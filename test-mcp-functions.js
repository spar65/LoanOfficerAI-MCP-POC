const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  headers: {
    'Authorization': 'Bearer SYSTEM_INTERNAL_CALL',
    'X-Internal-Call': 'true',
    'Content-Type': 'application/json'
  }
};

// Test cases for MCP function calling
const MCP_TEST_CASES = [
  {
    name: 'Default Risk Assessment - B003',
    description: 'Test getBorrowerDefaultRisk for borrower B003',
    messages: [
      { role: 'user', content: "What's the default risk for borrower B003 in the next 3 months?" }
    ],
    expectedFunction: 'getBorrowerDefaultRisk',
    expectedData: ['borrower_id', 'risk_score']
  },
  {
    name: 'Non-Accrual Risk Assessment - B001',
    description: 'Test getBorrowerNonAccrualRisk for borrower B001',
    messages: [
      { role: 'user', content: "Is there a risk that borrower B001 will become non-accrual?" }
    ],
    expectedFunction: 'getBorrowerNonAccrualRisk',
    expectedData: ['borrower_id', 'non_accrual_risk']
  },
  {
    name: 'High Risk Farmers Identification',
    description: 'Test getHighRiskFarmers function',
    messages: [
      { role: 'user', content: "Which farmers are at high risk of default?" }
    ],
    expectedFunction: 'getHighRiskFarmers',
    expectedData: ['farmers']
  },
  {
    name: 'Borrower Details - B004',
    description: 'Test getBorrowerDetails for borrower B004',
    messages: [
      { role: 'user', content: "Show me details for borrower B004" }
    ],
    expectedFunction: 'getBorrowerDetails',
    expectedData: ['borrower_id', 'first_name', 'last_name']
  },
  {
    name: 'Invalid Borrower Test',
    description: 'Test validation with invalid borrower ID',
    messages: [
      { role: 'user', content: "What's the default risk for borrower XYZ123?" }
    ],
    expectedFunction: 'getBorrowerDefaultRisk',
    expectError: true,
    expectedErrorType: 'validation'
  }
];

// Utility function to make test API calls
async function makeTestCall(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 ${testCase.description}`);
    
    const response = await axios.post(`${BASE_URL}/openai/chat`, {
      messages: testCase.messages,
      function_call: 'auto'
    }, TEST_CONFIG);
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 'NETWORK_ERROR'
    };
  }
}

// Function to validate test results
function validateTestResult(testCase, result) {
  console.log(`🔍 Validating result for: ${testCase.name}`);
  
  if (!result.success) {
    if (testCase.expectError) {
      console.log(`✅ Expected error occurred: ${result.error}`);
      return true;
    } else {
      console.log(`❌ Unexpected error: ${result.error}`);
      return false;
    }
  }
  
  const responseContent = result.data.content;
  
  if (testCase.expectError) {
    console.log(`❌ Expected error but got success: ${responseContent}`);
    return false;
  }
  
  // Check if response contains expected data indicators
  let hasExpectedData = true;
  if (testCase.expectedData) {
    for (const dataField of testCase.expectedData) {
      if (!responseContent.toLowerCase().includes(dataField.toLowerCase().replace('_', ' '))) {
        console.log(`⚠️  Missing expected data field: ${dataField}`);
        hasExpectedData = false;
      }
    }
  }
  
  if (hasExpectedData) {
    console.log(`✅ Test passed - Contains expected data`);
    console.log(`📄 Response: ${responseContent.substring(0, 200)}...`);
    return true;
  } else {
    console.log(`❌ Test failed - Missing expected data`);
    console.log(`📄 Response: ${responseContent}`);
    return false;
  }
}

// Main test function
async function runMcpFunctionTests() {
  console.log('🚀 Starting MCP Function Calling Tests');
  console.log('=====================================');
  
  let passedTests = 0;
  let totalTests = MCP_TEST_CASES.length;
  
  // First, verify server is running
  try {
    const healthCheck = await axios.get(`${BASE_URL}/system/status`, TEST_CONFIG);
    console.log(`✅ Server is running: ${healthCheck.data.status}`);
    console.log(`📊 Memory usage: ${healthCheck.data.memory.used}`);
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('Please start the server with: npm start');
    return;
  }
  
  // Run each test case
  for (const testCase of MCP_TEST_CASES) {
    const result = await makeTestCall(testCase);
    const isValid = validateTestResult(testCase, result);
    
    if (isValid) {
      passedTests++;
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n📋 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All MCP function tests passed!');
  } else {
    console.log(`⚠️  ${totalTests - passedTests} tests need attention`);
  }
  
  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
}

// Direct API endpoint tests for comparison
async function testDirectApiEndpoints() {
  console.log('\n🔧 Testing Direct API Endpoints');
  console.log('=================================');
  
  const endpoints = [
    { name: 'Borrower B001', url: '/api/borrowers/B001' },
    { name: 'Borrower B003', url: '/api/borrowers/B003' },
    { name: 'Default Risk B003', url: '/api/risk/default/B003' },
    { name: 'Non-Accrual Risk B001', url: '/api/risk/non-accrual/B001' },
    { name: 'Analytics Default B003', url: '/api/analytics/predict/default-risk/B003' },
    { name: 'Analytics Non-Accrual B001', url: '/api/analytics/predict/non-accrual-risk/B001' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.url}`, TEST_CONFIG);
      console.log(`✅ ${endpoint.name}: ${response.status} - ${JSON.stringify(response.data).substring(0, 100)}...`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
    }
  }
}

// Function to test the MCP functions registry
async function testMcpRegistry() {
  console.log('\n📋 Testing MCP Functions Registry');
  console.log('==================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/mcp/functions`, TEST_CONFIG);
    const registry = response.data;
    
    console.log(`✅ Total Functions: ${registry.total_functions}`);
    console.log(`✅ Active Functions: ${registry.active_functions}`);
    console.log(`📊 Categories:`, registry.categories);
    
    if (registry.functions) {
      console.log('\n📝 Available Functions:');
      registry.functions.forEach(func => {
        console.log(`  - ${func.name} (${func.category})`);
      });
    }
    
    return registry;
  } catch (error) {
    console.log(`❌ MCP Registry Error: ${error.response?.data || error.message}`);
    return null;
  }
}

// Main execution
async function main() {
  try {
    // Test direct API endpoints first
    await testDirectApiEndpoints();
    
    // Test MCP registry
    await testMcpRegistry();
    
    // Test MCP function calling through OpenAI route
    const testResults = await runMcpFunctionTests();
    
    console.log('\n🏁 Testing Complete');
    console.log('====================');
    
    if (testResults.success) {
      console.log('🎉 All systems operational! MCP functions are working correctly.');
      process.exit(0);
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.');
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Test script error:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}

module.exports = { runMcpFunctionTests, testDirectApiEndpoints, testMcpRegistry }; 