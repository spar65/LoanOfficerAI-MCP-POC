# LoanOfficerAI MCP Project Overview

## Project Description

LoanOfficerAI is an agricultural lending intelligence system designed to help loan officers manage agricultural loans, assess risk, and make data-driven lending decisions. The system uses OpenAI's API with MCP (Model Context Protocol) integration to provide intelligent responses to loan officers' queries about borrowers, loans, and risk assessments.

Current status: v1.0.0-POC (Proof of Concept), demo-ready but with active issues

## System Architecture

This is a full-stack application with:

1. **Frontend**: React-based client with Material UI components
2. **Backend**: Node.js/Express server with REST API endpoints
3. **MCP Integration**: Model Context Protocol implementation for enhanced AI interaction
4. **Authentication**: JWT-based authentication system
5. **Data Layer**: JSON file-based storage (in this POC; would be database in production)

## Key Components

### 1. Client-Side (React)

The React client provides a dashboard interface with a chatbot component that allows loan officers to query the system about loans, borrowers, and risk assessments.

**Key Files:**

- `client/src/components/Chatbot.js` - Main chatbot component
- `client/src/components/Dashboard.js` - Dashboard UI
- `client/src/mcp/client.js` - Original HTTP-based MCP client implementation
- `client/src/mcp/mcpClient.js` - New StreamableHTTP MCP client implementation
- `client/src/mcp/authService.js` - Authentication service

### 2. Server-Side (Node.js/Express)

The server provides REST API endpoints for authentication, loan data, borrower data, and OpenAI integration.

**Key Files:**

- `server/server.js` - Main server file
- `server/mcp/server.js` - MCP server implementation
- `server/routes/openai.js` - OpenAI integration
- `server/routes/risk.js` - Risk assessment endpoints
- `server/routes/loans.js` - Loan data endpoints
- `server/routes/borrowers.js` - Borrower data endpoints
- `server/auth/authMiddleware.js` - Authentication middleware

### 3. Data Layer

The POC uses JSON files to store loan, borrower, and other data.

**Key Files:**

- `server/data/loans.json` - Loan data
- `server/data/borrowers.json` - Borrower data
- `server/data/payments.json` - Payment history data
- `server/data/collateral.json` - Collateral data

## Current Issues

The project is currently experiencing MCP integration issues, with conflicts between two different MCP client implementations:

1. Original HTTP-based client (`client.js`)
2. New StreamableHTTP client (`mcpClient.js`)

The most recent effort was to revert to the simpler HTTP-based implementation to restore functionality.

## Key Code Snippets

### 1. Chatbot Component (client/src/components/Chatbot.js)

This is the core component that provides the chat interface to interact with the LoanOfficer AI:

```javascript
import React, { useState, useRef, useEffect } from "react";
import mcpClient from "../mcp/client";
import axios from "axios";
import authService from "../mcp/authService"; // Import auth service
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Card,
  CardContent,
  InputAdornment,
  List,
  ListItem,
  Divider,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import DescriptionIcon from "@mui/icons-material/Description";
import PaymentsIcon from "@mui/icons-material/Payments";
import AssessmentIcon from "@mui/icons-material/Assessment";

// Define MCP function schemas for OpenAI
const MCP_FUNCTIONS = [
  {
    name: "getAllLoans",
    description: "Get a list of all loans in the system",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getLoanDetails",
    description: "Get detailed information about a specific loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to retrieve",
        },
      },
      required: ["loan_id"],
    },
  },
  // More functions defined here...
];

const Chatbot = ({ onClose }) => {
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState([
    {
      role: "system",
      content:
        "You are an AI Farm Loan Assistant. You help users find information about agricultural loans using the available MCP functions. Keep your responses concise and professional. Always format currency values and percentages correctly. If you don't know the answer, ask for clarification.",
    },
    {
      role: "assistant",
      content:
        "Hello! I'm your Farm Loan Assistant. Ask me about loan status, details, payments, collateral, active loans, or loans by borrower.",
    },
  ]);

  // UI message state
  const [messages, setMessages] = useState([
    {
      text: "Hello! I'm your Farm Loan Assistant. Ask me about loan status, details, payments, collateral, active loans, or loans by borrower.",
      sender: "bot",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Handler functions and core logic
  // ...rest of the component code...
};

export default Chatbot;
```

### 2. MCP Client Implementation (client/src/mcp/client.js)

The original HTTP-based MCP client implementation:

```javascript
import axios from "axios";
import authService from "./authService";

const mcpClient = {
  // In production, update baseURL to real MCP endpoint (e.g., https://your-mcp-api.com)
  baseURL: "http://localhost:3001/api",

  // Get axios config with auth headers
  getConfig() {
    const token = authService.getToken();
    const config = {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true, // Important for cookies
    };

    console.log("API request with auth token:", token ? "Present" : "Missing");
    return config;
  },

  // Check server health (public endpoint)
  async checkHealth() {
    try {
      console.log("Checking server health...");
      const response = await axios.get(`${this.baseURL}/health`);
      console.log("Server health check response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Server health check failed:", error.message);
      return null;
    }
  },

  // Function implementations
  async getAllLoans() {
    try {
      console.log("Fetching all loans...");
      const response = await axios.get(
        `${this.baseURL}/loans`,
        this.getConfig()
      );
      console.log(`Received ${response.data.length} loans`);
      return response.data;
    } catch (error) {
      this.handleApiError(error, "getAllLoans");
      return [];
    }
  },

  // Many more methods for various loan functions
  // ...
};

export default mcpClient;
```

### 3. New MCP Client (client/src/mcp/mcpClient.js)

The newer StreamableHTTP MCP client implementation:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

class MCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  async connect(url = "http://localhost:3001/mcp") {
    try {
      console.log(`[MCP Client] Connecting to ${url}`);

      // Create StreamableHTTP transport
      this.transport = new StreamableHTTPClientTransport(new URL(url));

      // Create MCP client
      this.client = new Client({
        name: "LoanOfficerAI-Client",
        version: "1.0.0",
      });

      // Connect to MCP server
      await this.client.connect(this.transport);

      this.connected = true;
      this.reconnectAttempts = 0;
      console.log("[MCP Client] Connected successfully");

      // Set up connection event handlers
      this.transport.onclose = () => {
        console.log("[MCP Client] Connection closed");
        this.connected = false;
        this.attemptReconnect(url);
      };

      this.transport.onerror = (error) => {
        console.error("[MCP Client] Transport error:", error);
      };

      return true;
    } catch (error) {
      console.error("[MCP Client] Connection failed:", error);
      this.connected = false;

      // Attempt reconnection
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect(url);
      }

      throw error;
    }
  }

  // More methods...

  isConnected() {
    return this.connected;
  }

  // Tool execution methods
  async callTool(toolName, args = {}) {
    // MCP tool calling implementation
    // ...
  }
}

// Create singleton instance
const mcpClient = new MCPClient();

// Auto-connection logic
// ...

// Add a baseURL property for HTTP fallback
mcpClient.baseURL = "http://localhost:3001/api";

export default mcpClient;
```

### 4. Server-Side MCP Implementation (server/mcp/server.js)

The MCP server implementation handles MCP protocol requests:

```javascript
const { Server } = require("@modelcontextprotocol/sdk/server");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp");
const LogService = require("../services/logService");

class LoanOfficerMCPServer {
  constructor() {
    this.server = new Server({
      name: "LoanOfficerAI-Server",
      version: "1.0.0",
    });

    // Register tools
    this.registerTools();

    LogService.info("MCP Server initialized");
  }

  registerTools() {
    // Register loan-related tools
    this.server.registerTool({
      name: "getBorrowerDefaultRisk",
      description: "Get default risk assessment for a specific borrower",
      execute: async (params) => {
        // Tool implementation
        // ...
      },
    });

    // More tool registrations
    // ...
  }

  async handleMCPRequest(req, res, isInitializeRequest = false) {
    // Handle MCP requests via StreamableHTTP
    // ...
  }

  // More methods...
}

module.exports = LoanOfficerMCPServer;
```

### 5. OpenAI Integration (server/routes/openai.js)

This file handles integration with OpenAI's API and MCP function calling:

```javascript
const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/authMiddleware");
const LogService = require("../services/logService");
const openaiService = require("../services/openaiService");
const McpService = require("../services/mcpService");
const axios = require("axios");

// MCP Functions for LoanOfficerAI
const mcpFunctions = [
  {
    name: "getBorrowerDefaultRisk",
    description: "Get default risk assessment for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)",
        },
        timeHorizon: {
          type: "string",
          enum: ["short_term", "medium_term", "long_term"],
          description: "The time horizon for risk assessment",
        },
      },
      required: ["borrowerId"],
    },
  },
  // More function definitions
  // ...
];

// OpenAI proxy endpoint
router.post("/chat", authMiddleware.verifyToken, async (req, res) => {
  try {
    // Validate request body
    const { messages, functions, function_call } = req.body;
    if (!messages || !Array.isArray(messages)) {
      LogService.error(
        "Invalid OpenAI request format: Messages array is missing or invalid"
      );
      return res
        .status(400)
        .json({ error: "Invalid request format. Messages array is required." });
    }

    // Log request details for visibility
    LogService.mcp("MCP PROTOCOL: OpenAI Chat Completion", {
      messageCount: messages.length,
      functionCount: functions ? functions.length : 0,
      functionCall: function_call || "auto",
      user: req.user ? req.user.id : "unknown",
    });

    // Merge MCP functions with any provided functions
    const allFunctions = [...mcpFunctions, ...(functions || [])];

    // Use our enhanced OpenAI service
    const response = await openaiService.createChatCompletion({
      model: "gpt-4o",
      messages,
      functions: allFunctions,
      function_call: function_call || "auto",
    });

    // Check if we got a function call
    const message = response.choices[0].message;
    if (message.function_call) {
      // Handle function call logic
      // ...
    }

    // Return the response
    res.json(response.choices[0].message);
  } catch (error) {
    // Error handling
    // ...
  }
});

module.exports = router;
```

### 6. Main Server Configuration (server/server.js)

The main server file sets up the Express server, routes, and the MCP server:

```javascript
// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

// Import logging service
const LogService = require("./services/logService");

// Import data service
const dataService = require("./services/dataService");

// Import middleware
const requestLogger = require("./middleware/requestLogger");
const errorHandler = require("./middleware/errorHandler");
const authMiddleware = require("./auth/authMiddleware");
const tenantMiddleware = require("./middleware/tenantMiddleware");

// Import routes
const authRoutes = require("./auth/authRoutes");
const loansRoutes = require("./routes/loans");
const borrowersRoutes = require("./routes/borrowers");
const riskRoutes = require("./routes/risk");
const analyticsRoutes = require("./routes/analytics");
const openaiRoutes = require("./routes/openai");
const collateralRoutes = require("./routes/collateral");
const paymentsRoutes = require("./routes/payments");

// Initialize app
const app = express();

// Basic middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // Allow cookies with CORS
  })
);

// Configure JSON parsing with error handling
app.use(
  express.json({
    limit: "1mb",
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch (e) {
        res.status(400).json({ error: "Invalid JSON" });
        throw new Error("Invalid JSON");
      }
    },
  })
);

app.use(cookieParser());

// Apply request logging middleware
app.use(requestLogger);

// Register routes
app.use("/api/auth", authRoutes);
app.use("/api/loans", loansRoutes);
app.use("/api/borrowers", borrowersRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/collateral", collateralRoutes);
app.use("/api/payments", paymentsRoutes);

// Start MCP Server
const LoanOfficerMCPServer = require("./mcp/server");
const mcpServer = new LoanOfficerMCPServer();

// Add MCP routes before the 404 handler
app.post("/mcp", async (req, res) => {
  const isInitializeRequest = req.body && req.body.method === "initialize";
  await mcpServer.handleMCPRequest(req, res, isInitializeRequest);
});

app.get("/mcp", async (req, res) => {
  await mcpServer.handleSessionRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  await mcpServer.handleSessionRequest(req, res);
});

// Handle 404 errors
app.use((req, res) => {
  LogService.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Resource not found" });
});

// Global error handler
app.use(errorHandler);

// Start the servers
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  LogService.info(`Server running on port ${PORT}`);
  LogService.info(`MCP Server ready at /mcp endpoint`);
});

module.exports = app; // For testing
```

### 7. Risk Assessment Routes (server/routes/risk.js)

This file provides endpoints for risk assessment:

```javascript
const express = require("express");
const router = express.Router();
const dataService = require("../services/dataService");
const LogService = require("../services/logService");

// Get default risk assessment for borrower
router.get("/default/:borrower_id", (req, res) => {
  const borrowerId = req.params.borrower_id;
  const timeHorizon = req.query.time_horizon || "medium_term";

  LogService.info(
    `Assessing default risk for borrower ${borrowerId} with time horizon: ${timeHorizon}`
  );

  // Load data
  const borrowers = dataService.loadData(dataService.paths.borrowers);
  const loans = dataService.loadData(dataService.paths.loans);
  const payments = dataService.loadData(dataService.paths.payments);

  // Find the borrower
  const borrower = borrowers.find((b) => b.borrower_id === borrowerId);
  if (!borrower) {
    LogService.warn(`Borrower not found with ID: ${borrowerId}`);
    return res.status(404).json({ error: "Borrower not found" });
  }

  // Risk assessment logic
  // ...

  // Return risk assessment
  res.json(result);
});

// More risk assessment endpoints
// ...

module.exports = router;
```

### 8. Authentication Service (client/src/mcp/authService.js)

The client-side authentication service manages tokens and user authentication:

```javascript
const TOKEN_KEY = "loan_officer_auth_token";
const USER_KEY = "loan_officer_user";

const authService = {
  // Store auth data in localStorage
  setAuth(authData) {
    if (authData && authData.accessToken) {
      localStorage.setItem(TOKEN_KEY, authData.accessToken);
      if (authData.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
      }
    }
  },

  // Clear auth data from localStorage
  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  // Get the stored token
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Get the authenticated user data
  getUser() {
    const userData = localStorage.getItem(USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (e) {
        console.error("Error parsing user data:", e);
        return null;
      }
    }
    return null;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;
```

## Data Structure Examples

### Loan Data Example (server/data/loans.json)

```json
[
  {
    "loan_id": "L001",
    "borrower_id": "B001",
    "loan_type": "Equipment",
    "loan_amount": 250000,
    "interest_rate": 5.25,
    "term_months": 60,
    "origination_date": "2023-01-15",
    "maturity_date": "2028-01-15",
    "payment_frequency": "monthly",
    "payment_amount": 4745.12,
    "status": "Active"
  },
  {
    "loan_id": "L002",
    "borrower_id": "B002",
    "loan_type": "Operating",
    "loan_amount": 100000,
    "interest_rate": 4.75,
    "term_months": 12,
    "origination_date": "2023-03-10",
    "maturity_date": "2024-03-10",
    "payment_frequency": "monthly",
    "payment_amount": 8645.83,
    "status": "Active"
  }
  // More loan records...
]
```

### Borrower Data Example (server/data/borrowers.json)

```json
[
  {
    "borrower_id": "B001",
    "first_name": "John",
    "last_name": "Smith",
    "credit_score": 720,
    "farm_type": "Crop",
    "farm_size": 1200,
    "crops": ["corn", "soybeans"],
    "income": 450000,
    "years_farming": 15,
    "address": "123 Farm Road, Ruralville, IA 50123"
  },
  {
    "borrower_id": "B002",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "credit_score": 680,
    "farm_type": "Livestock",
    "farm_size": 800,
    "livestock": ["cattle", "poultry"],
    "income": 320000,
    "years_farming": 8,
    "address": "456 Ranch Lane, Countryside, NE 68345"
  }
  // More borrower records...
]
```

## Summary

The LoanOfficerAI MCP POC is a sophisticated agricultural lending intelligence system that combines:

1. A React frontend with a chatbot interface
2. A Node.js backend with REST API endpoints
3. MCP integration for enhanced AI functionality
4. OpenAI integration for natural language understanding
5. JWT-based authentication

The system is currently experiencing issues with conflicting MCP client implementations (HTTP-based vs StreamableHTTP). The team has reverted to the simpler HTTP-based implementation to restore functionality while planning a phased approach to add back the advanced features from the newer implementation.

The primary use case is to help loan officers quickly assess loan applications, monitor existing loans, evaluate risk, and make data-driven lending decisions in the agricultural sector.
