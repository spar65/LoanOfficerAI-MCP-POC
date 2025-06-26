/**
 * Simple test script to verify MCP functions
 */
const mcpFunctionRegistry = require('./server/services/mcpFunctionRegistry');

// Test helper function
async function testMcpFunction(functionName, args) {
  console.log(`\n=== Testing ${functionName} ===`);
  console.log(`Args: ${JSON.stringify(args)}`);
  
  try {
    const result = await mcpFunctionRegistry.executeFunction(functionName, args);
    console.log('Result:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error:');
    console.error(error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('=== MCP Functions Test ===');
  
  // Test getActiveLoans (already working)
  await testMcpFunction('getActiveLoans', {});
  
  // Test getLoanStatus (newly implemented)
  await testMcpFunction('getLoanStatus', { loan_id: 'L001' });
  
  // Test getLoanSummary (newly implemented)
  await testMcpFunction('getLoanSummary', {});
  
  // Test with invalid loan ID
  await testMcpFunction('getLoanStatus', { loan_id: 'NONEXISTENT' });
  
  // Test with missing required parameter
  await testMcpFunction('getLoanStatus', {});
  
  console.log('\n=== Tests Complete ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Test execution failed:');
  console.error(error);
}); 