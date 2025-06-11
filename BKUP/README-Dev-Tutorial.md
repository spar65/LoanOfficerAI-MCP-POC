# MCP Developer Tutorial

## Introduction

Welcome to the Model Completion Protocol (MCP) framework! If you're reading this, you're about to dive into our service communication architecture. While MCP originated as a protocol for AI function calling, we've expanded it into a comprehensive framework for all service-to-service communication in our application.

## What is MCP?

At its core, MCP is a standardized approach to function-based communication between services. It provides:

- **Type-safe interfaces** with JSON Schema validation
- **Consistent error handling** across all service boundaries
- **Protocol-agnostic communication** that works over HTTP, WebSockets, or direct function calls
- **Composable operations** that can be chained, batched, or nested

## Getting Started

### Basic Server Implementation

Here's how MCP works on the server side:

```javascript
// server/services/mcpService.js - Basic implementation
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

    // Execute the function
    return await func.handler(args, context);
  }
}

module.exports = new McpService();
```

### Defining Functions

MCP functions follow a consistent structure:

```javascript
// Example MCP function
const getLoanDetails = {
  name: "getLoanDetails",
  description: "Get detailed information about a loan",
  parameters: {
    type: "object",
    properties: {
      loanId: {
        type: "string",
        description: "The unique identifier for the loan",
      },
    },
    required: ["loanId"],
  },
  handler: async (args, context) => {
    const { loanId } = args;

    // Implementation to fetch loan details
    const loan = await db.loans.findOne({ id: loanId });

    if (!loan) {
      throw new Error(`Loan not found: ${loanId}`);
    }

    return {
      id: loan.id,
      amount: loan.amount,
      term: loan.term,
      interestRate: loan.interestRate,
      status: loan.status,
      createdAt: loan.createdAt,
    };
  },
};
```

### Client Implementation

On the client side, our MCP client makes it easy to call functions:

```javascript
// client/src/mcp/client.js
class McpClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "/api/mcp";
    this.headers = options.headers || {};
  }

  // Execute MCP function
  async execute(functionName, args = {}, options = {}) {
    const url = this.baseUrl;

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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error(`Error executing ${functionName}:`, error);
      throw error;
    }
  }
}
```

## Advanced Features

### Middleware Architecture

MCP uses middleware for cross-cutting concerns:

```javascript
// Middleware example - Authentication
const authMiddleware = async (context, next) => {
  const { req } = context;

  // Check for token
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return {
      success: false,
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication required",
      },
    };
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Add user to context
    context.user = decoded;

    // Continue to next middleware or handler
    return next();
  } catch (error) {
    return {
      success: false,
      error: {
        code: "AUTHENTICATION_FAILED",
        message: "Authentication failed",
      },
    };
  }
};

// Add middleware to MCP router
mcpRouter.use(authMiddleware);
```

### Function Composition

You can compose functions for more complex operations:

```javascript
// Compose multiple MCP functions
const createLoanApplication = {
  name: "createLoanApplication",
  description: "Create a new loan application",
  parameters: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "Customer ID",
      },
      loanAmount: {
        type: "number",
        description: "Requested loan amount",
      },
      loanTerm: {
        type: "number",
        description: "Loan term in months",
      },
    },
    required: ["customerId", "loanAmount", "loanTerm"],
  },
  handler: async (args, context) => {
    const { customerId, loanAmount, loanTerm } = args;

    // Step 1: Get customer data
    const customer = await mcpService.executeFunction(
      "getCustomerProfile",
      { customerId },
      context
    );

    // Step 2: Check credit eligibility
    const creditCheck = await mcpService.executeFunction(
      "checkCreditEligibility",
      {
        customerId,
        requestedAmount: loanAmount,
      },
      context
    );

    // Step 3: Create application
    const application = await db.loanApplications.create({
      customerId,
      amount: loanAmount,
      term: loanTerm,
      status: creditCheck.approved ? "pre_approved" : "pending_review",
      creditScore: creditCheck.creditScore,
      submittedAt: new Date(),
    });

    // Step 4: Notify customer
    await mcpService.executeFunction(
      "sendNotification",
      {
        recipient: {
          email: customer.email,
          phone: customer.phone,
        },
        template: "loan_application_received",
        data: {
          customerName: `${customer.firstName} ${customer.lastName}`,
          applicationId: application.id,
          amount: loanAmount,
          status: application.status,
        },
      },
      context
    );

    return {
      applicationId: application.id,
      status: application.status,
      nextSteps:
        application.status === "pre_approved"
          ? ["Upload required documents", "Sign disclosures"]
          : ["Wait for review"],
    };
  },
};
```

### Offline Operations

Our MCP implementation supports offline operations:

```javascript
// Using offline support in client
const offlineClient = new McpOfflineClient();

// Execute with offline fallback
const result = await offlineClient.execute(
  "getCustomerProfile",
  { customerId: "123" },
  {
    cacheable: true, // Can be cached for offline use
    offlineCapable: true, // Can execute offline
  }
);

// Queue operation for later sync
await offlineClient.execute(
  "updateCustomerProfile",
  {
    customerId: "123",
    firstName: "John",
    lastName: "Doe",
  },
  { isWrite: true } // Will be queued offline
);
```

## MCP Components Overview

Here's a brief overview of the key MCP components in our system:

### Rules and Implementation Guides

| Rule                       | Guide                          | Description                                           |
| -------------------------- | ------------------------------ | ----------------------------------------------------- |
| MCP as Service Protocol    | 02-mcp-service-protocol.md     | Using MCP beyond AI for general service communication |
| MCP Composition Patterns   | 03-mcp-composition-patterns.md | Patterns for combining MCP functions                  |
| MCP for Real-time Systems  | 04-mcp-real-time-systems.md    | Real-time communication using MCP                     |
| MCP for Offline Operations | 05-mcp-offline-operations.md   | Implementing offline capabilities with sync           |
| MCP Versioning Strategy    | 06-mcp-versioning-strategy.md  | Managing API evolution with versioning                |
| MCP as Integration Bus     | 07-mcp-as-integration-bus.md   | Using MCP for service integration                     |
| MCP Analytics & Monitoring | 08-mcp-analytics-monitoring.md | Adding observability to MCP functions                 |
| MCP Security Patterns      | 09-mcp-security-patterns.md    | Security implementation for MCP                       |

## Summary of MCP Components

### Rules

**508-mcp-as-service-protocol**: Establishes MCP as a general-purpose service protocol providing standardized communication across different service types, with consistent error handling, schema validation, and protocol independence. It emphasizes unified interfaces across service boundaries.

**509-mcp-composition-patterns**: Defines patterns for combining MCP functions including chains, batches, sagas, and process managers. This enables building complex workflows from simpler operations while maintaining transactional integrity across multiple service calls.

**510-mcp-real-time-systems**: Provides patterns for implementing real-time capabilities with MCP including WebSocket integration, server-sent events, and long-polling. Enables building responsive applications with bidirectional communication.

**511-mcp-offline-operations**: Describes how to implement offline capabilities with queueing, local storage, synchronization, and conflict resolution. Enables applications to function without continuous network connectivity.

**512-mcp-versioning-strategy**: Details how to evolve MCP functions while maintaining backward compatibility, using version identification, parameter deprecation, and migration paths between versions.

**513-mcp-as-integration-bus**: Shows how to use MCP as a central integration hub connecting disparate systems with standard adapters, transformers, and routing rules. Establishes patterns for cross-system communication.

**514-mcp-analytics-monitoring**: Covers implementing observability for MCP functions with structured logging, metrics collection, and tracing. Enables monitoring function performance and troubleshooting issues.

**515-mcp-security-patterns**: Defines security measures for MCP including authentication, authorization, input validation, and secure data handling. Establishes patterns for protecting sensitive operations and data.

### Implementation Guides

**01-mcp-implementation-guide**: Core implementation guide providing the foundation for MCP with base server and client implementations, function registration, and execution patterns.

**02-mcp-service-protocol**: Shows how to use MCP for general service communication beyond AI function calling, with protocol-agnostic interfaces and consistent error handling.

**03-mcp-composition-patterns**: Practical examples of composition patterns including chains, batches, and distributed transactions with code examples for each pattern.

**04-mcp-real-time-systems**: Implementation details for real-time capabilities including WebSocket and SSE examples, along with best practices for event streaming.

**05-mcp-offline-operations**: Practical implementation of offline capabilities with client-side queuing, synchronization logic, and conflict resolution strategies.

**06-mcp-versioning-strategy**: Implementation examples for versioning MCP functions with backward compatibility guarantees and migration strategies.

**07-mcp-as-integration-bus**: Detailed implementation of an integration bus using MCP with adapter patterns, transformers, and dynamic routing between systems.

**08-mcp-analytics-monitoring**: Implementation of logging middleware, metrics collection, and tracing for MCP functions with visualization examples.

**09-mcp-security-patterns**: Security implementations including authentication middleware, authorization patterns, and secure data handling with encryption.

## Next Steps

For more detailed information on any aspect of MCP, refer to the specific implementation guides in the `.cursor/rules/examples/mcp/` directory. These guides contain comprehensive examples and best practices for each aspect of the framework.

If you're developing new functionality, we recommend starting with the base MCP patterns and extending them as needed for your specific use case. This ensures consistency across our application and makes your code easier to maintain.
