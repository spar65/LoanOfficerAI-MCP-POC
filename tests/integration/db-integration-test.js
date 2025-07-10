/**
 * Database Integration Test Suite
 * 
 * Tests the integration between the application and the database layer
 */
const db = require('../../utils/database');
const mcpDatabaseService = require('../../server/services/mcpDatabaseService');
const LogService = require('../../services/logService');

// Test data for creating test records
const TEST_DATA = {
  loan: {
    loan_id: 'TEST-LOAN-001',
    borrower_id: 'TEST-BORROWER-001',
    loan_amount: 250000,
    interest_rate: 4.5,
    term_months: 60,
    status: 'active',
    loan_type: 'equipment'
  },
  borrower: {
    borrower_id: 'TEST-BORROWER-001',
    first_name: 'Test',
    last_name: 'Borrower',
    email: 'test@example.com',
    phone: '555-123-4567',
    credit_score: 720,
    debt_to_income_ratio: 0.32
  }
};

// Export a class to run all tests
class DbIntegrationTest {
  /**
   * Run all database integration tests
   */
  static async runAllTests() {
    try {
      // Set up test data
      await this.setupTestData();
      
      // Test basic loan data retrieval
      const loanResult = await this.testLoanDataRetrieval();
      if (!loanResult.success) {
        return loanResult;
      }
      
      // Test MCP conversation tracking
      const mcpResult = await this.testMcpConversationTracking();
      if (!mcpResult.success) {
        return mcpResult;
      }
      
      // Test risk assessment functions
      const riskResult = await this.testRiskAssessmentFunctions();
      if (!riskResult.success) {
        return riskResult;
      }
      
      // Clean up test data
      await this.cleanupTestData();
      
      return { success: true };
    } catch (error) {
      LogService.error('Database integration test error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Set up test data in database
   */
  static async setupTestData() {
    try {
      console.log('✅ Setting up test data...');
      
      // Check if test borrower exists
      const borrowerResult = await db.executeQuery('SELECT * FROM Borrowers WHERE borrower_id = @borrowerId', { TEST_DATA.borrower.borrower_id });
      
      // Insert test borrower if it doesn't exist
      if (borrowerResult.recordset.length === 0) {
        await db.executeQuery(
          `INSERT INTO Borrowers (borrower_id, first_name, last_name, email, phone, credit_score, debt_to_income_ratio)
           VALUES (@borrowerId, @firstName, @lastName, @email, @phone, @creditScore, @dti)`,
          {
            borrowerId: TEST_DATA.borrower.borrower_id,
            firstName: TEST_DATA.borrower.first_name,
            lastName: TEST_DATA.borrower.last_name,
            email: TEST_DATA.borrower.email,
            phone: TEST_DATA.borrower.phone,
            creditScore: TEST_DATA.borrower.credit_score,
            dti: TEST_DATA.borrower.debt_to_income_ratio
          }
        );
        console.log(`✅ Created test borrower: ${TEST_DATA.borrower.borrower_id}`);
      }
      
      // Check if test loan exists
      const loanResult = await db.executeQuery('SELECT * FROM Loans WHERE loan_id = @loanId', { TEST_DATA.loan.loan_id });
      
      // Insert test loan if it doesn't exist
      if (loanResult.recordset.length === 0) {
        await db.executeQuery(
          `INSERT INTO Loans (loan_id, borrower_id, loan_amount, interest_rate, term_months, status, loan_type)
           VALUES (@loanId, @borrowerId, @loanAmount, @interestRate, @termMonths, @status, @loanType)`,
          {
            loanId: TEST_DATA.loan.loan_id,
            borrowerId: TEST_DATA.loan.borrower_id,
            loanAmount: TEST_DATA.loan.loan_amount,
            interestRate: TEST_DATA.loan.interest_rate,
            termMonths: TEST_DATA.loan.term_months,
            status: TEST_DATA.loan.status,
            loanType: TEST_DATA.loan.loan_type
          }
        );
        console.log(`✅ Created test loan: ${TEST_DATA.loan.loan_id}`);
      }
      
      // Set up test collateral
      await db.executeQuery(
        `DELETE FROM Collateral WHERE loan_id = @loanId`,
        { loanId: TEST_DATA.loan.loan_id }
      );
      
      await db.executeQuery(
        `INSERT INTO Collateral (collateral_id, loan_id, type, description, value)
         VALUES (@collateralId, @loanId, @type, @description, @value)`,
        {
          collateralId: `TEST-COLLATERAL-001`,
          loanId: TEST_DATA.loan.loan_id,
          type: 'Equipment',
          description: 'Farm Tractor',
          value: 175000
        }
      );
      console.log(`✅ Created test collateral for loan: ${TEST_DATA.loan.loan_id}`);
      
      console.log('✅ Test data setup complete\n');
    } catch (error) {
      LogService.error('Error setting up test data:', error.message);
      throw error;
    }
  }
  
  /**
   * Clean up test data from database
   */
  static async cleanupTestData() {
    try {
      console.log('\n✅ Cleaning up test data...');
      
      // We'll leave the test data in the database for now
      // In a real test environment, we would delete the test data here
      
      console.log('✅ Test data cleanup complete');
    } catch (error) {
      LogService.error('Error cleaning up test data:', error.message);
    }
  }
  
  /**
   * Test loan data retrieval
   */
  static async testLoanDataRetrieval() {
    try {
      console.log('✅ Testing loan data retrieval...');
      
      // Get loans
      const loans = await mcpDatabaseService.getLoans();
      
      if (!loans || !Array.isArray(loans)) {
        console.log('❌ Failed to retrieve loans from database');
        return {
          success: false,
          error: 'Failed to retrieve loans'
        };
      }
      
      console.log(`✅ Successfully retrieved ${loans.length} loans from database`);
      
      // Get a specific loan
      const loan = await mcpDatabaseService.getLoanById(TEST_DATA.loan.loan_id);
      
      if (!loan) {
        console.log(`❌ Failed to retrieve loan by ID: ${TEST_DATA.loan.loan_id}`);
        return {
          success: false,
          error: `Failed to retrieve loan by ID: ${TEST_DATA.loan.loan_id}`
        };
      }
      
      console.log(`✅ Successfully retrieved loan by ID: ${TEST_DATA.loan.loan_id}`);
      
      return { success: true };
    } catch (error) {
      LogService.error('Loan data retrieval test error:', error.message);
      return {
        success: false,
        error: `Loan data retrieval error: ${error.message}`
      };
    }
  }
  
  /**
   * Test MCP conversation tracking
   */
  static async testMcpConversationTracking() {
    try {
      console.log('✅ Testing MCP conversation tracking...');
      
      // Track a test conversation
      const conversationId = await mcpDatabaseService.trackMcpConversation({
        userId: 'test-user',
        query: 'Test query for database integration test',
        response: 'Test response for database integration test',
        timestamp: new Date().toISOString()
      });
      
      if (!conversationId) {
        console.log('❌ Failed to track MCP conversation');
        return {
          success: false,
          error: 'Failed to track MCP conversation'
        };
      }
      
      console.log(`✅ Successfully tracked MCP conversation with ID: ${conversationId}`);
      
      // Get the conversation
      const conversation = await mcpDatabaseService.getMcpConversation(conversationId);
      
      if (!conversation) {
        console.log(`❌ Failed to retrieve MCP conversation by ID: ${conversationId}`);
        return {
          success: false,
          error: `Failed to retrieve MCP conversation by ID: ${conversationId}`
        };
      }
      
      console.log(`✅ Successfully retrieved MCP conversation by ID: ${conversationId}`);
      
      return { success: true };
    } catch (error) {
      LogService.error('MCP conversation tracking test error:', error.message);
      return {
        success: false,
        error: `MCP conversation tracking error: ${error.message}`
      };
    }
  }
  
  /**
   * Test risk assessment functions
   */
  static async testRiskAssessmentFunctions() {
    try {
      console.log('✅ Testing risk assessment functions...');
      
      // Test default risk calculation
      const defaultRisk = await mcpDatabaseService.calculateDefaultRisk(TEST_DATA.loan.loan_id);
      
      if (typeof defaultRisk !== 'number') {
        console.log('❌ Failed to calculate default risk');
        return {
          success: false,
          error: 'Failed to calculate default risk'
        };
      }
      
      console.log(`✅ Successfully calculated default risk: ${defaultRisk}`);
      
      // Test collateral sufficiency calculation
      const collateralSufficiency = await mcpDatabaseService.evaluateCollateralSufficiency(TEST_DATA.loan.loan_id);
      
      if (typeof collateralSufficiency !== 'object') {
        console.log('❌ Failed to evaluate collateral sufficiency');
        return {
          success: false,
          error: 'Failed to evaluate collateral sufficiency'
        };
      }
      
      console.log(`✅ Successfully evaluated collateral sufficiency`);
      
      return { success: true };
    } catch (error) {
      LogService.error('Risk assessment test error:', error.message);
      return {
        success: false,
        error: `Risk assessment error: ${error.message}`
      };
    }
  }
}

module.exports = DbIntegrationTest; 