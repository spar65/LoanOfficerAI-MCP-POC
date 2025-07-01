/**
 * Combined Risk Assessment Tests
 * 
 * This script tests all risk assessment functionality:
 * 1. Default risk prediction
 * 2. Non-accrual risk assessment
 * 3. High-risk farmers identification
 * 4. Collateral sufficiency evaluation
 */
const axios = require('axios');
const LogService = require('./services/logService');

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
 * Test default risk prediction for borrower B003
 */
async function testDefaultRisk() {
  console.log('\n🔍 TESTING DEFAULT RISK PREDICTION');
  console.log('================================');
  
  try {
    // Test default risk via risk endpoint
    console.log('Testing risk/default endpoint...');
    const riskRes = await axios.get(
      `${BASE_URL}/risk/default/B003?time_horizon=short_term`,
      TEST_CONFIG
    );
    
    if (riskRes.data && riskRes.data.borrower_id === 'B003') {
      console.log('✅ Successfully retrieved default risk:');
      console.log(`   Risk score: ${riskRes.data.risk_score}`);
      console.log(`   Risk level: ${riskRes.data.risk_level}`);
    } else {
      console.log('❌ Unexpected response from risk endpoint');
      return false;
    }
    
    // Test default risk via analytics endpoint
    console.log('\nTesting analytics/predict/default-risk endpoint...');
    const analyticsRes = await axios.get(
      `${BASE_URL}/analytics/predict/default-risk/B003?time_horizon=3m`,
      TEST_CONFIG
    );
    
    if (analyticsRes.data && analyticsRes.data.borrower_id === 'B003') {
      console.log('✅ Successfully retrieved default risk prediction:');
      console.log(`   Default probability: ${analyticsRes.data.default_probability}`);
      console.log(`   Risk level: ${analyticsRes.data.default_risk_level}`);
      return true;
    } else {
      console.log('❌ Unexpected response from analytics endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing default risk:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test non-accrual risk assessment for borrower B001
 */
async function testNonAccrualRisk() {
  console.log('\n🔍 TESTING NON-ACCRUAL RISK ASSESSMENT');
  console.log('===================================');
  
  try {
    // Test non-accrual risk via risk endpoint
    console.log('Testing risk/non-accrual endpoint...');
    const riskRes = await axios.get(
      `${BASE_URL}/risk/non-accrual/B001`,
      TEST_CONFIG
    );
    
    if (riskRes.data && riskRes.data.borrower_id === 'B001') {
      console.log('✅ Successfully retrieved non-accrual risk:');
      console.log(`   Risk level: ${riskRes.data.non_accrual_risk}`);
      console.log(`   Risk score: ${riskRes.data.risk_score}`);
    } else {
      console.log('❌ Unexpected response from risk endpoint');
      return false;
    }
    
    // Test non-accrual risk via analytics endpoint
    console.log('\nTesting analytics/predict/non-accrual-risk endpoint...');
    const analyticsRes = await axios.get(
      `${BASE_URL}/analytics/predict/non-accrual-risk/B001`,
      TEST_CONFIG
    );
    
    if (analyticsRes.data && analyticsRes.data.borrower_id === 'B001') {
      console.log('✅ Successfully retrieved non-accrual risk prediction:');
      console.log(`   Non-accrual probability: ${analyticsRes.data.non_accrual_probability}`);
      console.log(`   Status: ${analyticsRes.data.status}`);
      return true;
    } else {
      console.log('❌ Unexpected response from analytics endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing non-accrual risk:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test high-risk farmers identification
 */
async function testHighRiskFarmers() {
  console.log('\n🔍 TESTING HIGH-RISK FARMERS IDENTIFICATION');
  console.log('=======================================');
  
  try {
    // Test high risk farmers with high threshold
    console.log('Testing high-risk-farmers endpoint (high threshold)...');
    const highRes = await axios.get(
      `${BASE_URL}/analytics/high-risk-farmers?time_horizon=3m&threshold=high`,
      TEST_CONFIG
    );
    
    if (highRes.data && Array.isArray(highRes.data.farmers)) {
      console.log('✅ Successfully retrieved high risk farmers:');
      console.log(`   Count: ${highRes.data.farmers.length}`);
      console.log(`   Risk threshold: ${highRes.data.risk_threshold}`);
    } else {
      console.log('❌ Unexpected response from high threshold endpoint');
      return false;
    }
    
    // Test high risk farmers with medium threshold
    console.log('\nTesting high-risk-farmers endpoint (medium threshold)...');
    const mediumRes = await axios.get(
      `${BASE_URL}/analytics/high-risk-farmers?time_horizon=3m&threshold=medium`,
      TEST_CONFIG
    );
    
    if (mediumRes.data && Array.isArray(mediumRes.data.farmers)) {
      console.log('✅ Successfully retrieved medium risk farmers:');
      console.log(`   Count: ${mediumRes.data.farmers.length}`);
      console.log(`   Risk threshold: ${mediumRes.data.risk_threshold}`);
      return true;
    } else {
      console.log('❌ Unexpected response from medium threshold endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing high-risk farmers:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test collateral sufficiency for loan L002
 */
async function testCollateralSufficiency() {
  console.log('\n🔍 TESTING COLLATERAL SUFFICIENCY');
  console.log('==============================');
  
  try {
    // Test collateral sufficiency
    console.log('Testing risk/collateral endpoint...');
    const collateralRes = await axios.get(
      `${BASE_URL}/risk/collateral/L002?market_conditions=stable`,
      TEST_CONFIG
    );
    
    if (collateralRes.data && collateralRes.data.loan_id === 'L002') {
      console.log('✅ Successfully evaluated collateral sufficiency:');
      console.log(`   Is sufficient: ${collateralRes.data.is_sufficient}`);
      console.log(`   Loan-to-value ratio: ${collateralRes.data.loan_to_value_ratio}`);
      console.log(`   Collateral value: $${collateralRes.data.collateral_value}`);
      return true;
    } else {
      console.log('❌ Unexpected response from collateral endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing collateral sufficiency:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Run all tests and report results
 */
async function runAllTests() {
  console.log('🚀 STARTING RISK ASSESSMENT TEST SUITE');
  console.log('====================================');
  
  // First check if server is running
  try {
    console.log('Checking server health...');
    const healthCheck = await axios.get(`${BASE_URL}/health`);
    console.log(`✅ Server is running: ${healthCheck.data.status}`);
    console.log(`   Version: ${healthCheck.data.version}`);
    console.log(`   Environment: ${healthCheck.data.environment}`);
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('Please start the server with: npm start');
    process.exit(1);
  }
  
  // Run all tests
  const defaultRiskResult = await testDefaultRisk();
  const nonAccrualRiskResult = await testNonAccrualRisk();
  const highRiskFarmersResult = await testHighRiskFarmers();
  const collateralSufficiencyResult = await testCollateralSufficiency();
  
  // Output summary
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('====================');
  console.log(`Default Risk Prediction: ${defaultRiskResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Non-Accrual Risk Assessment: ${nonAccrualRiskResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`High-Risk Farmers Identification: ${highRiskFarmersResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Collateral Sufficiency Evaluation: ${collateralSufficiencyResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = defaultRiskResult && nonAccrualRiskResult && 
                    highRiskFarmersResult && collateralSufficiencyResult;
  
  if (allPassed) {
    console.log('\n🎉 ALL RISK ASSESSMENT TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('\n⚠️ SOME RISK ASSESSMENT TESTS FAILED');
    process.exit(1);
  }
}

// Run all tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testDefaultRisk,
  testNonAccrualRisk,
  testHighRiskFarmers,
  testCollateralSufficiency,
  runAllTests
}; 