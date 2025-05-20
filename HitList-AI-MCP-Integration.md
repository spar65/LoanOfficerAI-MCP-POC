# HitList: ChatGPT Integration with MCP Loan Officer Application

## Phase 1: Setup OpenAI API Access

- [ ] 1.1 Create OpenAI API account and generate an API key
- [ ] 1.2 Install OpenAI SDK in the client application
      `bash
    cd loan-chatbot-poc/client-new
    npm install openai
    `
- [ ] 1.3 Set up secure environment variables for API key storage

## Phase 2: Modify the Chatbot Component

- [ ] 2.1 Replace rule-based parsing with ChatGPT API calls
- [ ] 2.2 Implement function calling to maintain MCP client integration
- [ ] 2.3 Update handleSend function to maintain conversation history
- [ ] 2.4 Add loading states and error handling for API calls

## Phase 3: Security and Backend Integration

- [ ] 3.1 Create a proxy server endpoint to secure the OpenAI API key
- [ ] 3.2 Update Chatbot client to use the proxy server endpoint
- [ ] 3.3 Add authentication to secure API endpoints
- [ ] 3.4 Implement rate limiting to manage API usage

## Phase 4: Enhance MCP Integration

- [ ] 4.1 Create an MCP context provider endpoint to supply metadata to ChatGPT
- [ ] 4.2 Update the Chatbot to fetch and include this context in prompts
- [ ] 4.3 Define specific function schemas for each MCP endpoint
- [ ] 4.4 Optimize system messages for loan officer domain expertise

## Phase 5: Testing and Refinement

- [ ] 5.1 Test the chatbot with various loan queries
- [ ] 5.2 Refine system messages based on test results
- [ ] 5.3 Add more specific function definitions as needed
- [ ] 5.4 Implement caching for common queries

## Phase 6: Production Optimization

- [ ] 6.1 Implement streaming responses for a more responsive UI
- [ ] 6.2 Add fallback mechanisms for API failures
- [ ] 6.3 Create a feedback mechanism to improve AI responses
- [ ] 6.4 Consider fine-tuning a custom model for loan domain

## Technical Implementation Notes

### OpenAI Integration Code Example

```javascript
import { OpenAI } from "openai";

// Initialize OpenAI client (in production, use server-side proxy)
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Only for development
});

// ChatGPT API call function
const getChatGPTResponse = async (message, conversationHistory) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a loan officer assistant. You help users find information about loans using the MCP API.",
        },
        ...conversationHistory,
        { role: "user", content: message },
      ],
      functions: [
        {
          name: "getLoanStatus",
          description: "Get the status of a loan by ID",
          parameters: {
            type: "object",
            properties: {
              loanId: {
                type: "string",
                description: "The ID of the loan",
              },
            },
            required: ["loanId"],
          },
        },
        // Additional function definitions...
      ],
      function_call: "auto",
    });

    // Process function calls from ChatGPT
    const responseMessage = response.choices[0].message;
    if (responseMessage.function_call) {
      // Execute MCP client functions based on ChatGPT's request
      // ...
    }

    return responseMessage.content;
  } catch (error) {
    console.error("Error calling ChatGPT API:", error);
    return "Sorry, I encountered an error when processing your request.";
  }
};
```

### Server-Side Proxy Example

```javascript
// In server.js
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, functions } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      functions,
      function_call: "auto",
    });

    res.json(response.choices[0].message);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Error processing your request" });
  }
});
```

### MCP Context Provider Example

```javascript
// In server.js
app.get("/api/context", (req, res) => {
  // Gather useful metadata about the loans
  const context = {
    loanCount: loans.length,
    availableLoanIds: loans.map((loan) => loan.id),
    borrowers: [...new Set(loans.map((loan) => loan.borrower))],
    statusTypes: [...new Set(loans.map((loan) => loan.status))],
  };

  res.json(context);
});
```
