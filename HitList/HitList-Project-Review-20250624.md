# LoanOfficerAI-MCP-POC Project Review

**Date: June 24, 2025**

## 1. Project Overview

The LoanOfficerAI project is a proof-of-concept (POC) application for agricultural loan officers to manage farm loans and assess risk. The application integrates with MCP (Multiple Callable Processes) to facilitate AI-assisted loan analysis and decision support. It features a chatbot interface powered by OpenAI, detailed loan data tracking, and risk assessment capabilities.

### 1.1 MCP Protocol Overview

MCP (Multiple Callable Processes) is intended to be our standardized protocol for communication between the client and server components, replacing traditional REST APIs. The core concept is to define a registry of callable functions on the server that can be invoked by the client through a uniform interface.

**Current Implementation Status:**

- The system currently uses a hybrid approach with both MCP functions and traditional REST API endpoints
- The OpenAI chatbot integration uses MCP function calling patterns
- Several backend services have been structured as MCP functions but are accessed via REST endpoints

**Key Features:**

- AI-powered chatbot for loan information queries
- Loan portfolio management and tracking
- Risk assessment tools (default risk, collateral evaluation, non-accrual risk)
- Authentication and access control

## 2. Architecture Overview

The project follows a standard client-server architecture:

- **Frontend**: React application with Material UI components
- **Backend**: Node.js/Express server with RESTful APIs (to be fully replaced by MCP)
- **Data**: JSON file-based storage for this POC (simulating a database)
- **Authentication**: JWT-based authentication system
- **AI Integration**: OpenAI API for natural language processing and MCP function calling

### 2.1 Current vs. Target Architecture

**Current Architecture (Mixed REST/MCP):**

```
                    ┌─────────────┐
                    │   OpenAI    │
                    │     API     │
                    └──────┬──────┘
                           │
            ┌──────────────▼──────────────┐
            │                             │
┌───────────▼──────────┐      ┌───────────▼───────────┐
│    React Frontend    │◄────►│    Express Backend    │
│    (Client App)      │      │    (API Server)       │
└────────────┬─────────┘      └────────────┬──────────┘
            │                              │
            │                   ┌──────────▼──────────┐
            │                   │     JSON Files      │
            │                   │    (Data Store)     │
            │                   └─────────────────────┘
            │
┌───────────▼─────────┐
│   User Interface    │
└─────────────────────┘
```

**Target Architecture (Pure MCP):**

```
                    ┌─────────────┐
                    │   OpenAI    │
                    │     API     │
                    └──────┬──────┘
                           │
            ┌──────────────▼──────────────┐
            │                             │
┌───────────▼──────────┐      ┌───────────▼───────────┐
│    React Frontend    │      │      MCP Server       │
│    (Client App)      │◄────►│ Function Registry     │
└────────────┬─────────┘      └────────────┬──────────┘
            │                              │
            │                   ┌──────────▼──────────┐
            │                   │     JSON Files      │
            │                   │    (Data Store)     │
            │                   └─────────────────────┘
            │
┌───────────▼─────────┐
│   User Interface    │
└─────────────────────┘
```

## 3. Frontend Implementation

### 3.1. Chatbot Component

The central user interface is an AI-powered chatbot that processes natural language queries about loans and borrowers:

```javascript
// client/src/components/Chatbot.js (simplified)
import React, { useState } from "react";
import mcpClient from "../mcp/client";

const MCP_FUNCTIONS = [
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
  // Additional MCP function definitions here
  {
    name: "getBorrowerDefaultRisk", // Currently not working
    description: "Get the default risk assessment for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to assess for default risk",
        },
      },
      required: ["borrower_id"],
    },
  },
];

const Chatbot = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your Farm Loan Assistant.", sender: "bot" },
  ]);

  const handleSend = async () => {
    // Call OpenAI API with function definitions
    const response = await axios.post(`${mcpClient.baseURL}/openai/chat`, {
      messages: [...conversationHistory],
      functions: MCP_FUNCTIONS,
      function_call: "auto",
    });

    // Handle function calls if OpenAI invokes them
    if (aiMessage.function_call) {
      const functionResult = await processFunctionCall(aiMessage.function_call);
      // Process result and update UI
    }
  };

  return <Box>{/* Chatbot UI implementation */}</Box>;
};
```

### 3.2. MCP Client

The client-side MCP implementation that handles communication with the backend:

```javascript
// client/src/mcp/client.js (simplified)
import axios from "axios";
import authService from "./authService";

const mcpClient = {
  baseURL: "http://localhost:3001/api",

  getConfig() {
    const token = authService.getToken();
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    };
  },

  // Generic MCP function executor
  async executeMcpFunction(functionName, args) {
    try {
      const response = await axios.post(
        `${this.baseURL}/mcp/execute`,
        {
          functionName,
          args,
        },
        this.getConfig()
      );

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    } catch (error) {
      this.handleApiError(error, functionName);
      throw error;
    }
  },

  // Specific MCP function wrappers
  async getLoanDetails(loanId) {
    return this.executeMcpFunction("getLoanDetails", { loan_id: loanId });
  },

  async getBorrowerDefaultRisk(borrowerId) {
    return this.executeMcpFunction("getBorrowerDefaultRisk", {
      borrower_id: borrowerId,
    });
  },

  // Other MCP function wrappers
};
```

## 4. Backend Implementation

### 4.1. Server Setup

```javascript
// server/server.js (simplified)
const express = require("express");
const app = express();
const cors = require("cors");

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(require("./middleware/authMiddleware"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/loans", require("./routes/loans"));
app.use("/api/risk", require("./routes/risk"));
app.use("/api/openai", require("./routes/openai"));
app.use("/api/mcp", require("./routes/mcp"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4.2. Risk Assessment Routes

```javascript
// server/routes/risk.js (simplified)
const express = require("express");
const router = express.Router();
const dataService = require("../services/dataService");
const LogService = require("../services/logService");

// Get default risk assessment for borrower
router.get("/default/:borrower_id", (req, res) => {
  const borrowerId = req.params.borrower_id;

  // Load data
  const borrowers = dataService.loadData(dataService.paths.borrowers);
  const loans = dataService.loadData(dataService.paths.loans);
  const payments = dataService.loadData(dataService.paths.payments);

  // Find the borrower
  const borrower = borrowers.find((b) => b.borrower_id === borrowerId);
  if (!borrower) {
    return res.status(404).json({ error: "Borrower not found" });
  }

  // Calculate risk score and other metrics
  let riskScore = 50; // Base score

  // Apply various risk factors
  if (borrower.credit_score < 600) riskScore += 20;
  // Other risk calculations...

  // Return formatted response
  res.json({
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    risk_score: riskScore,
    risk_level: riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low",
    // Additional data...
  });
});

// Other risk-related endpoints...
module.exports = router;
```

### 4.3. MCP Function Registry

```javascript
// server/services/mcpFunctionRegistry.js (simplified)
const MCPServiceWithLogging = require("./mcpServiceWithLogging");

// Registry of MCP functions
const registry = {
  // LOAN FUNCTIONS
  getLoanDetails: MCPServiceWithLogging.createFunction(
    "getLoanDetails",
    async (args) => {
      const { loan_id } = args;

      if (!loan_id) {
        throw new Error("Loan ID is required");
      }

      // Call internal API to get loan details
      const result = await callInternalApi(`/api/loans/details/${loan_id}`);

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    }
  ),

  // RISK ASSESSMENT FUNCTIONS
  getBorrowerDefaultRisk: MCPServiceWithLogging.createFunction(
    "getBorrowerDefaultRisk",
    async (args) => {
      const { borrower_id } = args;

      if (!borrower_id) {
        throw new Error("Borrower ID is required");
      }

      try {
        const result = await callInternalApi(
          `/api/risk/default/${borrower_id}`
        );

        if (result.error) {
          throw new Error(result.error);
        }

        return result;
      } catch (error) {
        return {
          error: true,
          message: `Could not assess default risk: ${error.message}`,
          borrower_id,
        };
      }
    }
  ),

  // Other MCP functions...
};

// Schema definitions for MCP functions (used for OpenAI function calling)
const functionSchemas = {
  // Schema definitions matching the registry functions
};

module.exports = {
  registry,
  executeFunction: async (functionName, args) => {
    /* Implementation */
  },
  getRegisteredFunctionsSchema: () => Object.values(functionSchemas),
};
```

## 5. Data Services

### 5.1. Data Service

```javascript
// server/services/dataService.js (simplified)
const fs = require("fs");
const path = require("path");

const dataService = {
  paths: {
    loans: path.join(__dirname, "../data/loans.json"),
    borrowers: path.join(__dirname, "../data/borrowers.json"),
    collateral: path.join(__dirname, "../data/collateral.json"),
    payments: path.join(__dirname, "../data/payments.json"),
    users: path.join(__dirname, "../data/users.json"),
  },

  loadData(filePath) {
    try {
      const rawData = fs.readFileSync(filePath, "utf8");
      return JSON.parse(rawData);
    } catch (error) {
      console.error(`Error loading data from ${filePath}:`, error);
      return [];
    }
  },

  saveData(filePath, data) {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, jsonData, "utf8");
      return true;
    } catch (error) {
      console.error(`Error saving data to ${filePath}:`, error);
      return false;
    }
  },
};

module.exports = dataService;
```

## 6. Authentication and Security

### 6.1. Authentication Service

```javascript
// client/src/mcp/authService.js (simplified)
const authService = {
  getToken() {
    return localStorage.getItem("token");
  },

  setToken(token) {
    localStorage.setItem("token", token);
  },

  clearToken() {
    localStorage.removeItem("token");
  },

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    // Simple token validation
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  },
};

export default authService;
```

### 6.2. Auth Middleware

```javascript
// server/middleware/authMiddleware.js (simplified)
const jwt = require("jsonwebtoken");
const config = require("../auth/config");

module.exports = (req, res, next) => {
  // Skip authentication for public routes
  const publicRoutes = ["/api/auth/login", "/api/auth/refresh", "/api/health"];
  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // Get token from request header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  // Verify token
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
```

## 7. Logging and Error Handling

### 7.1. Logging Service

```javascript
// server/services/logService.js (simplified)
const winston = require("winston");

const LogService = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

// Add specialized logging methods
LogService.mcp = (message, meta = {}) => {
  LogService.info(message, { ...meta, source: "MCP" });
};

module.exports = LogService;
```

## 8. OpenAI Integration

### 8.1. OpenAI Service

```javascript
// server/services/openaiService.js (simplified)
const axios = require("axios");
const LogService = require("./logService");
const mcpFunctionRegistry = require("./mcpFunctionRegistry");

async function createChatCompletion(messages, options = {}) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    // Prepare request payload
    const payload = {
      model: options.model || "gpt-3.5-turbo",
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 500,
    };

    // Add functions if specified
    if (options.functions) {
      payload.functions = options.functions;

      if (options.function_call) {
        payload.function_call = options.function_call;
      }
    }

    // Call OpenAI API
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      {
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message;
  } catch (error) {
    LogService.error("OpenAI API call failed:", {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
}

module.exports = {
  createChatCompletion,
};
```

## 9. Testing Strategy

The project uses Jest for unit and integration testing with a focus on:

1. **Unit Testing**: Testing individual components in isolation
2. **Integration Testing**: Testing API flows and component interactions
3. **Mock Data**: Consistent test fixtures to simulate the database

Key testing files include:

- `server/tests/unit/*` - Backend unit tests
- `server/tests/integration/*` - Backend integration tests
- `client/src/tests/unit/*` - Frontend unit tests

## 10. Current Issues and Challenges

### 10.1. MCP Risk Assessment Functions

The primary issue identified is with the risk assessment functions in the chatbot:

1. **Missing Function Definitions**: The OpenAI integration is missing function definitions for risk assessment functions in the frontend.
2. **Incomplete Function Handling**: The `processFunctionCall` method doesn't handle the risk assessment functions.

```javascript
// Missing from MCP_FUNCTIONS array in Chatbot.js
{
  name: "getBorrowerDefaultRisk",
  description: "Get the default risk assessment for a specific borrower",
  parameters: {
    type: "object",
    properties: {
      borrower_id: {
        type: "string",
        description: "The ID of the borrower to assess for default risk"
      }
    },
    required: ["borrower_id"]
  }
}
```

```javascript
// Missing from processFunctionCall in Chatbot.js
case 'getBorrowerDefaultRisk':
case 'getBorrowerNonAccrualRisk':
  // These functions take borrower_id
  result = await mcpClient[name](args.borrower_id);
  break;
```

### 10.2. Authentication Issues

Occasional authentication token expiration issues are occurring, leading to API failures.

## 11. MCP Implementation Details and Conversion Plan

### 11.1. Current MCP Implementation Structure

The application's MCP implementation is built on these components:

1. **Client-side MCP Client** (`client/src/mcp/client.js`):

   - Currently wraps traditional REST API calls
   - Provides a unified interface for the frontend
   - Uses axios under the hood for HTTP requests

2. **Server-side MCP Function Registry** (`server/services/mcpFunctionRegistry.js`):

   - Defines available MCP functions with validation and error handling
   - Centralized registry pattern with standardized execution flow
   - Currently accessed through traditional REST endpoints

3. **MCP Service with Logging** (`server/services/mcpServiceWithLogging.js`):
   - Wraps MCP functions with logging, error handling, and PII redaction
   - Provides consistent execution patterns for MCP functions

### 11.2. Pure MCP Conversion Plan

To convert the system to pure MCP (eliminating REST APIs):

1. **Create a dedicated MCP endpoint**:

```javascript
// server/routes/mcp.js (expanded)
router.post("/execute", async (req, res) => {
  const { functionName, args } = req.body;

  // Validate function exists
  if (!mcpFunctionRegistry.registry[functionName]) {
    return res.status(404).json({
      success: false,
      error: `Unknown MCP function: ${functionName}`,
    });
  }

  try {
    // Execute the MCP function from registry
    const result = await mcpFunctionRegistry.executeFunction(
      functionName,
      args
    );
    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
```

2. **Update Client MCP Service**:

```javascript
// Updated client/src/mcp/client.js
import axios from "axios";
import authService from "./authService";

const mcpClient = {
  baseURL: "http://localhost:3001/api",

  getConfig() {
    const token = authService.getToken();
    return {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    };
  },

  // Generic MCP function executor
  async executeMcpFunction(functionName, args) {
    try {
      const response = await axios.post(
        `${this.baseURL}/mcp/execute`,
        {
          functionName,
          args,
        },
        this.getConfig()
      );

      if (!response.data.success) {
        throw new Error(response.data.error);
      }

      return response.data.result;
    } catch (error) {
      this.handleApiError(error, functionName);
      throw error;
    }
  },

  // Specific MCP function wrappers
  async getLoanDetails(loanId) {
    return this.executeMcpFunction("getLoanDetails", { loan_id: loanId });
  },

  async getBorrowerDefaultRisk(borrowerId) {
    return this.executeMcpFunction("getBorrowerDefaultRisk", {
      borrower_id: borrowerId,
    });
  },

  // Other MCP function wrappers
};
```

3. **Eliminate REST endpoint dependencies**:

Replace internal API calls within the MCP Function Registry with direct function calls:

```javascript
// Current implementation
getBorrowerDefaultRisk: MCPServiceWithLogging.createFunction(
  "getBorrowerDefaultRisk",
  async (args) => {
    const { borrower_id } = args;

    try {
      // Currently using internal REST API call
      const result = await callInternalApi(`/api/risk/default/${borrower_id}`);
      return result;
    } catch (error) {
      // Error handling
    }
  }
);

// Proposed implementation
getBorrowerDefaultRisk: MCPServiceWithLogging.createFunction(
  "getBorrowerDefaultRisk",
  async (args) => {
    const { borrower_id } = args;

    try {
      // Direct data access without REST API
      const borrowers = dataService.loadData(dataService.paths.borrowers);
      const loans = dataService.loadData(dataService.paths.loans);
      const payments = dataService.loadData(dataService.paths.payments);

      // Find borrower and calculate risk
      const borrower = borrowers.find((b) => b.borrower_id === borrower_id);
      if (!borrower) {
        throw new Error(`Borrower with ID ${borrower_id} not found`);
      }

      // Risk calculation logic
      let riskScore = 50; // Base score
      // Risk calculation...

      return {
        borrower_id,
        borrower_name: `${borrower.first_name} ${borrower.last_name}`,
        risk_score: riskScore,
        risk_level: riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low",
      };
    } catch (error) {
      // Error handling
    }
  }
);
```

### 11.3. Benefits of Pure MCP Approach

1. **Unified Interface**: Single consistent protocol for all client-server communication
2. **Simplified Authentication**: Authentication handled once at MCP execution level
3. **Enhanced Logging**: Centralized logging and error handling for all operations
4. **Better Schema Validation**: Input/output validation via standardized schemas
5. **Reduced API Surface Area**: Fewer endpoints to maintain and secure
6. **OpenAI Integration**: Seamless integration with OpenAI function calling pattern

### 11.4. MCP Implementation Roadmap

1. **Phase 1 - Fix Current Risk Functions**:

   - Update Chatbot component with missing function definitions
   - Add handlers for risk assessment functions

2. **Phase 2 - Convert Key REST APIs to MCP**:

   - Implement the generic MCP execution endpoint
   - Convert loan and borrower endpoints first
   - Update client to use MCP execution for these functions

3. **Phase 3 - Full MCP Conversion**:
   - Remove all direct REST API calls from client
   - Refactor server implementation to use pure function calls
   - Update authentication to work with unified MCP pattern

## 12. Recommended Improvements

1. **Complete Risk Assessment Integration**: Implement the missing risk assessment function definitions and processing.
2. **Enhanced Error Handling**: Improve error handling for API failures and token expiration.
3. **Logging Enhancement**: Add more detailed logging for troubleshooting MCP function failures.
4. **Test Coverage**: Increase test coverage for the risk assessment functions.
5. **Token Refresh**: Implement automatic token refresh to handle expiring authentication tokens.
6. **Full MCP Conversion**: Complete the transition to pure MCP communication pattern.

## 13. Note for Claude 4 Analysis

### Key Information for Claude 4 to Understand Our MCP Goals

Claude, we need your assistance in transforming this hybrid REST/MCP system into a pure MCP solution. Here are the key points to understand:

1. **MCP Definition in Our Context**:

   - MCP (Multiple Callable Processes) refers to our standardized protocol for client-server communication
   - It's a function-calling pattern that closely aligns with OpenAI's function calling implementation
   - We want to eliminate traditional REST APIs in favor of a unified MCP interface

2. **Current Implementation Issues**:

   - The codebase has a disconnect between declared MCP functions and their implementation
   - Risk assessment function calls fail because they're not properly defined in the client's MCP_FUNCTIONS array
   - The backend has MCP functions defined but they're accessed through REST endpoints

3. **Request for Analysis**:

   - Can you identify any architectural weaknesses in our current MCP implementation?
   - Are there any security concerns with our proposed pure MCP approach?
   - How can we better align our MCP protocol with OpenAI's function calling paradigm?
   - What's the most efficient path to transition from hybrid REST/MCP to pure MCP?

4. **Specific Technical Questions**:
   - Should our MCP client and server use a JSON schema for validation, and if so, what's the best approach?
   - How should we handle authentication in pure MCP?
   - What's the best way to provide comprehensive error handling in MCP functions?
   - How should we handle batch operations in MCP?

We believe your advanced capabilities can help us design a robust MCP architecture that will serve as the foundation for our production system.

## 14. Conclusion

The LoanOfficerAI-MCP-POC application demonstrates effective integration of AI capabilities with a loan management system. The main issues identified with risk assessment functions can be resolved with targeted improvements to the OpenAI function definitions and processing logic. The transition from a hybrid REST/MCP system to pure MCP will provide a more consistent, manageable, and secure architecture. This POC provides a solid foundation for further development into a production-ready system.

---

**Prepared by**: AI Assistant
**For**: Loan Officer AI Development Team
