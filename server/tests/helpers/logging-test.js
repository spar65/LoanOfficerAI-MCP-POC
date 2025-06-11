/**
 * Logging Test Script
 * 
 * This script tests the logging functionality, focusing on:
 * 1. PII redaction in logs
 * 2. Request context propagation
 * 3. Error logging format
 * 4. Log level filtering
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Constants
const API_URL = 'http://localhost:3001';
const TEST_TOKEN = 'test-token';
const LOG_FILE = path.join(__dirname, '../../logs/app.log');

// Helper to make API calls
async function callAPI(endpoint, data, headers = {}) {
  try {
    const response = await axios({
      method: 'POST',
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...headers
      },
      data
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      details: error.response?.data
    };
  }
}

// Helper to read the last N lines of a file
function readLastLines(filePath, lineCount) {
  try {
    if (!fs.existsSync(filePath)) {
      return { error: `Log file not found: ${filePath}` };
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    
    return lines.slice(-lineCount);
  } catch (error) {
    return { error: `Error reading log file: ${error.message}` };
  }
}

// Check if logs contain certain strings
function logsContain(logs, searchStrings, requireAll = true) {
  if (!Array.isArray(logs)) {
    return false;
  }
  
  const logsText = logs.join('\n');
  
  if (requireAll) {
    return searchStrings.every(s => logsText.includes(s));
  } else {
    return searchStrings.some(s => logsText.includes(s));
  }
}

// Check if logs DON'T contain certain strings
function logsDontContain(logs, searchStrings) {
  if (!Array.isArray(logs)) {
    return false;
  }
  
  const logsText = logs.join('\n');
  
  return searchStrings.every(s => !logsText.includes(s));
}

// Test cases
const testCases = [
  {
    name: 'PII Redaction Test',
    action: async () => {
      // Create a message that would trigger PII in response
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Get personal details for borrower B001 including phone number and email' }
        ]
      });
      
      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Read the last 50 lines of logs
      const logs = readLastLines(LOG_FILE, 50);
      
      // Check for redacted content in logs
      const containsPII = logsContain(logs, ['555-1234', 'john@example.com'], false);
      const containsRedacted = logsContain(logs, ['[REDACTED]']);
      
      return {
        success: !containsPII && containsRedacted,
        logs,
        details: {
          containsPII,
          containsRedacted
        }
      };
    }
  },
  {
    name: 'Request Context Propagation Test',
    action: async () => {
      // Create a unique request ID
      const requestId = `test-${Date.now()}`;
      
      // Make API call with custom request ID
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ]
      }, {
        'X-Request-ID': requestId
      });
      
      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Read the last 30 lines of logs
      const logs = readLastLines(LOG_FILE, 30);
      
      // Check if the request ID propagated through the logs
      const containsRequestId = logsContain(logs, [requestId]);
      
      return {
        success: containsRequestId,
        logs,
        details: {
          requestId,
          containsRequestId
        }
      };
    }
  },
  {
    name: 'Error Logging Format Test',
    action: async () => {
      // Create an error by requesting a non-existent entity
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Get details for loan L999' }
        ]
      });
      
      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Read the last 50 lines of logs
      const logs = readLastLines(LOG_FILE, 50);
      
      // Check for error format in logs
      const containsErrorLog = logsContain(logs, ['✗ FAILED MCP FUNCTION', 'error', 'L999']);
      const containsStack = logsContain(logs, ['stack']);
      
      return {
        success: containsErrorLog && containsStack,
        logs,
        details: {
          containsErrorLog,
          containsStack
        }
      };
    }
  },
  {
    name: 'OpenAI API Logging Test',
    action: async () => {
      // Make an OpenAI request that triggers function calling
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Show me active loans' }
        ]
      });
      
      // Wait for logs to be written
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Read the last 50 lines of logs
      const logs = readLastLines(LOG_FILE, 50);
      
      // Check for OpenAI request/response logs
      const containsOpenAIRequest = logsContain(logs, ['MCP OPENAI REQUEST']);
      const containsOpenAIResponse = logsContain(logs, ['MCP OPENAI RESPONSE']);
      const containsTokensRedacted = logsContain(logs, ['tokensUsed', '[REDACTED]']);
      
      return {
        success: containsOpenAIRequest && containsOpenAIResponse && containsTokensRedacted,
        logs,
        details: {
          containsOpenAIRequest,
          containsOpenAIResponse,
          containsTokensRedacted
        }
      };
    }
  }
];

// Run all tests
async function runTests() {
  console.log(chalk.cyan.bold('🧪 Logging Test Suite'));
  console.log(chalk.cyan('===================\n'));
  
  // First check if server is running
  try {
    const healthCheck = await axios.get(`${API_URL}/api/health`);
    if (healthCheck.status === 200) {
      console.log(chalk.green('✅ Server is running'));
    } else {
      console.log(chalk.red(`❌ Server returned unexpected status: ${healthCheck.status}`));
      return { success: false, passed: 0, total: testCases.length };
    }
  } catch (error) {
    console.log(chalk.red(`❌ Server not available: ${error.message}`));
    console.log(chalk.yellow('Please start the server before running tests'));
    return { success: false, passed: 0, total: testCases.length };
  }
  
  // Check if log file exists
  if (!fs.existsSync(LOG_FILE)) {
    console.log(chalk.red(`❌ Log file not found: ${LOG_FILE}`));
    console.log(chalk.yellow('Please make sure logging is enabled and the file path is correct'));
    return { success: false, passed: 0, total: testCases.length };
  } else {
    console.log(chalk.green(`✅ Log file found: ${LOG_FILE}`));
  }
  
  console.log(''); // Empty line for spacing
  
  // Run each test case
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    process.stdout.write(chalk.cyan(`Testing: ${testCase.name}... `));
    
    const result = await testCase.action();
    
    if (result.success) {
      console.log(chalk.green('✅ PASSED'));
      passed++;
    } else {
      console.log(chalk.red('❌ FAILED'));
      console.log(chalk.yellow('  Details:'));
      console.log(JSON.stringify(result.details, null, 2));
      failed++;
      
      // Print a few lines of logs for context
      if (Array.isArray(result.logs)) {
        console.log(chalk.yellow('  Recent logs (last 5 lines):'));
        result.logs.slice(-5).forEach(line => {
          console.log(chalk.gray(`    ${line}`));
        });
      }
    }
    
    console.log(''); // Empty line for spacing
  }
  
  // Print summary
  console.log(chalk.cyan.bold('\n📋 Test Results'));
  console.log(chalk.cyan('============='));
  console.log(`Total: ${testCases.length}`);
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  
  if (passed === testCases.length) {
    console.log(chalk.green.bold('\n🎉 All tests passed! The logging system is working correctly.'));
    return { success: true, passed, total: testCases.length };
  } else {
    console.log(chalk.yellow.bold('\n⚠️ Some tests failed. Please check the issues above.'));
    return { success: false, passed, total: testCases.length };
  }
}

// Run the tests when called directly
if (require.main === module) {
  runTests().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error(chalk.red('Error running tests:'), error);
    process.exit(1);
  });
} else {
  // Export for use in test harness
  module.exports = runTests;
} 