# MCP Basic Loan Information Plan

## Executive Summary

This document outlines the Model Control Protocol (MCP) implementation for basic loan information queries in the LoanOfficerAI system. Currently, only the "Active Loans" query is working correctly, while "Loan Status" and "Portfolio Summary" queries are failing. This document provides a comprehensive analysis of the architecture, identifies the issues, and proposes solutions.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Client-Side Implementation](#client-side-implementation)
3. [Server-Side Implementation](#server-side-implementation)
4. [Data Management](#data-management)
5. [Issue Analysis](#issue-analysis)
6. [Proposed Solutions](#proposed-solutions)
7. [Implementation Plan](#implementation-plan)

## Architecture Overview

The LoanOfficerAI chatbot uses the Model Control Protocol (MCP) to enable AI function calling. The architecture consists of:

1. **Client-Side React Components**: The chatbot interface that sends user queries to the OpenAI API through a secure server proxy
2. **Server-Side OpenAI Integration**: Processes queries, handles authentication, and manages function calling
3. **MCP Function Registry**: Centralized registry of functions that can be called by the AI
4. **Data Service**: Provides access to loan and borrower data stored as JSON files

The flow is:

1. User enters a query in the chatbot
2. Client sends query to the server's OpenAI proxy endpoint
3. Server forwards the query to OpenAI with available function definitions
4. If OpenAI selects a function, the server executes it via the MCP registry
5. Server returns the response to the client
6. Client displays the response to the user

## Client-Side Implementation

### Chatbot Component (`client/src/components/Chatbot.js`)

```javascript
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
  {
    name: "getLoanStatus",
    description: "Get the status of a specific loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to retrieve the status for",
        },
      },
      required: ["loan_id"],
    },
  },
  {
    name: "getActiveLoans",
    description: "Get a list of all active loans",
    parameters: { type: "object", properties: {}, required: [] },
  },
  {
    name: "getLoansByBorrower",
    description: "Get loans for a specific borrower by name",
    parameters: {
      type: "object",
      properties: {
        borrower: {
          type: "string",
          description: "The name of the borrower to retrieve loans for",
        },
      },
      required: ["borrower"],
    },
  },
  {
    name: "getLoanSummary",
    description: "Get summary statistics about all loans",
    parameters: { type: "object", properties: {}, required: [] },
  },
];

// Process function calls from OpenAI
const processFunctionCall = async (functionCall) => {
  try {
    const { name, arguments: argsString } = functionCall;
    console.log(`Executing function: ${name} with args: ${argsString}`);

    // Parse function arguments
    const args = JSON.parse(argsString);
    console.log("Parsed args:", args);

    // Execute the appropriate function based on the name
    if (typeof mcpClient[name] === "function") {
      let result;

      // Call with appropriate arguments based on function name
      switch (name) {
        case "getAllLoans":
        case "getActiveLoans":
        case "getLoanSummary":
          // These functions take no arguments
          result = await mcpClient[name]();
          break;

        case "getLoanStatus":
        case "getLoanDetails":
        case "getLoanPayments":
        case "getLoanCollateral":
          // These functions take loan_id
          result = await mcpClient[name](args.loan_id);
          break;

        case "getLoansByBorrower":
          // Takes borrower name
          result = await mcpClient[name](args.borrower);
          break;

        default:
          throw new Error(`Unsupported function: ${name}`);
      }

      console.log(`Function ${name} executed successfully`);
      return { role: "function", name, content: JSON.stringify(result) };
    } else {
      throw new Error(`Function ${name} not found in mcpClient`);
    }
  } catch (error) {
    console.error("Error executing function:", error);
    return {
      role: "function",
      name: functionCall.name,
      content: JSON.stringify({ error: error.message }),
    };
  }
};

const handleSend = async () => {
  if (!input.trim() || loading) return;

  const userMessage = { text: input, sender: "user" };
  const userMessageForAPI = { role: "user", content: input };

  setMessages((prev) => [...prev, userMessage]);
  setConversationHistory((prev) => [...prev, userMessageForAPI]);
  setInput("");
  setLoading(true);

  try {
    // Get auth token using the auth service
    const token = authService.getToken();

    if (!token) {
      console.error("No authentication token available");
      throw new Error("Authentication required");
    }

    // Add typing indicator
    setMessages((prev) => [
      ...prev,
      { text: "...", sender: "bot", isTyping: true },
    ]);

    // Make API request to our OpenAI proxy
    const response = await axios.post(
      `${mcpClient.baseURL}/openai/chat`,
      {
        messages: [...conversationHistory, userMessageForAPI],
        functions: MCP_FUNCTIONS,
        function_call: "auto",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Remove typing indicator
    setMessages((prev) => prev.filter((msg) => !msg.isTyping));

    // Handle the response
    const aiMessage = response.data;
    let responseText = aiMessage.content;
    let updatedHistory = [...conversationHistory, userMessageForAPI, aiMessage];

    // Handle function call if present
    if (aiMessage.function_call) {
      // Execute the function
      const functionResult = await processFunctionCall(aiMessage.function_call);
      updatedHistory.push(functionResult);

      // Get a second response from OpenAI that incorporates the function result
      const secondResponse = await axios.post(
        `${mcpClient.baseURL}/openai/chat`,
        {
          messages: updatedHistory,
          functions: MCP_FUNCTIONS,
          function_call: "auto",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update with the final response
      const finalAiMessage = secondResponse.data;
      responseText = finalAiMessage.content;
      updatedHistory.push(finalAiMessage);
    }

    // Add final message to UI
    const botMessage = { text: responseText, sender: "bot" };
    setMessages((prev) => [...prev.filter((msg) => !msg.isTyping), botMessage]);

    // Update conversation history
    setConversationHistory(updatedHistory);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);

    // Remove typing indicator
    setMessages((prev) => prev.filter((msg) => !msg.isTyping));

    // Add error message
    const errorMessage = {
      text: `Sorry, I encountered an error: ${
        error.message || "Unknown error"
      }. Please try again.`,
      sender: "bot",
    };
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setLoading(false);
  }
};
```

### MCP Client (`client/src/mcp/client.js`)

```javascript
const mcpClient = {
  baseURL: "http://localhost:3001/api",

  // Authentication helpers
  getConfig() {
    const token = localStorage.getItem("token");
    return {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };
  },

  handleApiError(error, functionName) {
    console.error(`Error in ${functionName}:`, error);
    if (error.response) {
      console.error(`Status: ${error.response.status}`, error.response.data);

      // Handle authentication errors
      if (error.response.status === 401) {
        // Clear local token and redirect to login
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
  },

  // Loan-related functions
  async getAllLoans() {
    try {
      console.log("Fetching all loans...");
      const response = await axios.get(
        `${this.baseURL}/loans`,
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, "getAllLoans");
      throw error;
    }
  },

  async getLoanDetails(loanId) {
    try {
      console.log(`Fetching loan details for ${loanId}...`);
      const response = await axios.get(
        `${this.baseURL}/loans/details/${loanId}`,
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, "getLoanDetails");
      throw error;
    }
  },

  async getLoanStatus(loanId) {
    try {
      console.log(`Fetching loan status for ${loanId}...`);
      const response = await axios.get(
        `${this.baseURL}/loans/status/${loanId}`,
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, "getLoanStatus");
      throw error;
    }
  },

  async getActiveLoans() {
    try {
      console.log("Fetching active loans...");
      const response = await axios.get(
        `${this.baseURL}/loans/active`,
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, "getActiveLoans");
      throw error;
    }
  },

  async getLoanSummary() {
    try {
      console.log("Fetching loan summary...");
      const response = await axios.get(
        `${this.baseURL}/loans/summary`,
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, "getLoanSummary");
      throw error;
    }
  },
};
```

## Server-Side Implementation

### MCP Function Registry (`server/services/mcpFunctionRegistry.js`)

```javascript
// Helper for internal API calls
async function callInternalApi(endpoint, method = "GET", data = null) {
  try {
    // Simulate API call by directly accessing data
    const segments = endpoint.split("/").filter((s) => s);

    if (segments[0] === "api") {
      segments.shift(); // Remove 'api'
    }

    // Route the request based on the endpoint
    switch (segments[0]) {
      case "loans": {
        // Handle loan-related endpoints
        if (segments[1] === "details" && segments[2]) {
          const loanId = segments[2].toUpperCase();
          const loans = dataService.loadData(dataService.paths.loans);
          const loan = loans.find((l) => l.loan_id === loanId);

          if (!loan) {
            return { error: "Loan not found", loan_id: loanId };
          }

          return loan;
        }

        if (segments[1] === "active") {
          const loans = dataService.loadData(dataService.paths.loans);
          return loans.filter((l) => l.status === "Active");
        }

        // THIS ENDPOINT IS MISSING - Causing the getLoanStatus function to fail
        // if (segments[1] === 'status' && segments[2]) {
        //   const loanId = segments[2].toUpperCase();
        //   const loans = dataService.loadData(dataService.paths.loans);
        //   const loan = loans.find(l => l.loan_id === loanId);
        //
        //   if (!loan) {
        //     return { error: 'Loan not found', loan_id: loanId };
        //   }
        //
        //   return { status: loan.status };
        // }

        // THIS ENDPOINT IS MISSING - Causing the getLoanSummary function to fail
        // if (segments[1] === 'summary') {
        //   const loans = dataService.loadData(dataService.paths.loans);
        //
        //   // Calculate summary statistics
        //   const totalLoans = loans.length;
        //   const activeLoans = loans.filter(l => l.status === 'Active').length;
        //   const pendingLoans = loans.filter(l => l.status === 'Pending').length;
        //   const closedLoans = loans.filter(l => l.status === 'Closed').length;
        //   const totalAmount = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
        //   const avgInterestRate = loans.length > 0
        //     ? loans.reduce((sum, loan) => sum + loan.interest_rate, 0) / loans.length
        //     : 0;
        //
        //   return {
        //     total_loans: totalLoans,
        //     active_loans: activeLoans,
        //     pending_loans: pendingLoans,
        //     closed_loans: closedLoans,
        //     total_loan_amount: totalAmount,
        //     average_interest_rate: avgInterestRate
        //   };
        // }

        if (segments[1] === "borrower" && segments[2]) {
          const borrowerId = segments[2].toUpperCase();
          const loans = dataService.loadData(dataService.paths.loans);
          const borrowerLoans = loans.filter(
            (l) => l.borrower_id === borrowerId
          );

          if (borrowerLoans.length === 0) {
            return {
              note: "No loans found for this borrower",
              borrower_id: borrowerId,
            };
          }

          return borrowerLoans;
        }

        break;
      }

      // Other cases for borrowers, risk, etc.
    }

    // Default response if no matching endpoint
    return { error: "Endpoint not implemented", endpoint };
  } catch (error) {
    LogService.error(`Error in internal API call to ${endpoint}:`, error);
    return {
      error: "Internal API call failed",
      details: error.message,
    };
  }
}

// Registry of MCP functions
const registry = {
  // LOAN FUNCTIONS

  /**
   * Get details for a specific loan
   */
  getLoanDetails: MCPServiceWithLogging.createFunction(
    "getLoanDetails",
    async (args) => {
      const { loan_id } = args;

      if (!loan_id) {
        throw new Error("Loan ID is required");
      }

      const result = await callInternalApi(`/api/loans/details/${loan_id}`);

      if (result.error) {
        throw new Error(result.error);
      }

      return result;
    }
  ),

  /**
   * Get status for a specific loan
   */
  getLoanStatus: MCPServiceWithLogging.createFunction(
    "getLoanStatus",
    async (args) => {
      const { loan_id } = args;

      if (!loan_id) {
        throw new Error("Loan ID is required");
      }

      try {
        LogService.info(`Fetching loan status for loan ID: ${loan_id}`);
        const result = await callInternalApi(`/api/loans/status/${loan_id}`);

        if (result.error) {
          throw new Error(result.error);
        }

        return result;
      } catch (error) {
        LogService.error(`Error fetching loan status: ${error.message}`);
        return {
          error: true,
          message: `Could not retrieve loan status: ${error.message}`,
          loan_id,
        };
      }
    }
  ),

  /**
   * Get loan portfolio summary
   */
  getLoanSummary: MCPServiceWithLogging.createFunction(
    "getLoanSummary",
    async () => {
      try {
        LogService.info("Fetching loan portfolio summary");
        const result = await callInternalApi(`/api/loans/summary`);

        if (result.error) {
          throw new Error(result.error);
        }

        return result;
      } catch (error) {
        LogService.error(`Error fetching loan summary: ${error.message}`);
        return {
          error: true,
          message: `Could not retrieve loan summary: ${error.message}`,
        };
      }
    }
  ),

  /**
   * Get all active loans
   */
  getActiveLoans: MCPServiceWithLogging.createFunction(
    "getActiveLoans",
    async () => {
      try {
        LogService.info("Fetching all active loans");
        const result = await callInternalApi(`/api/loans/active`);

        if (result.error) {
          throw new Error(result.error);
        }

        return result;
      } catch (error) {
        LogService.error(`Error fetching active loans: ${error.message}`);
        return {
          error: true,
          message: `Could not retrieve active loans: ${error.message}`,
        };
      }
    }
  ),

  // Additional functions...
};

/**
 * Execute an MCP function by name with arguments
 * @param {string} functionName - Name of the MCP function
 * @param {Object} args - Arguments for the function
 * @returns {Promise<Object>} - Function result
 */
async function executeFunction(functionName, args) {
  // Check if function exists
  if (!registry[functionName]) {
    LogService.error(`Unknown MCP function: ${functionName}`);
    return mcpResponseFormatter.formatError(
      `Unknown function: ${functionName}`,
      "executeFunction"
    );
  }

  try {
    // Validate arguments
    const validation = validateMcpArgs(functionName, args);

    if (!validation.valid) {
      return mcpResponseFormatter.formatValidationError(
        validation.errors,
        functionName
      );
    }

    // Execute the function from the registry
    const result = await registry[functionName](args);

    // Format the success response
    return mcpResponseFormatter.formatSuccess(result, functionName);
  } catch (error) {
    // Format the error response
    if (error.message.includes("not found")) {
      const entityType = functionName.includes("Loan") ? "loan" : "borrower";
      const entityId =
        args.loan_id ||
        args.loanId ||
        args.borrower_id ||
        args.borrowerId ||
        "unknown";

      return mcpResponseFormatter.formatNotFound(
        entityType,
        entityId,
        functionName
      );
    }

    return mcpResponseFormatter.formatError(error, functionName, args);
  }
}
```

### OpenAI Routes (`server/routes/openai.js`)

```javascript
const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/authMiddleware");
const LogService = require("../services/logService");
const openaiService = require("../services/openaiService");
const mcpFunctionRegistry = require("../services/mcpFunctionRegistry");

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

    // Get functions from the registry - avoids duplicate declaration
    const mcpFunctions = mcpFunctionRegistry.getRegisteredFunctionsSchema();

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
      const functionName = message.function_call.name;

      try {
        const functionArgs = JSON.parse(message.function_call.arguments);
        LogService.mcp(`MCP FUNCTION CALL: ${functionName}`, functionArgs);

        // Use our enhanced MCP function registry to execute the function
        const functionResult = await mcpFunctionRegistry.executeFunction(
          functionName,
          functionArgs
        );

        // Log the function result
        LogService.mcp(`MCP FUNCTION RESULT: ${functionName}`, functionResult);

        // Create a new message with the function result
        const newMessage = {
          role: "function",
          name: functionName,
          content: JSON.stringify(functionResult),
        };

        // Call OpenAI again with the function result to get a natural language response
        const secondResponse = await openaiService.createChatCompletion({
          model: "gpt-4o",
          messages: [...messages, message, newMessage],
        });

        // Return the natural language response
        return res.json(secondResponse.choices[0].message);
      } catch (error) {
        LogService.error(
          `Error in MCP function execution: ${functionName}`,
          error
        );

        // Create an error message with standardized format
        const functionResult = {
          error: true,
          message: `Failed to execute function: ${error.message}`,
          function: functionName,
          timestamp: new Date().toISOString(),
        };

        // Create a new message with the function error
        const newMessage = {
          role: "function",
          name: functionName,
          content: JSON.stringify(functionResult),
        };

        // Call OpenAI again with the function error to get a natural language response
        const secondResponse = await openaiService.createChatCompletion({
          model: "gpt-4o",
          messages: [...messages, message, newMessage],
        });

        // Return the natural language response
        return res.json(secondResponse.choices[0].message);
      }
    } else {
      LogService.info("No function call received, returning direct response");
      return res.json(message);
    }
  } catch (error) {
    LogService.error("Error in OpenAI route", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
```

## Data Management

### Data Service (`server/services/dataService.js`)

```javascript
const fs = require("fs");
const path = require("path");
const LogService = require("./logService");

// Data paths
const dataDir = path.join(__dirname, "..", "data");
const loansPath = path.join(dataDir, "loans.json");
const borrowersPath = path.join(dataDir, "borrowers.json");
const paymentsPath = path.join(dataDir, "payments.json");
const collateralPath = path.join(dataDir, "collateral.json");

// Data loading function
const loadData = (filePath) => {
  try {
    // Ensure data file exists
    if (!fs.existsSync(filePath)) {
      LogService.warn(
        `Data file not found at ${filePath}, returning empty array`
      );
      return [];
    }

    // Read the file
    const data = fs.readFileSync(filePath, "utf8");
    if (!data || data.trim() === "") {
      LogService.warn(`Data file is empty: ${filePath}`);
      return [];
    }

    // Parse the JSON data
    return JSON.parse(data);
  } catch (error) {
    LogService.error(`Error loading data from ${filePath}:`, error);
    return [];
  }
};

module.exports = {
  loadData,
  paths: {
    loans: loansPath,
    borrowers: borrowersPath,
    payments: paymentsPath,
    collateral: collateralPath,
  },
};
```

### Sample Data (`server/data/loans.json`)

```json
[
  {
    "loan_id": "L001",
    "borrower_id": "B001",
    "loan_amount": 50000,
    "interest_rate": 3.5,
    "term_length": 60,
    "start_date": "2024-01-01",
    "end_date": "2029-01-01",
    "status": "Active",
    "loan_type": "Farm Equipment"
  },
  {
    "loan_id": "L002",
    "borrower_id": "B002",
    "loan_amount": 30000,
    "interest_rate": 4.0,
    "term_length": 36,
    "start_date": "2024-06-15",
    "end_date": "2027-06-15",
    "status": "Active",
    "loan_type": "Crop Production"
  },
  {
    "loan_id": "L003",
    "borrower_id": "B003",
    "loan_amount": 20000,
    "interest_rate": 3.0,
    "term_length": 24,
    "start_date": "2025-03-10",
    "end_date": "2027-03-10",
    "status": "Pending",
    "loan_type": "Livestock"
  },
  {
    "loan_id": "L004",
    "borrower_id": "B004",
    "loan_amount": 40000,
    "interest_rate": 3.8,
    "term_length": 48,
    "start_date": "2023-12-20",
    "end_date": "2028-12-20",
    "status": "Closed",
    "loan_type": "Farm Improvement"
  },
  {
    "loan_id": "L005",
    "borrower_id": "B005",
    "loan_amount": 25000,
    "interest_rate": 3.2,
    "term_length": 36,
    "start_date": "2024-11-05",
    "end_date": "2028-11-05",
    "status": "Active",
    "loan_type": "Operating Expenses"
  },
  {
    "loan_id": "L006",
    "borrower_id": "B006",
    "loan_amount": 35000,
    "interest_rate": 4.2,
    "term_length": 60,
    "start_date": "2025-04-20",
    "end_date": "2030-04-20",
    "status": "Pending",
    "loan_type": "Land Purchase"
  },
  {
    "loan_id": "L007",
    "borrower_id": "B007",
    "loan_amount": 15000,
    "interest_rate": 2.8,
    "term_length": 12,
    "start_date": "2024-09-10",
    "end_date": "2025-09-10",
    "status": "Active",
    "loan_type": "Agricultural Supplies"
  },
  {
    "loan_id": "L008",
    "borrower_id": "B008",
    "loan_amount": 45000,
    "interest_rate": 3.9,
    "term_length": 48,
    "start_date": "2023-08-15",
    "end_date": "2028-08-15",
    "status": "Closed",
    "loan_type": "Equipment Upgrade"
  },
  {
    "loan_id": "L009",
    "borrower_id": "B009",
    "loan_amount": 28000,
    "interest_rate": 3.6,
    "term_length": 36,
    "start_date": "2024-12-01",
    "end_date": "2028-12-01",
    "status": "Active",
    "loan_type": "Irrigation System"
  },
  {
    "loan_id": "L010",
    "borrower_id": "B010",
    "loan_amount": 32000,
    "interest_rate": 3.7,
    "term_length": 48,
    "start_date": "2025-02-28",
    "end_date": "2030-02-28",
    "status": "Pending",
    "loan_type": "Greenhouse Construction"
  }
]
```

## Issue Analysis

### What's Working: "Active Loans" Query

The "Active Loans" query works correctly because:

1. When the user asks "Give me the active loans", the OpenAI API correctly selects the `getActiveLoans` function.

2. The client-side `processFunctionCall` method properly handles this function, executing `mcpClient.getActiveLoans()` without any arguments.

3. The client's `mcpClient.getActiveLoans()` sends a request to `/api/loans/active` endpoint.

4. On the server side, the `callInternalApi` function in `mcpFunctionRegistry.js` has a specific case for `loans` + `active`:

   ```javascript
   if (segments[1] === "active") {
     const loans = dataService.loadData(dataService.paths.loans);
     return loans.filter((l) => l.status === "Active");
   }
   ```

5. This code correctly loads loan data from `loans.json` and filters for active loans.

6. The filtered list is returned to OpenAI, which generates a nice summary for the user.

### What's Not Working

#### 1. "Portfolio Summary" Query

When the user asks "Give me the portfolio summary", the flow fails because:

1. OpenAI correctly selects the `getLoanSummary` function.
2. The client-side code properly calls `mcpClient.getLoanSummary()`.
3. The request is sent to `/api/loans/summary`.
4. **ISSUE**: There is no handler for the `loans` + `summary` path in `callInternalApi`.
5. The function returns `{ error: 'Endpoint not implemented', endpoint: '/api/loans/summary' }`.
6. This causes the OpenAI function call to fail with a generic message.

#### 2. "Loan Status" Query

When the user asks for the status of loan L001, the flow fails because:

1. OpenAI correctly selects the `getLoanStatus` function with `{ loan_id: "L001" }` arguments.
2. The client-side code properly calls `mcpClient.getLoanStatus("L001")`.
3. The request is sent to `/api/loans/status/L001`.
4. **ISSUE**: There is no handler for the `loans` + `status` + `loanId` path in `callInternalApi`.
5. The function returns `{ error: 'Endpoint not implemented', endpoint: '/api/loans/status/L001' }`.
6. This causes the OpenAI function call to fail with a generic message.

## Proposed Solutions

### 1. Implement Missing Endpoints in callInternalApi

The core issue is that the `callInternalApi` function is missing implementations for two endpoints. We need to add the following code to the `loans` case in the function:

```javascript
// For loan status
if (segments[1] === "status" && segments[2]) {
  const loanId = segments[2].toUpperCase();
  const loans = dataService.loadData(dataService.paths.loans);
  const loan = loans.find((l) => l.loan_id === loanId);

  if (!loan) {
    return { error: "Loan not found", loan_id: loanId };
  }

  return { status: loan.status };
}

// For loan summary
if (segments[1] === "summary") {
  const loans = dataService.loadData(dataService.paths.loans);

  // Calculate summary statistics
  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => l.status === "Active").length;
  const pendingLoans = loans.filter((l) => l.status === "Pending").length;
  const closedLoans = loans.filter((l) => l.status === "Closed").length;
  const totalAmount = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const avgInterestRate =
    loans.length > 0
      ? loans.reduce((sum, loan) => sum + loan.interest_rate, 0) / loans.length
      : 0;

  return {
    total_loans: totalLoans,
    active_loans: activeLoans,
    pending_loans: pendingLoans,
    closed_loans: closedLoans,
    total_loan_amount: totalAmount,
    average_interest_rate: avgInterestRate,
  };
}
```

### 2. Improve Error Handling

Additionally, we should improve error handling to provide more specific error messages to the user:

1. Enhance client-side error display:

```javascript
// In client-side error handling:
if (error.response && error.response.data) {
  const errorMsg =
    error.response.data.message || error.response.data.error || error.message;
  const endpoint = error.response.data.endpoint;

  // More descriptive error messages
  if (endpoint && endpoint.includes("/summary")) {
    errorMessage = {
      text: `I'm having trouble generating a portfolio summary at the moment. Our technical team has been notified.`,
      sender: "bot",
    };
  } else if (endpoint && endpoint.includes("/status")) {
    errorMessage = {
      text: `I can't retrieve the loan status right now. Please try again later or check if the loan ID is correct.`,
      sender: "bot",
    };
  } else {
    errorMessage = {
      text: `Sorry, I encountered a problem: ${errorMsg}. Please try again later.`,
      sender: "bot",
    };
  }
}
```

2. Add more detailed logging on the server side:

```javascript
// In mcpFunctionRegistry.js
LogService.error(`Endpoint not implemented: ${endpoint}`, {
  requestPath: endpoint,
  availableEndpoints: [
    "/api/loans/active",
    "/api/loans/details/:loanId",
    "/api/loans/borrower/:borrowerId",
  ],
});
```

## Implementation Plan

1. **Fix Missing Endpoints (Priority: High)**

   - Add handlers for `loans/status/:loanId` and `loans/summary` in `callInternalApi`
   - Test each endpoint individually with manual API calls

2. **Improve Error Handling (Priority: Medium)**

   - Enhance error responses in both client and server
   - Add more contextual information to error messages

3. **Add Unit Tests (Priority: Medium)**

   - Create tests for the new endpoint implementations
   - Add tests for edge cases (missing loans, invalid IDs)

4. **Add Monitoring (Priority: Low)**
   - Add analytics tracking for successful and failed function calls
   - Create dashboard for API usage and error rates

## Conclusion

The core issue preventing the "Portfolio Summary" and "Loan Status" queries from working is the missing implementation of these endpoints in the `callInternalApi` function. By adding the missing code, we can enable these queries without changing the client-side implementation or the OpenAI integration. The data is already available in the system, but the endpoints to access it are not implemented.
