/**
 * Manual test for Predictive Analytics MCP Functions
 * 
 * This file provides a simple way to test the three predictive analytics functions:
 * - recommendLoanRestructuring
 * - assessCropYieldRisk
 * - analyzeMarketPriceImpact
 * 
 * Run with: node tests/manual-analytics-test.js
 */

const mcpFunctionRegistry = require('../services/mcpFunctionRegistry');

// Test the loan restructuring function
async function testLoanRestructuring() {
  console.log('Testing recommendLoanRestructuring function...');
  
  try {
    const result = await mcpFunctionRegistry.executeFunction('recommendLoanRestructuring', { loan_id: 'L001' });
    console.log('SUCCESS: Loan restructuring function returned:');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('ERROR: Loan restructuring function failed:', error.message);
    return false;
  }
}

// Test the crop yield risk function
async function testCropYieldRisk() {
  console.log('\nTesting assessCropYieldRisk function...');
  
  try {
    const result = await mcpFunctionRegistry.executeFunction('assessCropYieldRisk', { 
      borrower_id: 'B001',
      crop_type: 'corn',
      season: 'current'
    });
    console.log('SUCCESS: Crop yield risk function returned:');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('ERROR: Crop yield risk function failed:', error.message);
    return false;
  }
}

// Test the market price impact function
async function testMarketPriceImpact() {
  console.log('\nTesting analyzeMarketPriceImpact function...');
  
  try {
    const result = await mcpFunctionRegistry.executeFunction('analyzeMarketPriceImpact', { 
      commodity: 'corn',
      price_change_percent: '-10%'
    });
    console.log('SUCCESS: Market price impact function returned:');
    console.log(JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('ERROR: Market price impact function failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('=== PREDICTIVE ANALYTICS MCP FUNCTIONS TEST ===\n');
  
  let passCount = 0;
  let failCount = 0;
  
  // Test loan restructuring
  if (await testLoanRestructuring()) {
    passCount++;
  } else {
    failCount++;
  }
  
  // Test crop yield risk
  if (await testCropYieldRisk()) {
    passCount++;
  } else {
    failCount++;
  }
  
  // Test market price impact
  if (await testMarketPriceImpact()) {
    passCount++;
  } else {
    failCount++;
  }
  
  // Print summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Tests passed: ${passCount}`);
  console.log(`Tests failed: ${failCount}`);
  console.log(`Total tests: ${passCount + failCount}`);
  
  if (failCount === 0) {
    console.log('\n✅ All predictive analytics MCP functions are working correctly!');
  } else {
    console.log('\n❌ Some predictive analytics MCP functions are not working correctly.');
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Error running tests:', error);
}); 