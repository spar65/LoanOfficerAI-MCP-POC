/**
 * Simple test script to check risk endpoints
 */
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

async function main() {
  console.log('Testing risk endpoints...');
  
  try {
    // First check if server is running
    console.log('1. Checking server health...');
    const healthCheck = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Server is running: ${healthCheck.data.status}`);
    
    // Test default risk endpoint
    console.log('\n2. Testing default risk endpoint...');
    const defaultRiskResponse = await axios.get(
      `${BASE_URL}/risk/default/B003?time_horizon=medium_term`, 
      TEST_CONFIG
    );
    console.log(`✅ Default risk endpoint successful: ${defaultRiskResponse.status}`);
    console.log(`Risk score: ${defaultRiskResponse.data.risk_score}, Risk level: ${defaultRiskResponse.data.risk_level || 'N/A'}`);
    
    // Test non-accrual risk endpoint
    console.log('\n3. Testing non-accrual risk endpoint...');
    const nonAccrualRiskResponse = await axios.get(
      `${BASE_URL}/risk/non-accrual/B001`, 
      TEST_CONFIG
    );
    console.log(`✅ Non-accrual risk endpoint successful: ${nonAccrualRiskResponse.status}`);
    console.log(`Non-accrual risk: ${nonAccrualRiskResponse.data.non_accrual_risk}, Risk score: ${nonAccrualRiskResponse.data.risk_score}`);
    
    console.log('\n✅ All risk endpoints are working!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    process.exit(1);
  }
}

main();
