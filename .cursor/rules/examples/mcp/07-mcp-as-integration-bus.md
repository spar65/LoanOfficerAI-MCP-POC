# MCP as Integration Bus

This guide demonstrates how to use MCP as a centralized integration bus for connecting multiple systems and services.

## Table of Contents

1. [Introduction](#introduction)
2. [Integration Architecture](#integration-architecture)
3. [Service Registry](#service-registry)
4. [Event Broadcasting](#event-broadcasting)
5. [Adapters and Transformers](#adapters-and-transformers)

## Introduction

MCP can serve as a powerful integration platform, providing a consistent interface for service-to-service communication. Key benefits include:

- Centralized integration point for multiple systems
- Consistent interface definitions across services
- Type-safe communication with schema validation
- Built-in monitoring and observability
- Simplified client implementations

## Integration Architecture

```javascript
// server/mcp/integrationBus.js
const { EventEmitter } = require("events");
const LogService = require("../services/logService");

class McpIntegrationBus {
  constructor(options = {}) {
    this.services = new Map();
    this.functionHandlers = new Map();
    this.eventEmitter = new EventEmitter();
    this.middlewares = [];

    // Configure max listeners to prevent memory leak warnings
    this.eventEmitter.setMaxListeners(options.maxListeners || 100);
  }

  // Register a service with the bus
  registerService(serviceConfig) {
    const { serviceName, serviceUrl, functions = [] } = serviceConfig;

    if (this.services.has(serviceName)) {
      throw new Error(`Service ${serviceName} is already registered`);
    }

    this.services.set(serviceName, {
      name: serviceName,
      url: serviceUrl,
      functions: new Map(functions.map((f) => [f.name, f])),
      client: serviceConfig.client || this.createServiceClient(serviceUrl),
    });

    // Register functions from this service
    functions.forEach((func) => {
      const fullName = `${serviceName}.${func.name}`;
      this.functionHandlers.set(fullName, {
        service: serviceName,
        function: func.name,
        definition: func,
      });

      LogService.info(`Registered integration function: ${fullName}`);
    });

    LogService.info(`Registered service: ${serviceName}`);
    return this;
  }

  // Add middleware to the bus
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  // Execute a function through the bus
  async execute(functionName, args = {}, context = {}) {
    let serviceName, funcName;

    // Parse service and function name
    if (functionName.includes(".")) {
      [serviceName, funcName] = functionName.split(".");
    } else {
      // Search for function across all services
      for (const [svcName, service] of this.services.entries()) {
        if (service.functions.has(functionName)) {
          serviceName = svcName;
          funcName = functionName;
          break;
        }
      }

      if (!serviceName) {
        throw new Error(`Function not found: ${functionName}`);
      }
    }

    // Get service
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    // Build execution context
    const execContext = {
      serviceName,
      functionName: funcName,
      args,
      context: {
        requestId: context.requestId || `req_${Date.now()}`,
        timestamp: context.timestamp || new Date().toISOString(),
        user: context.user,
        ...context,
      },
    };

    // Run through middleware chain
    let currentIndex = 0;
    const next = async () => {
      if (currentIndex < this.middlewares.length) {
        const middleware = this.middlewares[currentIndex++];
        return middleware(execContext, next);
      } else {
        // End of middleware chain, execute the function
        return this.executeFunction(execContext);
      }
    };

    return next();
  }

  // Execute function on service
  async executeFunction(execContext) {
    const { serviceName, functionName, args, context } = execContext;
    const service = this.services.get(serviceName);

    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    LogService.info(
      `Executing integration function ${serviceName}.${functionName}`,
      {
        args: JSON.stringify(args),
        requestId: context.requestId,
      }
    );

    try {
      // Execute function using service client
      const result = await service.client.execute(functionName, args, context);

      // Emit execution event
      this.eventEmitter.emit("execution", {
        serviceName,
        functionName,
        args,
        context,
        result,
        timestamp: new Date().toISOString(),
        status: "success",
      });

      return result;
    } catch (error) {
      // Emit error event
      this.eventEmitter.emit("execution", {
        serviceName,
        functionName,
        args,
        context,
        error: {
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
        status: "error",
      });

      throw error;
    }
  }

  // Get all registered services
  getServices() {
    return Array.from(this.services.values()).map((svc) => ({
      name: svc.name,
      url: svc.url,
      functions: Array.from(svc.functions.values()),
    }));
  }

  // Get all registered functions
  getFunctions() {
    return Array.from(this.functionHandlers.entries()).map(
      ([name, handler]) => ({
        name,
        service: handler.service,
        definition: handler.definition,
      })
    );
  }

  // Create a standard client for a service
  createServiceClient(serviceUrl) {
    // Implementation would depend on your client library
    return {
      execute: async (functionName, args, context) => {
        // Basic implementation
        const response = await fetch(serviceUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Request-ID": context.requestId,
            Authorization: context.token
              ? `Bearer ${context.token}`
              : undefined,
          },
          body: JSON.stringify({
            function: functionName,
            arguments: args,
            requestId: context.requestId,
            timestamp: context.timestamp,
          }),
        });

        if (!response.ok) {
          throw new Error(`Service error: ${response.status}`);
        }

        return response.json();
      },
    };
  }

  // Subscribe to execution events
  onExecution(callback) {
    this.eventEmitter.on("execution", callback);
    return () => this.eventEmitter.off("execution", callback);
  }
}

module.exports = new McpIntegrationBus();
```

## Service Registry

```javascript
// Initialize integration bus with services
const integrationBus = require("./mcp/integrationBus");

// Register authentication service
integrationBus.registerService({
  serviceName: "auth",
  serviceUrl:
    process.env.AUTH_SERVICE_URL || "http://auth-service:3001/api/mcp",
  functions: [
    {
      name: "validateToken",
      description: "Validate authentication token",
      parameters: {
        type: "object",
        properties: {
          token: {
            type: "string",
            description: "Authentication token",
          },
        },
        required: ["token"],
      },
    },
    {
      name: "refreshToken",
      description: "Refresh authentication token",
      parameters: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            description: "Refresh token",
          },
        },
        required: ["refreshToken"],
      },
    },
  ],
});

// Register user service
integrationBus.registerService({
  serviceName: "users",
  serviceUrl:
    process.env.USER_SERVICE_URL || "http://user-service:3002/api/mcp",
  functions: [
    {
      name: "getUserProfile",
      description: "Get user profile",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID",
          },
        },
        required: ["userId"],
      },
    },
    {
      name: "updateUserProfile",
      description: "Update user profile",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "User ID",
          },
          data: {
            type: "object",
            description: "Profile data to update",
          },
        },
        required: ["userId", "data"],
      },
    },
  ],
});

// Add middleware for common concerns
integrationBus.use(async (context, next) => {
  // Log all requests
  console.log(
    `Integration request: ${context.serviceName}.${context.functionName}`
  );

  // Add timing
  const startTime = Date.now();

  try {
    const result = await next();

    console.log(
      `Integration complete: ${context.serviceName}.${context.functionName} (${
        Date.now() - startTime
      }ms)`
    );

    return result;
  } catch (error) {
    console.error(
      `Integration error: ${context.serviceName}.${context.functionName}`,
      error
    );
    throw error;
  }
});
```

## Event Broadcasting

See the [MCP Composition Patterns guide](03-mcp-composition-patterns.md) for examples of event-driven patterns that can be applied to integration scenarios.

For more comprehensive implementation guidelines on MCP as an integration bus, refer to rule [513-mcp-as-integration-bus.mdc](../../513-mcp-as-integration-bus.mdc) in the `.cursor/rules` directory.
