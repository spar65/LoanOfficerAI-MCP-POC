/**
 * Test script to verify the non-accrual risk functionality for borrower B001
 * Updated to work with SQL-only architecture - no server required
 */
require('dotenv').config();
const LogService = require('../../services/logService');
const mcpDatabaseService = require('../../services/mcpDatabaseService');

// Set test environment to avoid production checks
process.env.NODE_ENV = 'test';
process.env.USE_DATABASE = 'true';

/**
 * Test database connection and basic functionality
 */
async function testDatabaseConnection() {
  LogService.info('Testing database connection...');

  try {
    // Test basic database connectivity
    const result = await mcpDatabaseService.executeQuery('SELECT 1 as test', {});
    
    if (result && (result.recordset || result)) {
      LogService.info('✓ Database connection successful');
      return true;
    } else {
      LogService.error('✗ Database connection failed - no results');
      return false;
    }
  } catch (error) {
    LogService.error('✗ Database connection error:', error.message);
    LogService.error('   This test requires a SQL Server database connection.');
    LogService.error('   Please ensure:');
    LogService.error('   1. SQL Server is running and accessible');
    LogService.error('   2. USE_DATABASE=true is set in your .env file');
    LogService.error('   3. Database connection string is properly configured');
    return false;
  }
}

/**
 * Verify all the data required for non-accrual risk assessment
 */
async function verifyRequiredData() {
  LogService.info('Starting verification of required data...');

  // 1. Check if borrower B001 exists
  LogService.info('Step 1: Checking if borrower B001 exists...');
  try {
    const borrower = await mcpDatabaseService.getBorrowerDetails('B001');
    
    if (borrower && borrower.borrower_id === 'B001') {
      LogService.info('✓ Found borrower B001 in database:', { 
        borrower_id: borrower.borrower_id,
        name: `${borrower.first_name} ${borrower.last_name}`,
        credit_score: borrower.credit_score
      });
    } else {
      LogService.error('✗ Borrower B001 not found in database');
      throw new Error('Borrower B001 not found in database');
    }
  } catch (error) {
    LogService.error('✗ Error checking borrower data:', error.message);
    throw error;
  }

  // 2. Check if B001 has loans
  LogService.info('Step 2: Checking if B001 has loans...');
  try {
    const loans = await mcpDatabaseService.getLoansByBorrowerId('B001');
    
    if (loans && loans.length > 0) {
      LogService.info(`✓ Found ${loans.length} loans for borrower B001:`, {
        loans: loans.map(l => l.loan_id)
      });
    } else {
      LogService.error('✗ No loans found for borrower B001');
      throw new Error('No loans found for borrower B001');
    }
  } catch (error) {
    LogService.error('✗ Error checking loan data:', error.message);
    throw error;
  }

  // 3. Check if there are payments for B001's loans
  LogService.info('Step 3: Checking if B001 has payment history...');
  try {
    const loans = await mcpDatabaseService.getLoansByBorrower('B001');
    
    if (loans && loans.length > 0) {
      // Get payments for the first loan as a test
      const payments = await mcpDatabaseService.getLoanPayments(loans[0].loan_id);
      
      LogService.info(`✓ Found ${payments.length} payments for loan ${loans[0].loan_id}`);
      if (payments.length === 0) {
        LogService.warn('⚠ No payment history found for B001\'s loans');
        // Not throwing error as the system should handle this case
      }
    }
  } catch (error) {
    LogService.error('✗ Error checking payment data:', error.message);
    throw error;
  }
  
  LogService.info('✓ All required data verified successfully');
  return true;
}

/**
 * Test direct database service calls
 */
async function testDirectDatabaseCalls() {
  LogService.info('Testing direct database service calls...');
  
  // 1. Test borrower details
  LogService.info('Step 1: Testing getBorrowerDetails...');
  try {
    const borrower = await mcpDatabaseService.getBorrowerDetails('B001');
    
    if (borrower && borrower.borrower_id === 'B001') {
      LogService.info('✓ Successfully retrieved borrower B001 via database service');
    } else {
      LogService.error('✗ Failed to retrieve borrower B001 via database service');
      throw new Error('Failed to retrieve borrower B001 via database service');
    }
  } catch (error) {
    LogService.error('✗ Error calling getBorrowerDetails:', error.message);
    throw error;
  }
  
  // 2. Test loans for borrower
  LogService.info('Step 2: Testing getLoansByBorrowerId...');
  try {
    const loans = await mcpDatabaseService.getLoansByBorrowerId('B001');
    
    if (loans && Array.isArray(loans) && loans.length > 0) {
      LogService.info(`✓ Successfully retrieved ${loans.length} loans for B001 via database service`);
    } else {
      LogService.error('✗ Failed to retrieve loans for B001 via database service');
      throw new Error('Failed to retrieve loans for B001 via database service');
    }
      } catch (error) {
    LogService.error('✗ Error calling getLoansByBorrowerId:', error.message);
    throw error;
  }
  
  // 3. Test non-accrual risk assessment
  LogService.info('Step 3: Testing getBorrowerNonAccrualRisk...');
  try {
    const riskAssessment = await mcpDatabaseService.getBorrowerNonAccrualRisk('B001');
    
    if (riskAssessment && riskAssessment.borrower_id === 'B001') {
      LogService.info('✓ Successfully retrieved non-accrual risk assessment via database service:', {
        risk_level: riskAssessment.risk_level,
        risk_score: riskAssessment.risk_score
      });
    } else {
      LogService.error('✗ Failed to retrieve non-accrual risk assessment via database service');
      throw new Error('Failed to retrieve non-accrual risk assessment via database service');
    }
  } catch (error) {
    LogService.error('✗ Error calling getBorrowerNonAccrualRisk:', error.message);
    throw error;
  }
  
  LogService.info('✓ All database service tests completed successfully');
  return true;
}

/**
 * Test risk calculation logic directly
 */
async function testRiskCalculation() {
  LogService.info('Testing risk calculation logic...');
  
  try {
    // Test default risk calculation
    LogService.info('Step 1: Testing default risk calculation...');
    const defaultRisk = await mcpDatabaseService.getBorrowerDefaultRisk('B001');
    
    if (defaultRisk && typeof defaultRisk.default_risk_score === 'number') {
      LogService.info(`✓ Default risk calculation successful: ${defaultRisk.default_risk_score}`);
    } else {
      LogService.error('✗ Default risk calculation failed');
      throw new Error('Default risk calculation failed');
    }
    
    // Test non-accrual risk calculation
    LogService.info('Step 2: Testing non-accrual risk calculation...');
    const nonAccrualRisk = await mcpDatabaseService.getBorrowerNonAccrualRisk('B001');
    
    if (nonAccrualRisk && typeof nonAccrualRisk.risk_score === 'number') {
      LogService.info(`✓ Non-accrual risk calculation successful: ${nonAccrualRisk.risk_score}`);
    } else {
      LogService.error('✗ Non-accrual risk calculation failed');
      throw new Error('Non-accrual risk calculation failed');
    }
    
    LogService.info('✓ All risk calculations completed successfully');
    return true;
  } catch (error) {
    LogService.error('✗ Error in risk calculations:', error.message);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  LogService.info('Starting non-accrual risk tests for borrower B001...');
  LogService.info('Updated for SQL-only architecture - no server required');
  
  try {
    // Test database connection first
    const dbConnectionResult = await testDatabaseConnection();
    if (!dbConnectionResult) {
      LogService.error('✗ Database connection failed - cannot proceed with tests');
      return false;
    }
    
    // Run each test sequentially
    await verifyRequiredData();
    await testDirectDatabaseCalls();
    await testRiskCalculation();
    
    LogService.info('✓ All tests passed! Non-accrual risk assessment for B001 is working correctly.');
    LogService.info('✓ SQL-only architecture confirmed working');
    return true;
  } catch (error) {
    LogService.error('✗ Tests failed:', error.message);
    return false;
  }
}

// Run tests and exit with appropriate code
runAllTests()
  .then(success => {
    if (success) {
      LogService.info('Test script completed successfully');
      process.exit(0);
    } else {
      LogService.error('Test script failed');
      process.exit(1);
    }
  })
  .catch(error => {
    LogService.error('Unexpected error in test script:', error);
    process.exit(1);
  }); 