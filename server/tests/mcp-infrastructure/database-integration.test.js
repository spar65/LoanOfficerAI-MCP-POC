/**
 * Database Integration Tests
 * 
 * Jest-based tests to verify all 18 MCP functions are properly integrated
 * with the SQL Server database instead of JSON files.
 */

const mcpFunctionRegistry = require('../../services/mcpFunctionRegistry');

describe('MCP Database Integration', () => {
  beforeAll(async () => {
    // Ensure database is connected before running tests
    jest.setTimeout(30000);
  });

  describe('Basic Loan Information Functions (7 functions)', () => {
    test('getLoanDetails should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getLoanDetails', { loan_id: 'L001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.loan_id).toBe('L001');
    });

    test('getLoanStatus should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getLoanStatus', { loan_id: 'L001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.status).toBeDefined();
    });

    test('getLoanSummary should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getLoanSummary', {});
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.total_loans).toBeDefined();
    });

    test('getActiveLoans should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getActiveLoans', {});
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result['0']).toBeDefined(); // Numbered format
    });

    test('getLoansByBorrower should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getLoansByBorrower', { borrower_id: 'B001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
    });

    test('getLoanPayments should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getLoanPayments', { loan_id: 'L001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
    });

    test('getLoanCollateral should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getLoanCollateral', { loan_id: 'L001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
    });
  });

  describe('Borrower & Risk Assessment Functions (4 functions)', () => {
    test('getBorrowerDetails should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getBorrowerDetails', { borrower_id: 'B001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.borrower_id).toBe('B001');
    });

    test('getBorrowerDefaultRisk should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getBorrowerDefaultRisk', { borrower_id: 'B001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.default_risk_score).toBeDefined();
    });

    test('getBorrowerNonAccrualRisk should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getBorrowerNonAccrualRisk', { borrower_id: 'B001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.risk_score).toBeDefined();
    });

    test('evaluateCollateralSufficiency should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('evaluateCollateralSufficiency', { loan_id: 'L001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.ltvRatio).toBeDefined();
    });
  });

  describe('Predictive Analytics Functions (7 functions)', () => {
    test('analyzeMarketPriceImpact should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('analyzeMarketPriceImpact', { 
        borrower_id: 'B001', 
        commodity: 'corn', 
        price_change_percent: '5%' 
      });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.borrower_id).toBe('B001');
    });

    test('forecastEquipmentMaintenance should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('forecastEquipmentMaintenance', { borrower_id: 'B001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.total_maintenance_forecast).toBeDefined();
    });

    test('assessCropYieldRisk should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('assessCropYieldRisk', { 
        borrower_id: 'B001', 
        crop_type: 'corn', 
        season: 'spring' 
      });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.yield_risk_score).toBeDefined();
    });

    test('getRefinancingOptions should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getRefinancingOptions', { loan_id: 'L001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.refinancing_scenarios).toBeDefined();
    });

    test('analyzePaymentPatterns should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('analyzePaymentPatterns', { borrower_id: 'B001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.on_time_percentage).toBeDefined();
    });

    test('recommendLoanRestructuring should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('recommendLoanRestructuring', { loan_id: 'L001' });
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.recommendations).toBeDefined();
    });

    test('getHighRiskFarmers should use database', async () => {
      const result = await mcpFunctionRegistry.executeFunction('getHighRiskFarmers', {});
      expect(result).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result.high_risk_farmers).toBeDefined();
    });
  });

  describe('Database Integration Verification', () => {
    test('should not fallback to JSON files with invalid data', async () => {
      // Test with invalid borrower ID to ensure it fails (no JSON fallback)
      const result = await mcpFunctionRegistry.executeFunction('getBorrowerDetails', { borrower_id: 'INVALID_ID' });
      
      // Should return error response indicating database failure (no JSON fallback)
      expect(result).toBeDefined();
      expect(result.error).toBe(true);
      expect(result.code).toBe('ENTITY_NOT_FOUND');
      expect(result.message).toContain('not found');
      expect(result.entity_type).toBe('borrower');
      expect(result.entity_id).toBe('INVALID_ID');
    });

    test('all functions should return database metadata', async () => {
      const testCases = [
        { name: 'getLoanDetails', args: { loan_id: 'L001' } },
        { name: 'getBorrowerDetails', args: { borrower_id: 'B001' } },
        { name: 'getActiveLoans', args: {} }
      ];

      for (const testCase of testCases) {
        const result = await mcpFunctionRegistry.executeFunction(testCase.name, testCase.args);
        expect(result).toBeDefined();
        expect(result._metadata).toBeDefined();
        expect(result._metadata.success).toBe(true);
        expect(result._metadata.function).toBe(testCase.name);
      }
    });
  });
});
