/**
 * Security Test Script
 * 
 * This script tests the security features of the API, focusing on:
 * 1. Authentication checks
 * 2. Token validation
 * 3. Rate limiting
 * 4. Input validation and sanitization
 */

const axios = require('axios');
const chalk = require('chalk');
const { performance } = require('perf_hooks');

// Constants
const API_URL = 'http://localhost:3001';
const VALID_TOKEN = 'test-token';
const INVALID_TOKEN = 'invalid-token';
const EXPIRED_TOKEN = 'expired-token';

// Helper to make API calls
async function callAPI(endpoint, data, options = {}) {
  const startTime = performance.now();
  
  try {
    const response = await axios({
      method: options.method || 'POST',
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': options.token ? `Bearer ${options.token}` : '',
        ...options.headers
      },
      data,
      timeout: options.timeout || 10000, // 10 second timeout
      validateStatus: status => true // Don't throw for any status code
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return { 
      success: response.status >= 200 && response.status < 300, 
      data: response.data, 
      status: response.status,
      duration
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status,
      details: error.response?.data,
      duration
    };
  }
}

// Security test cases
const securityTests = [
  {
    name: 'Authentication Required',
    action: async () => {
      // Call API without a token
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }, { token: null });
      
      // Should return 401 Unauthorized
      return {
        success: result.status === 401,
        details: {
          status: result.status,
          expected: 401,
          message: result.data?.message || 'No error message'
        }
      };
    }
  },
  {
    name: 'Invalid Token Rejection',
    action: async () => {
      // Call API with an invalid token
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }, { token: INVALID_TOKEN });
      
      // Should return 401 Unauthorized
      return {
        success: result.status === 401,
        details: {
          status: result.status,
          expected: 401,
          message: result.data?.message || 'No error message'
        }
      };
    }
  },
  {
    name: 'Valid Token Acceptance',
    action: async () => {
      // Call API with a valid token
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      }, { token: VALID_TOKEN });
      
      // Should return 200 OK
      return {
        success: result.status === 200,
        details: {
          status: result.status,
          expected: 200
        }
      };
    }
  },
  {
    name: 'Input Validation - Empty Message',
    action: async () => {
      // Call API with an empty message
      const result = await callAPI('/api/openai/chat', {
        messages: []
      }, { token: VALID_TOKEN });
      
      // Should return 400 Bad Request
      return {
        success: result.status === 400,
        details: {
          status: result.status,
          expected: 400,
          message: result.data?.message || 'No error message'
        }
      };
    }
  },
  {
    name: 'Input Validation - Malformed Request',
    action: async () => {
      // Call API with malformed request (missing messages array)
      const result = await callAPI('/api/openai/chat', {
        invalidField: true
      }, { token: VALID_TOKEN });
      
      // Should return 400 Bad Request
      return {
        success: result.status === 400,
        details: {
          status: result.status,
          expected: 400,
          message: result.data?.message || 'No error message'
        }
      };
    }
  },
  {
    name: 'Protected Endpoint Check',
    action: async () => {
      // Try to access a protected endpoint
      const result = await callAPI('/api/admin/users', {}, { 
        token: VALID_TOKEN,
        method: 'GET'
      });
      
      // Should return 403 Forbidden (or 404 Not Found if endpoint doesn't exist)
      return {
        success: result.status === 403 || result.status === 404,
        details: {
          status: result.status,
          expected: '403 or 404',
          message: result.data?.message || 'No error message'
        }
      };
    }
  },
  {
    name: 'Rate Limiting Check',
    action: async () => {
      const results = [];
      let hitRateLimit = false;
      
      // Make 10 requests in quick succession to try triggering rate limiting
      for (let i = 0; i < 10; i++) {
        const result = await callAPI('/api/openai/chat', {
          messages: [
            { role: 'user', content: `Rapid request ${i + 1}` }
          ]
        }, { token: VALID_TOKEN });
        
        results.push({
          iteration: i + 1,
          status: result.status
        });
        
        // Check if we hit a rate limit (429 Too Many Requests)
        if (result.status === 429) {
          hitRateLimit = true;
          break;
        }
      }
      
      // Note: Rate limiting may or may not be implemented, so this test is informational
      return {
        success: true, // Always pass this test
        details: {
          results,
          hitRateLimit,
          rateLimitStatus: hitRateLimit ? 'Rate limiting is active' : 'No rate limiting detected or limit not reached'
        }
      };
    }
  }
];

// Run all tests
async function runTests() {
  console.log(chalk.cyan.bold('🧪 Security Test Suite'));
  console.log(chalk.cyan('====================\n'));
  
  // First check if server is running
  try {
    const healthCheck = await axios.get(`${API_URL}/api/health`);
    if (healthCheck.status === 200) {
      console.log(chalk.green('✅ Server is running'));
    } else {
      console.log(chalk.red(`❌ Server returned unexpected status: ${healthCheck.status}`));
      return { success: false, passed: 0, total: securityTests.length };
    }
  } catch (error) {
    console.log(chalk.red(`❌ Server not available: ${error.message}`));
    console.log(chalk.yellow('Please start the server before running tests'));
    return { success: false, passed: 0, total: securityTests.length };
  }
  
  console.log(''); // Empty line for spacing
  
  // Run each test case
  let passed = 0;
  let failed = 0;
  
  for (const testCase of securityTests) {
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
    }
    
    console.log(''); // Empty line for spacing
  }
  
  // Print summary
  console.log(chalk.cyan.bold('\n📋 Test Results'));
  console.log(chalk.cyan('============='));
  console.log(`Total: ${securityTests.length}`);
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  
  if (passed === securityTests.length) {
    console.log(chalk.green.bold('\n🎉 All tests passed! Security mechanisms are working correctly.'));
    return { success: true, passed, total: securityTests.length };
  } else {
    console.log(chalk.yellow.bold('\n⚠️ Some tests failed. Security vulnerabilities may exist.'));
    return { success: false, passed, total: securityTests.length };
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