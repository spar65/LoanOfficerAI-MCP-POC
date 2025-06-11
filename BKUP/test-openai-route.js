/**
 * Test Script for OpenAI Route with Enhanced Logging
 * Validates the OpenAI route with function calling and logging
 * 
 * Run with:
 * ENABLE_FILE_LOGGING=true node test-openai-route.js
 */

// Import required modules
const axios = require('axios');
const LogService = require('./server/services/logService');
const MCPServiceWithLogging = require('./server/services/mcpServiceWithLogging');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlciIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJyb2xlIjoidGVzdGVyIiwidGVuYW50SWQiOiJ0ZXN0LXRlbmFudCIsImlhdCI6MTc0OTUwMTE0NSwiZXhwIjoxNzQ5NTA0NzQ1fQ.v5R0ouqHtAsuvwav7iaeNniS49m65DK8s9XbBvd0wGM';

// Test queries to use
const TEST_QUERIES = [
  "Show me all active loans",
  "What are the details for loan L001?",
  "Who is borrower B001?",
  "Show me all borrowers with loans over $30,000"
];

// Log that tests are starting
console.log('\n========== TESTING OPENAI ROUTE WITH ENHANCED LOGGING ==========\n');
LogService.info('Starting OpenAI route tests', { 
  source: 'test-openai-route.js',
  queries: TEST_QUERIES
});

// Make a request to the OpenAI chat endpoint
async function testOpenAIRoute(query) {
  LogService.info(`Testing OpenAI route with query: "${query}"`, {
    source: 'test-openai-route.js',
    endpoint: '/api/openai/chat'
  });
  
  try {
    const startTime = Date.now();
    
    // Call the endpoint
    const response = await axios.post(`${BASE_URL}/api/openai/chat`, {
      messages: [
        { role: 'user', content: query }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    const duration = Date.now() - startTime;
    
    // Log response details
    LogService.info(`OpenAI route response received in ${duration}ms`, {
      source: 'test-openai-route.js',
      query,
      statusCode: response.status,
      duration,
      responseType: typeof response.data,
      isJSON: typeof response.data === 'object',
      hasChoices: response.data && Array.isArray(response.data.choices),
      contentLength: JSON.stringify(response.data).length
    });
    
    // Check if we got raw JSON or natural language
    const isRawJSON = isLikelyRawJSON(response.data);
    if (isRawJSON) {
      LogService.warn(`Response appears to be raw JSON for query: "${query}"`, {
        source: 'test-openai-route.js',
        responsePreview: truncateJSON(response.data)
      });
    } else {
      LogService.info(`Response appears to be natural language for query: "${query}"`, {
        source: 'test-openai-route.js',
        contentPreview: typeof response.data.content === 'string' 
          ? response.data.content.substring(0, 100) + '...'
          : 'N/A'
      });
    }
    
    return {
      success: true,
      data: response.data,
      isRawJSON,
      duration
    };
    
  } catch (error) {
    LogService.error(`Error testing OpenAI route with query: "${query}"`, {
      source: 'test-openai-route.js',
      error: error.message,
      response: error.response ? {
        status: error.response.status,
        data: truncateJSON(error.response.data)
      } : 'No response'
    });
    
    return {
      success: false,
      error: error.message,
      response: error.response ? error.response.data : null
    };
  }
}

// Helper function to determine if a response is likely raw JSON vs natural language
function isLikelyRawJSON(response) {
  // If it's an array, it's definitely raw JSON
  if (Array.isArray(response)) return true;
  
  // If it has keys like "loan_id", "borrower_id", it's likely raw data
  if (typeof response === 'object' && response !== null) {
    const jsonString = JSON.stringify(response);
    const dataKeys = ['loan_id', 'borrower_id', 'loan_amount', 'status'];
    
    // Check for data structure keys
    for (const key of dataKeys) {
      if (jsonString.includes(`"${key}":`)) return true;
    }
    
    // Check for OpenAI structure
    if (response.choices && Array.isArray(response.choices)) {
      if (response.choices[0].message && response.choices[0].message.content) {
        // This is likely a proper OpenAI response
        return false;
      }
    }
  }
  
  return false;
}

// Truncate long JSON for logging
function truncateJSON(obj, maxLength = 500) {
  const str = JSON.stringify(obj);
  if (str.length <= maxLength) return obj;
  return JSON.parse(str.substring(0, maxLength) + '..."');
}

// Run tests for all queries
async function runAllTests() {
  const results = [];
  
  for (const query of TEST_QUERIES) {
    console.log(`\n----- Testing query: "${query}" -----\n`);
    const result = await testOpenAIRoute(query);
    results.push({ query, ...result });
  }
  
  // Log summary
  console.log('\n========== TEST RESULTS SUMMARY ==========\n');
  
  for (const result of results) {
    console.log(`Query: "${result.query}"`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Raw JSON: ${result.isRawJSON}`);
    if (result.duration) console.log(`  Duration: ${result.duration}ms`);
    console.log('  --------------------------');
  }
  
  // Count raw JSON vs natural language
  const rawJSONCount = results.filter(r => r.success && r.isRawJSON).length;
  const naturalLanguageCount = results.filter(r => r.success && !r.isRawJSON).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`\nSummary:`);
  console.log(`  Total Queries: ${TEST_QUERIES.length}`);
  console.log(`  Raw JSON Responses: ${rawJSONCount}`);
  console.log(`  Natural Language Responses: ${naturalLanguageCount}`);
  console.log(`  Failed Requests: ${failureCount}`);
  
  LogService.info('OpenAI route tests completed', {
    source: 'test-openai-route.js',
    totalQueries: TEST_QUERIES.length,
    rawJSONCount,
    naturalLanguageCount,
    failureCount
  });
  
  console.log('\n========== TEST COMPLETE ==========\n');
  console.log('Check the logs directory for detailed logs:');
  console.log('- ./server/logs/combined.log - All logs');
  console.log('- ./server/logs/mcp.log - MCP operation logs');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test execution error:', error);
  LogService.error('Failed to run OpenAI route tests', {
    source: 'test-openai-route.js',
    error: error.message,
    stack: error.stack
  });
}); 