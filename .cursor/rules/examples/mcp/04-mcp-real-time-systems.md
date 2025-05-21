# MCP for Real-Time Systems

This guide demonstrates how to extend the Model Completion Protocol (MCP) to support real-time communication patterns like streaming, push notifications, and live updates.

## Table of Contents

1. [Introduction](#introduction)
2. [Event Streaming](#event-streaming)
3. [MCP over WebSockets](#mcp-over-websockets)
4. [Push Notifications](#push-notifications)
5. [Server-Sent Events](#server-sent-events)
6. [Real-Time Data Synchronization](#real-time-data-synchronization)

## Introduction

Traditional MCP implementations follow a request-response pattern. However, many modern applications require real-time communication where the server can push data to clients as events occur. This guide shows how to extend MCP to support such real-time patterns while maintaining its structured function-based approach.

Key benefits of real-time MCP include:

- **Consistent API Model** - Use the same function-based model for both request-response and real-time operations
- **Type Safety** - Maintain schema validation for events and subscriptions
- **Access Control** - Apply the same authorization model to real-time communications
- **Observability** - Track and monitor real-time communications using the same tools

## Event Streaming

### Server-Side Implementation

```javascript
// server/services/mcpStreamingService.js
const mcpService = require("./mcpService");
const { EventEmitter } = require("events");

class McpStreamingService {
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.streamingFunctions = new Map();
    this.subscriptions = new Map();
    this.nextSubscriptionId = 1;
  }

  // Register a streaming function
  registerStreamingFunction(functionDef) {
    this.streamingFunctions.set(functionDef.name, functionDef);
  }

  // Get streaming function definition
  getStreamingFunction(name) {
    return this.streamingFunctions.get(name);
  }

  // Create a subscription to a streaming function
  async createSubscription(functionName, args, context = {}) {
    const streamingFunction = this.getStreamingFunction(functionName);

    if (!streamingFunction) {
      throw new Error(`Streaming function not found: ${functionName}`);
    }

    // Validate parameters if schema is available
    if (streamingFunction.parameters) {
      const validationResult = await mcpService.validateParameters(
        streamingFunction.parameters,
        args
      );

      if (!validationResult.valid) {
        throw new Error(
          `Invalid parameters: ${JSON.stringify(validationResult.errors)}`
        );
      }
    }

    // Create subscription record
    const subscriptionId = `sub_${this.nextSubscriptionId++}`;

    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      functionName,
      args,
      context,
      createdAt: new Date(),
      isActive: true,
    });

    // Initialize the subscription
    if (streamingFunction.initialize) {
      await streamingFunction.initialize(subscriptionId, args, context);
    }

    return {
      subscriptionId,
      functionName,
      args,
    };
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId, context = {}) {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    // Check if the caller has permission to cancel
    if (subscription.context.userId !== context.userId) {
      throw new Error("Permission denied to cancel subscription");
    }

    // Get the streaming function
    const streamingFunction = this.getStreamingFunction(
      subscription.functionName
    );

    // Call cleanup handler if available
    if (streamingFunction.cleanup) {
      await streamingFunction.cleanup(
        subscriptionId,
        subscription.args,
        context
      );
    }

    // Mark as inactive and remove
    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);

    return { success: true };
  }

  // Emit an event for a subscription
  emitEvent(subscriptionId, eventType, data) {
    this.eventEmitter.emit(subscriptionId, {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit an event to all subscriptions of a specific function
  emitEventToFunction(functionName, eventType, data, filter = null) {
    // Find all active subscriptions for this function
    for (const [subscriptionId, subscription] of this.subscriptions.entries()) {
      if (subscription.functionName === functionName && subscription.isActive) {
        // Apply filter if provided
        if (filter && !filter(subscription.args, subscription.context)) {
          continue;
        }

        this.emitEvent(subscriptionId, eventType, data);
      }
    }
  }

  // Get event listener for a subscription
  getSubscriptionListener(subscriptionId) {
    return (callback) => {
      // First check if subscription exists
      const subscription = this.subscriptions.get(subscriptionId);

      if (!subscription || !subscription.isActive) {
        throw new Error(`Invalid or inactive subscription: ${subscriptionId}`);
      }

      // Add event listener
      this.eventEmitter.on(subscriptionId, callback);

      // Return cleanup function
      return () => {
        this.eventEmitter.off(subscriptionId, callback);
      };
    };
  }

  // Get all streaming function definitions
  getStreamingFunctionDefinitions() {
    const definitions = [];

    for (const [name, func] of this.streamingFunctions.entries()) {
      definitions.push({
        name,
        description: func.description,
        parameters: func.parameters,
        events: func.events,
      });
    }

    return definitions;
  }
}

module.exports = new McpStreamingService();
```

### Example Streaming Function

```javascript
// server/services/streamingFunctions.js
module.exports = {
  // Real-time loan status updates
  subscribeLoanUpdates: {
    name: "subscribeLoanUpdates",
    description: "Subscribe to real-time updates for a loan",
    parameters: {
      type: "object",
      properties: {
        loanId: {
          type: "string",
          description: "ID of the loan to monitor",
        },
        includePayments: {
          type: "boolean",
          description: "Whether to include payment updates",
          default: true,
        },
        includeStatusChanges: {
          type: "boolean",
          description: "Whether to include status changes",
          default: true,
        },
        includeDocuments: {
          type: "boolean",
          description: "Whether to include document updates",
          default: false,
        },
      },
      required: ["loanId"],
    },
    events: {
      status_changed: {
        description: "Loan status has changed",
        dataSchema: {
          type: "object",
          properties: {
            loanId: { type: "string" },
            oldStatus: { type: "string" },
            newStatus: { type: "string" },
            changedBy: { type: "string" },
            reason: { type: "string" },
          },
        },
      },
      payment_received: {
        description: "Payment has been received for this loan",
        dataSchema: {
          type: "object",
          properties: {
            loanId: { type: "string" },
            paymentId: { type: "string" },
            amount: { type: "number" },
            timestamp: { type: "string" },
            method: { type: "string" },
          },
        },
      },
      document_added: {
        description: "Document has been added to the loan",
        dataSchema: {
          type: "object",
          properties: {
            loanId: { type: "string" },
            documentId: { type: "string" },
            documentType: { type: "string" },
            timestamp: { type: "string" },
          },
        },
      },
    },
    initialize: async (subscriptionId, args, context) => {
      const { loanId } = args;

      // Check if user has access to this loan
      const hasAccess = await loanService.checkUserAccess(
        context.userId,
        loanId
      );

      if (!hasAccess) {
        throw new Error("User does not have access to this loan");
      }

      // Register this subscription with the loan monitoring service
      await loanMonitoringService.registerSubscription(loanId, subscriptionId, {
        includePayments: args.includePayments,
        includeStatusChanges: args.includeStatusChanges,
        includeDocuments: args.includeDocuments,
      });

      // Return initial loan state
      const loan = await loanService.getLoanById(loanId);

      return {
        initialState: {
          loanId: loan.id,
          status: loan.status,
          currentBalance: loan.currentBalance,
          nextPaymentDate: loan.nextPaymentDate,
          paymentHistory: args.includePayments ? loan.recentPayments : null,
          documents: args.includeDocuments ? loan.documents : null,
        },
      };
    },
    cleanup: async (subscriptionId, args) => {
      // Unregister from monitoring service
      await loanMonitoringService.unregisterSubscription(
        args.loanId,
        subscriptionId
      );
    },
  },

  // Real-time market rate updates
  subscribeMarketRates: {
    name: "subscribeMarketRates",
    description: "Subscribe to real-time market rate updates",
    parameters: {
      type: "object",
      properties: {
        productTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["mortgage", "auto", "personal", "heloc", "cd"],
          },
          description: "Product types to monitor rates for",
        },
        updateInterval: {
          type: "string",
          enum: ["realtime", "daily", "hourly"],
          default: "realtime",
          description: "How frequently to receive updates",
        },
      },
      required: ["productTypes"],
    },
    events: {
      rate_changed: {
        description: "Interest rate has changed for a product",
        dataSchema: {
          type: "object",
          properties: {
            productType: { type: "string" },
            term: { type: "number" },
            oldRate: { type: "number" },
            newRate: { type: "number" },
            effectiveDate: { type: "string" },
          },
        },
      },
      daily_summary: {
        description: "Daily summary of rate changes",
        dataSchema: {
          type: "object",
          properties: {
            date: { type: "string" },
            changes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  productType: { type: "string" },
                  term: { type: "number" },
                  netChange: { type: "number" },
                  currentRate: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    initialize: async (subscriptionId, args) => {
      // Register with rate monitoring service
      await rateMonitoringService.registerSubscription(subscriptionId, {
        productTypes: args.productTypes,
        updateInterval: args.updateInterval,
      });

      // Return current rates
      const currentRates = await rateService.getCurrentRates(args.productTypes);

      return {
        initialState: {
          timestamp: new Date().toISOString(),
          rates: currentRates,
        },
      };
    },
    cleanup: async (subscriptionId) => {
      await rateMonitoringService.unregisterSubscription(subscriptionId);
    },
  },
};
```

### WebSocket Endpoint for MCP Streaming

```javascript
// server/websocket/mcpStreamingHandler.js
const WebSocket = require("ws");
const mcpStreamingService = require("../services/mcpStreamingService");
const mcpService = require("../services/mcpService");
const tokenService = require("../services/tokenService");
const logger = require("../utils/logger");

// Set up WebSocket server
function setupMcpStreamingServer(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", async (ws, req) => {
    let userId = null;
    const subscriptions = new Map();

    // Handle authentication
    try {
      // Extract token from URL
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (!token) {
        ws.close(4001, "Authentication required");
        return;
      }

      // Validate token
      const user = await tokenService.validateToken(token);
      if (!user) {
        ws.close(4003, "Invalid authentication token");
        return;
      }

      userId = user.id;

      // Send connection acknowledgment
      ws.send(
        JSON.stringify({
          type: "connection_established",
          userId,
          timestamp: new Date().toISOString(),
        })
      );

      logger.info(`WebSocket connection established for user: ${userId}`);
    } catch (error) {
      logger.error("WebSocket authentication error:", error);
      ws.close(4500, "Authentication error");
      return;
    }

    // Handle incoming messages
    ws.on("message", async (message) => {
      try {
        const msg = JSON.parse(message);

        switch (msg.type) {
          case "subscribe":
            await handleSubscribe(msg.data);
            break;

          case "unsubscribe":
            await handleUnsubscribe(msg.data);
            break;

          case "execute":
            await handleExecute(msg.data);
            break;

          default:
            ws.send(
              JSON.stringify({
                type: "error",
                requestId: msg.requestId,
                error: `Unknown message type: ${msg.type}`,
              })
            );
        }
      } catch (error) {
        logger.error("WebSocket message processing error:", error);

        ws.send(
          JSON.stringify({
            type: "error",
            error: error.message,
          })
        );
      }
    });

    // Handle subscription
    async function handleSubscribe(data) {
      try {
        const { functionName, arguments: args, requestId } = data;

        if (!functionName) {
          throw new Error("Missing function name");
        }

        // Create context with user info
        const context = {
          userId,
          requestId: requestId || Math.random().toString(36).substring(2, 15),
          ip: req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
        };

        // Create subscription
        const subscription = await mcpStreamingService.createSubscription(
          functionName,
          args || {},
          context
        );

        // Register event handler
        const unsubscribe = mcpStreamingService.getSubscriptionListener(
          subscription.subscriptionId
        )((event) => {
          ws.send(
            JSON.stringify({
              type: "event",
              subscriptionId: subscription.subscriptionId,
              eventType: event.type,
              data: event.data,
              timestamp: event.timestamp,
            })
          );
        });

        // Store subscription and cleanup handler
        subscriptions.set(subscription.subscriptionId, {
          unsubscribe,
          functionName,
        });

        // Send acknowledgment
        ws.send(
          JSON.stringify({
            type: "subscribed",
            requestId: requestId,
            subscriptionId: subscription.subscriptionId,
            functionName,
            timestamp: new Date().toISOString(),
          })
        );

        logger.info(`User ${userId} subscribed to ${functionName}`, {
          subscriptionId: subscription.subscriptionId,
        });
      } catch (error) {
        logger.error("Subscription error:", error);

        ws.send(
          JSON.stringify({
            type: "error",
            requestId: data.requestId,
            error: error.message,
          })
        );
      }
    }

    // Handle unsubscribe
    async function handleUnsubscribe(data) {
      try {
        const { subscriptionId, requestId } = data;

        if (!subscriptionId) {
          throw new Error("Missing subscription ID");
        }

        // Get subscription
        const subscription = subscriptions.get(subscriptionId);

        if (!subscription) {
          throw new Error(`Subscription not found: ${subscriptionId}`);
        }

        // Remove event listener
        subscription.unsubscribe();

        // Cancel subscription on server
        await mcpStreamingService.cancelSubscription(subscriptionId, {
          userId,
        });

        // Remove from local map
        subscriptions.delete(subscriptionId);

        // Send acknowledgment
        ws.send(
          JSON.stringify({
            type: "unsubscribed",
            requestId,
            subscriptionId,
            timestamp: new Date().toISOString(),
          })
        );

        logger.info(
          `User ${userId} unsubscribed from ${subscription.functionName}`,
          {
            subscriptionId,
          }
        );
      } catch (error) {
        logger.error("Unsubscribe error:", error);

        ws.send(
          JSON.stringify({
            type: "error",
            requestId: data.requestId,
            error: error.message,
          })
        );
      }
    }

    // Handle regular MCP function execution
    async function handleExecute(data) {
      try {
        const { function: functionName, arguments: args, requestId } = data;

        if (!functionName) {
          throw new Error("Missing function name");
        }

        // Create context with user info
        const context = {
          userId,
          requestId: requestId || Math.random().toString(36).substring(2, 15),
          ip: req.connection.remoteAddress,
          userAgent: req.headers["user-agent"],
        };

        // Execute the MCP function
        const result = await mcpService.executeFunction(
          functionName,
          args || {},
          context
        );

        // Send response
        ws.send(
          JSON.stringify({
            type: "result",
            requestId,
            functionName,
            result,
            timestamp: new Date().toISOString(),
          })
        );

        logger.info(`User ${userId} executed ${functionName} via WebSocket`);
      } catch (error) {
        logger.error("Function execution error:", error);

        ws.send(
          JSON.stringify({
            type: "error",
            requestId: data.requestId,
            error: error.message,
          })
        );
      }
    }

    // Handle client disconnect
    ws.on("close", async () => {
      logger.info(`WebSocket connection closed for user: ${userId}`);

      // Clean up all subscriptions
      for (const [subscriptionId, subscription] of subscriptions.entries()) {
        try {
          // Remove event listener
          subscription.unsubscribe();

          // Cancel subscription on server
          await mcpStreamingService.cancelSubscription(subscriptionId, {
            userId,
          });

          logger.info(
            `Cleaned up subscription ${subscriptionId} on disconnect`
          );
        } catch (error) {
          logger.error(
            `Error cleaning up subscription ${subscriptionId}:`,
            error
          );
        }
      }

      // Clear subscriptions map
      subscriptions.clear();
    });
  });

  return wss;
}

module.exports = setupMcpStreamingServer;
```

## MCP over WebSockets

### Client-Side Implementation

```javascript
// client/src/mcp/streamingClient.js
class McpStreamingClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || this.getWebSocketUrl();
    this.token = options.token;
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectDelay = options.reconnectDelay || 5000;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;

    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;

    this.subscriptions = new Map();
    this.pendingRequests = new Map();
    this.messageListeners = new Map();

    this.nextRequestId = 1;

    // Event callbacks
    this.onConnect = options.onConnect || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    this.onError =
      options.onError || ((error) => console.error("MCP Stream error:", error));
  }

  // Convert HTTP URL to WebSocket URL
  getWebSocketUrl() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    return `${protocol}//${host}/api/mcp/stream`;
  }

  // Connect to WebSocket server
  connect() {
    if (this.socket) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}?token=${encodeURIComponent(this.token)}`;

      this.socket = new WebSocket(url);

      // Setup event listeners
      this.socket.onopen = () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        this.onConnect();
        resolve();
      };

      this.socket.onclose = (event) => {
        this.connected = false;
        this.socket = null;
        this.onDisconnect(event);

        // Reject any pending requests
        for (const [id, { reject }] of this.pendingRequests.entries()) {
          reject(new Error("WebSocket connection closed"));
          this.pendingRequests.delete(id);
        }

        // Handle reconnection
        if (
          this.autoReconnect &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++;
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      this.socket.onerror = (error) => {
        this.onError(error);
        reject(error);
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          this.onError(new Error(`Failed to parse message: ${error.message}`));
        }
      };
    });
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.socket && this.connected) {
      this.socket.close();
      this.socket = null;
      this.connected = false;
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(message) {
    switch (message.type) {
      case "connection_established":
        // Connection confirmation
        this.userId = message.userId;
        break;

      case "result":
        // Response to a function execution
        const request = this.pendingRequests.get(message.requestId);
        if (request) {
          request.resolve(message.result);
          this.pendingRequests.delete(message.requestId);
        }
        break;

      case "subscribed":
        // Subscription confirmation
        const subRequest = this.pendingRequests.get(message.requestId);
        if (subRequest) {
          subRequest.resolve({
            subscriptionId: message.subscriptionId,
            functionName: message.functionName,
          });
          this.pendingRequests.delete(message.requestId);
        }
        break;

      case "unsubscribed":
        // Unsubscription confirmation
        const unsubRequest = this.pendingRequests.get(message.requestId);
        if (unsubRequest) {
          unsubRequest.resolve({ success: true });
          this.pendingRequests.delete(message.requestId);
        }
        break;

      case "event":
        // Event from a subscription
        const listeners =
          this.messageListeners.get(message.subscriptionId) || [];
        listeners.forEach((listener) => {
          try {
            listener(message.eventType, message.data);
          } catch (error) {
            this.onError(new Error(`Event listener error: ${error.message}`));
          }
        });
        break;

      case "error":
        // Error response
        const errorRequest = this.pendingRequests.get(message.requestId);
        if (errorRequest) {
          errorRequest.reject(new Error(message.error));
          this.pendingRequests.delete(message.requestId);
        } else {
          this.onError(new Error(`MCP Stream error: ${message.error}`));
        }
        break;

      default:
        this.onError(new Error(`Unknown message type: ${message.type}`));
    }
  }

  // Send message to server
  async sendMessage(type, data) {
    if (!this.connected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const requestId = `req_${this.nextRequestId++}`;

      // Store the promise callbacks
      this.pendingRequests.set(requestId, { resolve, reject });

      // Send the message
      this.socket.send(
        JSON.stringify({
          type,
          requestId,
          data: {
            ...data,
            requestId,
          },
        })
      );

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          const request = this.pendingRequests.get(requestId);
          request.reject(new Error("Request timeout"));
          this.pendingRequests.delete(requestId);
        }
      }, 30000);
    });
  }

  // Execute MCP function over WebSocket
  async execute(functionName, args = {}) {
    return this.sendMessage("execute", {
      function: functionName,
      arguments: args,
    });
  }

  // Subscribe to a streaming function
  async subscribe(functionName, args = {}, onEvent) {
    const subscription = await this.sendMessage("subscribe", {
      functionName,
      arguments: args,
    });

    const { subscriptionId } = subscription;

    // Store subscription
    this.subscriptions.set(subscriptionId, {
      functionName,
      args,
    });

    // Add event listener
    if (onEvent) {
      this.addEventHandler(subscriptionId, onEvent);
    }

    return subscription;
  }

  // Add an event handler for a subscription
  addEventHandler(subscriptionId, handler) {
    if (!this.messageListeners.has(subscriptionId)) {
      this.messageListeners.set(subscriptionId, []);
    }

    this.messageListeners.get(subscriptionId).push(handler);

    // Return function to remove this handler
    return () => {
      const listeners = this.messageListeners.get(subscriptionId) || [];
      const index = listeners.indexOf(handler);

      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  // Unsubscribe from a streaming function
  async unsubscribe(subscriptionId) {
    const result = await this.sendMessage("unsubscribe", {
      subscriptionId,
    });

    // Clean up subscription
    this.subscriptions.delete(subscriptionId);
    this.messageListeners.delete(subscriptionId);

    return result;
  }

  // Get all active subscriptions
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.entries()).map(([id, sub]) => ({
      id,
      functionName: sub.functionName,
      arguments: sub.args,
    }));
  }
}

export default McpStreamingClient;
```

### React Hook for MCP Streaming

```javascript
// client/src/hooks/useMcpStream.js
import { useState, useEffect, useRef, useCallback } from "react";
import McpStreamingClient from "../mcp/streamingClient";

// Create singleton instance
const streamingClient = new McpStreamingClient({
  token: localStorage.getItem("authToken"),
  onConnect: () => console.log("Connected to MCP streaming"),
  onDisconnect: () => console.log("Disconnected from MCP streaming"),
});

function useMcpStream(functionName, args = {}, options = {}) {
  const [data, setData] = useState(options.initialData || null);
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const subscriptionIdRef = useRef(null);
  const eventHandlersRef = useRef([]);

  // Handle events
  const handleEvent = useCallback(
    (eventType, eventData) => {
      setEvents((prev) => [
        ...prev,
        { type: eventType, data: eventData, timestamp: new Date() },
      ]);

      // Call custom event handlers
      if (options.onEvent) {
        options.onEvent(eventType, eventData);
      }

      // Call specific event handlers
      const handler =
        options[`on${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`];
      if (handler) {
        handler(eventData);
      }

      // Update data based on events if a reducer is provided
      if (options.reducer) {
        setData((currentData) =>
          options.reducer(currentData, eventType, eventData)
        );
      }
    },
    [options]
  );

  // Subscribe to the function
  const subscribe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Make sure client is connected
      if (!streamingClient.connected) {
        await streamingClient.connect();
      }

      // Create subscription
      const subscription = await streamingClient.subscribe(
        functionName,
        args,
        handleEvent
      );

      subscriptionIdRef.current = subscription.subscriptionId;
      setConnected(true);
      setLoading(false);

      // Clear events on new subscription
      setEvents([]);
    } catch (err) {
      setError(err);
      setLoading(false);
      setConnected(false);
    }
  }, [functionName, JSON.stringify(args), handleEvent]);

  // Unsubscribe from the function
  const unsubscribe = useCallback(async () => {
    const subscriptionId = subscriptionIdRef.current;

    if (subscriptionId) {
      try {
        await streamingClient.unsubscribe(subscriptionId);
      } catch (err) {
        console.error("Error unsubscribing:", err);
      }

      subscriptionIdRef.current = null;
      setConnected(false);
    }

    // Clear handlers
    eventHandlersRef.current.forEach((removeHandler) => removeHandler());
    eventHandlersRef.current = [];
  }, []);

  // Register additional event handlers
  const addEventHandler = useCallback((handler) => {
    const subscriptionId = subscriptionIdRef.current;

    if (subscriptionId) {
      const removeHandler = streamingClient.addEventHandler(
        subscriptionId,
        handler
      );
      eventHandlersRef.current.push(removeHandler);
      return removeHandler;
    }

    return () => {};
  }, []);

  // Set up subscription on mount and clean up on unmount
  useEffect(() => {
    const shouldSubscribe = options.autoSubscribe !== false;

    if (shouldSubscribe) {
      subscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe, options.autoSubscribe]);

  return {
    data,
    events,
    connected,
    loading,
    error,
    subscribe,
    unsubscribe,
    addEventHandler,
  };
}

export default useMcpStream;
```

### Example Usage of MCP Streaming in React

```jsx
// Example: Real-time loan dashboard using MCP streaming
function LoanDashboard({ loanId }) {
  // Use MCP streaming for loan updates
  const {
    data: loan,
    events,
    connected,
    loading,
    error,
  } = useMcpStream(
    "subscribeLoanUpdates",
    {
      loanId,
      includePayments: true,
      includeStatusChanges: true,
      includeDocuments: true,
    },
    {
      // Event specific handlers
      onStatusChanged: (data) => {
        toast.info(`Loan status changed to: ${data.newStatus}`);
      },
      onPaymentReceived: (data) => {
        toast.success(`Payment of $${data.amount.toFixed(2)} received`);
      },
      onDocumentAdded: (data) => {
        toast.info(`New document added: ${data.documentType}`);
      },

      // Reducer to update data based on events
      reducer: (currentData, eventType, eventData) => {
        if (!currentData) return currentData;

        switch (eventType) {
          case "status_changed":
            return {
              ...currentData,
              status: eventData.newStatus,
            };

          case "payment_received":
            return {
              ...currentData,
              currentBalance: currentData.currentBalance - eventData.amount,
              paymentHistory: [
                {
                  id: eventData.paymentId,
                  amount: eventData.amount,
                  date: eventData.timestamp,
                  method: eventData.method,
                },
                ...(currentData.paymentHistory || []),
              ],
            };

          case "document_added":
            return {
              ...currentData,
              documents: [
                {
                  id: eventData.documentId,
                  type: eventData.documentType,
                  date: eventData.timestamp,
                },
                ...(currentData.documents || []),
              ],
            };

          default:
            return currentData;
        }
      },
    }
  );

  if (loading && !loan) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  if (!loan) {
    return <div>No loan data available</div>;
  }

  return (
    <div className="loan-dashboard">
      <ConnectionStatus connected={connected} />

      <div className="loan-header">
        <h2>Loan Dashboard</h2>
        <LoanStatusBadge status={loan.status} />
      </div>

      <div className="loan-summary">
        <div className="summary-item">
          <span className="label">Balance</span>
          <span className="value">${loan.currentBalance.toFixed(2)}</span>
        </div>

        <div className="summary-item">
          <span className="label">Next Payment</span>
          <span className="value">{formatDate(loan.nextPaymentDate)}</span>
        </div>
      </div>

      <Tabs>
        <TabPanel title="Payment History">
          <PaymentHistoryList payments={loan.paymentHistory} />
        </TabPanel>

        <TabPanel title="Documents">
          <DocumentList documents={loan.documents} />
        </TabPanel>

        <TabPanel title="Activity Log">
          <ActivityLog events={events} />
        </TabPanel>
      </Tabs>
    </div>
  );
}

// Activity log component
function ActivityLog({ events }) {
  return (
    <div className="activity-log">
      <h3>Recent Activity</h3>

      {events.length === 0 ? (
        <div className="empty-state">No recent activity</div>
      ) : (
        <ul className="event-list">
          {events
            .slice()
            .reverse()
            .map((event, index) => (
              <li key={index} className={`event-item ${event.type}`}>
                <div className="event-time">{formatTime(event.timestamp)}</div>
                <div className="event-icon">{getEventIcon(event.type)}</div>
                <div className="event-details">
                  {formatEventMessage(event.type, event.data)}
                </div>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

// Helper to format event messages
function formatEventMessage(type, data) {
  switch (type) {
    case "status_changed":
      return `Loan status changed from ${data.oldStatus} to ${data.newStatus}`;

    case "payment_received":
      return `Payment of $${data.amount.toFixed(2)} received via ${
        data.method
      }`;

    case "document_added":
      return `New document added: ${data.documentType}`;

    default:
      return `Event: ${type}`;
  }
}
```

## Additional Real-Time Patterns

For additional patterns related to MCP, please refer to these guides:

- [01-mcp-implementation-guide.md](01-mcp-implementation-guide.md) - Basic implementation patterns
- [02-mcp-service-protocol.md](02-mcp-service-protocol.md) - Using MCP as a service protocol
- [03-mcp-composition-patterns.md](03-mcp-composition-patterns.md) - Composition patterns for complex workflows

For more details about the MCP framework expansion, refer to rules 508-515 in the `.cursor/rules` directory.
