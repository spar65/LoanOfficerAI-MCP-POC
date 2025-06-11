# Session Security Implementation Guide

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides detailed implementation patterns for secure session management in web applications, following the guidelines in the [046-session-validation.mdc](mdc:departments/engineering/security/046-session-validation.mdc) rule.

## Table of Contents

1. [Secure Session Token Implementation](#secure-session-token-implementation)
2. [Authentication Middleware](#authentication-middleware)
3. [Session Timeout Management](#session-timeout-management)
4. [Cross-Site Request Forgery (CSRF) Protection](#cross-site-request-forgery-csrf-protection)
5. [Session Revocation and Management](#session-revocation-and-management)

## Secure Session Token Implementation

### JWT vs. Opaque Tokens

```typescript
// JWT Implementation
// lib/auth/jwt.ts

import { sign, verify } from "jsonwebtoken";

// GOOD: Secure JWT configuration
export function createJwtToken(userId: string, userRoles: string[]): string {
  // Keep claims minimal - don't include sensitive data
  const payload = {
    sub: userId,
    roles: userRoles,
    // Short expiration for enhanced security
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  };

  // Use strong signing algorithm
  return sign(payload, process.env.JWT_SECRET as string, {
    algorithm: "HS256",
    jwtid: crypto.randomUUID(), // Add jti for revocation capability
    issuer: "your-app-name",
  });
}

// Validate JWT token
export function validateJwtToken(token: string): {
  valid: boolean;
  userId?: string;
  roles?: string[];
} {
  try {
    const decoded = verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
      issuer: "your-app-name",
    });

    // Verify token is not revoked
    if (isTokenRevoked(decoded.jti)) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: decoded.sub as string,
      roles: decoded.roles as string[],
    };
  } catch (error) {
    return { valid: false };
  }
}
```

```typescript
// Opaque Token Implementation
// lib/auth/session.ts

import { randomBytes } from "crypto";

// GOOD: Secure opaque token implementation
export async function createSessionToken(
  userId: string,
  userRoles: string[]
): Promise<string> {
  // Generate cryptographically strong random token
  const token = randomBytes(32).toString("hex");

  // Store token in database with user info and expiration
  await db.sessions.create({
    token: await hashToken(token), // Store hash, not the raw token
    userId,
    userRoles,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    createdAt: new Date(),
    lastActivityAt: new Date(),
  });

  return token;
}

// Validate opaque token
export async function validateSessionToken(token: string): Promise<{
  valid: boolean;
  userId?: string;
  roles?: string[];
}> {
  if (!token) return { valid: false };

  // Find session by token hash
  const session = await db.sessions.findUnique({
    where: { token: await hashToken(token) },
  });

  // Check if session exists and is not expired
  if (!session || session.expiresAt < new Date()) {
    return { valid: false };
  }

  // Update last activity timestamp
  await db.sessions.update({
    where: { id: session.id },
    data: { lastActivityAt: new Date() },
  });

  return {
    valid: true,
    userId: session.userId,
    roles: session.userRoles,
  };
}

// Helper to hash tokens before storage
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

### Setting Secure Cookies

```typescript
// lib/auth/cookies.ts

import { serialize, parse } from "cookie";
import type { NextApiResponse } from "next";

// GOOD: Secure cookie configuration
export function setSessionCookie(
  res: NextApiResponse,
  token: string,
  rememberMe = false
): void {
  const cookieOptions = {
    httpOnly: true, // Not accessible via JavaScript
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "strict" as const, // Restrict to same site
    path: "/", // Available across the site
    maxAge: rememberMe
      ? 30 * 24 * 60 * 60 // 30 days if "remember me"
      : 15 * 60, // 15 minutes otherwise
  };

  res.setHeader("Set-Cookie", serialize("session_token", token, cookieOptions));
}

// For CSRF protection, set a non-HttpOnly cookie with the same expiration
export function setCsrfCookie(
  res: NextApiResponse,
  csrfToken: string,
  rememberMe = false
): void {
  const cookieOptions = {
    httpOnly: false, // Accessible via JavaScript
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 15 * 60,
  };

  res.setHeader(
    "Set-Cookie",
    serialize("csrf_token", csrfToken, cookieOptions)
  );
}

// Clear session cookies on logout
export function clearSessionCookies(res: NextApiResponse): void {
  res.setHeader("Set-Cookie", [
    serialize("session_token", "", {
      maxAge: -1,
      path: "/",
    }),
    serialize("csrf_token", "", {
      maxAge: -1,
      path: "/",
    }),
  ]);
}
```

## Authentication Middleware

### Next.js Middleware

```typescript
// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateSessionToken } from "./lib/auth/session";

export async function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/verify-email",
  ];

  // Check if path is public
  const isPublicPath = publicPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // Always allow access to public assets
  if (
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api/public") ||
    request.nextUrl.pathname.startsWith("/favicon.ico") ||
    isPublicPath
  ) {
    return NextResponse.next();
  }

  // Get session token from cookie
  const sessionToken = request.cookies.get("session_token")?.value;

  // Validate the session
  const sessionData = sessionToken
    ? await validateSessionToken(sessionToken)
    : { valid: false };

  if (!sessionData.valid) {
    // Store the original URL to redirect back after login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set("X-User-ID", sessionData.userId as string);

  return response;
}

export const config = {
  matcher: ["/((?!api/public|_next/static|_next/image|favicon.ico).*)"],
};
```

### API Route Protection

```typescript
// lib/auth/withAuth.ts

import { NextApiRequest, NextApiResponse } from "next";
import { validateSessionToken } from "./session";

type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void> | void;

// Higher-order function to protect API routes
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Get session token from cookie
    const sessionToken = req.cookies.session_token;

    // Validate session
    const sessionData = sessionToken
      ? await validateSessionToken(sessionToken)
      : { valid: false };

    if (!sessionData.valid) {
      return res.status(401).json({
        error: "Unauthorized: Invalid or expired session",
      });
    }

    // Add user data to request for handler
    req.user = {
      id: sessionData.userId,
      roles: sessionData.roles || [],
    };

    // If authorized, proceed to the handler
    return handler(req, res);
  };
}

// Usage example
import { withAuth } from "@/lib/auth/withAuth";

export default withAuth(async function handler(req, res) {
  // This handler only runs for authenticated users
  const userData = await getUserData(req.user.id);
  return res.status(200).json(userData);
});
```

## Session Timeout Management

### Session Renewal

```typescript
// hooks/useSessionRenewal.ts

import { useState, useEffect, useCallback } from "react";

export function useSessionRenewal() {
  const [sessionStatus, setSessionStatus] = useState({
    isValid: true,
    expiresAt: null,
    showWarning: false,
  });

  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh-session", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        setSessionStatus({
          isValid: false,
          expiresAt: null,
          showWarning: false,
        });
        return false;
      }

      const data = await response.json();
      setSessionStatus({
        isValid: true,
        expiresAt: new Date(data.expiresAt),
        showWarning: false,
      });
      return true;
    } catch (error) {
      console.error("Failed to refresh session:", error);
      return false;
    }
  }, []);

  // Check session status periodically
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session-status");

        if (!response.ok) {
          setSessionStatus({
            isValid: false,
            expiresAt: null,
            showWarning: false,
          });
          return;
        }

        const data = await response.json();
        const expiresAt = new Date(data.expiresAt);
        const now = new Date();

        // Show warning if session expires in less than 2 minutes
        const showWarning =
          expiresAt && expiresAt.getTime() - now.getTime() < 2 * 60 * 1000;

        setSessionStatus({
          isValid: data.isValid,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          showWarning,
        });
      } catch (error) {
        console.error("Failed to check session status:", error);
      }
    };

    checkSession();

    // Check every minute
    const interval = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    ...sessionStatus,
    refreshSession,
  };
}
```

### Session Expiration UI Component

```tsx
// components/SessionExpirationWarning.tsx

import { useEffect, useState } from "react";
import { useSessionRenewal } from "@/hooks/useSessionRenewal";
import { Modal, Button, Text } from "@/components/ui";

export function SessionExpirationWarning() {
  const { showWarning, expiresAt, refreshSession } = useSessionRenewal();
  const [timeRemaining, setTimeRemaining] = useState("");

  // Format remaining time
  useEffect(() => {
    if (!showWarning || !expiresAt) return;

    const calculateRemaining = () => {
      const now = new Date();
      const diff = Math.max(0, expiresAt.getTime() - now.getTime());

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 1000);

    return () => clearInterval(timer);
  }, [showWarning, expiresAt]);

  if (!showWarning) return null;

  return (
    <Modal isOpen={showWarning} onClose={() => {}}>
      <div className="p-4">
        <h3 className="text-lg font-medium mb-2">Session Expiring Soon</h3>
        <Text>
          Your session will expire in <strong>{timeRemaining}</strong>. Would
          you like to stay logged in?
        </Text>
        <div className="mt-4 flex space-x-3">
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/login")}
          >
            Logout
          </Button>
          <Button onClick={refreshSession}>Stay Logged In</Button>
        </div>
      </div>
    </Modal>
  );
}
```

## Cross-Site Request Forgery (CSRF) Protection

### Implementing CSRF Protection

```typescript
// lib/csrf.ts

import { randomBytes } from "crypto";

// Generate a new CSRF token
export function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

// Validate CSRF token
export function validateCsrfToken(
  cookieToken: string,
  headerToken: string
): boolean {
  if (!cookieToken || !headerToken) {
    return false;
  }

  // Constant time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

// Middleware to check CSRF tokens on state-changing operations
import { NextApiRequest, NextApiResponse } from "next";
import { validateCsrfToken } from "@/lib/csrf";

export function withCsrfProtection(handler: any) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only check CSRF for state-changing methods
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method as string)) {
      const csrfCookie = req.cookies.csrf_token;
      const csrfHeader = req.headers["x-csrf-token"] as string;

      if (!validateCsrfToken(csrfCookie, csrfHeader)) {
        return res.status(403).json({
          error: "Invalid CSRF token. Please refresh the page and try again.",
        });
      }
    }

    return handler(req, res);
  };
}
```

### Using CSRF Tokens in Forms

```tsx
// components/CsrfInput.tsx

import { useEffect, useState } from "react";

export function CsrfInput() {
  const [csrfToken, setCsrfToken] = useState("");

  useEffect(() => {
    // Get CSRF token from cookie
    const getCsrfToken = () => {
      const cookies = document.cookie.split("; ");
      const csrfCookie = cookies.find((c) => c.startsWith("csrf_token="));
      if (csrfCookie) {
        setCsrfToken(csrfCookie.split("=")[1]);
      } else {
        console.error("CSRF token not found in cookies");
      }
    };

    getCsrfToken();
  }, []);

  return <input type="hidden" name="csrfToken" value={csrfToken} />;
}

// Usage in a form
function UserProfileForm() {
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": formData.get("csrfToken"),
      },
      body: JSON.stringify(Object.fromEntries(formData)),
    });

    // Handle response...
  };

  return (
    <form onSubmit={handleSubmit}>
      <CsrfInput />
      {/* Other form fields */}
      <button type="submit">Save Profile</button>
    </form>
  );
}
```

## Session Revocation and Management

### Session Store

```typescript
// lib/sessionStore.ts

import { db } from "@/lib/db";

// Create a new session
export async function createSession(
  userId: string,
  metadata: any = {}
): Promise<{
  token: string;
  expiresAt: Date;
}> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = await hashToken(token);

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minute expiration

  await db.sessions.create({
    data: {
      token: tokenHash,
      userId,
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      deviceInfo: metadata.deviceInfo,
    },
  });

  return { token, expiresAt };
}

// List all active sessions for a user
export async function listUserSessions(userId: string): Promise<
  Array<{
    id: string;
    createdAt: Date;
    lastActivityAt: Date;
    userAgent: string;
    ipAddress: string;
    deviceInfo: string;
    isCurrent: boolean;
  }>
> {
  const sessions = await db.sessions.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() }, // Only active sessions
    },
    orderBy: { lastActivityAt: "desc" },
  });

  const currentSessionId = getCurrentSessionId();

  return sessions.map((session) => ({
    id: session.id,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    deviceInfo: session.deviceInfo,
    isCurrent: session.id === currentSessionId,
  }));
}

// Revoke a specific session
export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    await db.sessions.delete({
      where: { id: sessionId },
    });
    return true;
  } catch (error) {
    console.error("Failed to revoke session:", error);
    return false;
  }
}

// Revoke all sessions for a user except the current one
export async function revokeOtherSessions(userId: string): Promise<number> {
  const currentSessionId = getCurrentSessionId();

  const { count } = await db.sessions.deleteMany({
    where: {
      userId,
      id: { not: currentSessionId },
    },
  });

  return count;
}

// Helper function to get current session ID
function getCurrentSessionId(): string {
  // Implementation depends on how you store current session ID
  // Could be from a request object, context, etc.
  return "current-session-id";
}
```

### Session Management UI

```tsx
// components/SessionManagement.tsx

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch user's sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/auth/sessions");

        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        setSessions(data);
      } catch (err) {
        setError("Failed to load sessions");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Revoke a session
  const revokeSession = async (sessionId) => {
    try {
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: "DELETE",
        headers: {
          "X-CSRF-Token": getCsrfToken(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to revoke session");
      }

      // Remove from UI
      setSessions(sessions.filter((session) => session.id !== sessionId));
    } catch (err) {
      setError("Failed to revoke session");
      console.error(err);
    }
  };

  // Revoke all other sessions
  const revokeAllOtherSessions = async () => {
    try {
      const response = await fetch("/api/auth/sessions/revoke-all", {
        method: "POST",
        headers: {
          "X-CSRF-Token": getCsrfToken(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to revoke other sessions");
      }

      // Keep only current session in UI
      setSessions(sessions.filter((session) => session.isCurrent));
    } catch (err) {
      setError("Failed to revoke sessions");
      console.error(err);
    }
  };

  if (loading) return <div>Loading sessions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Active Sessions</h2>

      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="border p-4 rounded-lg flex justify-between"
          >
            <div>
              <div className="font-medium">
                {session.deviceInfo || "Unknown Device"}
                {session.isCurrent && (
                  <span className="ml-2 text-green-600 text-sm">(Current)</span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Last active:{" "}
                {formatDistanceToNow(new Date(session.lastActivityAt))} ago
              </div>
              <div className="text-sm text-gray-600">
                IP: {session.ipAddress}
              </div>
            </div>

            {!session.isCurrent && (
              <button
                onClick={() => revokeSession(session.id)}
                className="text-red-600 hover:text-red-800"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>

      {sessions.length > 1 && (
        <button
          onClick={revokeAllOtherSessions}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Sign Out From All Other Devices
        </button>
      )}
    </div>
  );
}
```

## Best Practices Checklist

- ✅ Use HTTP-only, secure cookies for session tokens
- ✅ Implement short session timeouts (15-30 minutes)
- ✅ Provide session renewal mechanisms
- ✅ Implement CSRF protection for state-changing operations
- ✅ Store minimal data in session tokens
- ✅ Hash session tokens before storing in the database
- ✅ Provide UI for users to manage their active sessions
- ✅ Support session revocation
- ✅ Implement proper security headers
- ✅ Use consistent validation across the application
- ✅ Test session security thoroughly
