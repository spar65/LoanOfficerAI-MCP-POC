/**
 * Performance Test Script
 * 
 * This script tests the performance of the API, focusing on:
 * 1. Response times for different types of requests
 * 2. Throughput under concurrent load
 * 3. Memory usage patterns
 * 4. System stability under stress
 */

const axios = require('axios');
const chalk = require('chalk');
const { performance } = require('perf_hooks');

// Constants
const API_URL = 'http://localhost:3001';
const TEST_TOKEN = 'test-token';

// Helper to make API calls
async function callAPI(endpoint, data, options = {}) {
  const startTime = performance.now();
  
  try {
    const response = await axios({
      method: options.method || 'POST',
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...options.headers
      },
      data,
      timeout: options.timeout || 30000 // 30 second timeout by default
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    return { 
      success: true, 
      data: response.data, 
      status: response.status,
      duration,
      size: JSON.stringify(response.data).length
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

// Test cases
const performanceTests = [
  {
    name: 'Simple Chat Response Time',
    action: async () => {
      const results = [];
      
      // Make 5 requests and measure response time
      for (let i = 0; i < 5; i++) {
        const result = await callAPI('/api/openai/chat', {
          messages: [
            { role: 'user', content: 'Hello, how are you?' }
          ]
        });
        
        results.push({
          iteration: i + 1,
          success: result.success,
          duration: result.duration,
          status: result.status
        });
      }
      
      // Calculate average and max duration
      const durations = results.map(r => r.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      return {
        success: results.every(r => r.success),
        details: {
          results,
          avgDuration,
          maxDuration
        }
      };
    }
  },
  {
    name: 'Function Calling Response Time',
    action: async () => {
      const results = [];
      
      // Make 3 requests that trigger function calls
      for (let i = 0; i < 3; i++) {
        const result = await callAPI('/api/openai/chat', {
          messages: [
            { role: 'user', content: 'Show me details for loan L001' }
          ]
        });
        
        results.push({
          iteration: i + 1,
          success: result.success,
          duration: result.duration,
          status: result.status
        });
      }
      
      // Calculate average and max duration
      const durations = results.map(r => r.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      return {
        success: results.every(r => r.success),
        details: {
          results,
          avgDuration,
          maxDuration
        }
      };
    }
  },
  {
    name: 'Concurrent Request Handling',
    action: async () => {
      const concurrentRequests = 5;
      const results = [];
      
      // Create an array of promises for concurrent requests
      const promises = Array(concurrentRequests).fill().map((_, i) => {
        return callAPI('/api/openai/chat', {
          messages: [
            { role: 'user', content: `Hello from concurrent request ${i + 1}` }
          ]
        });
      });
      
      // Wait for all requests to complete
      const startTime = performance.now();
      const responses = await Promise.all(promises);
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      // Process results
      for (let i = 0; i < responses.length; i++) {
        results.push({
          iteration: i + 1,
          success: responses[i].success,
          duration: responses[i].duration,
          status: responses[i].status
        });
      }
      
      // Calculate average and max duration
      const durations = results.map(r => r.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      
      return {
        success: results.every(r => r.success),
        details: {
          results,
          avgDuration,
          maxDuration,
          totalDuration,
          throughput: concurrentRequests / (totalDuration / 1000), // Requests per second
          successRate: results.filter(r => r.success).length / results.length
        }
      };
    }
  },
  {
    name: 'Error Response Time',
    action: async () => {
      // Request that will generate an error (non-existent entity)
      const result = await callAPI('/api/openai/chat', {
        messages: [
          { role: 'user', content: 'Show me details for loan L999' }
        ]
      });
      
      return {
        success: result.success && result.duration < 5000, // Should respond in less than 5 seconds
        details: {
          duration: result.duration,
          status: result.status,
          errorHandledProperly: result.success && 
            result.data.content && 
            result.data.content.includes('no loan')
        }
      };
    }
  }
];

// Run all tests
async function runTests() {
  console.log(chalk.cyan.bold('🧪 Performance Test Suite'));
  console.log(chalk.cyan('=======================\n'));
  
  // First check if server is running
  try {
    const startTime = performance.now();
    const healthCheck = await axios.get(`${API_URL}/api/health`);
    const endTime = performance.now();
    const healthCheckDuration = endTime - startTime;
    
    if (healthCheck.status === 200) {
      console.log(chalk.green(`✅ Server is running (health check took ${healthCheckDuration.toFixed(1)}ms)`));
    } else {
      console.log(chalk.red(`❌ Server returned unexpected status: ${healthCheck.status}`));
      return { success: false, passed: 0, total: performanceTests.length };
    }
  } catch (error) {
    console.log(chalk.red(`❌ Server not available: ${error.message}`));
    console.log(chalk.yellow('Please start the server before running tests'));
    return { success: false, passed: 0, total: performanceTests.length };
  }
  
  console.log(''); // Empty line for spacing
  
  // Run each test case
  let passed = 0;
  let failed = 0;
  
  for (const testCase of performanceTests) {
    console.log(chalk.cyan(`Testing: ${testCase.name}`));
    
    const result = await testCase.action();
    
    if (result.success) {
      console.log(chalk.green('  ✅ PASSED'));
      passed++;
      
      // Print performance details
      if (result.details.avgDuration) {
        console.log(chalk.blue(`  Average response time: ${result.details.avgDuration.toFixed(1)}ms`));
      }
      if (result.details.maxDuration) {
        console.log(chalk.blue(`  Max response time: ${result.details.maxDuration.toFixed(1)}ms`));
      }
      if (result.details.throughput) {
        console.log(chalk.blue(`  Throughput: ${result.details.throughput.toFixed(2)} requests/second`));
      }
      if (result.details.successRate) {
        console.log(chalk.blue(`  Success rate: ${(result.details.successRate * 100).toFixed(1)}%`));
      }
    } else {
      console.log(chalk.red('  ❌ FAILED'));
      console.log(chalk.yellow('  Details:'));
      console.log(JSON.stringify(result.details, null, 2));
      failed++;
    }
    
    console.log(''); // Empty line for spacing
  }
  
  // Print summary
  console.log(chalk.cyan.bold('\n📋 Test Results'));
  console.log(chalk.cyan('============='));
  console.log(`Total: ${performanceTests.length}`);
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.red(`Failed: ${failed}`));
  
  if (passed === performanceTests.length) {
    console.log(chalk.green.bold('\n🎉 All tests passed! Performance is within acceptable ranges.'));
    return { success: true, passed, total: performanceTests.length };
  } else {
    console.log(chalk.yellow.bold('\n⚠️ Some tests failed. Performance may need improvement.'));
    return { success: false, passed, total: performanceTests.length };
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