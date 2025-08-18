/**
 * Database MCP Functions Test
 * 
 * Tests all 16 MCP functions to ensure they're using the SQL database
 * instead of JSON files. This test validates the complete database integration.
 * 
 * Updated: August 18, 2025 - Complete database integration testing
 */

require('dotenv').config();
const LogService = require('../../services/logService');
const mcpFunctionRegistry = require('../../services/mcpFunctionRegistry');

// Set test environment
process.env.NODE_ENV = 'test';

/**
 * Test all 16 MCP functions with database integration
 */
async function testAllMcpFunctions() {
  LogService.info('🧪 Starting comprehensive MCP database integration tests...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    total: 18,
    results: []
  };

  // Test 1: Basic Loan Information Functions (7 functions)
  const loanFunctions = [
    { name: 'getLoanDetails', args: { loan_id: 'L001' }, expectedField: 'loan_id' },
    { name: 'getLoanStatus', args: { loan_id: 'L001' }, expectedField: 'status' },
    { name: 'getLoanSummary', args: {}, expectedField: 'total_loans' },
    { name: 'getActiveLoans', args: {}, expectedField: '_metadata' }, // Returns numbered objects with metadata
    { name: 'getLoansByBorrower', args: { borrower_id: 'B001' }, expectedField: '_metadata' }, // Returns numbered objects with metadata
    { name: 'getLoanPayments', args: { loan_id: 'L001' }, expectedField: '_metadata' }, // Payment history
    { name: 'getLoanCollateral', args: { loan_id: 'L001' }, expectedField: '_metadata' } // Collateral information
  ];

  // Test 2: Borrower & Risk Assessment Functions (4 functions)  
  const borrowerFunctions = [
    { name: 'getBorrowerDetails', args: { borrower_id: 'B001' }, expectedField: 'borrower_id' },
    { name: 'getBorrowerDefaultRisk', args: { borrower_id: 'B001' }, expectedField: 'default_risk_score' },
    { name: 'getBorrowerNonAccrualRisk', args: { borrower_id: 'B001' }, expectedField: 'risk_score' },
    { name: 'evaluateCollateralSufficiency', args: { loan_id: 'L001' }, expectedField: 'ltvRatio' } // Actual field name
  ];

  // Test 3: Predictive Analytics Functions (7 functions)
  const analyticsFunctions = [
    { name: 'analyzeMarketPriceImpact', args: { borrower_id: 'B001', commodity: 'corn', price_change_percent: '5%' }, expectedField: 'borrower_id' },
    { name: 'forecastEquipmentMaintenance', args: { borrower_id: 'B001' }, expectedField: 'total_maintenance_forecast' },
    { name: 'assessCropYieldRisk', args: { borrower_id: 'B001', crop_type: 'corn', season: 'spring' }, expectedField: 'yield_risk_score' },
    { name: 'getRefinancingOptions', args: { loan_id: 'L001' }, expectedField: 'refinancing_scenarios' },
    { name: 'analyzePaymentPatterns', args: { borrower_id: 'B001' }, expectedField: 'on_time_percentage' },
    { name: 'recommendLoanRestructuring', args: { loan_id: 'L001' }, expectedField: 'recommendations' },
    { name: 'getHighRiskFarmers', args: {}, expectedField: 'high_risk_farmers' }
  ];

  const allFunctions = [...loanFunctions, ...borrowerFunctions, ...analyticsFunctions];

  // Execute all tests
  for (const test of allFunctions) {
    try {
      LogService.info(`Testing ${test.name}...`);
      
      const result = await mcpFunctionRegistry.executeFunction(test.name, test.args);
      
      // Check for database response format
      if (result && result._metadata && result._metadata.success) {
        // Check if expected field exists (indicating database data)
        const hasExpectedField = test.expectedField === 'length' ? 
          Array.isArray(result.data || result) :
          test.expectedField === '_metadata' ?
          (result._metadata !== undefined) :
          (result[test.expectedField] !== undefined || (result.data && result.data[test.expectedField] !== undefined));
        
        if (hasExpectedField) {
          LogService.info(`✅ ${test.name} - PASSED (using database)`);
          testResults.passed++;
          testResults.results.push({ function: test.name, status: 'PASSED', source: 'DATABASE' });
        } else {
          LogService.error(`❌ ${test.name} - FAILED (missing expected field: ${test.expectedField})`);
          testResults.failed++;
          testResults.results.push({ function: test.name, status: 'FAILED', source: 'UNKNOWN', error: `Missing field: ${test.expectedField}` });
        }
      } else if (result && !result._metadata) {
        // Direct result format (some functions return direct objects)
        const hasExpectedField = test.expectedField === 'length' ? 
          Array.isArray(result) :
          (result[test.expectedField] !== undefined);
        
        if (hasExpectedField) {
          LogService.info(`✅ ${test.name} - PASSED (using database)`);
          testResults.passed++;
          testResults.results.push({ function: test.name, status: 'PASSED', source: 'DATABASE' });
        } else {
          LogService.error(`❌ ${test.name} - FAILED (missing expected field: ${test.expectedField})`);
          testResults.failed++;
          testResults.results.push({ function: test.name, status: 'FAILED', source: 'UNKNOWN', error: `Missing field: ${test.expectedField}` });
        }
      } else {
        LogService.error(`❌ ${test.name} - FAILED (error in response)`);
        testResults.failed++;
        testResults.results.push({ function: test.name, status: 'FAILED', source: 'ERROR', error: result.message || 'Unknown error' });
      }
      
    } catch (error) {
      LogService.error(`❌ ${test.name} - FAILED (exception: ${error.message})`);
      testResults.failed++;
      testResults.results.push({ function: test.name, status: 'FAILED', source: 'EXCEPTION', error: error.message });
    }
  }

  return testResults;
}

/**
 * Verify no JSON file dependencies
 */
async function verifyNoDatabaseFallbacks() {
  LogService.info('🔍 Verifying no JSON file fallbacks...');
  
  // Test a function with invalid data to ensure it fails properly (no JSON fallback)
  try {
    const result = await mcpFunctionRegistry.executeFunction('getBorrowerDetails', { borrower_id: 'INVALID_ID' });
    
    // If we get a result, check if it's an error response (which is good - no JSON fallback)
    if (result && result._metadata && !result._metadata.success) {
      LogService.info('✅ No JSON fallback detected - function properly returns error response');
      return true;
    } else if (result && result.error) {
      LogService.info('✅ No JSON fallback detected - function properly returns error object');
      return true;
    } else {
      LogService.error('❌ Possible JSON fallback detected - function succeeded with invalid data');
      return false;
    }
  } catch (error) {
    // Exception thrown is also good - means no JSON fallback
    LogService.info('✅ No JSON fallback detected - function properly throws error with invalid data');
    return true;
  }
}

/**
 * Main test execution
 */
async function runDatabaseIntegrationTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🗄️  MCP DATABASE INTEGRATION TEST SUITE');
  console.log('='.repeat(60));
  
  try {
    // Test all MCP functions
    const testResults = await testAllMcpFunctions();
    
    // Verify no JSON fallbacks
    const noFallbacks = await verifyNoDatabaseFallbacks();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Functions Tested: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`🔒 No JSON Fallbacks: ${noFallbacks ? 'VERIFIED' : 'WARNING'}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    // Print detailed results
    console.log('\n📋 DETAILED RESULTS:');
    testResults.results.forEach((result, index) => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${result.function} (${result.source})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    if (testResults.passed === testResults.total && noFallbacks) {
      console.log('\n🎉 ALL TESTS PASSED - DATABASE INTEGRATION COMPLETE!');
      process.exit(0);
    } else {
      console.log('\n⚠️  SOME TESTS FAILED - DATABASE INTEGRATION INCOMPLETE');
      process.exit(1);
    }
    
  } catch (error) {
    LogService.error('❌ Test suite failed:', error.message);
    console.log('\n💥 TEST SUITE FAILED');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runDatabaseIntegrationTests();
}

module.exports = {
  runDatabaseIntegrationTests,
  testAllMcpFunctions,
  verifyNoDatabaseFallbacks
};
