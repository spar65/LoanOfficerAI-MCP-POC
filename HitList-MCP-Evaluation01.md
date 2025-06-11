# LoanOfficerAI MCP Implementation Evaluation

## Overview

This document analyzes the LoanOfficerAI MCP implementation, focusing on issues and code changes that led to the current state where MCP functionality is partially broken. Based on the chat history and code inspection, we've identified several key changes and problem areas.

## 1. MCP Client Implementation Issues

### Problem: Duplication of MCP Client with Conflicting Implementations

The codebase has two MCP client implementations that are causing conflicts:

1. **Original HTTP-based client**: `client/src/mcp/client.js`
2. **New StreamableHTTP MCP client**: `client/src/mcp/mcpClient.js`

#### Code Comparison:

**Old client.js (HTTP-based approach):**

```javascript
import axios from 'axios';
import authService from './authService';

const mcpClient = {
  // In production, update baseURL to real MCP endpoint (e.g., https://your-mcp-api.com)
  baseURL: 'http://localhost:3001/api',

  // Get axios config with auth headers
  getConfig() {
    const token = authService.getToken();
    const config = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true // Important for cookies
    };

    console.log('API request with auth token:', token ? 'Present' : 'Missing');
    return config;
  },

  // Check server health (public endpoint)
  async checkHealth() {
    try {
      console.log('Checking server health...');
      const response = await axios.get(`${this.baseURL}/health`);
      console.log('Server health check response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Server health check failed:', error.message);
      return null;
    }
  },

  // ... many more methods for specific API calls
```

**New mcpClient.js (StreamableHTTP MCP):**

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

class MCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  async connect(url = 'http://localhost:3001/mcp') {
    try {
      console.log(`[MCP Client] Connecting to ${url}`);

      // Create StreamableHTTP transport
      this.transport = new StreamableHTTPClientTransport(new URL(url));

      // Create MCP client
      this.client = new Client({
        name: 'LoanOfficerAI-Client',
        version: '1.0.0'
      });

      // Connect to MCP server
      await this.client.connect(this.transport);

      // ... more code
```

### Issue: Import Conflicts in App.js

App.js was importing from the wrong path, leading to importing conflicts:

**Problematic import in App.js:**

```javascript
import authService from "./mcp/authService";
import mcpClient from "./mcp/client"; // Wrong path
```

**Fixed to:**

```javascript
import authService from "./mcp/authService";
import mcpClient from "./mcp/mcpClient"; // Correct path
```

## 2. MCP Connection Issues

### Problem: Auto-connection Disabled

In the new implementation, auto-connection was disabled as part of troubleshooting:

```javascript
// TEMPORARILY DISABLE MCP AUTO-CONNECT - focusing on HTTP flow first
// Auto-connect on module load with better error handling
if (typeof window !== 'undefined' && false) { // Disabled for now
  // Browser environment - try to connect immediately and on window load
  const tryConnect = async () => {
    // ...
  };
```

### Problem: Missing Connection Status Handling

The Chatbot component shows "MCP Disconnected" but has limited handling for reconnection:

```javascript
// Manual MCP reconnection function
const handleMCPReconnect = async () => {
  try {
    console.log("[Chatbot] Attempting to reconnect to MCP server...");
    const success = await mcpClient.connect();
    if (success) {
      console.log("[Chatbot] Successfully reconnected to MCP");
      setMcpConnected(true);
    } else {
      console.warn("[Chatbot] Failed to reconnect to MCP server");
    }
  } catch (error) {
    console.error("[Chatbot] Reconnection error:", error);
  }
};
```

## 3. Message Structure Inconsistency

### Problem: Inconsistent Message Format

The Chatbot component uses inconsistent message structures across different parts of the code:

**Initial State:**

```javascript
const [messages, setMessages] = useState([
  {
    id: 1,
    text: "Hello! I'm your Farm Loan Assistant...",
    sender: "bot",
    timestamp: new Date().toISOString(),
  },
]);
```

**UserMessage in handleSend:**

```javascript
const userMessage = {
  id: Date.now(),
  text: input,
  sender: "user",
  timestamp: new Date().toISOString(),
};
```

**Bot Message in API response handling:**

```javascript
const botMessage = {
  id: Date.now() + 2,
  text: responseText,
  sender: "bot",
  timestamp: new Date().toISOString(),
};
```

## 4. Authentication Issues

### Problem: Missing or Expired Authentication Token

The Chatbot doesn't properly handle authentication token issues:

```javascript
// Get auth token using the auth service
let token = authService.getToken();

if (!token) {
  console.error("No authentication token available, attempting to get one...");

  // Try to auto-login if no token
  try {
    const response = await axios.post("http://localhost:3001/api/auth/login", {
      username: "john.doe",
      password: "password123",
    });

    if (response.data.success) {
      authService.setAuth(response.data);
      token = response.data.accessToken;
      console.log("Got new auth token");
    } else {
      throw new Error("Login failed");
    }
  } catch (loginError) {
    console.error("Auto-login failed:", loginError);
    throw new Error("Authentication required - please refresh the page");
  }
}
```

## 5. API Integration Issues

### Problem: Endpoint Compatibility and Error Handling

The new MCP client doesn't properly map to all the same endpoints and functions as the old client:

**Old Client (client.js):**

```javascript
async predictNonAccrualRisk(borrowerId) {
  try {
    console.log(`Predicting non-accrual risk for borrower ${borrowerId}...`);

    // Normalize the borrowerId
    const normalizedId = borrowerId.toString().toUpperCase().trim();
    console.log(`Using normalized borrower ID: ${normalizedId}`);

    // First try the analytics endpoint
    try {
      const response = await axios.get(
        `${this.baseURL}/analytics/predict/non-accrual-risk/${normalizedId}`,
        this.getConfig()
      );
      console.log('Analytics API returned non-accrual risk data successfully');
      return response.data;
    } catch (analyticsError) {
      console.log('Analytics API failed, trying risk endpoint:', analyticsError.message);

      // If analytics fails, try the risk endpoint
      try {
        const riskResponse = await axios.get(
          `${this.baseURL}/risk/non-accrual/${normalizedId}`,
          this.getConfig()
        );
        console.log('Risk API returned non-accrual risk data successfully');
        return riskResponse.data;
      } catch (riskError) {
        // ... more fallback handling
      }
    }
  } catch (error) {
    this.handleApiError(error, 'predictNonAccrualRisk');
    throw error;
  }
}
```

**New Client (mcpClient.js):**

```javascript
async getBorrowerNonAccrualRisk(borrowerId) {
  return this.callTool('getBorrowerNonAccrualRisk', { borrowerId });
}
```

## 6. Recommended Fixes

1. **Standardize MCP Client Implementation**:

   - Choose one client implementation (HTTP-based or StreamableHTTP)
   - Ensure all components consistently import from the same client file
   - Delete or rename the unused client file to avoid confusion

2. **Fix Connection Handling**:

   - Re-enable auto-connection in the mcpClient.js
   - Improve connection status handling with better UI feedback
   - Add retry logic with backoff

3. **Standardize Message Structure**:

   - Ensure consistent message structure throughout the application
   - Create helper functions to standardize message creation

4. **Improve Authentication**:

   - Implement proper token refresh logic
   - Add better error handling for authentication issues
   - Store authentication state properly

5. **Ensure API Endpoint Compatibility**:
   - Map all MCP functions to proper endpoints
   - Add comprehensive error handling for each endpoint
   - Add retry logic for transient errors

## 7. Working Solution Path

Based on the chat history, a working solution appears to be:

1. Revert to using the original client.js implementation with simple HTTP calls
2. Fix import paths in App.js and other components to use the correct client
3. Standardize message structures across the application
4. Improve authentication handling with auto-login
5. Add better error handling for API responses

These changes would restore the previously working functionality while maintaining the enhanced UI with example queries added to the chatbot interface.
