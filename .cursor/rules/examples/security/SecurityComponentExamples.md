# Security Component Examples

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides examples of security-related UI components following the guidelines in [047-security-design-system.mdc](mdc:departments/engineering/security/047-security-design-system.mdc).

## Table of Contents

1. [Security Icon System](#security-icon-system)
2. [Security Status Indicators](#security-status-indicators)
3. [Secure Form Elements](#secure-form-elements)
4. [Security Notifications](#security-notifications)
5. [Authentication UI Components](#authentication-ui-components)

## Security Icon System

A consistent set of security icons helps users recognize security-related elements across the application.

```tsx
// security-icons.tsx
import {
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  Shield,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Key,
} from "lucide-react";

// Base security icon component with consistent styling
export function SecurityIcon({
  icon: Icon,
  variant = "default",
  size = 20,
  ...props
}) {
  return (
    <span
      className={`security-icon security-icon-${variant}`}
      aria-hidden="true"
      {...props}
    >
      <Icon size={size} />
    </span>
  );
}

// Exported icon library with consistent naming and styling
export const SecurityIcons = {
  // Core security states
  locked: (props) => <SecurityIcon icon={Lock} variant="locked" {...props} />,
  unlocked: (props) => (
    <SecurityIcon icon={Unlock} variant="unlocked" {...props} />
  ),
  verified: (props) => (
    <SecurityIcon icon={ShieldCheck} variant="verified" {...props} />
  ),

  // Notification levels
  warning: (props) => (
    <SecurityIcon icon={AlertTriangle} variant="warning" {...props} />
  ),
  error: (props) => (
    <SecurityIcon icon={AlertOctagon} variant="error" {...props} />
  ),
  info: (props) => <SecurityIcon icon={Info} variant="info" {...props} />,

  // Specialized security icons
  protection: (props) => (
    <SecurityIcon icon={Shield} variant="protection" {...props} />
  ),
  visible: (props) => <SecurityIcon icon={Eye} variant="visible" {...props} />,
  hidden: (props) => <SecurityIcon icon={EyeOff} variant="hidden" {...props} />,
  success: (props) => (
    <SecurityIcon icon={Check} variant="success" {...props} />
  ),
  failed: (props) => <SecurityIcon icon={X} variant="failed" {...props} />,
  alert: (props) => (
    <SecurityIcon icon={AlertCircle} variant="alert" {...props} />
  ),
  key: (props) => <SecurityIcon icon={Key} variant="key" {...props} />,
};
```

```css
/* security-tokens.css */
:root {
  /* Security-specific color palette */
  --security-secure: #00845c;
  --security-warning: #f1a817;
  --security-danger: #e12029;
  --security-info: #2670e8;
  --security-neutral: #6e7a8a;

  /* Security level indicators */
  --security-level-1: #0070f3;
  --security-level-2: #7928ca;
  --security-level-3: #e12029;

  /* Icon colors */
  --security-icon-locked: var(--security-secure);
  --security-icon-unlocked: var(--security-neutral);
  --security-icon-verified: var(--security-secure);
  --security-icon-warning: var(--security-warning);
  --security-icon-error: var(--security-danger);
  --security-icon-info: var(--security-info);
  --security-icon-protection: var(--security-secure);
  --security-icon-visible: var(--security-neutral);
  --security-icon-hidden: var(--security-neutral);
  --security-icon-success: var(--security-secure);
  --security-icon-failed: var(--security-danger);
  --security-icon-alert: var(--security-warning);
  --security-icon-key: var(--security-level-1);
}

/* Apply colors to icons */
.security-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.security-icon-locked {
  color: var(--security-icon-locked);
}
.security-icon-unlocked {
  color: var(--security-icon-unlocked);
}
.security-icon-verified {
  color: var(--security-icon-verified);
}
.security-icon-warning {
  color: var(--security-icon-warning);
}
.security-icon-error {
  color: var(--security-icon-error);
}
.security-icon-info {
  color: var(--security-icon-info);
}
.security-icon-protection {
  color: var(--security-icon-protection);
}
.security-icon-visible {
  color: var(--security-icon-visible);
}
.security-icon-hidden {
  color: var(--security-icon-hidden);
}
.security-icon-success {
  color: var(--security-icon-success);
}
.security-icon-failed {
  color: var(--security-icon-failed);
}
.security-icon-alert {
  color: var(--security-icon-alert);
}
.security-icon-key {
  color: var(--security-icon-key);
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --security-secure: #0abb8a;
    --security-warning: #ffb938;
    --security-danger: #ff4a5e;
    --security-info: #5c93f8;
    --security-neutral: #98a5b3;
  }
}
```

## Security Status Indicators

Security status indicators should clearly communicate the current security state to users.

```tsx
// auth-status-indicator.tsx
import { SecurityIcons } from "./security-icons";
import { Tooltip } from "@/components/ui/tooltip";

type AuthStatus =
  | "authenticated"
  | "expiring-soon"
  | "expired"
  | "unauthenticated";

interface AuthStatusIndicatorProps {
  status: AuthStatus;
  timeRemaining?: number; // in seconds
  className?: string;
}

export function AuthStatusIndicator({
  status,
  timeRemaining,
  className = "",
}: AuthStatusIndicatorProps) {
  // Format time remaining for display
  const formattedTime = timeRemaining
    ? formatTimeRemaining(timeRemaining)
    : null;

  // Determine label for screen readers
  const getAriaLabel = () => {
    switch (status) {
      case "authenticated":
        return "Your session is active and secure";
      case "expiring-soon":
        return `Your session will expire in ${formattedTime}`;
      case "expired":
        return "Your session has expired";
      case "unauthenticated":
        return "You are not logged in";
      default:
        return "Authentication status";
    }
  };

  return (
    <Tooltip content={getAriaLabel()}>
      <div
        className={`auth-status-indicator status-${status} ${className}`}
        aria-label={getAriaLabel()}
      >
        {status === "authenticated" && (
          <>
            {SecurityIcons.verified()}
            <span className="auth-status-text">Verified Session</span>
          </>
        )}

        {status === "expiring-soon" && (
          <>
            {SecurityIcons.warning()}
            <span className="auth-status-text">
              Session Expiring {formattedTime && `in ${formattedTime}`}
            </span>
          </>
        )}

        {status === "expired" && (
          <>
            {SecurityIcons.error()}
            <span className="auth-status-text">Session Expired</span>
          </>
        )}

        {status === "unauthenticated" && (
          <>
            {SecurityIcons.unlocked()}
            <span className="auth-status-text">Not Logged In</span>
          </>
        )}
      </div>
    </Tooltip>
  );
}

// Helper function to format seconds into human-readable time
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }

  return `${minutes}m ${remainingSeconds}s`;
}
```

```css
/* auth-status-indicator.css */
.auth-status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.auth-status-indicator .security-icon {
  display: flex;
}

.auth-status-indicator.status-authenticated {
  background-color: rgba(0, 132, 92, 0.1);
  color: var(--security-secure);
}

.auth-status-indicator.status-expiring-soon {
  background-color: rgba(241, 168, 23, 0.1);
  color: var(--security-warning);
}

.auth-status-indicator.status-expired {
  background-color: rgba(225, 32, 41, 0.1);
  color: var(--security-danger);
}

.auth-status-indicator.status-unauthenticated {
  background-color: rgba(110, 122, 138, 0.1);
  color: var(--security-neutral);
}
```

## Secure Form Elements

Secure form elements should indicate their security level and protect sensitive information.

```tsx
// secure-field.tsx
import { useState } from "react";
import { SecurityIcons } from "./security-icons";
import { Tooltip } from "@/components/ui/tooltip";

type SecurityLevel = "standard" | "medium" | "high";

interface SecureFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  securityLevel?: SecurityLevel;
  helperText?: string;
  showPasswordToggle?: boolean;
}

export function SecureField({
  label,
  securityLevel = "standard",
  helperText,
  showPasswordToggle = false,
  type = "text",
  ...props
}: SecureFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  // Determine the field type based on whether we're showing the password
  const fieldType = isPassword && showPassword ? "text" : type;

  // Security level icon based on the specified level
  const SecurityLevelIcon = () => {
    switch (securityLevel) {
      case "high":
        return <SecurityIcons.locked aria-hidden="true" />;
      case "medium":
        return <SecurityIcons.key aria-hidden="true" />;
      default:
        return null;
    }
  };

  // Security level label for screen readers
  const securityLevelLabel = {
    high: "This field has high security protection",
    medium: "This field has medium security protection",
    standard: "",
  };

  return (
    <div className={`secure-field-container security-level-${securityLevel}`}>
      <div className="secure-field-header">
        <label htmlFor={props.id} className="secure-field-label">
          {label}
          {securityLevel !== "standard" && (
            <Tooltip content={securityLevelLabel[securityLevel]}>
              <span className="security-level-indicator">
                <SecurityLevelIcon />
              </span>
            </Tooltip>
          )}
        </label>
      </div>

      <div className="secure-field-wrapper">
        <input
          type={fieldType}
          className="secure-field-input"
          aria-describedby={helperText ? `${props.id}-hint` : undefined}
          {...props}
        />

        {isPassword && showPasswordToggle && (
          <button
            type="button"
            className="password-toggle-button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? SecurityIcons.hidden() : SecurityIcons.visible()}
          </button>
        )}
      </div>

      {helperText && (
        <p id={`${props.id}-hint`} className="secure-field-helper-text">
          {helperText}
        </p>
      )}
    </div>
  );
}
```

```css
/* secure-field.css */
.secure-field-container {
  margin-bottom: 1rem;
}

.secure-field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.secure-field-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
}

.secure-field-wrapper {
  position: relative;
  display: flex;
}

.secure-field-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(110, 122, 138, 0.3);
  transition: border-color 0.15s ease;
}

.secure-field-input:focus {
  outline: none;
  border-color: var(--security-info);
  box-shadow: 0 0 0 2px rgba(38, 112, 232, 0.1);
}

/* High security fields get stronger visual indicator */
.security-level-high .secure-field-input {
  border-color: var(--security-secure);
}

.security-level-high .secure-field-input:focus {
  border-color: var(--security-secure);
  box-shadow: 0 0 0 2px rgba(0, 132, 92, 0.1);
}

.password-toggle-button {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--security-neutral);
  cursor: pointer;
}

.password-toggle-button:hover {
  color: var(--security-info);
}

.secure-field-helper-text {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--security-neutral);
}
```

## Security Notifications

Security notifications should clearly communicate security events with appropriate urgency.

```tsx
// security-notice.tsx
import { SecurityIcons } from "./security-icons";
import { Button } from "@/components/ui/button";

type SecuritySeverity = "info" | "warning" | "error" | "success";

interface SecurityNoticeProps {
  title: string;
  message: string;
  severity?: SecuritySeverity;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  isDismissible?: boolean;
  id?: string;
}

export function SecurityNotice({
  title,
  message,
  severity = "info",
  actionText,
  onAction,
  onDismiss,
  isDismissible = true,
  id,
}: SecurityNoticeProps) {
  // Icon mapping based on severity
  const getIcon = () => {
    switch (severity) {
      case "warning":
        return SecurityIcons.warning();
      case "error":
        return SecurityIcons.error();
      case "success":
        return SecurityIcons.success();
      default:
        return SecurityIcons.info();
    }
  };

  return (
    <div
      className={`security-notice severity-${severity}`}
      role="alert"
      aria-live={severity === "error" ? "assertive" : "polite"}
      id={id}
    >
      <div className="security-notice-icon">{getIcon()}</div>

      <div className="security-notice-content">
        <h3 className="security-notice-title">{title}</h3>
        <p className="security-notice-message">{message}</p>

        {actionText && onAction && (
          <div className="security-notice-actions">
            <Button
              className="security-notice-action"
              variant="outline"
              size="sm"
              onClick={onAction}
            >
              {actionText}
            </Button>
          </div>
        )}
      </div>

      {isDismissible && onDismiss && (
        <button
          className="security-notice-dismiss"
          aria-label="Dismiss notification"
          onClick={onDismiss}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4L12 12"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
```

```css
/* security-notice.css */
.security-notice {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.security-notice-icon {
  display: flex;
  align-items: flex-start;
  padding-top: 0.125rem;
}

.security-notice-title {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.security-notice-message {
  margin: 0;
  font-size: 0.875rem;
}

.security-notice-actions {
  display: flex;
  margin-top: 0.75rem;
}

.security-notice-dismiss {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  opacity: 0.7;
  cursor: pointer;
  padding: 0.25rem;
}

.security-notice-dismiss:hover {
  opacity: 1;
}

/* Severity-specific styles */
.security-notice.severity-info {
  background-color: rgba(38, 112, 232, 0.1);
  color: var(--security-info);
  border-left: 4px solid var(--security-info);
}

.security-notice.severity-warning {
  background-color: rgba(241, 168, 23, 0.1);
  color: var(--security-warning);
  border-left: 4px solid var(--security-warning);
}

.security-notice.severity-error {
  background-color: rgba(225, 32, 41, 0.1);
  color: var(--security-danger);
  border-left: 4px solid var(--security-danger);
}

.security-notice.severity-success {
  background-color: rgba(0, 132, 92, 0.1);
  color: var(--security-secure);
  border-left: 4px solid var(--security-secure);
}
```

## Authentication UI Components

Authentication components should provide clear security level indications and consistent UX.

```tsx
// security-level-indicator.tsx
import { Tooltip } from "@/components/ui/tooltip";

interface SecurityLevelIndicatorProps {
  level: 1 | 2 | 3;
  maxLevel?: 1 | 2 | 3;
  showLabels?: boolean;
  className?: string;
}

export function SecurityLevelIndicator({
  level,
  maxLevel = 3,
  showLabels = false,
  className = "",
}: SecurityLevelIndicatorProps) {
  const levelDescriptions = {
    1: "Basic security level - password required",
    2: "Enhanced security level - two-factor authentication required",
    3: "Maximum security level - biometric authentication required",
  };

  return (
    <div
      className={`security-level-indicator ${className}`}
      aria-label={`Security level ${level} of ${maxLevel}`}
    >
      <div className="level-markers">
        {[...Array(maxLevel)].map((_, i) => (
          <Tooltip
            key={i}
            content={
              levelDescriptions[(i + 1) as keyof typeof levelDescriptions]
            }
          >
            <div
              className={`level-marker ${i + 1 <= level ? "active" : ""}`}
              data-level={i + 1}
            />
          </Tooltip>
        ))}
      </div>

      {showLabels && (
        <div className="level-label">
          Security Level: {level}/{maxLevel}
        </div>
      )}
    </div>
  );
}
```

```css
/* security-level-indicator.css */
.security-level-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1rem 0;
}

.level-markers {
  display: flex;
  gap: 0.5rem;
}

.level-marker {
  width: 2rem;
  height: 0.5rem;
  border-radius: 1rem;
  background-color: rgba(110, 122, 138, 0.3);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.level-marker.active[data-level="1"] {
  background-color: var(--security-level-1);
}

.level-marker.active[data-level="2"] {
  background-color: var(--security-level-2);
}

.level-marker.active[data-level="3"] {
  background-color: var(--security-level-3);
}

.level-label {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--security-neutral);
}
```

By implementing these security component patterns consistently across your application, you will create a clear and recognizable security language for users, increasing trust and understanding of security features.
