# MCP as a Service Protocol

This guide demonstrates how to use the Model Completion Protocol (MCP) as a general-purpose service protocol for communication between different services, regardless of whether AI is involved.

## Table of Contents

1. [Introduction](#introduction)
2. [Service-to-Service Communication](#service-to-service-communication)
3. [MCP as a REST Alternative](#mcp-as-a-rest-alternative)
4. [Microservice Architecture](#microservice-architecture)
5. [Cross-Platform Communication](#cross-platform-communication)

## Introduction

MCP provides a structured, function-based approach to service communication that can be applied beyond AI interactions. By using MCP as your primary service protocol, you get:

- Unified interface for all service interactions
- Strong typing with schema validation
- Consistent error handling
- Simplified service discovery
- Centralized authorization and logging

## Service-to-Service Communication

### Basic Service Architecture

Here's how to set up a basic service architecture using MCP:

```javascript
// paymentService.js
const McpServer = require("./mcpServer");

// Create MCP server for the payment service
const paymentServer = new McpServer({
  serviceName: "payment-service",
  port: 3001,
});

// Register payment functions
paymentServer.registerFunction({
  name: "processPayment",
  description: "Process a payment transaction",
  parameters: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "Customer ID",
      },
      amount: {
        type: "number",
        description: "Payment amount",
      },
      currency: {
        type: "string",
        description: "Payment currency",
        default: "USD",
      },
      paymentMethod: {
        type: "object",
        description: "Payment method details",
        properties: {
          type: {
            type: "string",
            enum: ["credit_card", "bank_account", "paypal"],
            description: "Payment method type",
          },
          token: {
            type: "string",
            description: "Secure payment token",
          },
        },
        required: ["type", "token"],
      },
    },
    required: ["customerId", "amount", "paymentMethod"],
  },
  handler: async (args, context) => {
    const { customerId, amount, currency = "USD", paymentMethod } = args;

    // Process payment logic (simplified for example)
    const paymentResult = await processPaymentWithProvider(
      customerId,
      amount,
      currency,
      paymentMethod
    );

    return {
      transactionId: paymentResult.id,
      status: paymentResult.status,
      amount,
      currency,
      timestamp: new Date().toISOString(),
    };
  },
});

// Start the server
paymentServer.start();
```

### Client-Side Service Communication

```javascript
// orderService.js - Using the payment service
const McpClient = require("./mcpClient");

// Create MCP client for the payment service
const paymentClient = new McpClient({
  serviceUrl: "http://payment-service:3001",
});

// Order service function that uses the payment service
async function createOrder(orderData, context) {
  // Create order in database
  const order = await db.orders.create({
    customerId: orderData.customerId,
    items: orderData.items,
    shippingAddress: orderData.shippingAddress,
    status: "pending",
    totalAmount: calculateTotal(orderData.items),
    createdAt: new Date(),
  });

  // Process payment using payment service via MCP
  try {
    const paymentResult = await paymentClient.execute("processPayment", {
      customerId: orderData.customerId,
      amount: order.totalAmount,
      currency: "USD",
      paymentMethod: orderData.paymentMethod,
    });

    // Update order with payment information
    await db.orders.update(order.id, {
      status: "paid",
      paymentId: paymentResult.transactionId,
      paymentStatus: paymentResult.status,
    });

    return {
      orderId: order.id,
      status: "paid",
      paymentId: paymentResult.transactionId,
      totalAmount: order.totalAmount,
    };
  } catch (error) {
    // Handle payment failure
    await db.orders.update(order.id, {
      status: "payment_failed",
      paymentError: error.message,
    });

    throw new Error(`Payment failed: ${error.message}`);
  }
}
```

## MCP as a REST Alternative

### API Design with MCP

Traditional REST APIs map HTTP methods to CRUD operations. With MCP, you define explicit functions that more clearly express your domain:

REST approach:

- GET /customers/{id}
- PUT /customers/{id}
- POST /customers
- DELETE /customers/{id}
- GET /customers/{id}/loans

MCP approach:

- `getCustomer(id)`
- `updateCustomer(id, data)`
- `createCustomer(data)`
- `deleteCustomer(id)`
- `getCustomerLoans(customerId)`

### Implementation Example

```javascript
// customerService.js
const McpServer = require("./mcpServer");

const customerServer = new McpServer({
  serviceName: "customer-service",
  port: 3002,
});

// Register customer functions (instead of REST endpoints)
customerServer.registerFunction({
  name: "getCustomer",
  description: "Get customer by ID",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "Customer ID" },
    },
    required: ["id"],
  },
  handler: async (args) => {
    const { id } = args;
    return await db.customers.findOne({ id });
  },
});

customerServer.registerFunction({
  name: "updateCustomer",
  description: "Update customer information",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string", description: "Customer ID" },
      data: {
        type: "object",
        description: "Customer data to update",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          address: { type: "object" },
        },
      },
    },
    required: ["id", "data"],
  },
  handler: async (args) => {
    const { id, data } = args;
    await db.customers.update({ id }, { $set: data });
    return await db.customers.findOne({ id });
  },
});

// Function can better represent complex domain operations
customerServer.registerFunction({
  name: "mergeCustomerAccounts",
  description: "Merge two customer accounts into one",
  parameters: {
    type: "object",
    properties: {
      primaryId: { type: "string", description: "Primary customer ID to keep" },
      secondaryId: {
        type: "string",
        description: "Secondary customer ID to merge",
      },
    },
    required: ["primaryId", "secondaryId"],
  },
  handler: async (args) => {
    // This complex operation is hard to represent in REST,
    // but natural as an MCP function
    const { primaryId, secondaryId } = args;

    // Fetch both customers
    const primary = await db.customers.findOne({ id: primaryId });
    const secondary = await db.customers.findOne({ id: secondaryId });

    if (!primary || !secondary) {
      throw new Error("One or both customers not found");
    }

    // Merge operation (simplified)
    await db.transactions.updateMany(
      { customerId: secondaryId },
      { $set: { customerId: primaryId } }
    );

    await db.loans.updateMany(
      { customerId: secondaryId },
      { $set: { customerId: primaryId } }
    );

    // Mark secondary as merged
    await db.customers.update(
      { id: secondaryId },
      { $set: { status: "merged", mergedInto: primaryId } }
    );

    return {
      message: "Accounts merged successfully",
      primaryCustomer: primary,
      affectedRecords: {
        transactions: await db.transactions.count({ customerId: primaryId }),
        loans: await db.loans.count({ customerId: primaryId }),
      },
    };
  },
});

// Start the server
customerServer.start();
```

## Microservice Architecture

### MCP as a Microservice Communication Protocol

MCP can serve as the primary communication protocol between microservices:

```javascript
// Service registry for MCP-based microservices
class McpServiceRegistry {
  constructor() {
    this.services = new Map();
    this.clients = new Map();
  }

  // Register a service with its available functions
  registerService(serviceName, serviceUrl, functions = []) {
    this.services.set(serviceName, {
      url: serviceUrl,
      functions: new Map(functions.map((f) => [f.name, f])),
    });

    // Create client for this service
    if (!this.clients.has(serviceName)) {
      this.clients.set(serviceName, new McpClient({ serviceUrl }));
    }

    return this;
  }

  // Get an MCP client for a specific service
  getClient(serviceName) {
    const client = this.clients.get(serviceName);

    if (!client) {
      throw new Error(`Service not registered: ${serviceName}`);
    }

    return client;
  }

  // Execute a function on a specific service
  async execute(serviceName, functionName, args, options = {}) {
    const client = this.getClient(serviceName);
    return await client.execute(functionName, args, options);
  }

  // Get all registered services and their functions
  getServiceDirectory() {
    const directory = {};

    for (const [name, service] of this.services.entries()) {
      directory[name] = {
        url: service.url,
        functions: Array.from(service.functions.values()),
      };
    }

    return directory;
  }
}

// Usage example
const registry = new McpServiceRegistry();

// Register microservices
registry.registerService(
  "user-service",
  "http://user-service:3001",
  userFunctions
);
registry.registerService(
  "payment-service",
  "http://payment-service:3002",
  paymentFunctions
);
registry.registerService(
  "order-service",
  "http://order-service:3003",
  orderFunctions
);
registry.registerService(
  "notification-service",
  "http://notification-service:3004",
  notificationFunctions
);

// Service orchestration example
async function processOrder(orderData) {
  // Validate user
  const user = await registry.execute("user-service", "validateUser", {
    userId: orderData.userId,
  });

  // Create order
  const order = await registry.execute("order-service", "createOrder", {
    userId: user.id,
    items: orderData.items,
    shippingAddress: orderData.shippingAddress,
  });

  // Process payment
  const payment = await registry.execute("payment-service", "processPayment", {
    orderId: order.id,
    amount: order.totalAmount,
    paymentMethod: orderData.paymentMethod,
  });

  // Update order with payment
  await registry.execute("order-service", "updateOrderPayment", {
    orderId: order.id,
    paymentId: payment.id,
    paymentStatus: payment.status,
  });

  // Send confirmation notification
  await registry.execute("notification-service", "sendOrderConfirmation", {
    userId: user.id,
    orderId: order.id,
    email: user.email,
    orderDetails: order,
  });

  return {
    orderId: order.id,
    status: "completed",
    totalAmount: order.totalAmount,
    paymentId: payment.id,
  };
}
```

## Cross-Platform Communication

MCP can bridge communication between different platforms and languages:

```javascript
// Node.js MCP Service
const mcpServer = new McpServer({ port: 3001 });

mcpServer.registerFunction({
  name: "processData",
  description: "Process data from any platform",
  parameters: {
    type: "object",
    properties: {
      data: { type: "object" },
      options: { type: "object" },
    },
    required: ["data"],
  },
  handler: async (args) => {
    // Process data and return results
    return processData(args.data, args.options);
  },
});

mcpServer.start();
```

```python
# Python MCP Client
import requests
import json

class McpClient:
    def __init__(self, service_url):
        self.service_url = service_url

    def execute(self, function_name, args):
        payload = {
            "function": function_name,
            "arguments": args
        }

        response = requests.post(
            self.service_url,
            json=payload,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code != 200:
            error_data = response.json()
            raise Exception(f"MCP error: {error_data.get('error', 'Unknown error')}")

        result = response.json().get("result")
        return result

# Usage example
client = McpClient("http://node-service:3001")

# Process data from Python
result = client.execute("processData", {
    "data": {
        "items": [1, 2, 3, 4, 5],
        "metadata": {"source": "python_client"}
    },
    "options": {
        "normalize": True,
        "format": "json"
    }
})

print(f"Processed data: {result}")
```

```csharp
// C# MCP Client
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class McpClient
{
    private readonly HttpClient _httpClient;
    private readonly string _serviceUrl;

    public McpClient(string serviceUrl)
    {
        _httpClient = new HttpClient();
        _serviceUrl = serviceUrl;
    }

    public async Task<T> ExecuteAsync<T>(string functionName, object args)
    {
        var payload = new
        {
            function = functionName,
            arguments = args
        };

        var content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PostAsync(_serviceUrl, content);

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            var errorData = JsonSerializer.Deserialize<dynamic>(errorContent);
            throw new Exception($"MCP error: {errorData.error ?? "Unknown error"}");
        }

        var responseContent = await response.Content.ReadAsStringAsync();
        var resultData = JsonSerializer.Deserialize<McpResponse<T>>(responseContent);

        return resultData.Result;
    }

    private class McpResponse<T>
    {
        public T Result { get; set; }
    }
}

// Usage example
class Program
{
    static async Task Main(string[] args)
    {
        var client = new McpClient("http://node-service:3001");

        var result = await client.ExecuteAsync<ProcessedData>("processData", new {
            data = new {
                items = new[] { 1, 2, 3, 4, 5 },
                metadata = new { source = "csharp_client" }
            },
            options = new {
                normalize = true,
                format = "json"
            }
        });

        Console.WriteLine($"Processed data: {result.Summary}");
    }

    class ProcessedData
    {
        public string Summary { get; set; }
        public object Results { get; set; }
    }
}
```

For more advanced examples of MCP as a service protocol, including advanced routing, middleware, and error handling, see the [03-mcp-composition-patterns.md](03-mcp-composition-patterns.md) guide.

For comprehensive implementation guidelines, refer to rule [508-mcp-as-service-protocol.mdc](../../508-mcp-as-service-protocol.mdc) in the `.cursor/rules` directory.
