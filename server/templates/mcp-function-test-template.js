/**
 * Template for MCP Function Test Script
 * 
 * This template follows the pattern established in .cursor/rules/502-mcp-function-debugging.mdc
 * 
 * To use this template:
 * 1. Copy this file and rename it to test-[function-name].js
 * 2. Replace placeholder values with your specific function details
 * 3. Add appropriate test data verification
 * 4. Implement appropriate test assertions
 */
require('dotenv').config();
const axios = require('axios');
const LogService = require('../services/logService');
const dataService = require('../services/dataService');

// Configuration
const FUNCTION_NAME = "functionName"; // e.g., "evaluateCollateralSufficiency"
const TEST_ENTITY_TYPE = "entityType"; // e.g., "loan", "borrower"
const TEST_ENTITY_ID = "TEST_ID"; // e.g., "L002", "B001"
const TEST_PARAMETERS = {}; // e.g., { marketConditions: "stable" }
const API_ENDPOINT = `/api/endpoint/${TEST_ENTITY_ID}`; // e.g., `/api/risk/collateral/${loanId}`
const TEST_QUERY = "Natural language query"; // e.g., "Is the collateral for loan L002 sufficient?"

// Build base URL for API calls
const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

// Step 1: Verify test data exists in data files
LogService.info(`Verifying ${TEST_ENTITY_TYPE} data`);
try {
  // Load primary entity data
  const entityData = dataService.loadData(dataService.paths[TEST_ENTITY_TYPE + 's']);
  LogService.info(`Found ${entityData.length} ${TEST_ENTITY_TYPE}s`);
  
  // Look for test entity
  const testEntity = entityData.find(e => e[`${TEST_ENTITY_TYPE}_id`] === TEST_ENTITY_ID);
  if (testEntity) {
    LogService.info(`${TEST_ENTITY_TYPE} ${TEST_ENTITY_ID} found:`, testEntity);
  } else {
    LogService.error(`${TEST_ENTITY_TYPE} ${TEST_ENTITY_ID} not found in data!`);
  }
  
  // Load related data (customize this based on your entity relationships)
  const RELATED_DATA_TYPE = "relatedType"; // e.g., "collateral", "payments" 
  const relatedData = dataService.loadData(dataService.paths[RELATED_DATA_TYPE]);
  LogService.info(`Found ${relatedData.length} ${RELATED_DATA_TYPE} items`);
  
  // Look for related items
  const relatedItems = relatedData.filter(item => item[`${TEST_ENTITY_TYPE}_id`] === TEST_ENTITY_ID);
  if (relatedItems.length > 0) {
    LogService.info(`Found ${relatedItems.length} ${RELATED_DATA_TYPE} items for ${TEST_ENTITY_TYPE} ${TEST_ENTITY_ID}:`, relatedItems);
  } else {
    LogService.warn(`No ${RELATED_DATA_TYPE} found for ${TEST_ENTITY_TYPE} ${TEST_ENTITY_ID}`);
  }
} catch (error) {
  LogService.error(`Error verifying data:`, {
    message: error.message,
    stack: error.stack
  });
}

// Main test function
async function testMcpFunction() {
  LogService.info(`Starting ${FUNCTION_NAME} test for ${TEST_ENTITY_TYPE} ${TEST_ENTITY_ID}...`);
  
  try {
    // Step 2: Test direct API endpoint
    LogService.info(`Step 1: Testing ${API_ENDPOINT}`);
    try {
      // Format query parameters if needed
      const queryParams = new URLSearchParams();
      Object.entries(TEST_PARAMETERS).forEach(([key, value]) => {
        queryParams.append(key, value);
      });
      
      const paramString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      const directResponse = await axios.get(`${BASE_URL}${API_ENDPOINT}${paramString}`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      LogService.info(`Direct API response:`, directResponse.data);
      
      // Add assertions about the direct response here
      // Example: assert(directResponse.data.propertyName === expectedValue);
    } catch (directError) {
      LogService.error(`Failed to retrieve data from direct API:`, {
        message: directError.message,
        status: directError.response?.status,
        data: directError.response?.data
      });
    }
    
    // Step 3: Test via OpenAI endpoint with function calling
    LogService.info(`Step 2: Testing OpenAI endpoint with function calling`);
    try {
      const openaiResponse = await axios.post(`${BASE_URL}/api/openai/chat`, {
        messages: [{ 
          role: 'user', 
          content: TEST_QUERY
        }],
        function_call: 'auto'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      LogService.info(`OpenAI response:`, openaiResponse.data);
      
      // Add assertions about the OpenAI response here
      // Example: assert(openaiResponse.data.content.includes("expected text"));
    } catch (openaiError) {
      LogService.error(`Failed to get OpenAI response:`, {
        message: openaiError.message,
        status: openaiError.response?.status,
        data: openaiError.response?.data
      });
    }
    
    LogService.info(`${FUNCTION_NAME} test completed`);
  } catch (error) {
    LogService.error(`Test failed with error:`, {
      message: error.message,
      stack: error.stack
    });
  }
}

// Only run if server is already running
axios.get(`${BASE_URL}/api/health`)
  .then(() => {
    LogService.info(`Server is running at ${BASE_URL}`);
    testMcpFunction();
  })
  .catch((error) => {
    LogService.error(`Server is not running at ${BASE_URL}. Start the server first.`, {
      message: error.message
    });
  }); 