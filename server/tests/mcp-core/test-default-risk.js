/**
 * Test Default Risk Assessment MCP Function
 * 
 * This test validates the default risk assessment function
 * by testing various borrower scenarios and risk factors.
 */

const mcpFunctionRegistry = require('../../services/mcpFunctionRegistry');
const db = require('../../../utils/database'); // Import database utility

// Mock data for testing
const mockBorrowers = [
  {
    borrower_id: 'B001',
    first_name: 'John',
    last_name: 'Doe',
    credit_score: 750,
    income: 100000,
    farm_size: 500,
    farm_type: 'Crop'
  },
  {
    borrower_id: 'B002',
    first_name: 'Jane',
    last_name: 'Smith',
    credit_score: 580,
    income: 75000,
    farm_size: 200,
    farm_type: 'Livestock'
  }
];

async function testDefaultRiskAssessment() {
  console.log('🧪 Testing Default Risk Assessment Function...\n');
  
  try {
    // Test 1: Standard default risk assessment
    console.log('Test 1: Default risk assessment for borrower B001');
    const result1 = await mcpFunctionRegistry.executeFunction('getBorrowerDefaultRisk', {
      borrowerId: 'B001',
      timeHorizon: 'medium_term'
    });
    
    console.log('✅ Result:', JSON.stringify(result1, null, 2));
    
    // Test 2: High risk borrower
    console.log('\nTest 2: Default risk assessment for high-risk borrower B002');
    const result2 = await mcpFunctionRegistry.executeFunction('getBorrowerDefaultRisk', {
      borrowerId: 'B002',
      timeHorizon: 'short_term'
    });
    
    console.log('✅ Result:', JSON.stringify(result2, null, 2));
    
    // Test 3: Non-existent borrower
    console.log('\nTest 3: Non-existent borrower test');
    const result3 = await mcpFunctionRegistry.executeFunction('getBorrowerDefaultRisk', {
      borrowerId: 'B999',
      timeHorizon: 'medium_term'
    });
    
    console.log('✅ Result:', JSON.stringify(result3, null, 2));
    
    console.log('\n🎉 All default risk assessment tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 STARTING DEFAULT RISK ASSESSMENT TESTS');
  console.log('='.repeat(60));
  
  await testDefaultRiskAssessment();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(60));
}

// Export for use in other test runners
module.exports = {
  testDefaultRiskAssessment,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .catch(console.error)
    .finally(() => db.disconnect());
} 