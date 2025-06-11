/**
 * Test Script for Logging Implementation
 * Validates the enhanced logging functionality
 * 
 * Run with:
 * ENABLE_FILE_LOGGING=true node test-logging.js
 */

// Import required modules
const LogService = require('./server/services/logService');
const MCPServiceWithLogging = require('./server/services/mcpServiceWithLogging');
const { v4: uuidv4 } = require('uuid');

// Simulate a request context
const requestId = uuidv4();
LogService.setContext({
  requestId,
  userId: 'test-user',
  method: 'TEST',
  url: '/test-endpoint'
});

console.log('\n========== TESTING LOGGING IMPLEMENTATION ==========\n');

// Test basic logging levels
async function testBasicLogging() {
  console.log('\n--- Testing Basic Logging Levels ---\n');
  
  LogService.debug('This is a debug message', { source: 'test-logging.js' });
  LogService.info('This is an info message', { source: 'test-logging.js' });
  LogService.warn('This is a warning message', { source: 'test-logging.js' });
  LogService.error('This is an error message', { 
    source: 'test-logging.js',
    code: 'TEST_ERROR'
  });
  
  // Test MCP logging
  LogService.mcp('This is an MCP operation message', {
    operation: 'test-operation',
    params: { id: '123' }
  });
  
  console.log('\n--- Basic Logging Tests Complete ---\n');
}

// Test API request/response logging
async function testApiLogging() {
  console.log('\n--- Testing API Request/Response Logging ---\n');
  
  // Simulate API request
  LogService.apiRequest('GET', '/api/loans', {
    query: { status: 'Active' }
  });
  
  // Simulate successful response
  LogService.apiResponse('GET', '/api/loans', 200, 125, {
    resultCount: 5
  });
  
  // Simulate error response
  LogService.apiResponse('POST', '/api/loans', 400, 50, {
    error: 'Invalid input'
  });
  
  console.log('\n--- API Logging Tests Complete ---\n');
}

// Test MCP function logging
async function testMcpLogging() {
  console.log('\n--- Testing MCP Function Logging ---\n');
  
  // Simulate successful MCP function
  const mockSuccessFunction = async () => {
    return [
      { id: 'loan1', amount: 50000 },
      { id: 'loan2', amount: 25000 }
    ];
  };
  
  try {
    // Mock a successful function call
    const startTime = Date.now();
    
    // Log function start
    LogService.mcpFunction('getActiveLoans', {}, {
      timestamp: new Date().toISOString()
    });
    
    // Execute function
    const result = await mockSuccessFunction();
    const duration = Date.now() - startTime;
    
    // Log successful result
    LogService.mcpResult('getActiveLoans', result, duration, {
      success: true
    });
    
    // Test error logging
    try {
      // Simulate a failing function
      throw new Error('Test MCP function error');
    } catch (error) {
      LogService.mcpError('getBorrowerDetails', error, 75, {
        args: { borrowerId: 'B001' }
      });
    }
    
    // Test OpenAI interaction logging
    MCPServiceWithLogging.logOpenAIInteraction('function_call', {
      function: 'getActiveLoans',
      arguments: { status: 'Active' }
    });
    
    // Test authentication logging
    MCPServiceWithLogging.logAuthEvent('login', 'user123', true, {
      method: 'password'
    });
    
    // Test data access logging
    MCPServiceWithLogging.logDataAccess('loan', 'read', 'user123', true, {
      loanId: 'L001'
    });
    
  } catch (error) {
    console.error('Error in testMcpLogging:', error);
  }
  
  console.log('\n--- MCP Logging Tests Complete ---\n');
}

// Test PII redaction
async function testPiiRedaction() {
  console.log('\n--- Testing PII Redaction ---\n');
  
  // Test with sensitive data
  LogService.info('User information', {
    user: {
      id: 'user123',
      name: 'John Doe',
      password: 'secret123', // This should be redacted
      ssn: '123-45-6789',    // This should be redacted
      email: 'john@example.com',
      preferences: {
        theme: 'dark',
        apiKey: 'abc123xyz'  // This should be redacted
      }
    }
  });
  
  console.log('\n--- PII Redaction Tests Complete ---\n');
}

// Run all tests
async function runAllTests() {
  await testBasicLogging();
  await testApiLogging();
  await testMcpLogging();
  await testPiiRedaction();
  
  console.log('\n========== ALL LOGGING TESTS COMPLETED ==========\n');
  console.log('Check the logs directory for file outputs if ENABLE_FILE_LOGGING=true');
  console.log('- ./server/logs/combined.log - All logs');
  console.log('- ./server/logs/error.log - Error logs only');
  console.log('- ./server/logs/mcp.log - MCP operation logs');
  
  // Clear context when done
  LogService.clearContext();
}

// Run the tests
runAllTests(); 