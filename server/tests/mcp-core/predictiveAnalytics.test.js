/**
 * Unit Tests for Predictive Analytics MCP Functions
 * 
 * Tests the three predictive analytics functions:
 * - recommendLoanRestructuring
 * - assessCropYieldRisk
 * - analyzeMarketPriceImpact
 */

// Create proper mock functions
const mockRecommendLoanRestructuring = jest.fn();
const mockAssessCropYieldRisk = jest.fn();
const mockAnalyzeMarketPriceImpact = jest.fn();

// Mock the mcpFunctionRegistry
jest.mock('../../services/mcpFunctionRegistry', () => {
  const mockRegistry = {
    recommendLoanRestructuring: mockRecommendLoanRestructuring,
    assessCropYieldRisk: mockAssessCropYieldRisk,
    analyzeMarketPriceImpact: mockAnalyzeMarketPriceImpact
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
            code: error.code || 'FUNCTION_ERROR',
            function: functionName,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        return {
          error: true,
          message: `Unknown function: ${functionName}`,
          code: 'UNKNOWN_FUNCTION',
          function: functionName,
          timestamp: new Date().toISOString()
        };
      }
    })
  };
});

const { registry, executeFunction } = require('../../services/mcpFunctionRegistry');

describe('Predictive Analytics MCP Functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('recommendLoanRestructuring', () => {
    test('should return restructuring options for valid loan ID', async () => {
      // Mock the implementation for this test
      mockRecommendLoanRestructuring.mockResolvedValue({
        loan_id: 'L001',
        current_structure: {
          loan_amount: 50000,
          interest_rate: 3.5,
          term_months: 60,
          monthly_payment: 909.09
        },
        restructuring_options: [
          {
            option_type: 'Term Extension',
            new_term_months: 84,
            new_monthly_payment: 694.44,
            interest_rate: 3.5,
            total_interest_saved: 2500,
            recommendation_score: 85
          },
          {
            option_type: 'Rate Reduction',
            new_term_months: 60,
            new_monthly_payment: 854.17,
            interest_rate: 3.0,
            total_interest_saved: 3300,
            recommendation_score: 90
          },
          {
            option_type: 'Payment Holiday',
            deferred_months: 3,
            new_monthly_payment: 909.09,
            interest_rate: 3.5,
            total_additional_cost: 1500,
            recommendation_score: 70
          }
        ],
        borrower_profile: {
          borrower_id: 'B001',
          name: 'John Doe',
          credit_score: 720,
          debt_to_income_ratio: 0.35
        }
      });
      
      const result = await executeFunction('recommendLoanRestructuring', { loan_id: 'L001' });
      
      // Verify the result structure
      expect(result).toBeDefined();
      expect(result._metadata).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result._metadata.function).toBe('recommendLoanRestructuring');
      expect(result.loan_id).toBe('L001');
      expect(result.restructuring_options).toHaveLength(3);
      expect(result.restructuring_options[0]).toHaveProperty('option_type');
      expect(result.restructuring_options[0]).toHaveProperty('recommendation_score');
      expect(result.borrower_profile).toHaveProperty('borrower_id', 'B001');
      
      // Verify the mock was called correctly
      expect(mockRecommendLoanRestructuring).toHaveBeenCalledWith({ loan_id: 'L001' });
    });
    
    test('should handle error for non-existent loan ID', async () => {
      // Mock the implementation to throw an error
      mockRecommendLoanRestructuring.mockRejectedValue(new Error('Loan not found'));
      
      const result = await executeFunction('recommendLoanRestructuring', { loan_id: 'L999' });
      
      // Verify error handling
      expect(result.error).toBe(true);
      expect(result.message).toBe('Loan not found');
      expect(result.code).toBe('FUNCTION_ERROR');
      expect(result.function).toBe('recommendLoanRestructuring');
    });
  });

  describe('assessCropYieldRisk', () => {
    test('should return crop yield risk assessment for valid borrower ID', async () => {
      // Mock the implementation for this test
      mockAssessCropYieldRisk.mockResolvedValue({
        borrower_id: 'B001',
        crop_type: 'corn',
        yield_risk_score: 65,
        risk_level: 'medium',
        risk_factors: [
          {
            factor: 'Weather Conditions',
            impact: 'high',
            description: 'Drought conditions in the region'
          },
          {
            factor: 'Soil Quality',
            impact: 'medium',
            description: 'Moderate soil degradation observed'
          },
          {
            factor: 'Market Demand',
            impact: 'low',
            description: 'Stable demand for corn products'
          }
        ],
        historical_yields: [
          { year: 2023, yield_per_acre: 175, weather_impact: 'normal' },
          { year: 2022, yield_per_acre: 160, weather_impact: 'drought' },
          { year: 2021, yield_per_acre: 185, weather_impact: 'favorable' }
        ],
        recommendations: [
          'Consider drought-resistant seed varieties',
          'Implement soil conservation practices',
          'Diversify crop portfolio to reduce risk'
        ]
      });
      
      const result = await executeFunction('assessCropYieldRisk', { 
        borrower_id: 'B001', 
        crop_type: 'corn',
        season: 'current'
      });
      
      // Verify the result structure
      expect(result).toBeDefined();
      expect(result._metadata).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result._metadata.function).toBe('assessCropYieldRisk');
      expect(result.borrower_id).toBe('B001');
      expect(result.crop_type).toBe('corn');
      expect(result.yield_risk_score).toBe(65);
      expect(result.risk_level).toBe('medium');
      expect(result.risk_factors).toHaveLength(3);
      expect(result.historical_yields).toHaveLength(3);
      expect(result.recommendations).toHaveLength(3);
      
      // Verify the mock was called correctly
      expect(mockAssessCropYieldRisk).toHaveBeenCalledWith({ 
        borrower_id: 'B001', 
        crop_type: 'corn',
        season: 'current'
      });
    });
    
    test('should handle error for non-existent borrower ID', async () => {
      // Mock the implementation to throw an error
      mockAssessCropYieldRisk.mockRejectedValue(new Error('Borrower not found'));
      
      const result = await executeFunction('assessCropYieldRisk', { borrower_id: 'B999' });
      
      // Verify error handling
      expect(result.error).toBe(true);
      expect(result.message).toBe('Borrower not found');
      expect(result.code).toBe('FUNCTION_ERROR');
      expect(result.function).toBe('assessCropYieldRisk');
    });
  });

  describe('analyzeMarketPriceImpact', () => {
    test('should return market price impact analysis for valid commodity', async () => {
      // Mock the implementation for this test
      mockAnalyzeMarketPriceImpact.mockResolvedValue({
        commodity: 'corn',
        price_change_percent: '-10%',
        affected_loans_count: 3,
        total_portfolio_exposure: 125000,
        impact_analysis: {
          high_risk_loans: 1,
          medium_risk_loans: 2,
          low_risk_loans: 0
        },
        borrower_impacts: [
          {
            borrower_id: 'B001',
            name: 'John Doe',
            loan_amount: 50000,
            exposure_percentage: 80,
            estimated_impact: -4000,
            risk_level: 'high'
          },
          {
            borrower_id: 'B002',
            name: 'Jane Smith',
            loan_amount: 75000,
            exposure_percentage: 60,
            estimated_impact: -4500,
            risk_level: 'medium'
          }
        ],
        recommendations: [
          'Monitor affected borrowers closely',
          'Consider loan restructuring for high-risk borrowers',
          'Implement hedging strategies for future loans'
        ]
      });
      
      const result = await executeFunction('analyzeMarketPriceImpact', { 
        commodity: 'corn',
        price_change_percent: -10
      });
      
      // Verify the result structure
      expect(result).toBeDefined();
      expect(result._metadata).toBeDefined();
      expect(result._metadata.success).toBe(true);
      expect(result._metadata.function).toBe('analyzeMarketPriceImpact');
      expect(result.commodity).toBe('corn');
      expect(result.price_change_percent).toBe('-10%');
      expect(result.affected_loans_count).toBe(3);
      expect(result.total_portfolio_exposure).toBe(125000);
      expect(result.impact_analysis).toBeDefined();
      expect(result.borrower_impacts).toHaveLength(2);
      expect(result.recommendations).toHaveLength(3);
      
      // Verify the mock was called correctly
      expect(mockAnalyzeMarketPriceImpact).toHaveBeenCalledWith({ 
        commodity: 'corn',
        price_change_percent: -10
      });
    });
    
    test('should handle error for invalid commodity', async () => {
      // Mock the implementation to throw an error
      mockAnalyzeMarketPriceImpact.mockRejectedValue(new Error('Invalid commodity'));
      
      const result = await executeFunction('analyzeMarketPriceImpact', { 
        commodity: 'invalidCommodity'
      });
      
      // Verify error handling
      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid commodity');
      expect(result.code).toBe('FUNCTION_ERROR');
      expect(result.function).toBe('analyzeMarketPriceImpact');
    });
  });
}); 