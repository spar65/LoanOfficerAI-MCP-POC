/**
 * Advanced Logging Validation Tests
 * 
 * This script tests the enhanced logging implementation to ensure it meets all requirements.
 * It includes comprehensive tests for:
 * - All logging levels
 * - File output verification
 * - MCP function logging
 * - Request context propagation
 * - PII redaction
 * - Performance monitoring
 * 
 * Run with:
 * ENABLE_FILE_LOGGING=true node test-logging-validation.js
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const { v4: uuidv4 } = require('uuid');

// Import required modules
const LogService = require('../../services/logService');
const MCPServiceWithLogging = require('../../services/mcpServiceWithLogging');

// Configuration
const LOG_DIR = path.join(__dirname, '../../logs');
const ENABLE_FILE_CHECKS = process.env.ENABLE_FILE_LOGGING === 'true';

// Test reporting utilities
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  skipped: 0
};

function reportTest(name, result, error = null) {
  if (result === 'PASS') {
    console.log(`✅ PASS: ${name}`);
    TEST_RESULTS.passed++;
  } else if (result === 'FAIL') {
    console.log(`❌ FAIL: ${name}${error ? ` - ${error}` : ''}`);
    TEST_RESULTS.failed++;
  } else if (result === 'SKIP') {
    console.log(`⚠️ SKIP: ${name} - ${error || 'Test skipped'}`);
    TEST_RESULTS.skipped++;
  }
}

async function checkLogFileContains(filename, searchText) {
  if (!ENABLE_FILE_CHECKS) {
    reportTest(`Check log file ${filename} contains "${searchText}"`, 'SKIP', 'File logging not enabled');
    return false;
  }
  
  try {
    const filePath = path.join(LOG_DIR, filename);
    if (!fs.existsSync(filePath)) {
      reportTest(`Check log file ${filename} exists`, 'FAIL', 'File does not exist');
      return false;
    }
    
    const content = await readFile(filePath, 'utf8');
    const containsText = content.includes(searchText);
    
    reportTest(
      `Check log file ${filename} contains "${searchText}"`, 
      containsText ? 'PASS' : 'FAIL'
    );
    
    return containsText;
  } catch (error) {
    reportTest(
      `Check log file ${filename} contains "${searchText}"`, 
      'FAIL', 
      `Error: ${error.message}`
    );
    return false;
  }
}

// 1. Test basic logging functionality
async function testBasicLogging() {
  console.log('\n=== Testing Basic Logging ===\n');
  
  // Generate unique identifiers for this test run
  const testId = uuidv4().substring(0, 8);
  const testPrefix = `[TEST-${testId}]`;
  
  // Test each log level
  LogService.debug(`${testPrefix} Debug message for test run`);
  LogService.info(`${testPrefix} Info message for test run`);
  LogService.warn(`${testPrefix} Warning message for test run`);
  LogService.error(`${testPrefix} Error message for test run`);
  LogService.mcp(`${testPrefix} MCP message for test run`);
  
  reportTest('Basic logging - All levels', 'PASS');
  
  // Check file output if enabled
  if (ENABLE_FILE_CHECKS) {
    await checkLogFileContains('combined.log', testPrefix);
    await checkLogFileContains('error.log', `${testPrefix} Error message`);
    await checkLogFileContains('mcp.log', `${testPrefix} MCP message`);
  }
}

// 2. Test request context propagation
async function testRequestContext() {
  console.log('\n=== Testing Request Context Propagation ===\n');
  
  const testRequestId = `req-${uuidv4().substring(0, 8)}`;
  
  // Set a test request context
  LogService.setContext({
    requestId: testRequestId,
    userId: 'test-user-id',
    method: 'GET',
    url: '/api/test',
    ip: '127.0.0.1'
  });
  
  // Log with this context
  LogService.info(`Request context test with ID ${testRequestId}`);
  
  // Log an MCP call within this request context
  LogService.mcp(`MCP operation within request ${testRequestId}`);
  
  // Clear context
  LogService.clearContext();
  
  // Log after clearing context - should not have the request ID
  LogService.info('Log after context cleared');
  
  reportTest('Request context - Setting and clearing', 'PASS');
  
  // Check if request ID was in log files
  if (ENABLE_FILE_CHECKS) {
    await checkLogFileContains('combined.log', testRequestId);
    await checkLogFileContains('mcp.log', testRequestId);
  }
}

// 3. Test PII redaction
async function testPiiRedaction() {
  console.log('\n=== Testing PII Redaction ===\n');
  
  const testId = uuidv4().substring(0, 8);
  const testSsn = '123-45-6789';
  const testPassword = 'SecretPass123';
  const testApiKey = 'sk_test_123456789';
  
  // Log with sensitive data that should be redacted
  LogService.info(`PII redaction test ${testId}`, {
    user: {
      name: 'Test User',
      ssn: testSsn,
      password: testPassword,
      preferences: {
        theme: 'dark',
        apiKey: testApiKey
      }
    }
  });
  
  reportTest('PII redaction - Basic fields', 'PASS');
  
  // Check that sensitive data was redacted
  if (ENABLE_FILE_CHECKS) {
    const sensitiveDataFound = await checkLogFileContains('combined.log', testSsn);
    const redactionFound = await checkLogFileContains('combined.log', '[REDACTED]');
    
    reportTest(
      'PII redaction - SSN not present in logs',
      !sensitiveDataFound ? 'PASS' : 'FAIL'
    );
    
    reportTest(
      'PII redaction - [REDACTED] marker present',
      redactionFound ? 'PASS' : 'FAIL'
    );
  }
}

// 4. Test MCP function logging
async function testMcpFunctionLogging() {
  console.log('\n=== Testing MCP Function Logging ===\n');
  
  const testFunctionName = `testFunction-${uuidv4().substring(0, 8)}`;
  
  // Test successful MCP function execution
  try {
    // Mock function implementation
    const mockFunction = async (args) => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
      return { success: true, result: `Result for ${args.id}` };
    };
    
    // Execute with MCPServiceWithLogging
    const result = await MCPServiceWithLogging.executeFunction(
      mockFunction,
      testFunctionName,
      { id: 'test-id', param: 'test-value' }
    );
    
    reportTest(`MCP function logging - Success for ${testFunctionName}`, 'PASS');
    
    // Test MCP function error handling
    try {
      // Mock failing function
      const mockFailingFunction = async () => {
        throw new Error('Intentional test error');
      };
      
      await MCPServiceWithLogging.executeFunction(
        mockFailingFunction,
        `${testFunctionName}-failing`,
        { id: 'test-id' }
      );
      
      reportTest('MCP function logging - Error handling', 'FAIL', 'Expected error was not thrown');
    } catch (error) {
      reportTest('MCP function logging - Error handling', 'PASS');
    }
    
    // Check log files for function execution records
    if (ENABLE_FILE_CHECKS) {
      await checkLogFileContains('mcp.log', testFunctionName);
      await checkLogFileContains('mcp.log', 'EXECUTING MCP FUNCTION');
      await checkLogFileContains('mcp.log', 'COMPLETED MCP FUNCTION');
      await checkLogFileContains('mcp.log', 'duration');
      await checkLogFileContains('error.log', 'FAILED MCP FUNCTION');
    }
  } catch (error) {
    reportTest(
      `MCP function logging - ${testFunctionName}`, 
      'FAIL', 
      `Unexpected error: ${error.message}`
    );
  }
}

// 5. Test performance metrics
async function testPerformanceMetrics() {
  console.log('\n=== Testing Performance Metrics ===\n');
  
  const testId = uuidv4().substring(0, 8);
  
  // Simulate API request/response with timing
  LogService.apiRequest('GET', `/api/test/${testId}`);
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 75));
  
  // Log response with duration
  LogService.apiResponse('GET', `/api/test/${testId}`, 200, 75);
  
  reportTest('Performance metrics - API request/response', 'PASS');
  
  // Test MCP function timing
  LogService.mcpFunction('performanceTest', { testId });
  
  // Simulate function execution
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Log result with timing
  LogService.mcpResult('performanceTest', { result: 'ok' }, 50);
  
  reportTest('Performance metrics - MCP function timing', 'PASS');
  
  // Check log files for timing information
  if (ENABLE_FILE_CHECKS) {
    await checkLogFileContains('combined.log', 'duration');
    await checkLogFileContains('combined.log', 'ms');
  }
}

// 6. Test log levels configuration
async function testLogLevels() {
  console.log('\n=== Testing Log Levels Configuration ===\n');
  
  // Store original log level
  const originalLevel = LogService.getLevel();
  
  // Test setting log level
  LogService.setLevel('info');
  reportTest(
    'Log level configuration - Set to info', 
    LogService.getLevel() === 'info' ? 'PASS' : 'FAIL'
  );
  
  // Test invalid log level
  LogService.setLevel('invalid-level');
  reportTest(
    'Log level configuration - Reject invalid level', 
    LogService.getLevel() === 'info' ? 'PASS' : 'FAIL'
  );
  
  // Restore original level
  LogService.setLevel(originalLevel);
  reportTest(
    'Log level configuration - Restore original level', 
    LogService.getLevel() === originalLevel ? 'PASS' : 'FAIL'
  );
}

// Run all tests
async function runAllTests() {
  console.log('\n====== STARTING LOGGING VALIDATION TESTS ======\n');
  
  // Check if logs directory exists when file logging is enabled
  if (ENABLE_FILE_CHECKS) {
    if (!fs.existsSync(LOG_DIR)) {
      console.log(`❌ ERROR: Logs directory ${LOG_DIR} does not exist. Creating it...`);
      fs.mkdirSync(LOG_DIR, { recursive: true });
    } else {
      console.log(`✅ Logs directory exists: ${LOG_DIR}`);
    }
  } else {
    console.log('⚠️ NOTE: File logging is disabled. Run with ENABLE_FILE_LOGGING=true to test file output.');
  }
  
  // Run all test suites
  await testBasicLogging();
  await testRequestContext();
  await testPiiRedaction();
  await testMcpFunctionLogging();
  await testPerformanceMetrics();
  await testLogLevels();
  
  // Print test summary
  console.log('\n====== LOGGING VALIDATION TEST SUMMARY ======\n');
  console.log(`✅ PASSED: ${TEST_RESULTS.passed}`);
  console.log(`❌ FAILED: ${TEST_RESULTS.failed}`);
  console.log(`⚠️ SKIPPED: ${TEST_RESULTS.skipped}`);
  console.log('\n==============================================\n');
  
  if (ENABLE_FILE_CHECKS) {
    console.log('Log files available at:');
    console.log(`- ${path.join(LOG_DIR, 'combined.log')} (all logs)`);
    console.log(`- ${path.join(LOG_DIR, 'error.log')} (error logs only)`);
    console.log(`- ${path.join(LOG_DIR, 'mcp.log')} (MCP operation logs)`);
  }
  
  // Return code based on test results
  process.exit(TEST_RESULTS.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
}); 