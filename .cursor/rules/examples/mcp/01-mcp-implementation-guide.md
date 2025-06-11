# MCP Implementation Guide

This guide provides practical examples and patterns for implementing the Model Completion Protocol (MCP) in your applications, both for AI functions and general service communication.

## Rule to Guide Mapping

The following table maps MCP rules to their corresponding implementation guides:

| Rule                                                                   | Description                     | Implementation Guide                                             |
| ---------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| [508-mcp-as-service-protocol](../../508-mcp-as-service-protocol.mdc)   | Using MCP as a service protocol | [02-mcp-service-protocol.md](02-mcp-service-protocol.md)         |
| [509-mcp-composition-patterns](../../509-mcp-composition-patterns.mdc) | Composition patterns for MCP    | [03-mcp-composition-patterns.md](03-mcp-composition-patterns.md) |
| [510-mcp-real-time-systems](../../510-mcp-real-time-systems.mdc)       | Real-time systems using MCP     | [04-mcp-real-time-systems.md](04-mcp-real-time-systems.md)       |
| [511-mcp-offline-operations](../../511-mcp-offline-operations.mdc)     | Offline operations and sync     | [05-mcp-offline-operations.md](05-mcp-offline-operations.md)     |
| [512-mcp-versioning-strategy](../../512-mcp-versioning-strategy.mdc)   | Versioning strategy for MCP     | [06-mcp-versioning-strategy.md](06-mcp-versioning-strategy.md)   |
| [513-mcp-as-integration-bus](../../513-mcp-as-integration-bus.mdc)     | MCP as integration bus          | [07-mcp-as-integration-bus.md](07-mcp-as-integration-bus.md)     |
| [514-mcp-analytics-monitoring](../../514-mcp-analytics-monitoring.mdc) | Analytics and monitoring        | [08-mcp-analytics-monitoring.md](08-mcp-analytics-monitoring.md) |
| [515-mcp-security-patterns](../../515-mcp-security-patterns.mdc)       | Security patterns for MCP       | [09-mcp-security-patterns.md](09-mcp-security-patterns.md)       |

## Table of Contents

1. [Basic MCP Implementation](#basic-mcp-implementation)
2. [MCP as Service Protocol](#mcp-as-service-protocol)
3. [Function Composition](#function-composition)
4. [Real-Time Systems](#real-time-systems)
5. [Offline Operations](#offline-operations)
6. [Versioning Strategy](#versioning-strategy)
7. [Integration Bus](#integration-bus)
8. [Analytics and Monitoring](#analytics-and-monitoring)
9. [Security Patterns](#security-patterns)

## Basic MCP Implementation

### Server-Side MCP Implementation

Here's a basic Express.js implementation of an MCP server:

```javascript
// server/services/mcpService.js
const functions = require("./mcpFunctions");

class McpService {
  constructor() {
    this.functions = new Map();

    // Register built-in functions
    this.registerFunctions(functions);
  }

  // Register MCP functions
  registerFunctions(functionsObj) {
    Object.entries(functionsObj).forEach(([name, func]) => {
      this.functions.set(name, func);
    });
  }

  // Execute MCP function
  async executeFunction(name, args, context = {}) {
    const func = this.functions.get(name);

    if (!func) {
      throw new Error(`Function not found: ${name}`);
    }

    // Validate parameters against schema if available
    if (func.parameters) {
      const validationResult = await this.validateParameters(
        func.parameters,
        args
      );
      if (!validationResult.valid) {
        throw new Error(
          `Invalid parameters: ${JSON.stringify(validationResult.errors)}`
        );
      }
    }

    // Execute the function
    return await func.handler(args, context);
  }

  // Validate parameters against schema
  async validateParameters(schema, args) {
    // Simple validation implementation
    // In production, use a schema validation library like Joi, Yup, or Ajv

    try {
      const requiredProps = schema.required || [];
      const errors = [];

      // Check required properties
      for (const prop of requiredProps) {
        if (args[prop] === undefined) {
          errors.push(`Missing required property: ${prop}`);
        }
      }

      // Check property types
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([name, propSchema]) => {
          if (args[name] !== undefined) {
            if (
              propSchema.type === "string" &&
              typeof args[name] !== "string"
            ) {
              errors.push(`Property ${name} must be a string`);
            } else if (
              propSchema.type === "number" &&
              typeof args[name] !== "number"
            ) {
              errors.push(`Property ${name} must be a number`);
            } else if (
              propSchema.type === "boolean" &&
              typeof args[name] !== "boolean"
            ) {
              errors.push(`Property ${name} must be a boolean`);
            } else if (
              propSchema.type === "array" &&
              !Array.isArray(args[name])
            ) {
              errors.push(`Property ${name} must be an array`);
            } else if (
              propSchema.type === "object" &&
              (typeof args[name] !== "object" || Array.isArray(args[name]))
            ) {
              errors.push(`Property ${name} must be an object`);
            }
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
      };
    }
  }

  // Get function definitions (for client discovery)
  getFunctionDefinitions() {
    const definitions = [];

    for (const [name, func] of this.functions.entries()) {
      definitions.push({
        name,
        description: func.description,
        parameters: func.parameters,
      });
    }

    return definitions;
  }
}

module.exports = new McpService();
```

### Defining MCP Functions

```javascript
// server/services/mcpFunctions.js
module.exports = {
  // Get customer profile
  getCustomerProfile: {
    name: "getCustomerProfile",
    description: "Retrieve a customer profile by ID",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "The unique identifier for the customer",
        },
      },
      required: ["customerId"],
    },
    handler: async (args, context) => {
      const { customerId } = args;

      // In a real implementation, fetch from database
      const customer = await db.customers.findOne({ id: customerId });

      if (!customer) {
        throw new Error(`Customer not found: ${customerId}`);
      }

      return {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        // Add other customer fields as needed
      };
    },
  },

  // List loan applications
  listLoanApplications: {
    name: "listLoanApplications",
    description: "List loan applications with optional filtering",
    parameters: {
      type: "object",
      properties: {
        customerId: {
          type: "string",
          description: "Filter applications by customer ID",
        },
        status: {
          type: "string",
          description: "Filter applications by status",
          enum: ["pending", "approved", "rejected", "closed"],
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return",
        },
        offset: {
          type: "number",
          description: "Number of results to skip for pagination",
        },
      },
    },
    handler: async (args, context) => {
      const { customerId, status, limit = 10, offset = 0 } = args;

      // Build query
      const query = {};
      if (customerId) query.customerId = customerId;
      if (status) query.status = status;

      // In a real implementation, fetch from database
      const applications = await db.loanApplications
        .find(query)
        .limit(limit)
        .skip(offset)
        .toArray();

      const total = await db.loanApplications.count(query);

      return {
        applications: applications.map((app) => ({
          id: app.id,
          customerId: app.customerId,
          amount: app.amount,
          term: app.term,
          status: app.status,
          submittedAt: app.submittedAt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + applications.length < total,
        },
      };
    },
  },
};
```

### API Endpoint for MCP

```javascript
// server/routes/openai.js - MCP API Endpoint
const express = require("express");
const router = express.Router();
const mcpService = require("../services/mcpService");

// MCP function execution endpoint
router.post("/mcp", async (req, res) => {
  try {
    const { function: functionName, arguments: args } = req.body;

    if (!functionName) {
      return res.status(400).json({ error: "Missing function name" });
    }

    // Create context with user info, request details, etc.
    const context = {
      user: req.user,
      requestId: req.id || Math.random().toString(36).substring(2, 15),
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    };

    // Execute the MCP function
    const result = await mcpService.executeFunction(
      functionName,
      args || {},
      context
    );

    return res.json({ result });
  } catch (error) {
    console.error("MCP function error:", error);

    return res.status(400).json({
      error: error.message || "Error executing function",
      requestId: req.id,
    });
  }
});

// Get available MCP functions
router.get("/mcp/functions", (req, res) => {
  const functions = mcpService.getFunctionDefinitions();
  return res.json({ functions });
});

module.exports = router;
```

### Client-Side MCP Implementation

```javascript
// client/src/mcp/client.js
class McpClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "/api/mcp";
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
  }

  // Execute MCP function
  async execute(functionName, args = {}, options = {}) {
    const url = this.baseUrl;
    const timeout = options.timeout || this.timeout;

    const headers = {
      "Content-Type": "application/json",
      ...this.headers,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          function: functionName,
          arguments: args,
        }),
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error(`Function execution timed out after ${timeout}ms`);
      }
      throw error;
    }
  }

  // Fetch available functions
  async getFunctions() {
    try {
      const response = await fetch(`${this.baseUrl}/functions`, {
        method: "GET",
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data.functions || [];
    } catch (error) {
      console.error("Error fetching MCP functions:", error);
      throw error;
    }
  }
}

export default McpClient;
```

### React Hook for MCP

```javascript
// client/src/hooks/useMcp.js
import { useState, useEffect, useCallback } from "react";
import McpClient from "../mcp/client";

// Client instance (could be moved to a provider for global state)
const mcpClient = new McpClient();

function useMcp(functionName, args = {}, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine if we should fetch immediately
  const { immediate = true, onSuccess, onError } = options;

  // Execute function and handle response
  const execute = useCallback(
    async (currentArgs = args) => {
      try {
        setLoading(true);
        setError(null);

        const result = await mcpClient.execute(
          functionName,
          currentArgs,
          options
        );

        setData(result);
        setLoading(false);

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        setError(err);
        setLoading(false);

        if (onError) {
          onError(err);
        }

        throw err;
      }
    },
    [functionName, options, onSuccess, onError]
  );

  // Initial fetch if immediate is true
  useEffect(() => {
    if (immediate) {
      execute(args);
    }
  }, [immediate, JSON.stringify(args)]);

  return {
    data,
    loading,
    error,
    execute,
  };
}

export default useMcp;
```

## MCP as Service Protocol

For more examples of using MCP as a general-purpose service protocol, see [02-mcp-service-protocol.md](02-mcp-service-protocol.md) and refer to rule [508-mcp-as-service-protocol.mdc](../../508-mcp-as-service-protocol.mdc) for detailed implementation guidelines.
