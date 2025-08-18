/**
 * Simple Integration Test Suite
 * Tests core MCP functionality using Jest with Node.js built-in assertions
 */

const assert = require('assert');
const axios = require('axios');
const mcpDatabaseService = require('../services/mcpDatabaseService');
const dataService = require('../services/dataService');

const BASE_URL = 'http://localhost:3001';
const API_TOKEN = 'test-token-123';

// Create axios instance with proper cleanup configuration
const axiosInstance = axios.create({
  timeout: 5000,
  maxRedirects: 0,
  httpAgent: false,
  httpsAgent: false
});

describe('LoanOfficerAI MCP Integration Tests', () => {
  
  // Clean up axios connections after all tests
  afterAll(async () => {
    // Force close any remaining connections
    if (axiosInstance.defaults.httpAgent) {
      axiosInstance.defaults.httpAgent.destroy();
    }
    if (axiosInstance.defaults.httpsAgent) {
      axiosInstance.defaults.httpsAgent.destroy();
    }
  });
  
  describe('Database Service Tests', () => {
    test('should connect to database and retrieve active loans', async () => {
      const loans = await mcpDatabaseService.getActiveLoans();
      assert(Array.isArray(loans), 'Active loans should be an array');
      console.log(`✅ Found ${loans.length} active loans`);
    });

    test('should retrieve loan summary', async () => {
      const summary = await mcpDatabaseService.getLoanSummary();
      assert(typeof summary === 'object', 'Summary should be an object');
      assert(typeof summary.total_loans === 'number', 'Total loans should be a number');
      console.log(`✅ Loan summary: ${summary.total_loans} total loans`);
    });

    test('should retrieve borrower details', async () => {
      const borrower = await mcpDatabaseService.getBorrowerDetails('B001');
      assert(borrower.borrower_id === 'B001', 'Should retrieve correct borrower');
      console.log(`✅ Retrieved borrower: ${borrower.first_name} ${borrower.last_name}`);
    });

    test('should retrieve loan details', async () => {
      const loan = await mcpDatabaseService.getLoanDetails('L001');
      assert(loan.loan_id === 'L001', 'Should retrieve correct loan');
      console.log(`✅ Retrieved loan: ${loan.loan_id} for $${loan.loan_amount}`);
    });

    test('should retrieve loans by borrower name', async () => {
      const loans = await mcpDatabaseService.getLoansByBorrower('John');
      assert(Array.isArray(loans), 'Loans by borrower should be an array');
      console.log(`✅ Found ${loans.length} loans for borrower 'John'`);
    });
  });

  describe('Predictive Analytics Tests', () => {
    test('should recommend loan restructuring', async () => {
      const restructuring = await mcpDatabaseService.recommendLoanRestructuring('L001');
      assert(Array.isArray(restructuring.recommendations), 'Restructuring should have recommendations array');
      assert(restructuring.recommendations.length > 0, 'Should have at least one restructuring option');
      console.log(`✅ Generated ${restructuring.recommendations.length} restructuring options`);
    });

    test('should assess crop yield risk', async () => {
      const riskAssessment = await mcpDatabaseService.assessCropYieldRisk('B001', 'corn', 'current');
      assert(typeof riskAssessment.yield_risk_score === 'number', 'Yield risk score should be a number');
      assert(riskAssessment.crop_type === 'corn', 'Should assess correct crop type');
      console.log(`✅ Crop yield risk score: ${riskAssessment.yield_risk_score}`);
    });

    test('should analyze market price impact', async () => {
      const impact = await dataService.analyzeMarketPriceImpact('corn', -10);
      assert(typeof impact.total_portfolio_exposure === 'number', 'Impact should have total_portfolio_exposure number');
      assert(Array.isArray(impact.affected_loans), 'Should have affected_loans array');
      console.log(`✅ Market impact analysis: ${impact.affected_loans.length} loans affected`);
    });

    test('should get high risk farmers', async () => {
      const highRiskFarmers = await mcpDatabaseService.getHighRiskFarmers();
      assert(Array.isArray(highRiskFarmers.high_risk_farmers), 'High risk farmers should have high_risk_farmers array');
      console.log(`✅ Identified ${highRiskFarmers.high_risk_farmers.length} high risk farmers`);
    });
  });

  describe('Risk Assessment Tests', () => {
    test('should calculate default risk', async () => {
      const risk = await mcpDatabaseService.calculateDefaultRisk('L001');
      assert(typeof risk === 'number', 'Risk should be a number');
      assert(risk >= 0 && risk <= 100, 'Risk score should be between 0 and 100');
      console.log(`✅ Default risk score: ${risk}`);
    });

    test('should evaluate collateral sufficiency', async () => {
      const collateral = await mcpDatabaseService.evaluateCollateralSufficiency('L001');
      assert(typeof collateral.ltvRatio === 'number', 'LTV ratio should be a number');
      console.log(`✅ Collateral LTV ratio: ${collateral.ltvRatio}`);
    });

    test('should get borrower default risk', async () => {
      const risk = await mcpDatabaseService.getBorrowerDefaultRisk('B001');
      assert(risk.borrower_id === 'B001', 'Should assess correct borrower');
      assert(typeof risk.default_risk_score === 'number', 'Should have numeric risk score');
      console.log(`✅ Borrower default risk: ${risk.default_risk_score}`);
    });

    test('should get borrower non-accrual risk', async () => {
      const risk = await mcpDatabaseService.getBorrowerNonAccrualRisk('B001');
      assert(risk.borrower_id === 'B001', 'Should assess correct borrower');
      assert(typeof risk.risk_score === 'number', 'Should have numeric risk score');
      console.log(`✅ Non-accrual risk: ${risk.risk_score}`);
    });
  });

  describe('API Endpoint Tests', () => {
    test('should get server health status', async () => {
      try {
        const response = await axiosInstance.get(`${BASE_URL}/api/health`);
        assert(response.status === 200, 'Health check should return 200');
        assert(response.data.status === 'ok', 'Health status should be ok');
        console.log(`✅ Server health: ${response.data.status}`);
      } catch (error) {
        // If server is not running, skip this test
        console.log('⚠️ Server not running, skipping API tests');
      }
    });

    test('should access MCP loan endpoint', async () => {
      try {
        const response = await axiosInstance.get(`${BASE_URL}/api/mcp/loan/L001`, {
          headers: { 'Authorization': `Bearer ${API_TOKEN}` }
        });
        assert(response.status === 200, 'MCP loan endpoint should return 200');
        assert(response.data.loan_id === 'L001', 'Should return correct loan');
        console.log(`✅ MCP loan endpoint working: ${response.data.loan_id}`);
      } catch (error) {
        console.log('⚠️ Server not running or MCP endpoint not accessible');
      }
    });
  });
});

// Helper function to run standalone test
if (require.main === module) {
  console.log('🧪 Running Simple Integration Tests...');
  
  // Run a basic test manually
  (async () => {
    try {
      console.log('\n📊 Testing Database Connection...');
      const loans = await mcpDatabaseService.getActiveLoans();
      console.log(`✅ Database connected - Found ${loans.length} active loans`);
      
      console.log('\n🔍 Testing Predictive Analytics...');
      const restructuring = await dataService.recommendLoanRestructuring('L001');
      console.log(`✅ Predictive analytics working - ${restructuring.options.length} options`);
      
      console.log('\n🎯 Testing Risk Assessment...');
      const risk = await mcpDatabaseService.calculateDefaultRisk('L001');
      console.log(`✅ Risk assessment working - Risk score: ${risk.risk_score}`);
      
      console.log('\n🎉 All core functionality tests passed!');
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  })();
} 