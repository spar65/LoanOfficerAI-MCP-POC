const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const LogService = require('../services/logService');
const openaiService = require('../services/openaiService');
const McpService = require('../services/mcpService');
const axios = require('axios');
const MCPServiceWithLogging = require('../services/mcpServiceWithLogging');
const mcpFunctionRegistry = require('../services/mcpFunctionRegistry');

// Helper function to call API endpoints internally
async function callInternalApi(endpoint, method = 'GET', data = null, skipAuth = false) {
  const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
  const url = `${baseUrl}${endpoint}`;
  
  try {
    LogService.info(`Internal API call to ${url}`);
    
    // Configure request with appropriate settings based on method
    const config = {
      method,
      url,
      headers: {
        'Accept': 'application/json'
      }
    };
    
    // Only add authentication headers if not skipped
    if (!skipAuth) {
      config.headers['X-Internal-Call'] = 'true'; // Marker for internal API calls
      config.headers['Authorization'] = 'Bearer SYSTEM_INTERNAL_CALL'; // Special token for internal calls
    }
    
    // Only add Content-Type and data for non-GET requests
    if (method !== 'GET' && data) {
      config.headers['Content-Type'] = 'application/json';
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (!response || !response.data) {
      LogService.warn(`Empty response from internal API call to ${url}`);
      return { error: 'Empty response from API' };
    }
    
    return response.data;
  } catch (error) {
    LogService.error(`Internal API call failed: ${error.message}`);
    if (error.response) {
      LogService.error(`Response status: ${error.response.status}`, error.response.data);
      return { 
        error: 'Internal API call failed', 
        details: error.response.data,
        status: error.response.status
      };
    }
    
    return { 
      error: 'Internal API call failed', 
      details: error.message 
    };
  }
}

// OpenAI proxy endpoint
const { validateMcpArgs } = require('../utils/validation');

// Helper function to securely call MCP functions with proper logging
async function callMCPFunction(functionName, args) {
  // Create the implementation function that calls the internal API
  const implementation = async (normalizedArgs) => {
    // This would be replaced with the actual internal API call
    // For now, we'll use the same function as before but with normalized args
    switch (functionName) {
      case 'getBorrowerDetails': {
        const { borrowerId } = normalizedArgs;
        return await callInternalApi(`/api/borrowers/${borrowerId}`);
      }
      case 'getLoanDetails': {
        const { loan_id } = normalizedArgs;
        return await callInternalApi(`/api/loans/details/${loan_id}`);
      }
      // Add other cases as needed
      default:
        throw new Error(`Unknown MCP function: ${functionName}`);
    }
  };
  
  // Execute function with enhanced logging and error handling
  return await MCPServiceWithLogging.executeFunction(
    implementation,
    functionName,
    args
  );
}

// Modified route to accept test-token for testing
router.post('/chat', authMiddleware.verifyToken, async (req, res) => {
  try {
    // Validate request body
    const { messages, functions, function_call } = req.body;
    if (!messages || !Array.isArray(messages)) {
      LogService.error('Invalid OpenAI request format: Messages array is missing or invalid');
      return res.status(400).json({ error: 'Invalid request format. Messages array is required.' });
    }
    
    // Log request details for visibility
    LogService.mcp('MCP PROTOCOL: OpenAI Chat Completion', {
      messageCount: messages.length,
      functionCount: functions ? functions.length : 0,
      functionCall: function_call || 'auto',
      user: req.user ? req.user.id : 'unknown'
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
      function_call: function_call || 'auto',
    });
    
    // Check if we got a function call
    const message = response.choices[0].message;
    if (message.function_call) {
      const functionName = message.function_call.name;
      
      // Add more detailed logging here
      console.log('\n==== OPENAI FUNCTION CALL RECEIVED ====');
      console.log('Function name:', functionName);
      console.log('Raw arguments:', message.function_call.arguments);
      console.log('=======================================\n');
      
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
          content: JSON.stringify(functionResult)
        };
        
        // Call OpenAI again with the function result to get a natural language response
        const secondResponse = await openaiService.createChatCompletion({
          model: "gpt-4o",
          messages: [...messages, message, newMessage],
        });
        
        // Return the natural language response
        return res.json(secondResponse.choices[0].message);
      } catch (error) {
        LogService.error(`Error in MCP function execution: ${functionName}`, error);
        
        // Create an error message with standardized format
        const functionResult = {
          error: true,
          message: `Failed to execute function: ${error.message}`,
          function: functionName,
          timestamp: new Date().toISOString()
        };
        
        // Create a new message with the function error
        const newMessage = {
          role: "function",
          name: functionName,
          content: JSON.stringify(functionResult)
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
      LogService.info('No function call received, returning direct response');
      return res.json(message);
    }
  } catch (error) {
    LogService.error('Error in OpenAI route', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;