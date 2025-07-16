# README-15b-MCP-CLIENT-SERVER-EXPLAINED.md

# 🔌 How MCP Works in Client & Server - Simple Explanation

## 📚 Table of Contents

1. [What is MCP Protocol?](#what-is-mcp-protocol)
2. [The Architecture](#the-architecture)
3. [Client Side MCP](#client-side-mcp)
4. [Server Side MCP](#server-side-mcp)
5. [How They Connect](#how-they-connect)
6. [Real Code Examples](#real-code-examples)

---

## 🎯 What is MCP Protocol?

**MCP = Model Context Protocol** - Think of it like a **universal remote control**:

- One remote (MCP) controls many devices (functions) 📱
- Each button (function) does something specific 🔘
- The remote knows which device to talk to 📡

In our bank:

- **Client** = The remote control (sends commands)
- **Server** = The devices (executes commands)
- **MCP** = The protocol that makes them understand each other

## 🏗️ The Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   CLIENT (React)    │         │   SERVER (Express)  │
├─────────────────────┤         ├─────────────────────┤
│                     │  HTTP   │                     │
│   Chatbot.js       │◀────────▶│   /api/openai      │
│       ↓            │         │        ↓            │
│   mcp/client.js    │         │   mcpFunctionRegistry│
│       ↓            │         │        ↓            │
│   API Calls        │         │   16 MCP Functions  │
└─────────────────────┘         └─────────────────────┘
```

## 📱 Client Side MCP

### What Lives on the Client?

```javascript
// client/src/mcp/client.js

const mcpClient = {
  baseURL: "http://localhost:3001/api",

  // The client knows how to:
  // 1. Send messages to the server
  // 2. Handle authentication
  // 3. Format requests properly
  // 4. Handle errors gracefully
};
```

### Client's Job - Send User Messages

```javascript
// client/src/components/Chatbot.js

// When user asks a question:
const handleSendMessage = async (userMessage) => {
  // Step 1: Package the message
  const requestData = {
    messages: [...previousMessages, { role: "user", content: userMessage }],
  };

  // Step 2: Send to our server (NOT directly to OpenAI!)
  const response = await fetch("/api/openai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(requestData),
  });

  // Step 3: Get AI's response
  const aiResponse = await response.json();

  // Step 4: Show to user
  displayMessage(aiResponse.message);
};
```

## 🖥️ Server Side MCP

### What Lives on the Server?

```javascript
// server/services/mcpFunctionRegistry.js

// The server has all 16 MCP functions registered:
const mcpFunctions = {
  // Loan Functions
  getLoanSummary: getLoanSummaryHandler,
  getLoanDetails: getLoanDetailsHandler,

  // Risk Functions
  calculateBorrowerRiskScore: calculateRiskHandler,
  getBorrowerNonAccrualRisk: getNonAccrualRiskHandler,

  // Analytics Functions
  predictDefaultRisk: predictDefaultHandler,
  assessCropYieldRisk: assessCropRiskHandler,
  // ... and 10 more
};
```

### Server's Job - Process with OpenAI & MCP

```javascript
// server/routes/openai.js

router.post("/chat", async (req, res) => {
  // Step 1: Get user's message
  const { messages } = req.body;

  // Step 2: Get all MCP function schemas
  const mcpFunctionSchemas = mcpFunctionRegistry.getRegisteredFunctionsSchema();

  // Step 3: Send to OpenAI with MCP functions
  const openAIResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    functions: mcpFunctionSchemas, // Tell OpenAI about our 16 functions
    function_call: "auto", // Let OpenAI decide
  });

  // Step 4: Did OpenAI want to use an MCP function?
  if (openAIResponse.choices[0].message.function_call) {
    // Yes! Execute the MCP function
    const result = await executeMCPFunction(
      openAIResponse.choices[0].message.function_call
    );

    // Send result back to OpenAI for final answer
    const finalAnswer = await getFinalAnswer(result);
    res.json({ message: finalAnswer });
  } else {
    // No function needed, return direct response
    res.json({ message: openAIResponse.choices[0].message.content });
  }
});
```

## 🔗 How They Connect

### The Complete Flow

```
1️⃣ USER TYPES QUESTION
   ↓
2️⃣ CLIENT (Chatbot.js)
   - Captures message
   - Adds to conversation
   - Sends to server
   ↓
3️⃣ CLIENT (mcp/client.js)
   - Adds auth token
   - Handles HTTP request
   - Manages errors
   ↓
4️⃣ SERVER (routes/openai.js)
   - Receives request
   - Loads MCP functions
   - Calls OpenAI
   ↓
5️⃣ OPENAI
   - Analyzes question
   - Picks MCP function
   - Returns function call
   ↓
6️⃣ SERVER (mcpFunctionRegistry)
   - Validates function
   - Executes function
   - Gets data
   ↓
7️⃣ SERVER (mcpDatabaseService)
   - Queries SQL/JSON
   - Formats response
   - Returns data
   ↓
8️⃣ SERVER → OPENAI
   - Sends data to OpenAI
   - Gets natural response
   ↓
9️⃣ SERVER → CLIENT
   - Sends final answer
   ↓
🔟 CLIENT SHOWS ANSWER
```

## 💻 Real Code Examples

### MCP Function Registration

```javascript
// server/services/mcpFunctionRegistry.js

class MCPFunctionRegistry {
  constructor() {
    this.functions = new Map();
    this.registerAllFunctions();
  }

  registerAllFunctions() {
    // Register each of the 16 functions
    this.registerFunction("getLoanSummary", {
      description: "Get basic loan information",
      parameters: {
        type: "object",
        properties: {
          loanId: {
            type: "string",
            description: "The loan ID to look up",
          },
        },
        required: ["loanId"],
      },
      handler: async (params) => {
        // This calls mcpDatabaseService
        return await mcpDatabaseService.getLoanSummary(params.loanId);
      },
    });

    // ... register other 15 functions
  }
}
```

### MCP Execution

```javascript
// server/services/mcpFunctionRegistry.js

async executeFunction(functionName, parameters) {
    // Step 1: Validate function exists
    if (!this.functions.has(functionName)) {
        throw new Error(`Unknown MCP function: ${functionName}`);
    }

    // Step 2: Get the function
    const mcpFunction = this.functions.get(functionName);

    // Step 3: Validate parameters
    const validationResult = validateParameters(
        parameters,
        mcpFunction.parameters
    );

    if (!validationResult.valid) {
        throw new Error(`Invalid parameters: ${validationResult.error}`);
    }

    // Step 4: Execute with logging
    LogService.mcp(`Executing ${functionName}`, parameters);

    try {
        const result = await mcpFunction.handler(parameters);
        LogService.mcp(`Success ${functionName}`, result);
        return result;
    } catch (error) {
        LogService.error(`MCP function failed: ${error.message}`);
        throw error;
    }
}
```

### Client Authentication

```javascript
// client/src/mcp/authService.js

const authService = {
  // Store token securely
  setToken(token) {
    localStorage.setItem("authToken", token);
  },

  // Get token for requests
  getToken() {
    return localStorage.getItem("authToken");
  },

  // Add to all MCP requests
  getAuthHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
};
```

## ❓ Common Questions

### Q: Why separate client and server?

**A:** Security and scalability!

- **Client** = What users see (can be inspected)
- **Server** = Where secrets live (API keys, database)
- **MCP** = Safe bridge between them

### Q: What if the server is down?

**A:** Built-in fallbacks:

```javascript
// Client handles server errors
try {
  const response = await mcpClient.sendMessage(message);
} catch (error) {
  if (error.status === 503) {
    showMessage("Service temporarily unavailable");
  } else {
    showMessage("Please try again");
  }
}
```

### Q: How fast is the communication?

**A:** Very fast!

- Client → Server: ~50ms
- Server → OpenAI: ~1000ms
- OpenAI → Server: ~500ms
- Server → Client: ~50ms
- **Total**: ~1.6 seconds

## 🎓 Key Takeaways

1. **Client Sends** - User messages to server
2. **Server Processes** - With OpenAI and MCP functions
3. **MCP Executes** - Specific functions to get data
4. **Server Returns** - Natural language response
5. **Client Displays** - Answer to user

## 📊 Simple Architecture Diagram

```
     [React Frontend]
            |
         HTTP/S
            |
      [Express API]
            |
    ┌───────┴───────┐
    │               │
[OpenAI API]  [MCP Functions]
                    │
             [SQL Database]
```

---

## 🚀 Next Steps

Ready for the final piece? Check out:

- [MCP Database Connection](./README-15c-MCP-DATABASE-CONNECTION-EXPLAINED.md)

Remember: Client and Server work together through MCP like a **well-rehearsed dance** - each knows their steps perfectly! 💃🕺
