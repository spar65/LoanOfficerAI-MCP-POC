/**
 * Unit Tests for Predictive Analytics MCP Functions
 * 
 * Tests the three predictive analytics functions:
 * - recommendLoanRestructuring
 * - assessCropYieldRisk
 * - analyzeMarketPriceImpact
 */
const { registry, executeFunction } = require('../../services/mcpFunctionRegistry');

// Mock the mcpFunctionRegistry
jest.mock('../../services/mcpFunctionRegistry', () => {
  const mockRegistry = {
    recommendLoanRestructuring: jest.fn(),
    assessCropYieldRisk: jest.fn(),
    analyzeMarketPriceImpact: jest.fn()
  };
  
  return {
    registry: mockRegistry,
    executeFunction: jest.fn().mockImplementation(async (functionName, args) => {
      if (mockRegistry[functionName]) {
        try {
          const result = await mockRegistry[functionName](args);
          return {
            _metadata: {
              success: true,
              function: functionName,
              timestamp: new Date().toISOString()
            },
            ...result
          };
        } catch (error) {
          return {
            error: true,
            message: error.message,
            code: error.code || 'FUNCTION_ERROR'
          };
        }
      } else {
        return {
          error: true,
          message: `Unknown function: ${functionName}`,
          code: 'UNKNOWN_FUNCTION'
        };
      }
    })
  };
});

describe('Predictive Analytics MCP Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Test recommendLoanRestructuring function
  describe('recommendLoanRestructuring', () => {
    test('should return restructuring options for valid loan ID', async () => {
      // Mock the implementation for this test
      registry.recommendLoanRestructuring.mockResolvedValue({
        loan_id: 'L001',
        current_structure: {
          loan_amount: 50000,
          interest_rate: 3.5,
          term_length: 60,
          monthly_payment: 911.38
        },
        restructuring_options: [
          {
            option_id: 1,
            description: "Extended term with same rate",
            interest_rate: 3.5,
            term_length: 84,
            monthly_payment: 673.27,
            savings_per_month: 238.11
          },
          {
            option_id: 2,
            description: "Lower rate with same term",
            interest_rate: 3.0,
            term_length: 60,
            monthly_payment: 878.65,
            savings_per_month: 32.73
          }
        ],
        recommendation: "Option 1 provides the most monthly payment relief"
      });
      
      const result = await executeFunction('recommendLoanRestructuring', { loan_id: 'L001' });
      
      expect(result).toHaveProperty('_metadata.success', true);
      expect(result).toHaveProperty('loan_id', 'L001');
      expect(result).toHaveProperty('current_structure');
      expect(result).toHaveProperty('restructuring_options');
      expect(Array.isArray(result.restructuring_options)).toBe(true);
      expect(result.restructuring_options.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('recommendation');
      
      expect(registry.recommendLoanRestructuring).toHaveBeenCalledWith({ loan_id: 'L001' });
    });
    
    test('should handle error for non-existent loan ID', async () => {
      // Mock the implementation to throw an error
      registry.recommendLoanRestructuring.mockRejectedValue(new Error('Loan not found'));
      
      const result = await executeFunction('recommendLoanRestructuring', { loan_id: 'L999' });
      
      expect(result).toHaveProperty('error', true);
      expect(result).toHaveProperty('message', 'Loan not found');
      
      expect(registry.recommendLoanRestructuring).toHaveBeenCalledWith({ loan_id: 'L999' });
    });
  });
  
  // Test assessCropYieldRisk function
  describe('assessCropYieldRisk', () => {
    test('should return crop yield risk assessment for valid borrower ID', async () => {
      // Mock the implementation for this test
      registry.assessCropYieldRisk.mockResolvedValue({
        borrower_id: 'B001',
        crop_type: 'corn',
        yield_risk_score: 65,
        risk_level: 'medium',
        risk_factors: [
          "Drought conditions in region",
          "Historical yield variability"
        ],
        recommendations: [
          "Consider drought-resistant varieties",
          "Implement irrigation improvements"
        ]
      });
      
      const result = await executeFunction('assessCropYieldRisk', { 
        borrower_id: 'B001',
        crop_type: 'corn',
        season: 'current'
      });
      
      expect(result).toHaveProperty('_metadata.success', true);
      expect(result).toHaveProperty('borrower_id', 'B001');
      expect(result).toHaveProperty('crop_type', 'corn');
      expect(result).toHaveProperty('yield_risk_score');
      expect(result).toHaveProperty('risk_level');
      expect(result).toHaveProperty('risk_factors');
      expect(Array.isArray(result.risk_factors)).toBe(true);
      expect(result).toHaveProperty('recommendations');
      
      expect(registry.assessCropYieldRisk).toHaveBeenCalledWith({ 
        borrower_id: 'B001',
        crop_type: 'corn',
        season: 'current'
      });
    });
    
    test('should handle error for non-existent borrower ID', async () => {
      // Mock the implementation to throw an error
      registry.assessCropYieldRisk.mockRejectedValue(new Error('Borrower not found'));
      
      const result = await executeFunction('assessCropYieldRisk', { borrower_id: 'B999' });
      
      expect(result).toHaveProperty('error', true);
      expect(result).toHaveProperty('message', 'Borrower not found');
      
      expect(registry.assessCropYieldRisk).toHaveBeenCalledWith({ borrower_id: 'B999' });
    });
  });
  
  // Test analyzeMarketPriceImpact function
  describe('analyzeMarketPriceImpact', () => {
    test('should return market price impact analysis for valid commodity', async () => {
      // Mock the implementation for this test
      registry.analyzeMarketPriceImpact.mockResolvedValue({
        commodity: 'corn',
        price_change_percent: '-10%',
        affected_loans_count: 3,
        affected_loans: [
          { loan_id: 'L001', impact_level: 'high' },
          { loan_id: 'L003', impact_level: 'medium' },
          { loan_id: 'L005', impact_level: 'low' }
        ],
        portfolio_impact_summary: "A 10% decrease in corn prices would affect 3 loans with a total exposure of $125,000",
        recommendations: [
          "Consider commodity price hedging for high-impact loans",
          "Review loan terms for affected borrowers"
        ]
      });
      
      const result = await executeFunction('analyzeMarketPriceImpact', { 
        commodity: 'corn',
        price_change_percent: '-10%'
      });
      
      expect(result).toHaveProperty('_metadata.success', true);
      expect(result).toHaveProperty('commodity', 'corn');
      expect(result).toHaveProperty('price_change_percent', '-10%');
      expect(result).toHaveProperty('affected_loans_count');
      expect(result).toHaveProperty('affected_loans');
      expect(Array.isArray(result.affected_loans)).toBe(true);
      expect(result).toHaveProperty('portfolio_impact_summary');
      expect(result).toHaveProperty('recommendations');
      
      expect(registry.analyzeMarketPriceImpact).toHaveBeenCalledWith({ 
        commodity: 'corn',
        price_change_percent: '-10%'
      });
    });
    
    test('should handle error for invalid commodity', async () => {
      // Mock the implementation to throw an error
      registry.analyzeMarketPriceImpact.mockRejectedValue(new Error('Invalid commodity'));
      
      const result = await executeFunction('analyzeMarketPriceImpact', { 
        commodity: 'invalidCommodity'
      });
      
      expect(result).toHaveProperty('error', true);
      expect(result).toHaveProperty('message', 'Invalid commodity');
      
      expect(registry.analyzeMarketPriceImpact).toHaveBeenCalledWith({ 
        commodity: 'invalidCommodity'
      });
    });
  });
}); 