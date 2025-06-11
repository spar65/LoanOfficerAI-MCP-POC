# MCP for Offline Operations

This guide demonstrates how to implement offline capabilities in MCP functions, allowing applications to work without continuous network connectivity while maintaining data consistency.

## Table of Contents

1. [Introduction](#introduction)
2. [Offline-First Architecture](#offline-first-architecture)
3. [Data Synchronization](#data-synchronization)
4. [Conflict Resolution](#conflict-resolution)
5. [Offline Function Execution](#offline-function-execution)

## Introduction

Modern applications require offline capabilities to provide a seamless user experience regardless of network conditions. Implementing offline support for MCP functions involves:

- Local storage and caching of function results
- Queuing operations when offline
- Background synchronization when connectivity resumes
- Conflict detection and resolution strategies

## Offline-First Architecture

```javascript
// client/src/mcp/offlineClient.js
class McpOfflineClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || "/api/mcp";
    this.storage = options.storage || window.localStorage;
    this.queueKey = options.queueKey || "mcp_offline_queue";
    this.networkMonitor = options.networkMonitor || new NetworkMonitor();

    // Initialize storage
    if (!this.storage.getItem(this.queueKey)) {
      this.storage.setItem(this.queueKey, JSON.stringify([]));
    }

    // Listen for network changes
    this.networkMonitor.onNetworkStatusChange((isOnline) => {
      if (isOnline) {
        this.syncOfflineQueue();
      }
    });
  }

  // Execute MCP function with offline support
  async execute(functionName, args = {}, options = {}) {
    // Check if online
    if (this.networkMonitor.isOnline()) {
      try {
        // Execute normally if online
        const result = await this.executeOnline(functionName, args, options);

        // Cache result if function is cacheable
        if (options.cacheable !== false) {
          this.cacheResult(functionName, args, result);
        }

        return result;
      } catch (error) {
        // Fall back to offline mode if online request fails
        if (options.offlineCapable !== false) {
          return this.executeOffline(functionName, args, options);
        }
        throw error;
      }
    } else {
      // Offline mode
      if (options.offlineCapable === false) {
        throw new Error(`Function ${functionName} cannot be executed offline`);
      }

      return this.executeOffline(functionName, args, options);
    }
  }

  // Execute function online
  async executeOnline(functionName, args = {}, options = {}) {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify({
        function: functionName,
        arguments: args,
        requestId: options.requestId || `req_${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`Network error: ${response.status}`);
    }

    return response.json();
  }

  // Execute function offline
  async executeOffline(functionName, args = {}, options = {}) {
    // Try to get from cache first
    const cachedResult = this.getCachedResult(functionName, args);

    if (cachedResult) {
      return {
        ...cachedResult,
        meta: {
          ...cachedResult.meta,
          isOffline: true,
          fromCache: true,
        },
      };
    }

    // If write operation, queue for later
    if (options.isWrite !== false) {
      this.queueOperation(functionName, args, options);

      return {
        success: true,
        data: null,
        meta: {
          isOffline: true,
          queued: true,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Read operation with no cache - return empty or error
    if (options.emptyResultWhenOffline) {
      return {
        success: true,
        data: options.emptyValue || null,
        meta: {
          isOffline: true,
          noCache: true,
        },
      };
    }

    throw new Error(
      `Cannot execute ${functionName} offline: no cached data available`
    );
  }

  // Cache function result
  cacheResult(functionName, args, result) {
    const cacheKey = this.getCacheKey(functionName, args);
    this.storage.setItem(
      cacheKey,
      JSON.stringify({
        ...result,
        meta: {
          ...result.meta,
          cachedAt: new Date().toISOString(),
        },
      })
    );
  }

  // Get cached result
  getCachedResult(functionName, args) {
    const cacheKey = this.getCacheKey(functionName, args);
    const cached = this.storage.getItem(cacheKey);

    if (!cached) return null;

    try {
      return JSON.parse(cached);
    } catch (error) {
      return null;
    }
  }

  // Queue operation for later execution
  queueOperation(functionName, args, options) {
    const queue = JSON.parse(this.storage.getItem(this.queueKey) || "[]");

    queue.push({
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      function: functionName,
      arguments: args,
      options: {
        requestId: options.requestId,
        headers: options.headers,
      },
      timestamp: new Date().toISOString(),
    });

    this.storage.setItem(this.queueKey, JSON.stringify(queue));
  }

  // Generate cache key from function name and args
  getCacheKey(functionName, args) {
    return `mcp_cache_${functionName}_${JSON.stringify(args)}`;
  }

  // Synchronize queued operations when online
  async syncOfflineQueue() {
    if (!this.networkMonitor.isOnline()) return;

    const queue = JSON.parse(this.storage.getItem(this.queueKey) || "[]");

    if (queue.length === 0) return;

    // Process queue in order
    const newQueue = [];

    for (const operation of queue) {
      try {
        await this.executeOnline(
          operation.function,
          operation.arguments,
          operation.options
        );
      } catch (error) {
        // Keep failed operations in queue
        newQueue.push(operation);
      }
    }

    // Update queue
    this.storage.setItem(this.queueKey, JSON.stringify(newQueue));
  }
}
```

## Data Synchronization

See the [MCP Composition Patterns guide](03-mcp-composition-patterns.md) for examples of function composition and command patterns that can be applied to offline data synchronization.

For more comprehensive implementation guidelines on offline operations, refer to rule [511-mcp-offline-operations.mdc](../../511-mcp-offline-operations.mdc) in the `.cursor/rules` directory.
