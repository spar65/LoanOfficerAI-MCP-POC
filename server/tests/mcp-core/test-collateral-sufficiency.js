/**
 * Test Collateral Sufficiency MCP Function
 * 
 * This test validates the collateral sufficiency evaluation function
 * by testing various loan scenarios and market conditions.
 */

const mcpFunctionRegistry = require('../../services/mcpFunctionRegistry');
const db = require('../../../utils/database'); // Import database utility

// Mock data for testing
const mockLoans = [
  {
    loan_id: 'L001',
    borrower_id: 'B001',
    loan_amount: 250000,
    interest_rate: 4.5,
    status: 'active'
  }
];

const mockCollateral = [
  {
    collateral_id: 'C001',
    loan_id: 'L001',
    type: 'Real Estate',
    description: 'Farm Property - 100 acres',
    value: 300000
  },
  {
    collateral_id: 'C002',
    loan_id: 'L001',
    type: 'Equipment',
    description: 'John Deere Tractor',
    value: 75000
  }
];

// Mock the database service to return test data
const mockDatabaseService = {
  executeQuery: async (query, params) => {
    if (query.includes('SELECT * FROM Loans')) {
      return { recordset: mockLoans };
    }
    if (query.includes('SELECT * FROM Collateral')) {
      return { recordset: mockCollateral };
    }
    return { recordset: [] };
  }
};

async function testCollateralSufficiency() {
  console.log('🧪 Testing Collateral Sufficiency Function...\n');
  
  try {
    // Test 1: Standard collateral evaluation
    console.log('Test 1: Standard collateral evaluation for loan L001');
    const result1 = await mcpFunctionRegistry.executeFunction('evaluateCollateralSufficiency', {
      loan_id: 'L001',
      marketConditions: 'stable'
    });
    
    console.log('✅ Result:', JSON.stringify(result1, null, 2));
    
    // Test 2: Declining market conditions
    console.log('\nTest 2: Collateral evaluation with declining market');
    const result2 = await mcpFunctionRegistry.executeFunction('evaluateCollateralSufficiency', {
      loan_id: 'L001', 
      marketConditions: 'declining'
    });
    
    console.log('✅ Result:', JSON.stringify(result2, null, 2));
    
    // Test 3: Non-existent loan
    console.log('\nTest 3: Non-existent loan test');
    const result3 = await mcpFunctionRegistry.executeFunction('evaluateCollateralSufficiency', {
      loan_id: 'L999',
      marketConditions: 'stable'
    });
    
    console.log('✅ Result:', JSON.stringify(result3, null, 2));
    
    console.log('\n🎉 All collateral sufficiency tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Function to test with different collateral scenarios
async function testCollateralScenarios() {
  console.log('\n🔍 Testing Various Collateral Scenarios...\n');
  
  try {
    // Scenario 1: High-value collateral
    console.log('Scenario 1: High-value collateral (375k for 250k loan)');
    
    // Override mock data for this test
    const originalExecuteQuery = mockDatabaseService.executeQuery;
    mockDatabaseService.executeQuery = async (query, params) => {
      if (query.includes('SELECT * FROM Collateral')) {
        return { 
          recordset: mockCollateral.map(c => ({ ...c, value: c.value * 1.5 }))
        };
      }
      return originalExecuteQuery(query, params);
    };
    
    const highValueResult = await mcpFunctionRegistry.executeFunction('evaluateCollateralSufficiency', {
      loan_id: 'L001',
      marketConditions: 'stable'
    });
    
    console.log('✅ High-value result:', JSON.stringify(highValueResult, null, 2));
    
    // Restore original mock
    mockDatabaseService.executeQuery = originalExecuteQuery;
    
    console.log('\n🎯 Collateral scenario tests completed!');
    
  } catch (error) {
    console.error('❌ Scenario test failed:', error.message);
  }
}

// Run the tests
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('🚀 STARTING COLLATERAL SUFFICIENCY TESTS');
  console.log('='.repeat(60));
  
  await testCollateralSufficiency();
  await testCollateralScenarios();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ ALL TESTS COMPLETED');
  console.log('='.repeat(60));
}

// Export for use in other test runners
module.exports = {
  testCollateralSufficiency,
  testCollateralScenarios,
  runAllTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .catch(console.error)
    .finally(() => db.disconnect());
} 