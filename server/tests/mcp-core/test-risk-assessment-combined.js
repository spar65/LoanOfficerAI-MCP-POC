/**
 * Combined Risk Assessment Tests
 * 
 * This script tests all risk assessment functionality:
 * 1. Default risk prediction
 * 2. Non-accrual risk assessment
 * 3. High-risk farmers identification
 * 4. Collateral sufficiency evaluation
 * 
 * Updated to work with SQL-only architecture - no server required
 */
const LogService = require('../../services/logService');
const mcpDatabaseService = require('../../services/mcpDatabaseService');

// Set test environment to avoid production checks
process.env.NODE_ENV = 'test';
process.env.USE_DATABASE = 'true';

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('\n🔍 TESTING DATABASE CONNECTION');
  console.log('=============================');
  
  try {
    console.log('Testing database connectivity...');
    const result = await mcpDatabaseService.executeQuery('SELECT 1 as test', {});
    
    if (result && (result.recordset || result)) {
      console.log('✅ Database connection successful');
      return true;
    } else {
      console.log('❌ Database connection failed - no results');
      return false;
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('   This test requires a SQL Server database connection.');
    console.error('   Please ensure:');
    console.error('   1. SQL Server is running and accessible');
    console.error('   2. USE_DATABASE=true is set in your .env file');
    console.error('   3. Database connection string is properly configured');
    return false;
  }
}

/**
 * Test default risk prediction for borrower B003
 */
async function testDefaultRisk() {
  console.log('\n🔍 TESTING DEFAULT RISK PREDICTION');
  console.log('================================');
  
  try {
    // Test default risk via database service
    console.log('Testing getBorrowerDefaultRisk service...');
    const defaultRisk = await mcpDatabaseService.getBorrowerDefaultRisk('B003');
    
    if (defaultRisk && defaultRisk.borrower_id === 'B003') {
      console.log('✅ Successfully retrieved default risk:');
      console.log(`   Risk score: ${defaultRisk.default_risk_score || defaultRisk.risk_score}`);
      console.log(`   Risk level: ${defaultRisk.risk_level || defaultRisk.risk_category}`);
      return true;
    } else {
      console.log('❌ Unexpected response from database service');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing default risk:', error.message);
    
    // Try with a different borrower if B003 doesn't exist
    try {
      console.log('Trying with borrower B001 instead...');
      const defaultRisk = await mcpDatabaseService.getBorrowerDefaultRisk('B001');
      
      if (defaultRisk && defaultRisk.borrower_id === 'B001') {
        console.log('✅ Successfully retrieved default risk for B001:');
        console.log(`   Risk score: ${defaultRisk.default_risk_score || defaultRisk.risk_score}`);
        console.log(`   Risk level: ${defaultRisk.risk_level || defaultRisk.risk_category}`);
        return true;
      } else {
        console.log('❌ Failed to retrieve default risk for any borrower');
        return false;
      }
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      return false;
    }
  }
}

/**
 * Test non-accrual risk assessment for borrower B001
 */
async function testNonAccrualRisk() {
  console.log('\n🔍 TESTING NON-ACCRUAL RISK ASSESSMENT');
  console.log('===================================');
  
  try {
    // Test non-accrual risk via database service
    console.log('Testing getBorrowerNonAccrualRisk service...');
    const nonAccrualRisk = await mcpDatabaseService.getBorrowerNonAccrualRisk('B001');
    
    if (nonAccrualRisk && nonAccrualRisk.borrower_id === 'B001') {
      console.log('✅ Successfully retrieved non-accrual risk:');
      console.log(`   Risk level: ${nonAccrualRisk.risk_level}`);
      console.log(`   Risk score: ${nonAccrualRisk.risk_score}`);
      return true;
    } else {
      console.log('❌ Unexpected response from database service');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing non-accrual risk:', error.message);
    return false;
  }
}

/**
 * Test collateral sufficiency evaluation for loan L001
 */
async function testCollateralSufficiency() {
  console.log('\n🔍 TESTING COLLATERAL SUFFICIENCY EVALUATION');
  console.log('==========================================');
  
  try {
    // Test collateral sufficiency via database service
    console.log('Testing evaluateCollateralSufficiency service...');
    const collateralEval = await mcpDatabaseService.evaluateCollateralSufficiency('L001');
    
    if (collateralEval && typeof collateralEval.isCollateralSufficient === 'boolean') {
      console.log('✅ Successfully retrieved collateral evaluation:');
      console.log(`   Is sufficient: ${collateralEval.isCollateralSufficient}`);
      console.log(`   LTV ratio: ${collateralEval.ltvRatio}`);
      console.log(`   Collateral value: $${collateralEval.collateralValue}`);
      return true;
    } else {
      console.log('❌ Unexpected response from database service');
      console.log('   Expected: object with isCollateralSufficient property');
      console.log('   Received:', collateralEval);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing collateral sufficiency:', error.message);
    return false;
  }
}

/**
 * Test high-risk farmers identification
 */
async function testHighRiskFarmers() {
  console.log('\n🔍 TESTING HIGH-RISK FARMERS IDENTIFICATION');
  console.log('=========================================');
  
  try {
    // Test high-risk farmers identification via data service
    console.log('Testing getHighRiskFarmers service...');
    
    // Import the dataService for this specific function
    const dataService = require('../../services/dataService');
    const highRiskFarmers = await dataService.getHighRiskFarmers();
    
    if (highRiskFarmers && Array.isArray(highRiskFarmers.high_risk_farmers)) {
      console.log('✅ Successfully retrieved high-risk farmers:');
      console.log(`   Count: ${highRiskFarmers.high_risk_farmers.length}`);
      console.log(`   Total assessed: ${highRiskFarmers.total_count}`);
      return true;
    } else {
      console.log('❌ Unexpected response from data service');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing high-risk farmers:', error.message);
    return false;
  }
}

/**
 * Test loan summary functionality
 */
async function testLoanSummary() {
  console.log('\n🔍 TESTING LOAN SUMMARY');
  console.log('=====================');
  
  try {
    // Test loan summary via database service
    console.log('Testing getLoanSummary service...');
    const loanSummary = await mcpDatabaseService.getLoanSummary();
    
    if (loanSummary && typeof loanSummary.total_loans === 'number') {
      console.log('✅ Successfully retrieved loan summary:');
      console.log(`   Total loans: ${loanSummary.total_loans}`);
      console.log(`   Active loans: ${loanSummary.active_loans}`);
      console.log(`   Total amount: $${loanSummary.total_loan_amount}`);
      return true;
    } else {
      console.log('❌ Unexpected response from database service');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing loan summary:', error.message);
    return false;
  }
}

/**
 * Run all tests and report results
 */
async function runAllTests() {
  console.log('🚀 STARTING COMBINED RISK ASSESSMENT TEST SUITE');
  console.log('==============================================');
  console.log('Updated for SQL-only architecture - no server required');
  
  // First check database connection
  const dbConnectionResult = await testDatabaseConnection();
  if (!dbConnectionResult) {
    console.log('\n❌ DATABASE CONNECTION FAILED');
    console.log('Cannot proceed with tests without database connection.');
    process.exit(1);
  }
  
  // Run all risk assessment tests
  const defaultRiskResult = await testDefaultRisk();
  const nonAccrualRiskResult = await testNonAccrualRisk();
  const collateralSufficiencyResult = await testCollateralSufficiency();
  const highRiskFarmersResult = await testHighRiskFarmers();
  const loanSummaryResult = await testLoanSummary();
  
  // Output summary
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('====================');
  console.log(`Database Connection: ${dbConnectionResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Default Risk Prediction: ${defaultRiskResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Non-Accrual Risk Assessment: ${nonAccrualRiskResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Collateral Sufficiency Evaluation: ${collateralSufficiencyResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`High-Risk Farmers Identification: ${highRiskFarmersResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Loan Summary: ${loanSummaryResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = dbConnectionResult && defaultRiskResult && nonAccrualRiskResult && 
                    collateralSufficiencyResult && highRiskFarmersResult && loanSummaryResult;
  
  if (allPassed) {
    console.log('\n🎉 ALL RISK ASSESSMENT TESTS PASSED!');
    console.log('SQL-only architecture working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ SOME RISK ASSESSMENT TESTS FAILED');
    console.log('Please check database connection and configuration.');
    process.exit(1);
  }
}

// Run all tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testDatabaseConnection,
  testDefaultRisk,
  testNonAccrualRisk,
  testCollateralSufficiency,
  testHighRiskFarmers,
  testLoanSummary,
  runAllTests
}; 