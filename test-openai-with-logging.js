/**
 * Test OpenAI Integration with Enhanced Logging
 * 
 * This script tests the OpenAI integration with proper logging to help debug
 * issues with the MCP function calling flow.
 * 
 * Run with:
 * ENABLE_FILE_LOGGING=true node test-openai-with-logging.js
 */

require('dotenv').config();
const LogService = require('./server/services/logService');
const MCPServiceWithLogging = require('./server/services/mcpServiceWithLogging');
const { v4: uuidv4 } = require('uuid');

// Make sure OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable is required.');
  process.exit(1);
}

// Import OpenAI
const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test ID for this run
const TEST_ID = uuidv4().substring(0, 8);

// Set up test request context
LogService.setContext({
  requestId: `req-${TEST_ID}`,
  userId: 'test-user',
  method: 'POST',
  url: '/api/openai/chat',
  source: 'test-script'
});

// Mock MCP functions
const MCP_FUNCTIONS = [
  {
    name: "getActiveLoans",
    description: "Get a list of all active loans",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "getLoanDetails",
    description: "Get detailed information about a specific loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The unique identifier for the loan"
        }
      },
      required: ["loan_id"]
    }
  },
  {
    name: "getBorrowerNonAccrualRisk",
    description: "Assess the risk of a borrower becoming non-accrual",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The unique identifier for the borrower"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "evaluateCollateralSufficiency",
    description: "Evaluate if the collateral is sufficient for a loan",
    parameters: {
      type: "object",
      properties: {
        loanId: {
          type: "string",
          description: "The unique identifier for the loan"
        },
        marketConditions: {
          type: "string",
          description: "Current market conditions (stable, declining, improving)",
          enum: ["stable", "declining", "improving"]
        }
      },
      required: ["loanId"]
    }
  }
];

// Mock MCP function implementations
const mockMcpFunctions = {
  getActiveLoans: async () => {
    LogService.mcp("Executing getActiveLoans");
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return [
      { loan_id: "L001", borrower_id: "B001", amount: 50000, status: "Active" },
      { loan_id: "L002", borrower_id: "B002", amount: 30000, status: "Active" },
      { loan_id: "L003", borrower_id: "B003", amount: 75000, status: "Active" }
    ];
  },
  
  getLoanDetails: async ({ loan_id }) => {
    LogService.mcp(`Executing getLoanDetails for ${loan_id}`);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 75));
    
    if (loan_id === "L001") {
      return {
        loan_id: "L001",
        borrower_id: "B001",
        borrower_name: "John Doe",
        amount: 50000,
        interest_rate: 4.5,
        term: 60,
        status: "Active",
        start_date: "2023-01-15",
        maturity_date: "2028-01-15"
      };
    }
    
    throw new Error(`Loan ${loan_id} not found`);
  },
  
  getBorrowerNonAccrualRisk: async ({ borrowerId }) => {
    LogService.mcp(`Executing getBorrowerNonAccrualRisk for ${borrowerId}`);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (borrowerId === "B001") {
      return {
        borrowerId: "B001",
        name: "John Doe",
        nonAccrualRisk: "low",
        riskScore: 25,
        riskFactors: [
          "Consistent payment history",
          "Strong cash flow",
          "Diversified operations"
        ]
      };
    }
    
    throw new Error(`Borrower ${borrowerId} not found`);
  },
  
  evaluateCollateralSufficiency: async ({ loanId, marketConditions = "stable" }) => {
    LogService.mcp(`Executing evaluateCollateralSufficiency for ${loanId} under ${marketConditions} conditions`);
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 125));
    
    if (loanId === "L001") {
      return {
        loanId: "L001",
        collateralValue: 75000,
        loanBalance: 45000,
        loanToValueRatio: 0.6,
        isSufficient: true,
        marketConditions: marketConditions,
        assessment: "Collateral is sufficient with adequate margin."
      };
    }
    
    throw new Error(`Loan ${loanId} not found`);
  }
};

// Function to execute the MCP function and log it
async function executeMcpFunction(name, args) {
  const startTime = Date.now();
  
  LogService.mcpFunction(name, args);
  
  try {
    const result = await mockMcpFunctions[name](args);
    const duration = Date.now() - startTime;
    
    LogService.mcpResult(name, result, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    LogService.mcpError(name, error, duration);
    throw error;
  }
}

// Test complete OpenAI flow with function calling
async function testOpenAIWithFunctionCalling(userQuery) {
  console.log(`\n🔍 Testing OpenAI with query: "${userQuery}"`);
  LogService.info(`Processing user query: ${userQuery}`, { 
    queryId: `query-${TEST_ID}` 
  });
  
  try {
    // Step 1: Send query to OpenAI to identify function to call
    LogService.info("Sending query to OpenAI for function selection");
    const messages = [
      { role: "system", content: "You are a helpful agricultural loan assistant." },
      { role: "user", content: userQuery }
    ];
    
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      functions: MCP_FUNCTIONS,
      function_call: "auto"
    });
    
    const initialDuration = Date.now() - startTime;
    LogService.info(`OpenAI response received in ${initialDuration}ms`);
    
    const responseMessage = response.choices[0].message;
    
    // Check if OpenAI wants to call a function
    if (responseMessage.function_call) {
      const { name, arguments: argsString } = responseMessage.function_call;
      LogService.info(`OpenAI suggested function call: ${name}`);
      
      try {
        // Parse function arguments
        const args = JSON.parse(argsString);
        
        // Step 2: Execute the MCP function
        LogService.info(`Executing MCP function: ${name}`);
        const functionResult = await executeMcpFunction(name, args);
        
        // Step 3: Send function result back to OpenAI for natural language formatting
        LogService.info("Sending function result to OpenAI for formatting");
        const finalStartTime = Date.now();
        
        const conversationMessages = [
          ...messages,
          responseMessage,
          {
            role: "function",
            name: name,
            content: JSON.stringify(functionResult)
          }
        ];
        
        const finalResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: conversationMessages
        });
        
        const finalDuration = Date.now() - finalStartTime;
        LogService.info(`Final OpenAI response received in ${finalDuration}ms`);
        
        // Step 4: Return the natural language response
        const naturalLanguageResponse = finalResponse.choices[0].message.content;
        
        console.log("\n✅ NATURAL LANGUAGE RESPONSE:");
        console.log("------------------------------------------------------------");
        console.log(naturalLanguageResponse);
        console.log("------------------------------------------------------------");
        
        const totalDuration = Date.now() - startTime;
        LogService.info(`Total processing time: ${totalDuration}ms`);
        
        return {
          success: true,
          content: naturalLanguageResponse,
          functionCalled: name,
          totalDuration
        };
      } catch (functionError) {
        LogService.error(`Function execution error: ${functionError.message}`);
        
        // Handle function error by sending it back to OpenAI
        const errorMessages = [
          ...messages,
          responseMessage,
          {
            role: "function",
            name: responseMessage.function_call.name,
            content: JSON.stringify({
              error: "Function execution failed",
              message: functionError.message
            })
          }
        ];
        
        const errorResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: errorMessages
        });
        
        const errorMessage = errorResponse.choices[0].message.content;
        
        console.log("\n❌ ERROR RESPONSE:");
        console.log("------------------------------------------------------------");
        console.log(errorMessage);
        console.log("------------------------------------------------------------");
        
        return {
          success: false,
          content: errorMessage,
          error: functionError.message
        };
      }
    } else {
      // No function call, just return the direct response
      console.log("\n📝 DIRECT RESPONSE (NO FUNCTION CALL):");
      console.log("------------------------------------------------------------");
      console.log(responseMessage.content);
      console.log("------------------------------------------------------------");
      
      return {
        success: true,
        content: responseMessage.content,
        functionCalled: null
      };
    }
  } catch (error) {
    LogService.error(`OpenAI error: ${error.message}`);
    console.error(`\n❌ OpenAI ERROR: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the tests
async function runTests() {
  console.log("\n====== TESTING OPENAI INTEGRATION WITH ENHANCED LOGGING ======\n");
  
  // Test different queries
  const queries = [
    "Show me all active loans",
    "What are the details for loan L001?",
    "Is there a risk that borrower B001 will become non-accrual?",
    "Is the collateral sufficient for loan L001?",
    "Tell me about loan L999" // Should trigger an error
  ];
  
  for (const query of queries) {
    await testOpenAIWithFunctionCalling(query);
    console.log("\n"); // Add spacing between tests
  }
  
  console.log("\n====== OPENAI INTEGRATION TESTS COMPLETED ======\n");
  console.log("Check the logs for detailed information:");
  console.log("- server/logs/combined.log");
  console.log("- server/logs/mcp.log");
  
  // Clear context when done
  LogService.clearContext();
}

// Run the tests
runTests().catch(error => {
  console.error("Test runner error:", error);
  LogService.error("Test runner error", { error: error.message });
  process.exit(1);
}); 