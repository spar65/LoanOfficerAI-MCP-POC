/**
 * Test script for enhanced MCP logging
 * Run with: node test-logging.js
 */
require('dotenv').config();
const LogService = require('../../services/logService');
const McpService = require('../../services/mcpService');
const OpenAIService = require('../../services/openaiService');

// Simulate MCP operations
async function runDemo() {
  console.log("\n\n");
  LogService.info("STARTING MCP LOGGING DEMO");
  console.log("\n");

  // Simulate a basic log for each level
  LogService.debug("This is a debug message");
  LogService.info("This is an info message");
  LogService.warn("This is a warning message");
  LogService.error("This is an error message");
  
  console.log("\n");
  LogService.info("=== MCP FUNCTION CALL EXAMPLES ===");
  
  // Simulate an MCP function call
  LogService.mcp("MCP CALL: getLoanDetails", {
    loanId: "L123456",
    tenant: "farm-credit-1"
  });
  
  // Simulate MCP result
  LogService.mcp("MCP RESULT: getLoanDetails", {
    loan: {
      loanId: "L123456",
      borrower: "John Doe",
      amount: 250000,
      interestRate: 4.25,
      term: 60
    },
    duration: "45ms"
  });
  
  console.log("\n");
  LogService.info("=== MCP SERVICE WRAPPER EXAMPLE ===");
  
  // Simulate using the McpService wrapper
  const mcpFunction = async (id) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    return { borrowerId: id, name: "Jane Smith", creditScore: 720 };
  };
  
  try {
    const result = await McpService.call(mcpFunction, "getBorrowerDetails", "B789012");
    console.log("Function result:", result);
  } catch (err) {
    console.error("Function error:", err);
  }
  
  console.log("\n");
  LogService.info("=== MCP OPENAI INTEGRATION EXAMPLE ===");
  
  // Simulate OpenAI function calls - this will require an API key
  if (process.env.OPENAI_API_KEY) {
    try {
      const mockFunctions = [
        {
          name: "getLoanDetails",
          description: "Get details about a specific loan",
          parameters: {
            type: "object",
            properties: {
              loanId: {
                type: "string",
                description: "The unique ID of the loan"
              }
            },
            required: ["loanId"]
          }
        }
      ];
      
      const mockMessages = [
        { role: "system", content: "You are a helpful loan assistant." },
        { role: "user", content: "Can you get me information about loan L123456?" }
      ];
      
      const response = await OpenAIService.createChatCompletion({
        model: "gpt-4o",
        messages: mockMessages,
        functions: mockFunctions,
        function_call: "auto"
      });
      
      console.log("\nOpenAI Response:");
      console.log(JSON.stringify(response.choices[0].message, null, 2));
    } catch (err) {
      LogService.error("OpenAI API Error", { error: err.message });
    }
  } else {
    LogService.warn("Skipping OpenAI test - No API key set");
  }
  
  console.log("\n");
  LogService.info("MCP LOGGING DEMO COMPLETED");
  console.log("\n\n");
}

// Run the demo
runDemo().catch(err => {
  LogService.error("Demo error", { error: err.message, stack: err.stack });
}); 