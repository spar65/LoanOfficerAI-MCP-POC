# MCP Versioning Strategy

This guide demonstrates how to implement versioning for MCP functions to allow for evolution while maintaining backward compatibility.

## Table of Contents

1. [Introduction](#introduction)
2. [Version Identification](#version-identification)
3. [Backward Compatibility](#backward-compatibility)
4. [Function Evolution](#function-evolution)
5. [Migration Strategies](#migration-strategies)

## Introduction

As applications evolve, so must their APIs. A robust versioning strategy allows MCP functions to evolve without breaking existing clients. Key considerations include:

- Explicit version identification
- Backward compatibility guarantees
- Gradual deprecation processes
- Client migration support

## Version Identification

```javascript
// Example: Version-namespaced functions
const mcpFunctions = [
  // Current version (v1)
  {
    name: "v1.getCustomerProfile",
    description: "Get customer profile data (v1)",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID",
        },
      },
      required: ["customerId"],
    },
    handler: async (args) => {
      // v1 implementation
      const { customerId } = args;
      const customer = await db.customers.findOne({ id: customerId });

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      };
    },
  },

  // Enhanced version (v2)
  {
    name: "v2.getCustomerProfile",
    description: "Get customer profile data with expanded information (v2)",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Customer ID",
        },
        includePreferences: {
          type: "boolean",
          description: "Include customer preferences",
          default: true,
        },
        includeHistory: {
          type: "boolean",
          description: "Include activity history summary",
          default: false,
        },
      },
      required: ["customerId"],
    },
    handler: async (args) => {
      // v2 implementation
      const { customerId, includePreferences, includeHistory } = args;
      const customer = await db.customers.findOne({ id: customerId });

      // Basic profile (same as v1)
      const profile = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      };

      // Enhanced data
      if (includePreferences) {
        profile.preferences = await getCustomerPreferences(customerId);
      }

      if (includeHistory) {
        profile.activitySummary = await getActivitySummary(customerId);
      }

      return profile;
    },
  },
];
```

## Backward Compatibility

```javascript
// Example: Version-transparent function with internal routing
function createBackwardCompatibleHandler() {
  return {
    // Single function name with version parameter
    async getCustomerProfile(args, context) {
      const { customerId, version = "current" } = args;

      // Route to appropriate implementation based on version
      if (version === "v1" || version === "1") {
        // v1 implementation
        const customer = await db.customers.findOne({ id: customerId });

        return {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        };
      } else {
        // v2 or current implementation
        const { includePreferences = true, includeHistory = false } = args;
        const customer = await db.customers.findOne({ id: customerId });

        // Basic profile
        const profile = {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        };

        // Enhanced data
        if (includePreferences) {
          profile.preferences = await getCustomerPreferences(customerId);
        }

        if (includeHistory) {
          profile.activitySummary = await getActivitySummary(customerId);
        }

        return profile;
      }
    },
  };
}
```

## Function Evolution

When evolving MCP functions, follow these patterns:

1. **Additive Changes**: Add new optional parameters or response fields
2. **Smart Defaults**: Provide sensible defaults for new parameters
3. **Parameter Deprecation**: Mark parameters as deprecated before removal
4. **Function Aliasing**: Support both old and new function names during transition

```javascript
// Function with deprecation notices
{
  name: "getLoanTerms",
  description: "Get loan terms with rate options",
  parameters: {
    type: "object",
    properties: {
      loanAmount: {
        type: "number",
        description: "Loan amount"
      },
      loanType: {
        type: "string",
        description: "Type of loan",
        enum: ["mortgage", "auto", "personal"]
      },
      creditScore: {
        type: "number",
        description: "Borrower's credit score"
      },
      term: {
        type: "number",
        description: "Loan term in months",
        deprecated: true,
        deprecationMessage: "Use 'termMonths' instead"
      },
      termMonths: {
        type: "number",
        description: "Loan term in months"
      }
    },
    required: ["loanAmount", "loanType", "creditScore"]
  },
  handler: async (args) => {
    const { loanAmount, loanType, creditScore } = args;

    // Handle deprecated parameter
    let termMonths = args.termMonths;
    if (termMonths === undefined && args.term !== undefined) {
      console.warn("'term' parameter is deprecated, use 'termMonths' instead");
      termMonths = args.term;
    }

    // Default for new parameter if both are missing
    termMonths = termMonths || getDefaultTerm(loanType);

    // Rest of implementation...
  }
}
```

## Migration Strategies

See the [MCP as Service Protocol guide](02-mcp-service-protocol.md) for examples of API migration strategies that can be applied to MCP function versioning.

For more comprehensive implementation guidelines on versioning strategy, refer to rule [512-mcp-versioning-strategy.mdc](../../512-mcp-versioning-strategy.mdc) in the `.cursor/rules` directory.
