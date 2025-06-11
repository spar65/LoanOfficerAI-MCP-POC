# MCP Security Patterns

This guide demonstrates how to implement robust security measures for MCP functions to protect data and prevent unauthorized access.

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Input Validation](#input-validation)
5. [Secure Data Handling](#secure-data-handling)

## Introduction

Security is a critical aspect of any service communication protocol. MCP functions need comprehensive security measures, including:

- Strong authentication mechanisms
- Fine-grained authorization controls
- Schema-based input validation
- Secure data handling practices
- Audit logging for security events

## Authentication

```javascript
// server/auth/mcpAuthMiddleware.js
const jwt = require("jsonwebtoken");
const LogService = require("../services/logService");

const mcpAuthMiddleware = async (context, next) => {
  const { req } = context;

  try {
    // Check for token in headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required",
        },
      };
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user to context
    context.user = decoded;

    // Log authentication success
    LogService.debug(`MCP authentication successful for user ${decoded.id}`, {
      userId: decoded.id,
      functionName: context.functionName,
      requestId: context.requestId,
    });

    // Continue to next middleware or handler
    return next();
  } catch (error) {
    // Log authentication failure
    LogService.warn(`MCP authentication failed: ${error.message}`, {
      error: error.message,
      functionName: context.functionName,
      requestId: context.requestId,
    });

    // Return authentication error
    return {
      success: false,
      error: {
        code: "AUTHENTICATION_FAILED",
        message: "Authentication failed",
        details:
          process.env.NODE_ENV === "production" ? undefined : error.message,
      },
    };
  }
};

module.exports = mcpAuthMiddleware;
```

## Authorization

```javascript
// server/auth/mcpAuthorizationMiddleware.js
const LogService = require("../services/logService");

// Permission definitions
const functionPermissions = {
  // User management functions
  "users.getUserProfile": ["USER_READ", "ADMIN"],
  "users.updateUserProfile": ["USER_WRITE", "ADMIN"],
  "users.deleteUser": ["ADMIN"],

  // Loan management functions
  "loans.getLoanDetails": ["LOAN_READ", "LOAN_OFFICER", "ADMIN"],
  "loans.createLoan": ["LOAN_WRITE", "LOAN_OFFICER", "ADMIN"],
  "loans.approveLoan": ["LOAN_APPROVE", "LOAN_OFFICER", "ADMIN"],
  "loans.rejectLoan": ["LOAN_APPROVE", "LOAN_OFFICER", "ADMIN"],

  // Document management functions
  "documents.getDocument": ["DOCUMENT_READ", "LOAN_OFFICER", "ADMIN"],
  "documents.uploadDocument": ["DOCUMENT_WRITE", "LOAN_OFFICER", "ADMIN"],
  "documents.deleteDocument": ["DOCUMENT_DELETE", "ADMIN"],
};

// Resource-based access control
const resourceAccessControl = {
  "users.getUserProfile": (user, args) =>
    user.id === args.userId || user.roles.includes("ADMIN"),
  "users.updateUserProfile": (user, args) =>
    user.id === args.userId || user.roles.includes("ADMIN"),
  "loans.getLoanDetails": async (user, args) => {
    // Resource-based check: only loan officers assigned to this loan or admins
    if (user.roles.includes("ADMIN")) return true;

    const loan = await db.loans.findOne({ id: args.loanId });
    return loan && loan.assignedOfficerId === user.id;
  },
};

const mcpAuthorizationMiddleware = async (context, next) => {
  const { functionName, args, user } = context;

  if (!user) {
    return {
      success: false,
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required for authorization",
      },
    };
  }

  try {
    // Check role-based permissions
    const requiredPermissions = functionPermissions[functionName];

    if (requiredPermissions) {
      const hasPermission = requiredPermissions.some(
        (permission) => user.roles && user.roles.includes(permission)
      );

      if (!hasPermission) {
        LogService.warn(
          `MCP authorization failed: insufficient permissions for ${functionName}`,
          {
            userId: user.id,
            functionName,
            userRoles: user.roles,
            requiredPermissions,
          }
        );

        return {
          success: false,
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Insufficient permissions to execute this function",
          },
        };
      }
    }

    // Check resource-based access control
    const resourceCheck = resourceAccessControl[functionName];

    if (resourceCheck) {
      const hasAccess = await resourceCheck(user, args);

      if (!hasAccess) {
        LogService.warn(
          `MCP authorization failed: resource access denied for ${functionName}`,
          {
            userId: user.id,
            functionName,
            resourceId: args.userId || args.loanId,
          }
        );

        return {
          success: false,
          error: {
            code: "ACCESS_DENIED",
            message: "Access denied to the requested resource",
          },
        };
      }
    }

    // Log successful authorization
    LogService.debug(`MCP authorization successful for ${functionName}`, {
      userId: user.id,
      functionName,
      requestId: context.requestId,
    });

    // Continue to next middleware or handler
    return next();
  } catch (error) {
    // Log authorization error
    LogService.error(`MCP authorization error: ${error.message}`, {
      userId: user.id,
      functionName,
      error: error.message,
      stack: error.stack,
    });

    // Return authorization error
    return {
      success: false,
      error: {
        code: "AUTHORIZATION_ERROR",
        message: "Error during authorization check",
        details:
          process.env.NODE_ENV === "production" ? undefined : error.message,
      },
    };
  }
};

module.exports = mcpAuthorizationMiddleware;
```

## Input Validation

```javascript
// server/middleware/mcpValidationMiddleware.js
const Ajv = require("ajv");
const LogService = require("../services/logService");

// Create validator instance
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: "all", // Remove additional properties from objects
  useDefaults: true, // Apply default values from schema
  coerceTypes: true, // Type coercion
});

// Add formats for validation
ajv.addFormat("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
ajv.addFormat("phone", /^\+?[0-9]{10,15}$/);

const mcpValidationMiddleware = (functionRegistry) => async (context, next) => {
  const { functionName, args } = context;

  try {
    // Get function definition with schema
    const functionDef = functionRegistry.getFunction(functionName);

    if (!functionDef) {
      return {
        success: false,
        error: {
          code: "FUNCTION_NOT_FOUND",
          message: `Function not found: ${functionName}`,
        },
      };
    }

    // Skip validation if no parameters schema defined
    if (!functionDef.parameters) {
      return next();
    }

    // Create validator for this schema
    const validate = ajv.compile(functionDef.parameters);

    // Validate arguments
    const valid = validate(args);

    if (!valid) {
      // Format validation errors
      const errors = validate.errors.map((err) => ({
        field:
          err.dataPath?.substring(1) || err.params?.missingProperty || "input",
        message: err.message,
        code: err.keyword,
      }));

      // Log validation failure
      LogService.warn(`MCP validation failed for ${functionName}`, {
        functionName,
        errors,
        args: JSON.stringify(args),
      });

      // Return validation error
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid arguments",
          details: errors,
        },
      };
    }

    // Arguments are valid and sanitized (additional properties removed)
    // Continue to next middleware or handler
    return next();
  } catch (error) {
    // Log validation error
    LogService.error(`MCP validation error: ${error.message}`, {
      functionName,
      error: error.message,
      stack: error.stack,
    });

    // Return validation error
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Error validating arguments",
        details:
          process.env.NODE_ENV === "production" ? undefined : error.message,
      },
    };
  }
};

module.exports = mcpValidationMiddleware;
```

## Secure Data Handling

```javascript
// server/middleware/mcpDataSecurityMiddleware.js
const LogService = require("../services/logService");
const { encrypt, decrypt } = require("../utils/encryption");

const sensitiveFields = [
  "ssn",
  "socialSecurityNumber",
  "taxId",
  "password",
  "creditCardNumber",
  "cardNumber",
  "cvv",
  "securityCode",
];

const mcpDataSecurityMiddleware = async (context, next) => {
  const { functionName, args } = context;

  try {
    // Process arguments to mask/encrypt sensitive data
    const sanitizedArgs = sanitizeObject(args);

    // Replace original args with sanitized version
    context.args = sanitizedArgs;

    // Execute the function
    const result = await next();

    // If result contains secure data that was requested, decrypt for response
    if (context.includeSecureData && result.success && result.data) {
      return {
        ...result,
        data: restoreSecureData(result.data, context),
      };
    }

    return result;
  } catch (error) {
    // Log security error
    LogService.error(`MCP data security error: ${error.message}`, {
      functionName,
      error: error.message,
      stack: error.stack,
    });

    // Return security error
    return {
      success: false,
      error: {
        code: "SECURITY_ERROR",
        message: "Error processing secure data",
        details:
          process.env.NODE_ENV === "production" ? undefined : error.message,
      },
    };
  }
};

// Recursively sanitize object
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.includes(key)) {
      // Encrypt sensitive values
      sanitized[key] = value ? encrypt(value) : value;

      // Add marker to identify encrypted fields
      sanitized[`${key}IsEncrypted`] = Boolean(value);
    } else if (typeof value === "object" && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value);
    } else {
      // Pass through non-sensitive values
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Restore secure data if authorized
function restoreSecureData(data, context) {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => restoreSecureData(item, context));
  }

  const restored = { ...data };

  for (const [key, value] of Object.entries(data)) {
    // Check for encrypted fields
    if (key.endsWith("IsEncrypted") && value === true) {
      const originalField = key.replace("IsEncrypted", "");

      // Check if user is authorized to see this field
      const canViewSecureField = checkSecureFieldAuthorization(
        context,
        originalField,
        data
      );

      if (canViewSecureField && data[originalField]) {
        // Decrypt the field
        restored[originalField] = decrypt(data[originalField]);
      }

      // Remove the marker
      delete restored[key];
    } else if (typeof value === "object" && value !== null) {
      // Recursively process nested objects
      restored[key] = restoreSecureData(value, context);
    }
  }

  return restored;
}

// Check if user can view a secure field
function checkSecureFieldAuthorization(context, fieldName, data) {
  const { user } = context;

  // Admins can view all secure data
  if (user && user.roles && user.roles.includes("ADMIN")) {
    return true;
  }

  // Additional field-specific authorization logic
  // For example, users can see their own SSN but not others
  if (fieldName === "ssn" || fieldName === "socialSecurityNumber") {
    return data.userId === user.id;
  }

  // Credit card data usually highly restricted
  if (
    fieldName === "creditCardNumber" ||
    fieldName === "cardNumber" ||
    fieldName === "cvv"
  ) {
    return false; // Only show last 4 digits, handled elsewhere
  }

  // Default to deny
  return false;
}

module.exports = mcpDataSecurityMiddleware;
```

For comprehensive implementation guidelines on security patterns, refer to rule [515-mcp-security-patterns.mdc](../../515-mcp-security-patterns.mdc) in the `.cursor/rules` directory.
