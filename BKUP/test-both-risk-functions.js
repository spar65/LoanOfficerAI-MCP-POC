const axios = require('axios');

// Configuration
const TEST_CONFIG = {
  headers: {
    'Authorization': 'Bearer SYSTEM_INTERNAL_CALL',
    'X-Internal-Call': 'true',
    'Content-Type': 'application/json'
  }
};

// Test getBorrowerDefaultRisk
async function testDefaultRisk() {
  console.log('\n🧪 Testing getBorrowerDefaultRisk function');
  console.log('------------------------------------------');

  try {
    const response = await axios.post(
      'http://localhost:3001/api/openai/chat',
      {
        messages: [{ role: 'user', content: "What's the default risk for borrower B003?" }],
        function_call: { name: "getBorrowerDefaultRisk" }
      },
      TEST_CONFIG
    );

    console.log('✅ Response status:', response.status);
    console.log('✅ Response content:', response.data.content.slice(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

// Test getBorrowerNonAccrualRisk
async function testNonAccrualRisk() {
  console.log('\n🧪 Testing getBorrowerNonAccrualRisk function');
  console.log('--------------------------------------------');

  try {
    const response = await axios.post(
      'http://localhost:3001/api/openai/chat',
      {
        messages: [{ role: 'user', content: "Is there a risk that borrower B001 will become non-accrual?" }],
        function_call: { name: "getBorrowerNonAccrualRisk" }
      },
      TEST_CONFIG
    );

    console.log('✅ Response status:', response.status);
    console.log('✅ Response content:', response.data.content.slice(0, 100) + '...');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return false;
  }
}

// Run both tests
async function runTests() {
  let results = {
    defaultRisk: await testDefaultRisk(),
    nonAccrualRisk: await testNonAccrualRisk()
  };

  console.log('\n📋 Test Results');
  console.log('---------------');
  console.log(`Default Risk: ${results.defaultRisk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Non-Accrual Risk: ${results.nonAccrualRisk ? '✅ PASSED' : '❌ FAILED'}`);

  if (results.defaultRisk && results.nonAccrualRisk) {
    console.log('\n✨ All tests passed! The fixes were successful.');
  } else {
    console.log('\n⚠️ Some tests failed. More debugging is needed.');
  }
}

// Run the tests
runTests(); 