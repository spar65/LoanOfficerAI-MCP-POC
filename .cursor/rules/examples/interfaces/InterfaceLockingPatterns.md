# Interface Locking Patterns

> **DOCUMENTATION EXAMPLE ONLY**: This document contains code examples for reference purposes. These examples demonstrate implementation patterns but are not meant to be imported or used directly.

This guide provides comprehensive examples of techniques for locking critical interfaces as described in [104-stable-interfaces.mdc](mdc:departments/engineering/coding-standards/104-stable-interfaces.mdc).

## Table of Contents

1. [Interface Locking Fundamentals](#interface-locking-fundamentals)
2. [VIBE Annotations for Locked Interfaces](#vibe-annotations-for-locked-interfaces)
3. [Lock File Implementations](#lock-file-implementations)
4. [CI/CD Integration](#cicd-integration)
5. [Change Control Process](#change-control-process)
6. [Runtime Lock Enforcement](#runtime-lock-enforcement)

## Interface Locking Fundamentals

Interface locking is a critical component of enterprise software development that:

1. **Prevents Accidental Changes**: Stops unintentional breaking changes to critical interfaces
2. **Enforces Review Processes**: Ensures proper change control for important contracts
3. **Documents Importance**: Clearly identifies which interfaces have high stability requirements
4. **Protects Against AI Modifications**: Prevents AI tools from modifying locked interfaces

### Types of Locks

| Lock Type            | Purpose                                     | Implementation                                             |
| -------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| **Hard Lock**        | Prevent all changes without formal approval | CI/CD restrictions, build rejections, registry enforcement |
| **Soft Lock**        | Flag potential changes for review           | Warnings, notifications, required reviews                  |
| **Time-Based Lock**  | Lock interfaces until a certain date        | Expiration metadata, CI validation                         |
| **Conditional Lock** | Lock based on environment or context        | Environment-specific locks, conditional checks             |

## VIBE Annotations for Locked Interfaces

VIBE (Value-Informed, Behavioral-Embedded) annotations provide explicit guidance to both human developers and AI assistants about interface protection.

### TypeScript Interface Locking

```typescript
/**
 * Authentication service for secure user authentication.
 *
 * @api AuthenticationService
 * @stability LOCKED
 * @version 2.1.0
 * @since 2023-01-15
 * @owners auth-team@example.com
 * @lockReason Critical security interface used by all applications
 * @changeProcess https://internal.example.com/rfc/process
 *
 * @ai-preserve
 * This is a LOCKED interface that handles critical authentication operations.
 * ⚠️ DO NOT MODIFY without an approved RFC and security review.
 * ⚠️ DO NOT CHANGE method signatures, parameters, or return types.
 * ⚠️ DO NOT ADD OR REMOVE methods without formal approval.
 *
 * @ai-modification-guidelines
 * - DO NOT change existing method signatures
 * - DO NOT modify authorization logic
 * - DO NOT change error handling for security-related errors
 * - MAY improve documentation comments
 * - MAY add monitoring or logging that doesn't affect behavior
 * - MUST get explicit approval for any changes
 */
export interface AuthenticationService {
  /**
   * Authenticates a user with username/password.
   * @stable since v1.0.0
   * @locked since v2.0.0
   */
  login(username: string, password: string): Promise<AuthResult>;

  /**
   * Refreshes a user's authentication token.
   * @stable since v1.0.0
   * @locked since v2.0.0
   */
  refreshToken(refreshToken: string): Promise<AuthResult>;

  /**
   * Verifies if a token is valid.
   * @stable since v1.0.0
   * @locked since v2.0.0
   */
  verifyToken(token: string): Promise<TokenStatus>;

  /**
   * Logs out a user and invalidates their tokens.
   * @stable since v1.0.0
   * @locked since v2.0.0
   */
  logout(token: string): Promise<void>;
}
```

### Java Interface Locking

```java
/**
 * Payment processor for handling financial transactions.
 *
 * @stability LOCKED
 * @version 3.2.1
 * @since 2022-09-05
 * @owners payments-team@example.com, financial-team@example.com
 * @lockReason Financial interface requiring audit compliance
 * @changeProcess RFC + Finance Team and Security Team approval
 *
 * @ai-preserve
 * This is a LOCKED financial interface with regulatory compliance requirements.
 * DO NOT MODIFY without formal approval process and security review.
 */
public interface PaymentProcessor {
    /**
     * Processes a payment transaction.
     *
     * @param paymentRequest The payment request details
     * @return The payment result
     * @throws PaymentException if processing fails
     *
     * @stable since v1.0.0
     * @locked since v2.5.0
     */
    PaymentResult processPayment(PaymentRequest paymentRequest) throws PaymentException;

    /**
     * Refunds a previously processed payment.
     *
     * @param transactionId The ID of the transaction to refund
     * @param amount The amount to refund (null for full refund)
     * @return The refund result
     * @throws RefundException if refund fails
     *
     * @stable since v1.0.0
     * @locked since v2.5.0
     */
    RefundResult refundPayment(String transactionId, BigDecimal amount) throws RefundException;

    /**
     * Retrieves transaction details.
     *
     * @param transactionId The ID of the transaction
     * @return The transaction details
     * @throws TransactionNotFoundException if transaction not found
     *
     * @stable since v1.5.0
     * @locked since v2.5.0
     */
    TransactionDetails getTransaction(String transactionId) throws TransactionNotFoundException;
}
```

### Python Interface Locking

```python
class DataExportService:
    """Data export service for secure data extraction.

    This interface is LOCKED and requires formal approval for changes.

    Stability:
        LOCKED since 2023-03-15
        Version: 1.5.2
        Owners: data-team@example.com, security-team@example.com
        Lock Reason: Critical data export with privacy implications
        Change Process: RFC + Privacy Officer approval required

    AI-Preserve:
        DO NOT MODIFY this interface without formal approval.
        DO NOT CHANGE method signatures or behavior.
        DO NOT ALTER data filtering or anonymization logic.
    """

    def export_user_data(self, user_id: str, format: str = "json") -> ExportResult:
        """Exports user data in specified format.

        Args:
            user_id: The ID of the user whose data to export
            format: The export format (json, csv, xml)

        Returns:
            ExportResult containing the exported data and metadata

        Raises:
            UserNotFoundError: If user doesn't exist
            ExportFormatError: If format is invalid

        Stability:
            Stable since v1.0.0
            Locked since v1.2.0
        """
        # Implementation

    def export_organization_data(self, org_id: str, format: str = "json") -> ExportResult:
        """Exports organization data in specified format.

        Args:
            org_id: The ID of the organization whose data to export
            format: The export format (json, csv, xml)

        Returns:
            ExportResult containing the exported data and metadata

        Raises:
            OrganizationNotFoundError: If organization doesn't exist
            ExportFormatError: If format is invalid

        Stability:
            Stable since v1.0.0
            Locked since v1.2.0
        """
        # Implementation
```

## Lock File Implementations

### Interface Lock Registry

Maintain a centralized registry of locked interfaces:

```json
// interface-locks.json
{
  "version": "1.0",
  "updated": "2025-04-10",
  "locked_interfaces": [
    {
      "name": "AuthenticationService",
      "file": "src/auth/AuthenticationService.ts",
      "stability": "LOCKED",
      "version": "2.1.0",
      "lockedSince": "2024-01-15",
      "owners": ["auth-team@example.com", "security@example.com"],
      "lockReason": "Critical security interface used by all applications",
      "changeProcess": {
        "requiresRFC": true,
        "approvers": [
          "Security Team Lead",
          "Auth Team Lead",
          "CTO for critical changes"
        ],
        "rfcTemplate": "templates/rfc-auth-change.md",
        "reviewBoard": "Security Review Board"
      },
      "methods": [
        {
          "name": "login",
          "lockedSince": "v2.0.0"
        },
        {
          "name": "refreshToken",
          "lockedSince": "v2.0.0"
        },
        {
          "name": "verifyToken",
          "lockedSince": "v2.0.0"
        },
        {
          "name": "logout",
          "lockedSince": "v2.0.0"
        }
      ],
      "lastReview": "2025-01-10",
      "nextReviewDue": "2025-07-10"
    },
    {
      "name": "PaymentProcessor",
      "file": "src/payments/PaymentProcessor.java",
      "stability": "LOCKED",
      "version": "3.2.1",
      "lockedSince": "2024-02-20",
      "owners": ["payments-team@example.com", "finance@example.com"],
      "lockReason": "Financial interface requiring audit compliance",
      "changeProcess": {
        "requiresRFC": true,
        "approvers": [
          "Finance Director",
          "Head of Payments",
          "Security Officer"
        ],
        "rfcTemplate": "templates/rfc-finance-change.md",
        "reviewBoard": "Financial Systems Review Board"
      },
      "complianceRequirements": ["PCI-DSS", "SOX"],
      "lastReview": "2025-01-15",
      "nextReviewDue": "2025-04-15"
    }
  ]
}
```

### Git-Based Locking

Add a specialized `.interfacelocks` configuration file to your repository:

```yaml
# .interfacelocks
version: 1.0
locks:
  - path: src/api/auth/AuthService.ts
    type: HARD_LOCK
    reason: "Critical authentication API used by all applications"
    owners:
      - authentication-team@example.com
      - security@example.com
    changeRequest:
      process: "RFC"
      template: "docs/rfc-templates/auth-change.md"
      approvers:
        - Security Team Lead
        - Authentication Team Lead
        - CTO (for critical changes)
    tests:
      - src/api/auth/__tests__/AuthService.test.ts
      - integration/auth/authentication-flows.test.ts
    last_review: "2025-03-15"
    next_review: "2025-09-15"

  - path: src/api/payments/**/*.ts
    type: HARD_LOCK
    reason: "Payment processing APIs with regulatory requirements"
    excludes:
      - src/api/payments/experimental/**
    owners:
      - payments-team@example.com
      - finance@example.com
    changeRequest:
      process: "RFC + Security Review"
      template: "docs/rfc-templates/payment-change.md"
      approvers:
        - Finance Director
        - Payments Team Lead
        - Security Officer
    compliance:
      - PCI-DSS
      - SOX
    last_review: "2025-02-10"
    next_review: "2025-05-10"

  - path: src/components/core/*.tsx
    type: SOFT_LOCK
    reason: "Core UI components used throughout the application"
    owners:
      - ui-team@example.com
    changeRequest:
      process: "Design Review"
      approvers:
        - UI Team Lead
        - Design System Owner
    excludes:
      - src/components/core/internal
    expires: "2025-12-31" # Temporary lock until design system stabilizes
```

## CI/CD Integration

### GitHub Actions Interface Lock Enforcement

```yaml
# .github/workflows/interface-lock-check.yml
name: Interface Lock Check

on:
  pull_request:
    paths:
      - "src/**"
    branches:
      - main
      - develop

jobs:
  check-locked-interfaces:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: npm ci

      - name: Check for locked interface modifications
        run: |
          # Get changed files
          CHANGED_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.sha }})

          # Check against locked interfaces
          node scripts/check-interface-locks.js --files "$CHANGED_FILES"

      - name: Run interface contract tests
        if: success() || failure()
        run: npm run test:interfaces

      - name: Generate interface change report
        if: success() || failure()
        run: |
          node scripts/generate-interface-change-report.js \
            --base ${{ github.event.pull_request.base.sha }} \
            --head ${{ github.sha }} \
            --output interface-changes.md

      - name: Comment on PR with interface changes
        if: success() || failure()
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('interface-changes.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

### Interface Lock Validation Script

```javascript
// scripts/check-interface-locks.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Load interface locks configuration
const locks = JSON.parse(fs.readFileSync(".interfacelocks", "utf8"));

// Parse command line arguments
const args = process.argv.slice(2);
const fileArg = args.find((arg) => arg.startsWith("--files="));
const changedFiles = fileArg ? fileArg.replace("--files=", "").split(" ") : [];

// Check if any locked interfaces are being modified
const violations = [];

for (const file of changedFiles) {
  for (const lock of locks.locks) {
    // Handle glob patterns in paths
    const isMatch = matchesPattern(file, lock.path);

    // Check if file is in exclusions
    const isExcluded = (lock.excludes || []).some((exclude) =>
      matchesPattern(file, exclude)
    );

    if (isMatch && !isExcluded) {
      // Check if lock is expired
      const isExpired = lock.expires && new Date() > new Date(lock.expires);

      if (!isExpired) {
        violations.push({
          file,
          lock,
          type: lock.type,
          reason: lock.reason,
          owners: lock.owners,
        });
      }
    }
  }
}

// Report results
if (violations.length > 0) {
  console.error("⚠️ LOCKED INTERFACE MODIFICATION DETECTED ⚠️");
  console.error("The following locked interfaces would be modified:");

  for (const violation of violations) {
    console.error(`\nFile: ${violation.file}`);
    console.error(`Lock Type: ${violation.type}`);
    console.error(`Reason: ${violation.reason}`);
    console.error(`Owners: ${violation.owners.join(", ")}`);

    if (violation.lock.changeRequest) {
      console.error("\nRequired Change Process:");
      console.error(`- Process: ${violation.lock.changeRequest.process}`);
      console.error(
        `- Approvers: ${violation.lock.changeRequest.approvers.join(", ")}`
      );
    }
  }

  // For hard locks, fail the build
  if (violations.some((v) => v.type === "HARD_LOCK")) {
    console.error("\n❌ HARD LOCK VIOLATION - BUILD FAILED");
    console.error(
      "To modify locked interfaces, please follow the change request process."
    );
    process.exit(1);
  } else {
    console.error("\n⚠️ SOFT LOCK VIOLATION - WARNING ONLY");
    console.error("Please ensure proper approval for these changes.");
  }
} else {
  console.log("✅ No locked interface modifications detected.");
}

// Helper function to match file patterns
function matchesPattern(file, pattern) {
  // Simple glob pattern matching
  // In a real implementation, use a proper glob matching library
  const regexPattern = pattern
    .replace(/\./g, "\\.")
    .replace(/\*\*/g, ".+")
    .replace(/\*/g, "[^/]+");

  return new RegExp(`^${regexPattern}$`).test(file);
}
```

## Change Control Process

### Request for Change (RFC) Template

```markdown
# Interface Change Request (RFC)

## Interface Details

- **Name**: AuthenticationService
- **File Path**: src/auth/AuthenticationService.ts
- **Current Version**: 2.1.0
- **Proposed Version**: 2.2.0
- **Stability Classification**: LOCKED

## Change Details

### Description

[Provide a detailed description of the proposed changes]

### Justification

[Explain why this change is necessary]

### Impact Assessment

**Consumer Impact**:

- [ ] No impact on existing consumers
- [ ] Minor impact, backward compatible
- [ ] Breaking change, requires migration

**Service Level Agreements**:

- [ ] No impact on SLAs
- [ ] Minor impact on SLAs
- [ ] Significant impact on SLAs

**Security Impact**:

- [ ] No security impact
- [ ] Minor security considerations
- [ ] Significant security impact (requires security review)

### Technical Details

[Provide technical details of the implementation]

### Testing Strategy

[Describe how the changes will be tested]

### Compatibility Plan

[Explain how backward compatibility will be maintained, or migration plan if not]

## Approval

### Required Approvers

- [ ] Auth Team Lead: ********\_******** (Signature)
- [ ] Security Team Lead: ******\_\_****** (Signature)
- [ ] CTO (for critical changes): **\_\_\_** (Signature)

### Review Board Decision

- [ ] Approved as proposed
- [ ] Approved with modifications
- [ ] Rejected

### Conditions

[List any conditions attached to the approval]

## Implementation Timeline

- RFC Submission Date: [Date]
- Review Completion Target: [Date]
- Implementation Start: [Date]
- Testing Completion: [Date]
- Deployment Target: [Date]
- Monitoring Period: [Start Date] to [End Date]
```

## Runtime Lock Enforcement

### Decorator-Based Lock Enforcement

```typescript
/**
 * Decorator to enforce interface locks at runtime
 */
function LockedInterface(options: LockOptions) {
  return function (target: any) {
    // Store the original methods
    const originalMethods = Object.getOwnPropertyNames(target.prototype)
      .filter((name) => name !== "constructor")
      .reduce((methods, name) => {
        methods[name] = target.prototype[name];
        return methods;
      }, {});

    // Replace methods with locked versions
    Object.getOwnPropertyNames(originalMethods).forEach((methodName) => {
      const originalMethod = originalMethods[methodName];

      target.prototype[methodName] = function (...args) {
        // Check if we're in development mode
        if (process.env.NODE_ENV === "development") {
          console.warn(
            `⚠️ Calling locked interface method: ${target.name}.${methodName}. ` +
              `This interface is locked and requires approval for modifications.`
          );
        }

        // Log the call for auditing if needed
        if (options.auditCalls) {
          logInterfaceCall(target.name, methodName, args);
        }

        // Call the original method
        return originalMethod.apply(this, args);
      };
    });

    // Add locked interface marker
    Object.defineProperty(target, "__LOCKED_INTERFACE__", {
      value: {
        name: target.name,
        version: options.version,
        lockedSince: options.lockedSince,
        owners: options.owners,
        lockReason: options.lockReason,
        lastReview: options.lastReview,
      },
      writable: false,
      enumerable: false,
      configurable: false,
    });
  };
}

// Usage example
@LockedInterface({
  version: "2.1.0",
  lockedSince: "2024-01-15",
  owners: ["auth-team@example.com"],
  lockReason: "Critical security interface",
  lastReview: "2025-01-10",
  auditCalls: true,
})
class AuthenticationServiceImpl implements AuthenticationService {
  // Implementation of interface methods
}
```

### Proxy-Based Runtime Validation

```typescript
/**
 * Factory function to create a locked interface proxy
 * that prevents changes to interface methods at runtime
 */
function createLockedInterface<T>(implementation: T, options: LockOptions): T {
  const interfaceHandler: ProxyHandler<T> = {
    get(target: T, prop: string | symbol) {
      const value = target[prop as keyof T];

      // If it's a method, wrap it to add logging or validation
      if (typeof value === "function") {
        return function (...args: any[]) {
          // Add audit logging
          if (options.auditCalls) {
            console.log(`Called locked interface method: ${String(prop)}`);
            // In a real implementation, send to audit log system
          }

          // Call the original method
          return (value as Function).apply(target, args);
        };
      }

      return value;
    },

    set(target: T, prop: string | symbol, value: any): boolean {
      // Prevent modifications to the interface
      throw new Error(
        `Cannot modify locked interface property '${String(prop)}'. ` +
          `This interface is locked since ${options.lockedSince}. ` +
          `Contact ${options.owners.join(", ")} for change requests.`
      );
    },

    defineProperty(
      target: T,
      prop: string | symbol,
      descriptor: PropertyDescriptor
    ): boolean {
      // Prevent adding new properties
      throw new Error(
        `Cannot add properties to locked interface. ` +
          `This interface is locked since ${options.lockedSince}. ` +
          `Contact ${options.owners.join(", ")} for change requests.`
      );
    },

    deleteProperty(target: T, prop: string | symbol): boolean {
      // Prevent deleting properties
      throw new Error(
        `Cannot delete properties from locked interface. ` +
          `This interface is locked since ${options.lockedSince}. ` +
          `Contact ${options.owners.join(", ")} for change requests.`
      );
    },
  };

  return new Proxy(implementation, interfaceHandler);
}

// Usage example
const authService = createLockedInterface<AuthenticationService>(
  new AuthenticationServiceImpl(),
  {
    version: "2.1.0",
    lockedSince: "2024-01-15",
    owners: ["auth-team@example.com"],
    lockReason: "Critical security interface",
    lastReview: "2025-01-10",
    auditCalls: true,
  }
);

// This will work normally
authService.login("username", "password");

// These would throw errors:
// authService.login = () => Promise.resolve({} as AuthResult);
// delete authService.login;
// authService.newMethod = () => {};
```

## Best Practices Summary

1. **Document Lock Classification**: Always use explicit VIBE annotations for locked interfaces
2. **Include Reasoning**: Document why an interface is locked and the impact of changes
3. **Specify Owners**: Clearly identify who owns and can approve changes to locked interfaces
4. **Implement CI Checks**: Use automated checks to prevent changes to locked interfaces
5. **Regular Reviews**: Schedule periodic reviews of locked interfaces to ensure they remain appropriate
6. **Time-Limited Locks**: Consider using expirations for locks to force periodic reassessment
7. **Audit Trail**: Maintain records of all approved changes to locked interfaces
8. **Contract Tests**: Implement comprehensive contract tests for all locked interfaces
9. **Graduated Locking**: Consider implementing different lock levels for different parts of the same interface
10. **Emergency Process**: Define a clear emergency change process for urgent security fixes
