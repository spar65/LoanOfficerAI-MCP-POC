/**
 * OpenAI Integration Test Script
 * 
 * This script tests OpenAI integration, focusing on:
 * 1. Function calling
 * 2. Natural language responses
 * 3. Error handling
 * 4. Proper response formatting
 */

const axios = require('axios');
const chalk = require('chalk');
const { startTestServer, stopTestServer, TEST_PORT, TEST_TOKEN } = require('./test-utils');

// Constants
const API_URL = `http://localhost:${TEST_PORT}`;

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
      data,
      timeout: 10000 // 10-second timeout to prevent hanging
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

// Test cases
const testCases = [
  {
    name: 'Direct Natural Language Response',
    action: async () => {
      // Send a message that can be answered directly without function calls
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Hello, how can you help me with agricultural loans?' }
        ]
      });
      
      // Check response
      if (!result.success) {
        return { 
          success: false, 
          error: 'API call failed',
          details: result 
        };
      }
      
      // Verify response is natural language, not raw JSON
      const isNaturalLanguage = typeof result.data.content === 'string' && 
                              !result.data.content.startsWith('{') &&
                              !result.data.content.startsWith('[');
      
      return {
        success: isNaturalLanguage,
        content: result.data.content,
        isNaturalLanguage
      };
    }
  },
  {
    name: 'Function Calling with Valid ID',
    action: async () => {
      // Send a message that should trigger function call
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Get details for borrower B001' }
        ]
      });
      
      // Check response
      if (!result.success) {
        return { 
          success: false, 
          error: 'API call failed',
          details: result 
        };
      }
      
      // Response should contain borrower info in natural language
      const mentionsName = result.data.content.includes('John') || result.data.content.includes('Doe');
      const mentionsDetails = result.data.content.includes('credit score') || 
                            result.data.content.includes('farm') || 
                            result.data.content.includes('income');
      const isNaturalLanguage = typeof result.data.content === 'string' && 
                              !result.data.content.startsWith('{') &&
                              !result.data.content.startsWith('[');
      
      return {
        success: mentionsName && mentionsDetails && isNaturalLanguage,
        content: result.data.content,
        mentionsName,
        mentionsDetails,
        isNaturalLanguage
      };
    }
  },
  {
    name: 'Function Calling with Invalid ID',
    action: async () => {
      // Send a message that should trigger function call with invalid ID
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Get details for borrower B999' }
        ]
      });
      
      // Check response
      if (!result.success) {
        return { 
          success: false, 
          error: 'API call failed',
          details: result 
        };
      }
      
      // Response should explain the error in natural language
      const mentionsNotFound = result.data.content.includes('not found') || 
                             result.data.content.includes('no borrower') ||
                             result.data.content.includes('unable to find');
      const mentionsID = result.data.content.includes('B999');
      const isNaturalLanguage = typeof result.data.content === 'string' && 
                              !result.data.content.startsWith('{') &&
                              !result.data.content.startsWith('[');
      
      return {
        success: mentionsNotFound && mentionsID && isNaturalLanguage,
        content: result.data.content,
        mentionsNotFound,
        mentionsID,
        isNaturalLanguage
      };
    }
  },
  {
    name: 'Case-Insensitive ID Handling',
    action: async () => {
      // Send a message with differently-cased ID (should still work)
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Get details for borrower b001' }
        ]
      });
      
      // Check response
      if (!result.success) {
        return { 
          success: false, 
          error: 'API call failed',
          details: result 
        };
      }
      
      // Response should contain borrower info despite case difference
      const mentionsName = result.data.content.includes('John') || result.data.content.includes('Doe');
      const mentionsDetails = result.data.content.includes('credit score') || 
                            result.data.content.includes('farm') || 
                            result.data.content.includes('income');
      
      return {
        success: mentionsName && mentionsDetails,
        content: result.data.content,
        mentionsName,
        mentionsDetails
      };
    }
  },
  {
    name: 'Function Chaining',
    action: async () => {
      // Ask a question that requires calling multiple functions
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'What loans does John Doe have?' }
        ]
      });
      
      // Check response
      if (!result.success) {
        return { 
          success: false, 
          error: 'API call failed',
          details: result 
        };
      }
      
      // Response should mention both the borrower and their loans
      const mentionsBorrower = result.data.content.includes('John') || result.data.content.includes('Doe');
      const mentionsLoans = result.data.content.includes('loan') || 
                          result.data.content.includes('amount') || 
                          result.data.content.includes('L001');
      
      return {
        success: mentionsBorrower && mentionsLoans,
        content: result.data.content,
        mentionsBorrower,
        mentionsLoans
      };
    }
  },
  {
    name: 'Conversation Context Handling',
    action: async () => {
      // Have a multi-turn conversation to test context preservation
      // First message
      const firstResult = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Tell me about borrower B001' }
        ]
      });
      
      if (!firstResult.success) {
        return { 
          success: false, 
          error: 'First API call failed',
          details: firstResult 
        };
      }
      
      // Follow-up question using previous context
      const secondResult = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Tell me about borrower B001' },
          { role: 'assistant', content: firstResult.data.content },
          { role: 'user', content: 'What loans do they have?' }
        ]
      });
      
      if (!secondResult.success) {
        return { 
          success: false, 
          error: 'Second API call failed',
          details: secondResult 
        };
      }
      
      // Response should mention loans without repeating all borrower information
      const mentionsLoans = secondResult.data.content.includes('loan') || 
                          secondResult.data.content.includes('amount') || 
                          secondResult.data.content.includes('L001');
      const usesPronoun = secondResult.data.content.includes('they') || 
                        secondResult.data.content.includes('their') || 
                        secondResult.data.content.includes('John');
      
      return {
        success: mentionsLoans && usesPronoun,
        content: secondResult.data.content,
        mentionsLoans,
        usesPronoun
      };
    }
  }
];

// Run all tests
async function runTests() {
  console.log(chalk.cyan.bold('🧪 OpenAI Integration Test Suite'));
  console.log(chalk.cyan('==============================\n'));
  
  // Start test server
  let server;
  try {
    server = await startTestServer();
    console.log(chalk.green(`✅ Test server started on port ${TEST_PORT}`));
  } catch (error) {
    console.log(chalk.red(`❌ Failed to start test server: ${error.message}`));
    console.log(chalk.yellow('Please make sure port 3002 is available'));
    return 1; // Return error code
  }
  
  // Run each test case
  let passed = 0;
  let failed = 0;
  
  try {
    for (const testCase of testCases) {
      process.stdout.write(chalk.cyan(`Testing: ${testCase.name}... `));
      
      try {
        const result = await testCase.action();
        
        if (result.success) {
          console.log(chalk.green('✅ PASSED'));
          passed++;
        } else {
          console.log(chalk.red('❌ FAILED'));
          console.log(chalk.yellow('  Details:'));
          console.log('  ' + JSON.stringify(result, null, 2).replace(/\n/g, '\n  '));
          failed++;
        }
        
        // For debugging, log the content
        if (result.content) {
          console.log(chalk.gray(`  Response: "${result.content.substring(0, 100)}${result.content.length > 100 ? '...' : ''}"`));
        }
      } catch (error) {
        console.log(chalk.red('❌ ERROR'));
        console.log(chalk.yellow('  Exception:'));
        console.log(`  ${error.message}`);
        failed++;
      }
      
      console.log(''); // Empty line for spacing
    }
  } catch (error) {
    console.error(chalk.red('Fatal error running tests:'), error);
    return 1; // Return error code
  } finally {
    // Always stop the test server, even if tests fail
    try {
      await stopTestServer();
      console.log(chalk.blue('Test server stopped.'));
    } catch (error) {
      console.error(chalk.red('Error stopping test server:'), error);
    }
  }
  
  // Print summary
  console.log(chalk.cyan.bold('\n📋 Test Results'));
  console.log(chalk.cyan('============='));
  console.log(`Total: ${testCases.length}`);
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  
  if (passed === testCases.length) {
    console.log(chalk.green.bold('\n🎉 All tests passed! OpenAI integration is working correctly.'));
    return 0; // Success
  } else {
    console.log(chalk.yellow.bold('\n⚠️ Some tests failed. Check the OpenAI integration.'));
    return 1; // Failure
  }
}

// Run the tests
if (require.main === module) {
  runTests().then(exitCode => {
    // Explicitly exit with code
    process.exit(exitCode);
  }).catch(error => {
    console.error(chalk.red('Unexpected error running tests:'), error);
    process.exit(1);
  });
} else {
  module.exports = runTests;
} 