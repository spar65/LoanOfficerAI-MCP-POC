/**
 * Test script to verify the Basic Loan Information MCP functions
 * 
 * This script tests:
 * - getLoanDetails
 * - getBorrowerDetails
 * - getActiveLoans
 * - getLoansByBorrower
 * - getLoanSummary
 * 
 * Updated to work with SQL-only architecture - no server required
 */
const LogService = require('../../services/logService');
const mcpDatabaseService = require('../../services/mcpDatabaseService');

// Set test environment to avoid production checks
process.env.NODE_ENV = 'test';
process.env.USE_DATABASE = 'true';

/**
 * Test the getLoanDetails function directly
 */
async function testGetLoanDetails() {
  console.log('\n🔍 TESTING getLoanDetails FUNCTION');
  console.log('================================');
  
  try {
    // Test via direct mcpDatabaseService call
    console.log('Testing direct database service call...');
    const loanDetails = await mcpDatabaseService.getLoanDetails('L001');
    
    if (loanDetails && loanDetails.loan_id === 'L001') {
      console.log('✅ Successfully retrieved loan details:');
      console.log(`   Loan ID: ${loanDetails.loan_id}`);
      console.log(`   Loan Amount: $${loanDetails.loan_amount}`);
      console.log(`   Interest Rate: ${loanDetails.interest_rate}%`);
      console.log(`   Status: ${loanDetails.status}`);
      return true;
    } else {
      console.log('❌ Unexpected response from database service');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getLoanDetails:', error.message);
    return false;
  }
}

/**
 * Test the getBorrowerDetails function directly
 */
async function testGetBorrowerDetails() {
  console.log('\n🔍 TESTING getBorrowerDetails FUNCTION');
  console.log('====================================');
  
  try {
    // Test via direct mcpDatabaseService call
    console.log('Testing direct database service call...');
    const borrowerDetails = await mcpDatabaseService.getBorrowerDetails('B001');
    
    if (borrowerDetails && borrowerDetails.borrower_id === 'B001') {
      console.log('✅ Successfully retrieved borrower details:');
      console.log(`   Borrower ID: ${borrowerDetails.borrower_id}`);
      console.log(`   Name: ${borrowerDetails.first_name} ${borrowerDetails.last_name}`);
      console.log(`   Credit Score: ${borrowerDetails.credit_score}`);
      return true;
    } else {
      console.log('❌ Unexpected response from database service');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getBorrowerDetails:', error.message);
    return false;
  }
}

/**
 * Test the getActiveLoans function directly
 */
async function testGetActiveLoans() {
  console.log('\n🔍 TESTING getActiveLoans FUNCTION');
  console.log('================================');
  
  try {
    // Test via direct mcpDatabaseService call
    console.log('Testing direct database service call...');
    const activeLoans = await mcpDatabaseService.getActiveLoans();
    
    if (activeLoans && Array.isArray(activeLoans)) {
      console.log('✅ Successfully retrieved active loans:');
      console.log(`   Count: ${activeLoans.length}`);
      if (activeLoans.length > 0) {
        console.log(`   First loan: ${activeLoans[0].loan_id} - $${activeLoans[0].loan_amount}`);
      }
      return true;
    } else {
      console.log('❌ Unexpected response from database service');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getActiveLoans:', error.message);
    return false;
  }
}

/**
 * Test the getLoansByBorrower function directly
 */
async function testGetLoansByBorrower() {
  console.log('\n🔍 TESTING getLoansByBorrower FUNCTION');
  console.log('====================================');
  
  try {
    // Test via direct mcpDatabaseService call
    console.log('Testing direct database service call...');
    const borrowerLoans = await mcpDatabaseService.getLoansByBorrower('John');
    
    if (borrowerLoans && Array.isArray(borrowerLoans)) {
      console.log('✅ Successfully retrieved loans for borrower:');
      console.log(`   Count: ${borrowerLoans.length}`);
      if (borrowerLoans.length > 0) {
        console.log(`   First loan: ${borrowerLoans[0].loan_id} - $${borrowerLoans[0].loan_amount}`);
      }
      return true;
    } else {
      console.log('❌ Unexpected response from database service');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getLoansByBorrower:', error.message);
    return false;
  }
}

/**
 * Test the getLoanSummary function directly
 */
async function testGetLoanSummary() {
  console.log('\n🔍 TESTING getLoanSummary FUNCTION');
  console.log('================================');
  
  try {
    // Test via direct mcpDatabaseService call
    console.log('Testing direct database service call...');
    const loanSummary = await mcpDatabaseService.getLoanSummary();
    
    if (loanSummary && typeof loanSummary === 'object') {
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
    console.error('❌ Error testing getLoanSummary:', error.message);
    return false;
  }
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  console.log('\n🔍 TESTING DATABASE CONNECTION');
  console.log('=============================');
  
  try {
    // Test basic database connectivity
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
 * Run all tests and report results
 */
async function runAllTests() {
  console.log('🚀 STARTING BASIC LOAN INFORMATION TEST SUITE');
  console.log('===========================================');
  console.log('Updated for SQL-only architecture - no server required');
  
  // First check database connection
  const dbConnectionResult = await testDatabaseConnection();
  if (!dbConnectionResult) {
    console.log('\n❌ DATABASE CONNECTION FAILED');
    console.log('Cannot proceed with tests without database connection.');
    process.exit(1);
  }
  
  // Run all tests
  const loanDetailsResult = await testGetLoanDetails();
  const borrowerDetailsResult = await testGetBorrowerDetails();
  const activeLoansResult = await testGetActiveLoans();
  const loansByBorrowerResult = await testGetLoansByBorrower();
  const loanSummaryResult = await testGetLoanSummary();
  
  // Output summary
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('====================');
  console.log(`Database Connection: ${dbConnectionResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getLoanDetails: ${loanDetailsResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getBorrowerDetails: ${borrowerDetailsResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getActiveLoans: ${activeLoansResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getLoansByBorrower: ${loansByBorrowerResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getLoanSummary: ${loanSummaryResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = dbConnectionResult && loanDetailsResult && borrowerDetailsResult && 
                    activeLoansResult && loansByBorrowerResult && loanSummaryResult;
  
  if (allPassed) {
    console.log('\n🎉 ALL BASIC LOAN INFORMATION TESTS PASSED!');
    console.log('SQL-only architecture working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️ SOME BASIC LOAN INFORMATION TESTS FAILED');
    console.log('Please check database connection and configuration.');
    process.exit(1);
  }
}

// Run all tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testGetLoanDetails,
  testGetBorrowerDetails,
  testGetActiveLoans,
  testGetLoansByBorrower,
  testGetLoanSummary,
  testDatabaseConnection,
  runAllTests
}; 