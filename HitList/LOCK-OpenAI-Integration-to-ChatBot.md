# OpenAI Integration with LoanOfficerAI Chatbot

This document serves as a complete reference for the OpenAI integration in the LoanOfficerAI project. **DO NOT MODIFY** this integration without careful review and approval, as it's a critical part of the application's functionality.

## Architecture Overview

The integration follows a secure pattern where:

1. Client (React frontend) makes requests to a secure server-side proxy
2. Server proxies requests to OpenAI API, keeping API keys secure
3. Server processes any function calls from OpenAI and executes them against internal APIs
4. Results are returned to the client for display

## Server-Side Components

### 1. OpenAI Service (`server/services/openaiService.js`)

```javascript
/**
 * OpenAI Service
 * Provides enhanced logging and metrics for OpenAI API calls
 */
const { OpenAI } = require("openai");
const LogService = require("./logService");

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      LogService.error("OPENAI_API_KEY environment variable is not set");
      throw new Error("OpenAI API key is not configured");
    }

    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    LogService.info("OpenAI client initialized");
  }

  /**
   * Process a chat completion request with enhanced MCP logging
   * @param {Object} options - OpenAI chat completion options
   * @returns {Promise<Object>} - OpenAI response
   */
  async createChatCompletion(options) {
    const startTime = Date.now();
    const model = options.model || "gpt-4o";
    const messages = options.messages || [];
    const functions = options.functions || [];

    LogService.mcp("MCP OPENAI REQUEST", {
      model,
      messageCount: messages.length,
      functionCount: functions.length,
      systemMessage:
        messages.find((m) => m.role === "system")?.content?.substring(0, 100) +
        "...",
    });

    try {
      // Make request to OpenAI
      const response = await this.client.chat.completions.create({
        model,
        ...options,
      });

      // Calculate duration
      const duration = Date.now() - startTime;

      // Check for function call in response
      const message = response.choices[0].message;
      const functionCall = message.function_call;

      if (functionCall) {
        LogService.mcp(`MCP FUNCTION SELECTION: ${functionCall.name}`, {
          function: functionCall.name,
          arguments: functionCall.arguments,
          duration: `${duration}ms`,
          tokensUsed: response.usage?.total_tokens,
        });
      } else {
        LogService.mcp(`MCP OPENAI RESPONSE (${duration}ms)`, {
          tokensUsed: response.usage?.total_tokens || "unknown",
          responseType: functionCall ? "function_call" : "message",
          contentLength: message.content?.length || 0,
          duration: `${duration}ms`,
        });
      }

      return response;
    } catch (error) {
      // Calculate duration even for errors
      const duration = Date.now() - startTime;

      LogService.error(`MCP OPENAI ERROR (${duration}ms)`, {
        error: error.message,
        duration: `${duration}ms`,
        request: {
          model,
          messageCount: messages.length,
          functionCount: functions.length,
        },
      });

      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new OpenAIService();
```

### 2. OpenAI Routes (`server/routes/openai.js`)

The OpenAI routes provide a secure API endpoint for the client to make chat completion requests:

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

### 3. MCP Function Registry (`server/services/mcpFunctionRegistry.js`)

The MCP Function Registry provides a centralized way to declare and execute functions that the AI can call:

```javascript
/**
 * Get all registered function schemas for OpenAI function calling
 * @returns {Array<object>} - Array of function schemas in OpenAI format
 */
function getRegisteredFunctionsSchema() {
  return Object.values(functionSchemas);
}

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

## Client-Side Components

### 1. Chatbot Component (`client/src/components/Chatbot.js`)

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
  // Additional function definitions...
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

## Configuration and Environment Setup

The OpenAI integration requires the following environment variables:

```
OPENAI_API_KEY=your_api_key_here
```

This should be set in a `.env` file in the server directory or as an environment variable when running the server.

## Security Considerations

1. **API Key Protection**: The API key is never exposed to the client; all requests go through the server
2. **Authentication**: All requests to the OpenAI proxy endpoint require valid authentication (JWT tokens)
3. **Rate Limiting**: The server includes proper error handling and logging for API rate limits
4. **Input Validation**: Both server and client validate inputs before processing

## Testing

The OpenAI integration can be tested using:

```bash
# Test OpenAI authentication and API key
node server/test-openai-auth.js
```

## Function Calling Flow

1. **Client**: Sends user message and MCP function definitions to server
2. **Server**: Forwards request to OpenAI with merged function definitions
3. **OpenAI**: Returns a response, potentially with a function_call
4. **Server**: If function_call is present, executes it against internal APIs
5. **Server**: Makes a second request to OpenAI with function result
6. **Server**: Returns final natural language response to client
7. **Client**: Displays response to user

## DO NOT CHANGE WITHOUT APPROVAL

This integration is a critical part of the LoanOfficerAI application. Changes to this integration should be thoroughly tested and approved by the technical lead before deployment.
