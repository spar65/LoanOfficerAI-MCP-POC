/**
 * Unit Tests for Predictive Analytics MCP Functions
 * 
 * Tests the three predictive analytics functions:
 * - recommendLoanRestructuring
 * - assessCropYieldRisk
 * - analyzeMarketPriceImpact
 */
const { registry, executeFunction } = require('../../services/mcpFunctionRegistry');
const dataService = require('../../services/dataService');

// Mock data paths
jest.mock('../../services/dataService', () => {
  // Sample test data
  const loans = [
    { 
      loan_id: 'L001', 
      borrower_id: 'B001', 
      loan_amount: 50000, 
      interest_rate: 3.5,
      term_length: 60,
      status: 'Active',
      loan_type: 'Equipment',
      start_date: '2024-01-01'
    },
    { 
      loan_id: 'L002', 
      borrower_id: 'B002', 
      loan_amount: 75000, 
      interest_rate: 4.0,
      term_length: 120,
      status: 'Active',
      loan_type: 'Real Estate',
      start_date: '2023-06-15'
    },
    { 
      loan_id: 'L003', 
      borrower_id: 'B001', 
      loan_amount: 25000, 
      interest_rate: 5.0,
      term_length: 36,
      status: 'Active',
      loan_type: 'Operating',
      start_date: '2024-03-10'
    }
  ];
  
  const borrowers = [
    {
      borrower_id: 'B001',
      first_name: 'John',
      last_name: 'Farmer',
      credit_score: 720,
      income: 150000,
      farm_type: 'Crop',
      farm_size: 500
    },
    {
      borrower_id: 'B002',
      first_name: 'Jane',
      last_name: 'Rancher',
      credit_score: 680,
      income: 200000,
      farm_type: 'Livestock',
      farm_size: 1000
    }
  ];
  
  const payments = [
    {
      payment_id: 'P001',
      loan_id: 'L001',
      payment_date: '2024-02-01',
      amount: 1000,
      status: 'On Time'
    },
    {
      payment_id: 'P002',
      loan_id: 'L001',
      payment_date: '2024-03-01',
      amount: 1000,
      status: 'On Time'
    },
    {
      payment_id: 'P003',
      loan_id: 'L001',
      payment_date: '2024-04-01',
      amount: 1000,
      status: 'On Time'
    }
  ];
  
  // Mock implementation
  return {
    paths: {
      loans: 'data/loans.json',
      borrowers: 'data/borrowers.json',
      payments: 'data/payments.json'
    },
    loadData: (path) => {
      if (path.includes('loans')) return [...loans];
      if (path.includes('borrowers')) return [...borrowers];
      if (path.includes('payments')) return [...payments];
      return [];
    }
  };
});

describe('Predictive Analytics MCP Functions', () => {
  // Test recommendLoanRestructuring function
  describe('recommendLoanRestructuring', () => {
    test('should return restructuring options for valid loan ID', async () => {
      const result = await registry.recommendLoanRestructuring({ 
        loan_id: 'L001', 
        restructuring_goal: 'reduce_payments' 
      });
      
      expect(result).toBeDefined();
      expect(result.loan_id).toBe('L001');
      expect(result).toHaveProperty('current_structure');
      expect(result).toHaveProperty('restructuring_options');
      expect(Array.isArray(result.restructuring_options)).toBe(true);
      expect(result.restructuring_options.length).toBeGreaterThan(0);
      expect(result).toHaveProperty('recommendation');
    });
    
    test('should handle case-insensitive loan IDs', async () => {
      const result = await registry.recommendLoanRestructuring({ 
        loan_id: 'l001', 
        restructuring_goal: 'reduce_payments' 
      });
      
      expect(result).toBeDefined();
      expect(result.loan_id).toBe('L001');
    });
    
    test('should work without restructuring_goal parameter', async () => {
      const result = await registry.recommendLoanRestructuring({ loan_id: 'L001' });
      
      expect(result).toBeDefined();
      expect(result.loan_id).toBe('L001');
      expect(result).toHaveProperty('restructuring_options');
    });
    
    test('should throw error for non-existent loan ID', async () => {
      await expect(registry.recommendLoanRestructuring({ loan_id: 'L999' }))
        .rejects.toThrow(/not found/i);
    });
    
    test('should throw error when loan ID is missing', async () => {
      await expect(registry.recommendLoanRestructuring({}))
        .rejects.toThrow(/required/i);
    });
  });
  
  // Test assessCropYieldRisk function
  describe('assessCropYieldRisk', () => {
    test('should return crop yield risk assessment for valid borrower ID', async () => {
      const result = await registry.assessCropYieldRisk({ 
        borrower_id: 'B001',
        crop_type: 'corn',
        season: 'current'
      });
      
      expect(result).toBeDefined();
      expect(result.borrower_id).toBe('B001');
      expect(result).toHaveProperty('crop_type');
      expect(result).toHaveProperty('yield_risk_score');
      expect(result).toHaveProperty('risk_level');
      expect(result).toHaveProperty('risk_factors');
      expect(Array.isArray(result.risk_factors)).toBe(true);
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
    
    test('should handle case-insensitive borrower IDs', async () => {
      const result = await registry.assessCropYieldRisk({ 
        borrower_id: 'b001',
        crop_type: 'corn',
        season: 'current'
      });
      
      expect(result).toBeDefined();
      expect(result.borrower_id).toBe('B001');
    });
    
    test('should work with minimal parameters', async () => {
      const result = await registry.assessCropYieldRisk({ borrower_id: 'B001' });
      
      expect(result).toBeDefined();
      expect(result.borrower_id).toBe('B001');
      expect(result).toHaveProperty('crop_type');
    });
    
    test('should throw error for non-existent borrower ID', async () => {
      await expect(registry.assessCropYieldRisk({ borrower_id: 'B999' }))
        .rejects.toThrow(/not found/i);
    });
    
    test('should throw error when borrower ID is missing', async () => {
      await expect(registry.assessCropYieldRisk({}))
        .rejects.toThrow(/required/i);
    });
  });
  
  // Test analyzeMarketPriceImpact function
  describe('analyzeMarketPriceImpact', () => {
    test('should return market price impact analysis for valid commodity', async () => {
      const result = await registry.analyzeMarketPriceImpact({ 
        commodity: 'corn',
        price_change_percent: '-10%'
      });
      
      expect(result).toBeDefined();
      expect(result.commodity).toBe('corn');
      expect(result).toHaveProperty('price_change_percent');
      expect(result).toHaveProperty('affected_loans_count');
      expect(result).toHaveProperty('affected_loans');
      expect(Array.isArray(result.affected_loans)).toBe(true);
      expect(result).toHaveProperty('portfolio_impact_summary');
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
    
    test('should handle case-insensitive commodity', async () => {
      const result = await registry.analyzeMarketPriceImpact({ 
        commodity: 'CORN',
        price_change_percent: '-10%'
      });
      
      expect(result).toBeDefined();
      expect(result.commodity).toBe('corn');
    });
    
    test('should work without price_change_percent parameter', async () => {
      const result = await registry.analyzeMarketPriceImpact({ commodity: 'corn' });
      
      expect(result).toBeDefined();
      expect(result.commodity).toBe('corn');
      expect(result).toHaveProperty('price_change_percent');
    });
    
    test('should throw error for invalid commodity', async () => {
      await expect(registry.analyzeMarketPriceImpact({ 
        commodity: 'invalidCommodity',
        price_change_percent: '-10%'
      }))
        .rejects.toThrow(/invalid commodity/i);
    });
    
    test('should throw error when commodity is missing', async () => {
      await expect(registry.analyzeMarketPriceImpact({}))
        .rejects.toThrow(/required/i);
    });
  });
  
  // Test executeFunction wrapper with our new functions
  describe('executeFunction wrapper for predictive analytics', () => {
    test('should properly format successful responses for loan restructuring', async () => {
      const result = await executeFunction('recommendLoanRestructuring', { loan_id: 'L001' });
      
      expect(result).toHaveProperty('loan_id', 'L001');
      expect(result).toHaveProperty('_metadata');
      expect(result._metadata).toHaveProperty('success', true);
      expect(result._metadata).toHaveProperty('function', 'recommendLoanRestructuring');
      expect(result._metadata).toHaveProperty('timestamp');
    });
    
    test('should properly format successful responses for crop yield risk', async () => {
      const result = await executeFunction('assessCropYieldRisk', { borrower_id: 'B001' });
      
      expect(result).toHaveProperty('borrower_id', 'B001');
      expect(result).toHaveProperty('_metadata');
      expect(result._metadata).toHaveProperty('success', true);
      expect(result._metadata).toHaveProperty('function', 'assessCropYieldRisk');
      expect(result._metadata).toHaveProperty('timestamp');
    });
    
    test('should properly format successful responses for market price impact', async () => {
      const result = await executeFunction('analyzeMarketPriceImpact', { commodity: 'corn' });
      
      expect(result).toHaveProperty('commodity', 'corn');
      expect(result).toHaveProperty('_metadata');
      expect(result._metadata).toHaveProperty('success', true);
      expect(result._metadata).toHaveProperty('function', 'analyzeMarketPriceImpact');
      expect(result._metadata).toHaveProperty('timestamp');
    });
  });
}); 