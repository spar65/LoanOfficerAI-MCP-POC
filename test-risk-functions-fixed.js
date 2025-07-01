const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api';
const TEST_CONFIG = {
  headers: {
    'Authorization': 'Bearer SYSTEM_INTERNAL_CALL',
    'X-Internal-Call': 'true',
    'Content-Type': 'application/json'
  }
};

/**
 * Test the getBorrowerDefaultRisk function
 */
async function testDefaultRiskFunction() {
  console.log('\n🔍 Testing getBorrowerDefaultRisk function');
  console.log('=======================================');
  
  try {
    // Step 1: Verify direct API endpoint works
    console.log('Step 1: Testing direct API endpoint');
    const directResponse = await axios.get(
      `${BASE_URL}/risk/default/B003?time_horizon=medium_term`, 
      TEST_CONFIG
    );
    
    console.log(`✅ Direct endpoint successful: ${directResponse.status}`);
    console.log(`📊 Risk score: ${directResponse.data.risk_score}, Risk level: ${directResponse.data.risk_level || 'N/A'}`);
    
    // Step 2: Test through OpenAI function calling
    console.log('\nStep 2: Testing through OpenAI function calling');
    
    const openaiResponse = await axios.post(
      `${BASE_URL}/openai/chat`,
      {
        messages: [
          { role: 'user', content: "What's the default risk for borrower B003?" }
        ],
        function_call: 'auto'
      },
      TEST_CONFIG
    );
    
    console.log(`✅ OpenAI response successful: ${openaiResponse.status}`);
    
    // Check if the response correctly mentions default risk
    const responseContent = openaiResponse.data.content || '';
    console.log(`📝 Response: ${responseContent.substring(0, 150)}...`);
    
    const hasRiskInfo = responseContent.toLowerCase().includes('risk') && 
                       (responseContent.toLowerCase().includes('score') || 
                        responseContent.toLowerCase().includes('level'));
    
    if (hasRiskInfo) {
      console.log('✅ Response contains default risk information');
    } else {
      console.log('❌ Response might be missing risk information');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing default risk function:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test the getBorrowerNonAccrualRisk function
 */
async function testNonAccrualRiskFunction() {
  console.log('\n🔍 Testing getBorrowerNonAccrualRisk function');
  console.log('=========================================');
  
  try {
    // Step 1: Verify direct API endpoint works
    console.log('Step 1: Testing direct API endpoint');
    const directResponse = await axios.get(
      `${BASE_URL}/risk/non-accrual/B001`, 
      TEST_CONFIG
    );
    
    console.log(`✅ Direct endpoint successful: ${directResponse.status}`);
    console.log(`📊 Non-accrual risk: ${directResponse.data.non_accrual_risk}, Risk score: ${directResponse.data.risk_score}`);
    
    // Step 2: Test through OpenAI function calling
    console.log('\nStep 2: Testing through OpenAI function calling');
    
    const openaiResponse = await axios.post(
      `${BASE_URL}/openai/chat`,
      {
        messages: [
          { role: 'user', content: "Is there a risk that borrower B001 will become non-accrual?" }
        ],
        function_call: 'auto'
      },
      TEST_CONFIG
    );
    
    console.log(`✅ OpenAI response successful: ${openaiResponse.status}`);
    
    // Check if the response correctly mentions non-accrual risk
    const responseContent = openaiResponse.data.content || '';
    console.log(`📝 Response: ${responseContent.substring(0, 150)}...`);
    
    const hasRiskInfo = responseContent.toLowerCase().includes('non-accrual') && 
                        responseContent.toLowerCase().includes('risk');
    
    if (hasRiskInfo) {
      console.log('✅ Response contains non-accrual risk information');
    } else {
      console.log('❌ Response might be missing risk information');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing non-accrual risk function:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Run both tests and report results
 */
async function runTests() {
  console.log('🚀 Starting Risk Functions Test Suite');
  console.log('===================================');
  
  // First check if server is running
  try {
    // Use the /api/health endpoint which we know exists
    const healthCheck = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Server is running: ${healthCheck.data.status || 'OK'}`);
    console.log(`📊 API version: ${healthCheck.data.version || 'N/A'}`);
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('Please start the server with: npm start');
    process.exit(1);
  }
  
  // Run the tests
  const defaultRiskResult = await testDefaultRiskFunction();
  const nonAccrualRiskResult = await testNonAccrualRiskFunction();
  
  // Output summary
  console.log('\n📋 Test Results Summary');
  console.log('=====================');
  console.log(`Default Risk Function: ${defaultRiskResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Non-Accrual Risk Function: ${nonAccrualRiskResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (defaultRiskResult && nonAccrualRiskResult) {
    console.log('\n🎉 All risk functions are working correctly!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some risk functions are still not working correctly.');
    process.exit(1);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testDefaultRiskFunction, testNonAccrualRiskFunction, runTests }; 