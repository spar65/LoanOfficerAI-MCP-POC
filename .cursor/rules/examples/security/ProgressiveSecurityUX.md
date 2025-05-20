# Progressive Security UX Guide

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide demonstrates progressive security UX patterns for implementing multi-level security verification, following the guidelines in [047-security-design-system.mdc](mdc:departments/engineering/security/047-security-design-system.mdc).

## Table of Contents

1. [Progressive Security Principles](#progressive-security-principles)
2. [Step-Up Authentication](#step-up-authentication)
3. [Security Level Visualization](#security-level-visualization)
4. [Multi-Factor Authentication Flow](#multi-factor-authentication-flow)
5. [Sensitive Action Protection](#sensitive-action-protection)

## Progressive Security Principles

Progressive security builds multiple layers of protection with appropriate UX for each level:

1. **Layered Protection**: Increase security requirements based on sensitivity of action
2. **Clear Visual Progression**: Visually communicate security level changes to users
3. **Contextual Challenges**: Match security verification to the context and risk
4. **User-Friendly Experience**: Balance security with usability
5. **Consistent Patterns**: Use the same UX patterns for similar security challenges
6. **Fail Securely**: Always fail closed, never open, when security verification fails

## Step-Up Authentication

Step-up authentication requires additional verification for sensitive operations.

```tsx
// step-up-auth.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SecurityLevelIndicator } from "./security-level-indicator";

interface StepUpAuthProps {
  requiredLevel: 1 | 2 | 3;
  currentLevel: 1 | 2 | 3;
  onComplete: () => void;
  onCancel: () => void;
  isOpen: boolean;
  actionDescription?: string;
}

export function StepUpAuth({
  requiredLevel,
  currentLevel,
  onComplete,
  onCancel,
  isOpen,
  actionDescription = "this action",
}: StepUpAuthProps) {
  const [verificationMethod, setVerificationMethod] = useState<
    "otp" | "security-question" | "biometric"
  >("otp");

  // Determine which verification methods are available based on the required level
  const getAvailableVerificationMethods = () => {
    switch (requiredLevel) {
      case 3:
        return ["biometric", "otp", "security-question"];
      case 2:
        return ["otp", "security-question"];
      default:
        return ["security-question"];
    }
  };

  // Get the appropriate verification component based on the method
  const getVerificationComponent = () => {
    switch (verificationMethod) {
      case "biometric":
        return <BiometricVerification onComplete={onComplete} />;
      case "otp":
        return <OtpVerification onComplete={onComplete} />;
      case "security-question":
        return <SecurityQuestionVerification onComplete={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="security-dialog">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <SecurityLevelIndicator level={requiredLevel} showLabels={true} />
          </div>

          <DialogTitle className="security-dialog-title">
            Additional Security Verification
          </DialogTitle>

          <DialogDescription className="security-dialog-description">
            {actionDescription} requires Security Level {requiredLevel}. Your
            current security level is {currentLevel}.
          </DialogDescription>
        </DialogHeader>

        {currentLevel < requiredLevel && (
          <div className="verification-method-selector">
            <p className="text-sm font-medium mb-2">Verify using:</p>

            <div className="verification-methods">
              {getAvailableVerificationMethods().map((method) => (
                <button
                  key={method}
                  className={`verification-method-button ${
                    method === verificationMethod ? "active" : ""
                  }`}
                  onClick={() => setVerificationMethod(method as any)}
                >
                  {method === "otp" && "One-Time Code"}
                  {method === "security-question" && "Security Question"}
                  {method === "biometric" && "Biometric Verification"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="verification-component">
          {currentLevel < requiredLevel ? (
            getVerificationComponent()
          ) : (
            <div className="already-verified">
              <p>You are already verified at the required security level.</p>
              <button className="button button-primary" onClick={onComplete}>
                Continue
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Verification method components would be implemented separately
function BiometricVerification({ onComplete }: { onComplete: () => void }) {
  // Implementation for biometric verification
  return <div>Biometric verification component</div>;
}

function OtpVerification({ onComplete }: { onComplete: () => void }) {
  // Implementation for OTP verification
  return <div>OTP verification component</div>;
}

function SecurityQuestionVerification({
  onComplete,
}: {
  onComplete: () => void;
}) {
  // Implementation for security question verification
  return <div>Security question verification component</div>;
}
```

```css
/* step-up-auth.css */
.security-dialog {
  max-width: 28rem;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.security-dialog-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.security-dialog-description {
  color: var(--security-neutral);
  margin-bottom: 1.5rem;
}

.verification-method-selector {
  margin-bottom: 1.5rem;
}

.verification-methods {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.verification-method-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(110, 122, 138, 0.2);
  background-color: transparent;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.verification-method-button:hover {
  background-color: rgba(38, 112, 232, 0.05);
}

.verification-method-button.active {
  background-color: rgba(38, 112, 232, 0.1);
  border-color: var(--security-info);
  color: var(--security-info);
}

.verification-component {
  margin-top: 1rem;
}

.already-verified {
  text-align: center;
  padding: 1rem;
}

.button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.button-primary {
  background-color: var(--security-info);
  color: white;
  border: none;
}

.button-primary:hover {
  opacity: 0.9;
}
```

## Security Level Visualization

Clearly visualize security levels to help users understand the protection level.

```tsx
// SecurityLevelVisualization.tsx
import { SecurityIcons } from "./security-icons";

interface SecurityLevelVisualizationProps {
  level: 1 | 2 | 3;
  showLabels?: boolean;
  showIcons?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SecurityLevelVisualization({
  level,
  showLabels = true,
  showIcons = true,
  size = "md",
  className = "",
}: SecurityLevelVisualizationProps) {
  // Map of level descriptions
  const levelDescriptions = {
    1: "Basic Protection",
    2: "Enhanced Protection",
    3: "Maximum Protection",
  };

  // Map of security icons by level
  const levelIcons = {
    1: SecurityIcons.key({
      size: size === "lg" ? 24 : size === "md" ? 20 : 16,
    }),
    2: SecurityIcons.verified({
      size: size === "lg" ? 24 : size === "md" ? 20 : 16,
    }),
    3: SecurityIcons.protection({
      size: size === "lg" ? 24 : size === "md" ? 20 : 16,
    }),
  };

  return (
    <div
      className={`security-level-visualization size-${size} ${className}`}
      aria-label={`Security level ${level}: ${levelDescriptions[level]}`}
    >
      <div className="level-bar-container">
        {[1, 2, 3].map((l) => (
          <div
            key={l}
            className={`level-bar ${l <= level ? "active" : ""} ${
              l === level ? "current" : ""
            }`}
            data-level={l}
          >
            {showIcons && l <= level && (
              <div className="level-icon">
                {levelIcons[l as keyof typeof levelIcons]}
              </div>
            )}
          </div>
        ))}
      </div>

      {showLabels && (
        <div className="level-description">{levelDescriptions[level]}</div>
      )}
    </div>
  );
}
```

```css
/* security-level-visualization.css */
.security-level-visualization {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.level-bar-container {
  display: flex;
  position: relative;
  width: 100%;
  gap: 4px;
}

.level-bar {
  flex: 1;
  height: 8px;
  background-color: rgba(110, 122, 138, 0.2);
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
}

.level-bar.active {
  transform: scaleY(1.2);
}

.level-bar.active[data-level="1"] {
  background-color: var(--security-level-1);
}

.level-bar.active[data-level="2"] {
  background-color: var(--security-level-2);
}

.level-bar.active[data-level="3"] {
  background-color: var(--security-level-3);
}

.level-bar.current::after {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

.level-icon {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-description {
  margin-top: 24px;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--security-neutral);
}

/* Size variations */
.security-level-visualization.size-sm .level-bar {
  height: 4px;
}

.security-level-visualization.size-sm .level-description {
  font-size: 0.75rem;
  margin-top: 16px;
}

.security-level-visualization.size-lg .level-bar {
  height: 12px;
}

.security-level-visualization.size-lg .level-icon {
  top: -28px;
  padding: 6px;
}

.security-level-visualization.size-lg .level-description {
  font-size: 1rem;
  margin-top: 32px;
}
```

## Multi-Factor Authentication Flow

Implement a user-friendly multi-factor authentication flow with clear security level communication.

```tsx
// mfa-flow.tsx
import { useState } from "react";
import { SecurityLevelVisualization } from "./security-level-visualization";
import { SecurityIcons } from "./security-icons";

interface MfaFlowProps {
  onComplete: (level: 1 | 2 | 3) => void;
  initialLevel?: 1 | 2 | 3;
  availableMethods?: {
    otp?: boolean;
    securityKey?: boolean;
    biometric?: boolean;
  };
}

export function MfaFlow({
  onComplete,
  initialLevel = 1,
  availableMethods = { otp: true, securityKey: false, biometric: false },
}: MfaFlowProps) {
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(initialLevel);
  const [step, setStep] = useState<"method-selection" | "verification">(
    "method-selection"
  );
  const [selectedMethod, setSelectedMethod] = useState<
    "otp" | "securityKey" | "biometric" | null
  >(null);

  // Handle method selection
  const handleMethodSelect = (method: "otp" | "securityKey" | "biometric") => {
    setSelectedMethod(method);
    setStep("verification");
  };

  // Map methods to new security levels
  const methodSecurityLevel = {
    otp: 2 as const,
    securityKey: 3 as const,
    biometric: 3 as const,
  };

  // Handle verification completion
  const handleVerificationComplete = () => {
    if (selectedMethod) {
      const newLevel = methodSecurityLevel[selectedMethod];
      setCurrentLevel(newLevel);
      onComplete(newLevel);
    }
  };

  // Get verification component based on selected method
  const renderVerification = () => {
    switch (selectedMethod) {
      case "otp":
        return <OtpVerificationStep onComplete={handleVerificationComplete} />;
      case "securityKey":
        return (
          <SecurityKeyVerificationStep
            onComplete={handleVerificationComplete}
          />
        );
      case "biometric":
        return (
          <BiometricVerificationStep onComplete={handleVerificationComplete} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mfa-flow">
      <div className="security-level-container">
        <SecurityLevelVisualization level={currentLevel} size="lg" />
      </div>

      {step === "method-selection" ? (
        <div className="method-selection">
          <h2 className="section-title">Enhance your account security</h2>
          <p className="section-description">
            Select an additional security method to protect your account
          </p>

          <div className="methods-list">
            {availableMethods.otp && (
              <button
                className="method-button"
                onClick={() => handleMethodSelect("otp")}
              >
                <div className="method-icon">{SecurityIcons.key()}</div>
                <div className="method-details">
                  <h3 className="method-title">Two-Factor Authentication</h3>
                  <p className="method-description">
                    Use a code from your authenticator app or SMS
                  </p>
                </div>
                <div className="method-security-level">
                  Level {methodSecurityLevel.otp}
                </div>
              </button>
            )}

            {availableMethods.securityKey && (
              <button
                className="method-button"
                onClick={() => handleMethodSelect("securityKey")}
              >
                <div className="method-icon">{SecurityIcons.protection()}</div>
                <div className="method-details">
                  <h3 className="method-title">Security Key</h3>
                  <p className="method-description">
                    Use a hardware security key like YubiKey
                  </p>
                </div>
                <div className="method-security-level">
                  Level {methodSecurityLevel.securityKey}
                </div>
              </button>
            )}

            {availableMethods.biometric && (
              <button
                className="method-button"
                onClick={() => handleMethodSelect("biometric")}
              >
                <div className="method-icon">{SecurityIcons.verified()}</div>
                <div className="method-details">
                  <h3 className="method-title">Biometric Authentication</h3>
                  <p className="method-description">
                    Use fingerprint, face ID, or other biometric methods
                  </p>
                </div>
                <div className="method-security-level">
                  Level {methodSecurityLevel.biometric}
                </div>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="verification-step">
          <button
            className="back-button"
            onClick={() => setStep("method-selection")}
          >
            ← Back to methods
          </button>

          {renderVerification()}
        </div>
      )}
    </div>
  );
}

// Example verification components
function OtpVerificationStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="verification-component">
      <h2 className="section-title">Enter verification code</h2>
      {/* OTP input implementation */}
      <button onClick={onComplete}>Verify</button>
    </div>
  );
}

function SecurityKeyVerificationStep({
  onComplete,
}: {
  onComplete: () => void;
}) {
  return (
    <div className="verification-component">
      <h2 className="section-title">Connect your security key</h2>
      {/* Security key implementation */}
      <button onClick={onComplete}>Verify</button>
    </div>
  );
}

function BiometricVerificationStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="verification-component">
      <h2 className="section-title">Biometric verification</h2>
      {/* Biometric verification implementation */}
      <button onClick={onComplete}>Verify</button>
    </div>
  );
}
```

## Sensitive Action Protection

Protect sensitive actions with appropriate security verification and visual treatment.

```tsx
// protected-action.tsx
import { useState } from "react";
import { SecurityIcons } from "./security-icons";
import { StepUpAuth } from "./step-up-auth";

interface ProtectedActionProps {
  onAction: () => void;
  requiredLevel: 1 | 2 | 3;
  currentLevel: 1 | 2 | 3;
  children: React.ReactNode;
  actionDescription: string;
  buttonText: string;
  buttonVariant?: "primary" | "danger" | "neutral";
  buttonSize?: "sm" | "md" | "lg";
  showSecurityIndicator?: boolean;
}

export function ProtectedAction({
  onAction,
  requiredLevel,
  currentLevel,
  children,
  actionDescription,
  buttonText,
  buttonVariant = "primary",
  buttonSize = "md",
  showSecurityIndicator = true,
}: ProtectedActionProps) {
  const [showVerification, setShowVerification] = useState(false);

  // Handle button click to trigger verification if needed
  const handleClick = () => {
    if (currentLevel >= requiredLevel) {
      // Already verified at required level
      onAction();
    } else {
      // Need additional verification
      setShowVerification(true);
    }
  };

  // Handle completion of verification
  const handleVerificationComplete = () => {
    setShowVerification(false);
    onAction();
  };

  // Handle cancellation of verification
  const handleVerificationCancel = () => {
    setShowVerification(false);
  };

  return (
    <>
      <div className="protected-action-container">
        <div className="protected-action-content">{children}</div>

        <div className="protected-action-footer">
          {showSecurityIndicator && requiredLevel > 1 && (
            <div className="security-level-indicator">
              <SecurityIcons.key size={16} />
              <span className="security-level-text">
                Requires security level {requiredLevel}
              </span>
            </div>
          )}

          <button
            className={`protected-action-button ${buttonVariant} ${buttonSize}`}
            onClick={handleClick}
          >
            {buttonText}
          </button>
        </div>
      </div>

      <StepUpAuth
        requiredLevel={requiredLevel}
        currentLevel={currentLevel}
        onComplete={handleVerificationComplete}
        onCancel={handleVerificationCancel}
        isOpen={showVerification}
        actionDescription={actionDescription}
      />
    </>
  );
}
```

```css
/* protected-action.css */
.protected-action-container {
  border: 1px solid rgba(110, 122, 138, 0.2);
  border-radius: 0.5rem;
  padding: 1rem;
}

.protected-action-content {
  margin-bottom: 1rem;
}

.protected-action-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.security-level-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--security-neutral);
}

.protected-action-button {
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* Button size variations */
.protected-action-button.sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.protected-action-button.md {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.protected-action-button.lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* Button variants */
.protected-action-button.primary {
  background-color: var(--security-info);
  color: white;
  border: none;
}

.protected-action-button.danger {
  background-color: var(--security-danger);
  color: white;
  border: none;
}

.protected-action-button.neutral {
  background-color: white;
  color: var(--security-neutral);
  border: 1px solid rgba(110, 122, 138, 0.3);
}

.protected-action-button:hover {
  opacity: 0.9;
}
```

## Implementation Best Practices

1. **Context-Aware Security**: Adjust security levels based on user context (device, location, behavior)
2. **Clear Feedback**: Always communicate current security level and requirements
3. **Multiple Options**: Provide alternative verification methods when possible
4. **Seamless Experience**: Design step-up authentication to feel like a natural part of the flow
5. **Risk-Based Verification**: Apply stronger security measures for higher-risk actions
6. **Session Expiration**: Provide clear indicators when security level will expire
7. **Recovery Paths**: Always provide fallback methods for authentication
8. **Security Visualization**: Use consistent visual patterns for security state

By implementing these progressive security patterns, you create a balance between security requirements and user experience, ensuring both robust protection and usability.
