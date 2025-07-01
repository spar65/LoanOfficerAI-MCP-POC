/**
 * Test script to verify the Basic Loan Information MCP functions
 * 
 * This script tests:
 * - getLoanDetails
 * - getBorrowerDetails
 * - getActiveLoans
 * - getLoansByBorrower
 * - getLoanSummary
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
 * Test the getLoanDetails MCP function
 */
async function testGetLoanDetails() {
  console.log('\n🔍 TESTING getLoanDetails FUNCTION');
  console.log('================================');
  
  try {
    // Test via direct API endpoint
    console.log('Testing direct API endpoint...');
    const response = await axios.get(
      `${BASE_URL}/mcp/loan/L001`,
      TEST_CONFIG
    );
    
    if (response.data && response.data.loan_id === 'L001') {
      console.log('✅ Successfully retrieved loan details:');
      console.log(`   Loan ID: ${response.data.loan_id}`);
      console.log(`   Loan Amount: $${response.data.loan_amount}`);
      console.log(`   Interest Rate: ${response.data.interest_rate}%`);
      console.log(`   Status: ${response.data.status}`);
      return true;
    } else {
      console.log('❌ Unexpected response from API endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getLoanDetails:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test the getBorrowerDetails MCP function
 */
async function testGetBorrowerDetails() {
  console.log('\n🔍 TESTING getBorrowerDetails FUNCTION');
  console.log('====================================');
  
  try {
    // Test via direct API endpoint
    console.log('Testing direct API endpoint...');
    const response = await axios.get(
      `${BASE_URL}/mcp/borrower/B001`,
      TEST_CONFIG
    );
    
    if (response.data && response.data.borrower_id === 'B001') {
      console.log('✅ Successfully retrieved borrower details:');
      console.log(`   Borrower ID: ${response.data.borrower_id}`);
      console.log(`   Name: ${response.data.first_name} ${response.data.last_name}`);
      console.log(`   Credit Score: ${response.data.credit_score}`);
      return true;
    } else {
      console.log('❌ Unexpected response from API endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getBorrowerDetails:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test the getActiveLoans function through the loans API
 */
async function testGetActiveLoans() {
  console.log('\n🔍 TESTING getActiveLoans FUNCTION');
  console.log('================================');
  
  try {
    // Test via loans API endpoint
    console.log('Testing loans API endpoint...');
    const response = await axios.get(
      `${BASE_URL}/loans/active`,
      TEST_CONFIG
    );
    
    if (response.data && Array.isArray(response.data)) {
      console.log('✅ Successfully retrieved active loans:');
      console.log(`   Count: ${response.data.length}`);
      if (response.data.length > 0) {
        console.log(`   First loan: ${response.data[0].loan_id} - $${response.data[0].loan_amount}`);
      }
      return true;
    } else {
      console.log('❌ Unexpected response from API endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getActiveLoans:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test the getLoansByBorrower function through the loans API
 */
async function testGetLoansByBorrower() {
  console.log('\n🔍 TESTING getLoansByBorrower FUNCTION');
  console.log('====================================');
  
  try {
    // Test via loans API endpoint
    console.log('Testing loans API endpoint...');
    const response = await axios.get(
      `${BASE_URL}/loans/borrower/B001`,
      TEST_CONFIG
    );
    
    if (response.data && Array.isArray(response.data)) {
      console.log('✅ Successfully retrieved loans for borrower:');
      console.log(`   Count: ${response.data.length}`);
      if (response.data.length > 0) {
        console.log(`   First loan: ${response.data[0].loan_id} - $${response.data[0].loan_amount}`);
      }
      return true;
    } else {
      console.log('❌ Unexpected response from API endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getLoansByBorrower:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test the getLoanSummary function through the loans API
 */
async function testGetLoanSummary() {
  console.log('\n🔍 TESTING getLoanSummary FUNCTION');
  console.log('================================');
  
  try {
    // Test via loans API endpoint
    console.log('Testing loans API endpoint...');
    const response = await axios.get(
      `${BASE_URL}/loans/summary`,
      TEST_CONFIG
    );
    
    if (response.data) {
      console.log('✅ Successfully retrieved loan summary:');
      console.log(`   Total loans: ${response.data.totalLoans}`);
      console.log(`   Active loans: ${response.data.activeLoans}`);
      console.log(`   Total amount: $${response.data.totalAmount}`);
      return true;
    } else {
      console.log('❌ Unexpected response from API endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing getLoanSummary:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return false;
  }
}

/**
 * Test the OpenAI function calling for loan information
 */
async function testOpenAIFunctionCalling() {
  console.log('\n🔍 TESTING OPENAI FUNCTION CALLING');
  console.log('================================');
  
  try {
    // Test OpenAI endpoint with function calling
    console.log('Testing OpenAI endpoint with function calling...');
    const response = await axios.post(
      `${BASE_URL}/openai/chat`,
      {
        messages: [
          { role: 'user', content: 'Tell me about loan L001' }
        ],
        function_call: 'auto'
      },
      TEST_CONFIG
    );
    
    if (response.data && response.data.content) {
      console.log('✅ Successfully received OpenAI response:');
      console.log(`   Response: ${response.data.content.substring(0, 150)}...`);
      return true;
    } else {
      console.log('❌ Unexpected response from OpenAI endpoint');
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing OpenAI function calling:', error.message);
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
  console.log('🚀 STARTING BASIC LOAN INFORMATION TEST SUITE');
  console.log('===========================================');
  
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
  const loanDetailsResult = await testGetLoanDetails();
  const borrowerDetailsResult = await testGetBorrowerDetails();
  const activeLoansResult = await testGetActiveLoans();
  const loansByBorrowerResult = await testGetLoansByBorrower();
  const loanSummaryResult = await testGetLoanSummary();
  const openAIResult = await testOpenAIFunctionCalling();
  
  // Output summary
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('====================');
  console.log(`getLoanDetails: ${loanDetailsResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getBorrowerDetails: ${borrowerDetailsResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getActiveLoans: ${activeLoansResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getLoansByBorrower: ${loansByBorrowerResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`getLoanSummary: ${loanSummaryResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`OpenAI Function Calling: ${openAIResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = loanDetailsResult && borrowerDetailsResult && 
                    activeLoansResult && loansByBorrowerResult && 
                    loanSummaryResult && openAIResult;
  
  if (allPassed) {
    console.log('\n🎉 ALL BASIC LOAN INFORMATION TESTS PASSED!');
    process.exit(0);
  } else {
    console.log('\n⚠️ SOME BASIC LOAN INFORMATION TESTS FAILED');
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
  testOpenAIFunctionCalling,
  runAllTests
}; 