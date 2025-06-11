# Authentication Best Practices Guide

> **DOCUMENTATION EXAMPLE ONLY**: This document contains guidelines and examples for reference purposes and is not meant to be imported or used directly.

This guide provides best practices for implementing secure authentication and session management in web applications, complementing the guidelines in [046-session-validation.mdc](mdc:departments/engineering/security/046-session-validation.mdc).

## Table of Contents

1. [Password Management](#password-management)
2. [Authentication Flows](#authentication-flows)
3. [Session Security](#session-security)
4. [Multi-Factor Authentication](#multi-factor-authentication)
5. [Security Headers and Protections](#security-headers-and-protections)

## Password Management

### Secure Password Storage

```typescript
// GOOD: Using bcrypt for password hashing
import * as bcrypt from "bcryptjs";

// Store a password
export async function hashPassword(password: string): Promise<string> {
  // Use high work factor for stronger security
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify a password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
```

### Password Policy Implementation

```typescript
// GOOD: Strong password validation function
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors = [];

  // Check length
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  // Check complexity
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must include at least one number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must include at least one special character");
  }

  // Check against common passwords
  if (isCommonPassword(password)) {
    errors.push("This password is too common and easily guessable");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### Password Reset Flow

```typescript
// GOOD: Secure password reset flow
export async function initiatePasswordReset(email: string): Promise<void> {
  // Generate a strong, single-use token
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = await hashToken(resetToken);

  // Store token with expiration (typically short, like 15-30 minutes)
  await db.passwordResetTokens.create({
    data: {
      email,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  // Do not reveal if the user exists
  // Only log information that doesn't expose user existence
  logger.info("Password reset requested", { emailDomain: email.split("@")[1] });

  // Send the reset link
  await sendPasswordResetEmail(email, resetToken);
}

// GOOD: Token validation and password reset completion
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // Validate password strength first
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.errors[0],
    };
  }

  // Find the reset token
  const hashedToken = await hashToken(token);
  const resetRequest = await db.passwordResetTokens.findUnique({
    where: { token: hashedToken },
  });

  // Check if token exists and is not expired
  if (!resetRequest || resetRequest.expiresAt < new Date()) {
    return {
      success: false,
      message: "Invalid or expired password reset link",
    };
  }

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword);

  // Update the user's password
  await db.users.update({
    where: { email: resetRequest.email },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(),
    },
  });

  // Delete the used token
  await db.passwordResetTokens.delete({
    where: { id: resetRequest.id },
  });

  // Invalidate all existing sessions for this user
  await invalidateAllUserSessions(resetRequest.email);

  // Notify user of password change
  await sendPasswordChangeNotification(resetRequest.email);

  return {
    success: true,
    message: "Password has been reset successfully",
  };
}
```

## Authentication Flows

### Login Flow with Rate Limiting

```typescript
// GOOD: Secure login flow with rate limiting and CAPTCHA
export async function authenticateUser(
  email: string,
  password: string,
  captchaToken?: string,
  ip?: string,
  userAgent?: string
): Promise<{
  success: boolean;
  user?: User;
  requireCaptcha?: boolean;
  message?: string;
}> {
  // Check for rate limiting first
  const rateLimitCheck = await checkRateLimit(email, ip);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      requireCaptcha: true,
      message: `Too many login attempts. Please try again after ${rateLimitCheck.retryAfter} minutes.`,
    };
  }

  // If CAPTCHA is required but not provided
  if (rateLimitCheck.requireCaptcha && !captchaToken) {
    return {
      success: false,
      requireCaptcha: true,
      message: "Please complete the CAPTCHA verification",
    };
  }

  // Verify CAPTCHA if provided
  if (captchaToken) {
    const captchaValid = await verifyCaptcha(captchaToken);
    if (!captchaValid) {
      return {
        success: false,
        requireCaptcha: true,
        message: "Invalid CAPTCHA verification",
      };
    }
  }

  // Find user by email (keep timing consistent to prevent username enumeration)
  const startTime = Date.now();
  const user = await db.users.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Verify password if user exists
  const passwordValid = user
    ? await verifyPassword(password, user.password)
    : false;

  // If login fails, record the attempt
  if (!user || !passwordValid) {
    await recordFailedLoginAttempt(email, ip);

    // Add artificial delay to prevent timing attacks
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < 500) {
      await new Promise((resolve) => setTimeout(resolve, 500 - elapsedTime));
    }

    return {
      success: false,
      requireCaptcha: rateLimitCheck.attemptsRemaining <= 2, // Require CAPTCHA after 3 failed attempts
      message: "Invalid email or password",
    };
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return {
      success: false,
      message: `Account is temporarily locked. Please try again later or reset your password.`,
    };
  }

  // Clear failed attempts on successful login
  await clearFailedLoginAttempts(email, ip);

  // Log successful login
  await logAuthEvent({
    userId: user.id,
    event: "login",
    ip,
    userAgent,
    success: true,
  });

  return { success: true, user };
}
```

### Account Lockout Implementation

```typescript
// GOOD: Account lockout with exponential backoff
async function checkAccountLockout(userId: string): Promise<{
  isLocked: boolean;
  lockedUntil?: Date;
}> {
  const user = await db.users.findUnique({
    where: { id: userId },
    select: {
      lockedUntil: true,
      failedLoginAttempts: true,
    },
  });

  if (!user) {
    return { isLocked: false };
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return {
      isLocked: true,
      lockedUntil: user.lockedUntil,
    };
  }

  return { isLocked: false };
}

// GOOD: Implementing account lockout
async function lockAccount(userId: string, attempts: number): Promise<Date> {
  // Calculate lockout duration with exponential backoff
  // Start with 5 minutes, then 10, 20, 40, etc. up to 24 hours
  const baseMinutes = 5;
  const factor = Math.min(attempts - 3, 10); // Cap at factor of 10
  const lockoutMinutes = baseMinutes * Math.pow(2, factor);

  // Cap at 24 hours
  const cappedMinutes = Math.min(lockoutMinutes, 24 * 60);

  const lockedUntil = new Date();
  lockedUntil.setMinutes(lockedUntil.getMinutes() + cappedMinutes);

  // Update user record
  await db.users.update({
    where: { id: userId },
    data: {
      lockedUntil,
      failedLoginAttempts: attempts,
    },
  });

  // Log the lockout event
  await logAuthEvent({
    userId,
    event: "account_lockout",
    details: `Account locked for ${cappedMinutes} minutes after ${attempts} failed attempts`,
    success: false,
  });

  // Send notification to user
  await sendAccountLockedEmail(userId, lockedUntil);

  return lockedUntil;
}
```

## Session Security

### JWT Best Practices

```typescript
// GOOD: Secure JWT implementation with limited scope
import { sign, verify } from "jsonwebtoken";

// Create a JWT with limited scope and short expiration
export function createAccessToken(userId: string, scopes: string[]): string {
  return sign(
    {
      sub: userId,
      scope: scopes.join(" "),
      type: "access",
      // Short expiration for access tokens
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    },
    process.env.JWT_SECRET as string,
    {
      algorithm: "HS256",
      issuer: "your-application",
      audience: "your-api",
      jwtid: crypto.randomUUID(),
    }
  );
}

// Create a refresh token with longer expiration
export function createRefreshToken(userId: string): string {
  const token = sign(
    {
      sub: userId,
      type: "refresh",
      // Longer expiration for refresh tokens
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    },
    process.env.JWT_REFRESH_SECRET as string, // Use a different secret
    {
      algorithm: "HS256",
      issuer: "your-application",
      jwtid: crypto.randomUUID(), // For revocation
    }
  );

  // Store refresh token hash in database for revocation
  storeRefreshToken(userId, token);

  return token;
}

// Verify a JWT and extract claims
export function verifyAccessToken(token: string): {
  valid: boolean;
  userId?: string;
  scopes?: string[];
  error?: string;
} {
  try {
    const decoded = verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
      issuer: "your-application",
      audience: "your-api",
    });

    // Verify token type
    if (decoded.type !== "access") {
      return { valid: false, error: "Invalid token type" };
    }

    return {
      valid: true,
      userId: decoded.sub as string,
      scopes: (decoded.scope as string).split(" "),
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
    };
  }
}
```

### Secure Cookie Settings

```typescript
// GOOD: Secure cookie configuration
export function setSecureCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  // Set access token in HTTP-only cookie
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });

  // Set refresh token in HTTP-only cookie with longer duration
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/api/auth/refresh", // Restrict to refresh endpoint only
  });

  // Set a non-HTTP-only cookie for frontend to know auth state
  // Does NOT contain any sensitive information
  res.cookie("authenticated", "true", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // Same as access token
    path: "/",
  });
}
```

## Multi-Factor Authentication

### TOTP Implementation

```typescript
// GOOD: TOTP (Time-based One-Time Password) implementation
import { authenticator } from "otplib";
import { User } from "@prisma/client";

// Generate new TOTP secret for a user
export async function generateTOTPSecret(userId: string): Promise<{
  secret: string;
  uri: string;
}> {
  const user = await db.users.findUnique({ where: { id: userId } });

  // Generate a secret
  const secret = authenticator.generateSecret();

  // Save the secret to the user record (encrypted in database)
  await db.users.update({
    where: { id: userId },
    data: {
      totpSecret: encryptSecret(secret), // Encrypt before storing
      totpEnabled: false, // Not enabled until verified
    },
  });

  // Generate the URI for QR code
  const uri = authenticator.keyuri(user.email, "Your Application", secret);

  return { secret, uri };
}

// Verify a TOTP code
export async function verifyTOTP(
  userId: string,
  token: string
): Promise<boolean> {
  const user = await db.users.findUnique({
    where: { id: userId },
    select: { totpSecret: true },
  });

  if (!user || !user.totpSecret) {
    return false;
  }

  // Decrypt the secret
  const secret = decryptSecret(user.totpSecret);

  // Verify the token (includes 30-second window)
  return authenticator.verify({
    token,
    secret,
  });
}

// Enable TOTP for a user (after verification)
export async function enableTOTP(userId: string): Promise<void> {
  await db.users.update({
    where: { id: userId },
    data: {
      totpEnabled: true,
      mfaMethod: "TOTP",
    },
  });

  // Generate recovery codes
  const recoveryCodes = generateRecoveryCodes();

  // Store hashed recovery codes
  await db.recoveryCode.createMany({
    data: recoveryCodes.map((code) => ({
      userId,
      code: hashRecoveryCode(code),
      used: false,
    })),
  });

  // Return the plain text recovery codes to the user
  return recoveryCodes;
}
```

### Recovery Codes

```typescript
// GOOD: Recovery code implementation
function generateRecoveryCodes(count = 10): string[] {
  const codes = [];

  for (let i = 0; i < count; i++) {
    // Format: XXXX-XXXX-XXXX (12 characters + 2 dashes)
    const code = [
      crypto.randomBytes(2).toString("hex").toUpperCase(),
      crypto.randomBytes(2).toString("hex").toUpperCase(),
      crypto.randomBytes(2).toString("hex").toUpperCase(),
    ].join("-");

    codes.push(code);
  }

  return codes;
}

// Verify a recovery code
export async function useRecoveryCode(
  userId: string,
  code: string
): Promise<boolean> {
  const hashedCode = hashRecoveryCode(code.toUpperCase());

  // Find the code
  const recoveryCode = await db.recoveryCode.findFirst({
    where: {
      userId,
      code: hashedCode,
      used: false,
    },
  });

  if (!recoveryCode) {
    return false;
  }

  // Mark the code as used
  await db.recoveryCode.update({
    where: { id: recoveryCode.id },
    data: { used: true, usedAt: new Date() },
  });

  // Log the recovery code usage
  await logAuthEvent({
    userId,
    event: "recovery_code_used",
    details: "Recovery code used for MFA bypass",
    success: true,
  });

  return true;
}
```

## Security Headers and Protections

### Essential Security Headers

```typescript
// GOOD: Implementing essential security headers
export function setSecurityHeaders(req, res, next) {
  // Prevent browsers from incorrectly detecting non-scripts as scripts
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Strict CSP policy
  res.setHeader(
    "Content-Security-Policy",
    `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https://api.yourservice.com;
    frame-src 'self' https://www.google.com/recaptcha/;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `
      .replace(/\s+/g, " ")
      .trim()
  );

  // Controls how much information the browser includes with navigation errors
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Disable browser features
  res.setHeader(
    "Permissions-Policy",
    `
    camera=(),
    microphone=(),
    geolocation=(self),
    interest-cohort=()
  `
      .replace(/\s+/g, " ")
      .trim()
  );

  next();
}
```

### XSS Protection

```typescript
// GOOD: XSS protection library
import { sanitize } from "sanitize-html";

// Sanitize user input to prevent XSS
export function sanitizeUserInput(input: string): string {
  return sanitize(input, {
    allowedTags: ["b", "i", "em", "strong", "a", "p", "br"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedIframeHostnames: [],
    transformTags: {
      a: (tagName, attribs) => {
        // Force noopener and noreferrer on all links
        return {
          tagName,
          attribs: {
            ...attribs,
            target: "_blank",
            rel: "noopener noreferrer",
          },
        };
      },
    },
  });
}

// Middleware to sanitize request body for XSS
export function sanitizeRequestBody(req, res, next) {
  if (req.body) {
    // Recursively sanitize all string values in the body
    req.body = sanitizeRequestData(req.body);
  }
  next();
}

// Helper function to recursively sanitize object data
function sanitizeRequestData(data: any): any {
  if (typeof data === "string") {
    return sanitizeUserInput(data);
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeRequestData(item));
  }

  if (typeof data === "object" && data !== null) {
    const result = {};
    for (const key in data) {
      result[key] = sanitizeRequestData(data[key]);
    }
    return result;
  }

  return data;
}
```

## Authentication Checklist

### Implementation Checklist

- [ ] **Password Security**

  - [ ] Use strong hashing algorithm (bcrypt, Argon2) with appropriate work factor
  - [ ] Implement strong password policy (12+ chars, mixed case, symbols, numbers)
  - [ ] Check against common/breached password databases
  - [ ] Implement secure password reset flow

- [ ] **Login Security**

  - [ ] Implement rate limiting (IP-based and account-based)
  - [ ] Implement CAPTCHA after failed attempts
  - [ ] Use account lockout with exponential backoff
  - [ ] Provide consistent error messages that don't leak account existence

- [ ] **Session Management**

  - [ ] Use HttpOnly, Secure, SameSite=Strict cookies
  - [ ] Implement appropriate timeouts (15-30 minutes)
  - [ ] Provide session renewal mechanism
  - [ ] Implement CSRF protection
  - [ ] Enable users to view/manage active sessions

- [ ] **Multi-Factor Authentication**

  - [ ] Offer at least one MFA option (TOTP, WebAuthn)
  - [ ] Provide recovery codes
  - [ ] Enforce MFA for privileged actions/accounts
  - [ ] Implement device remembering for trusted devices

- [ ] **Security Headers**

  - [ ] Set CSP (Content-Security-Policy)
  - [ ] Set X-Content-Type-Options
  - [ ] Set X-Frame-Options
  - [ ] Set Referrer-Policy
  - [ ] Set Permissions-Policy

- [ ] **Monitoring & Alerting**

  - [ ] Log all authentication events
  - [ ] Alert on suspicious activities
  - [ ] Monitor for brute force attempts
  - [ ] Track failed login patterns

- [ ] **User Experience**
  - [ ] Provide clear error messages
  - [ ] Implement "forgot password" functionality
  - [ ] Notify users of important security events (password changes, etc.)
  - [ ] Balance security with usability
