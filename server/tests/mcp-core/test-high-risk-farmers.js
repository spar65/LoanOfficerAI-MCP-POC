/**
 * Test High Risk Farmers MCP Function
 * 
 * This test validates the high risk farmers identification function
 * by testing various risk scenarios and thresholds.
 */

const mcpFunctionRegistry = require('../../services/mcpFunctionRegistry');
const db = require('../../../utils/database'); // Import database utility

// Mock data for testing
const mockBorrowers = [
  {
    borrower_id: 'B001',
    first_name: 'John',
    last_name: 'Doe',
    credit_score: 650,
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

async function testHighRiskFarmers() {
  console.log('🧪 Testing High Risk Farmers Function...\n');
  
  try {
    // Test 1: Standard high risk assessment
    console.log('Test 1: Identifying high risk farmers');
    const result1 = await mcpFunctionRegistry.executeFunction('getHighRiskFarmers', {
      timeHorizon: '3m',
      threshold: 'high'
    });
    
    console.log('✅ Result:', JSON.stringify(result1, null, 2));
    
    // Test 2: Medium risk threshold
    console.log('\nTest 2: Medium risk threshold assessment');
    const result2 = await mcpFunctionRegistry.executeFunction('getHighRiskFarmers', {
      timeHorizon: '6m',
      threshold: 'medium'
    });
    
    console.log('✅ Result:', JSON.stringify(result2, null, 2));
    
    console.log('\n🎉 All high risk farmers tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 STARTING HIGH RISK FARMERS TESTS');
  console.log('='.repeat(60));
  
  await testHighRiskFarmers();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(60));
}

// Export for use in other test runners
module.exports = {
  testHighRiskFarmers,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .catch(console.error)
    .finally(async () => {
      await db.disconnect();
    });
} 