/**
 * Unit Tests for MCP Function Registry
 * 
 * Tests individual MCP functions to ensure they:
 * - Handle valid inputs correctly
 * - Return expected data structures
 * - Handle errors properly
 * - Normalize IDs correctly
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
      term_months: 60,
      status: 'Active',
      loan_type: 'Equipment'
    },
    { 
      loan_id: 'L002', 
      borrower_id: 'B002', 
      loan_amount: 75000, 
      interest_rate: 4.0,
      term_months: 120,
      status: 'Active',
      loan_type: 'Real Estate'
    },
    { 
      loan_id: 'L003', 
      borrower_id: 'B001', 
      loan_amount: 25000, 
      interest_rate: 5.0,
      term_months: 36,
      status: 'Closed',
      loan_type: 'Operating'
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
  
  const collateral = [
    {
      collateral_id: 'C001',
      loan_id: 'L001',
      description: 'Farm Equipment',
      value: 60000
    },
    {
      collateral_id: 'C002',
      loan_id: 'L002',
      description: 'Farm Land',
      value: 100000
    }
  ];
  
  // Mock implementation
  return {
    paths: {
      loans: 'data/loans.json',
      borrowers: 'data/borrowers.json',
      collateral: 'data/collateral.json',
      payments: 'data/payments.json'
    },
    loadData: (path) => {
      if (path.includes('loans')) return [...loans];
      if (path.includes('borrowers')) return [...borrowers];
      if (path.includes('collateral')) return [...collateral];
      return [];
    }
  };
});

describe('MCP Function Registry', () => {
  // Test getLoanDetails function
  describe('getLoanDetails', () => {
    test('should return loan details for valid loan ID', async () => {
      const result = await registry.getLoanDetails({ loan_id: 'L001' });
      
      expect(result).toBeDefined();
      expect(result.loan_id).toBe('L001');
      expect(result.loan_amount).toBe(50000);
      expect(result.loan_type).toBe('Equipment');
    });
    
    test('should handle case-insensitive loan IDs', async () => {
      const result = await registry.getLoanDetails({ loan_id: 'l001' });
      
      expect(result).toBeDefined();
      expect(result.loan_id).toBe('L001');
    });
    
    test('should throw error for non-existent loan ID', async () => {
      await expect(registry.getLoanDetails({ loan_id: 'L999' }))
        .rejects.toThrow(/not found/i);
    });
    
    test('should throw error when loan ID is missing', async () => {
      await expect(registry.getLoanDetails({}))
        .rejects.toThrow(/required/i);
    });
  });
  
  // Test getBorrowerDetails function
  describe('getBorrowerDetails', () => {
    test('should return borrower details for valid borrower ID', async () => {
      const result = await registry.getBorrowerDetails({ borrower_id: 'B001' });
      
      expect(result).toBeDefined();
      expect(result.borrower_id).toBe('B001');
      expect(result.first_name).toBe('John');
      expect(result.last_name).toBe('Farmer');
    });
    
    test('should handle case-insensitive borrower IDs', async () => {
      const result = await registry.getBorrowerDetails({ borrower_id: 'b001' });
      
      expect(result).toBeDefined();
      expect(result.borrower_id).toBe('B001');
    });
    
    test('should throw error for non-existent borrower ID', async () => {
      await expect(registry.getBorrowerDetails({ borrower_id: 'B999' }))
        .rejects.toThrow(/not found/i);
    });
    
    test('should throw error when borrower ID is missing', async () => {
      await expect(registry.getBorrowerDetails({}))
        .rejects.toThrow(/required/i);
    });
  });
  
  // Test getActiveLoans function
  describe('getActiveLoans', () => {
    test('should return only active loans', async () => {
      const result = await registry.getActiveLoans({});
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // There are 2 active loans in our mock data
      expect(result.every(loan => loan.status === 'Active')).toBe(true);
    });
  });
  
  // Test getLoansByBorrower function
  describe('getLoansByBorrower', () => {
    test('should return all loans for a specific borrower', async () => {
      const result = await registry.getLoansByBorrower({ borrower_id: 'B001' });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // B001 has 2 loans in our mock data
      expect(result.every(loan => loan.borrower_id === 'B001')).toBe(true);
    });
    
    test('should handle case-insensitive borrower IDs', async () => {
      const result = await registry.getLoansByBorrower({ borrower_id: 'b001' });
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.every(loan => loan.borrower_id === 'B001')).toBe(true);
    });
    
    test('should return empty array for borrower with no loans', async () => {
      // The mock implementation will return an object with a note, not an error
      const result = await registry.getLoansByBorrower({ borrower_id: 'B999' });
      
      expect(result).toHaveProperty('note');
      expect(result.note).toMatch(/no loans found/i);
    });
  });
  
  // Test evaluateCollateralSufficiency function
  describe('evaluateCollateralSufficiency', () => {
    test('should evaluate if collateral is sufficient', async () => {
      const result = await registry.evaluateCollateralSufficiency({ loan_id: 'L001' });
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('loan_id', 'L001');
      expect(result).toHaveProperty('is_sufficient');
      expect(result).toHaveProperty('loan_to_value_ratio');
      expect(result).toHaveProperty('assessment');
    });
    
    test('should throw error for loan without collateral', async () => {
      await expect(registry.evaluateCollateralSufficiency({ loan_id: 'L003' }))
        .rejects.toThrow();
    });
  });
  
  // Test executeFunction wrapper
  describe('executeFunction wrapper', () => {
    test('should properly format successful responses', async () => {
      const result = await executeFunction('getLoanDetails', { loan_id: 'L001' });
      
      expect(result).toHaveProperty('loan_id', 'L001');
      expect(result).toHaveProperty('_metadata');
      expect(result._metadata).toHaveProperty('success', true);
      expect(result._metadata).toHaveProperty('function', 'getLoanDetails');
      expect(result._metadata).toHaveProperty('timestamp');
    });
    
    test('should properly format error responses', async () => {
      const result = await executeFunction('getLoanDetails', { loan_id: 'L999' });
      
      expect(result).toHaveProperty('error', true);
      expect(result).toHaveProperty('message');
      expect(result.message).toMatch(/not found/i);
      expect(result).toHaveProperty('code', 'ENTITY_NOT_FOUND');
      expect(result).toHaveProperty('entity_type', 'loan');
      expect(result).toHaveProperty('entity_id', 'L999');
    });
    
    test('should handle unknown function names', async () => {
      const result = await executeFunction('unknownFunction', {});
      
      expect(result).toHaveProperty('error', true);
      expect(result.message).toMatch(/unknown function/i);
    });
    
    test('should handle validation errors', async () => {
      const result = await executeFunction('getLoanDetails', {});
      
      expect(result).toHaveProperty('error', true);
      expect(result).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(result).toHaveProperty('validation_errors');
      expect(Array.isArray(result.validation_errors)).toBe(true);
    });
  });
}); 