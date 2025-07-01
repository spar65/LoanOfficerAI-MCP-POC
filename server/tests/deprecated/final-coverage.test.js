const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { getMockData } = require('../test-utils');

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  accessSync: jest.fn()
}));

const server = require('../../server');

describe('Final Coverage Tests', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
    fs.existsSync.mockImplementation(() => true);
  });

  // Test for the loan endpoint with borrower, payments, and collateral
  describe('GET /api/loan/:id with all relationships', () => {
    it('should fetch comprehensive loan details with all relationships', async () => {
      // Mock loans data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', loan_amount: 50000, status: 'Active' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock borrowers data
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));
      
      // Mock payments data
      const mockPayments = [
        { payment_id: 'P001', loan_id: 'L001', amount: 1000, status: 'On Time' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));
      
      // Mock collateral data
      const mockCollateral = [
        { collateral_id: 'C001', loan_id: 'L001', description: 'Farm Equipment', value: 30000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockCollateral));

      const response = await request(server)
        .get('/api/loan/L001')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.loan_id).toBe('L001');
      expect(response.body.borrower).toBe('John Doe');
      expect(response.body.payments.length).toBe(1);
      expect(response.body.payments[0].payment_id).toBe('P001');
      expect(response.body.collateral.length).toBe(1);
      expect(response.body.collateral[0].collateral_id).toBe('C001');
    });

    it('should return 404 for non-existent loan', async () => {
      // Mock empty loans data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      const response = await request(server)
        .get('/api/loan/nonexistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Loan not found');
    });
  });

  // Test for loans filtered by status (Query parameter handling)
  describe('GET /api/loans?status=X', () => {
    it('should filter loans by status', async () => {
      // Mock loans with mixed statuses
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active' },
        { loan_id: 'L002', borrower_id: 'B002', status: 'Closed' },
        { loan_id: 'L003', borrower_id: 'B003', status: 'Pending' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock borrowers data
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' },
        { borrower_id: 'B002', first_name: 'Jane', last_name: 'Smith' },
        { borrower_id: 'B003', first_name: 'Bob', last_name: 'Brown' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      const response = await request(server)
        .get('/api/loans?status=Pending')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('Pending');
      expect(response.body[0].loan_id).toBe('L003');
    });
  });

  // Test for the middleware logging
  describe('Middleware logging', () => {
    it('should log requests', async () => {
      // Spy on console.log
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Mock data for the endpoint
      const mockData = [{ id: 'test1' }];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockData));
      
      // Make a request
      await request(server)
        .get('/api/borrowers')
        .set('Accept', 'application/json');

      // Check if console.log was called with the request info
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z\] GET \/api\/borrowers/)
      );
      
      // Restore console.log
      consoleSpy.mockRestore();
    });
  });

  // Test for error handling in loadData
  describe('loadData error handling', () => {
    it('should return empty array when data file cannot be parsed', async () => {
      // Spy on console.error to verify it's called
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Make fs.readFileSync return invalid JSON
      fs.readFileSync.mockReturnValueOnce('not valid json');
      
      // Call an endpoint that uses loadData
      const response = await request(server)
        .get('/api/borrowers')
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
      
      // Should log the error
      expect(consoleSpy).toHaveBeenCalled();
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  // Test for equipment endpoint when no equipment data exists
  describe('Equipment endpoint edge cases', () => {
    it('should return empty array when equipment data does not exist', async () => {
      // Make readFileSync throw an error for equipment data
      fs.readFileSync.mockImplementationOnce(() => {
        throw new Error('Equipment file not found');
      });
      
      const response = await request(server)
        .get('/api/equipment')
        .set('Accept', 'application/json');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });

  // Test the comprehensive loan endpoint with all relationships
  describe('GET /api/loan/:id with all relationships', () => {
    it('should fetch comprehensive loan details with all relationships', async () => {
      // Create mock data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', amount: 50000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock borrowers data
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));
      
      // Mock payments data
      const mockPayments = [
        { payment_id: 'P001', loan_id: 'L001', amount: 1000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));
      
      // Mock collateral data
      const mockCollateral = [
        { collateral_id: 'C001', loan_id: 'L001', description: 'Land' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockCollateral));

      const response = await request(server)
        .get('/api/loan/L001/full')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.loan_id).toBe('L001');
      expect(response.body.borrower_id).toBe('B001');
      expect(response.body.borrower.first_name).toBe('John');
      expect(response.body.borrower.last_name).toBe('Doe');
      expect(Array.isArray(response.body.payments)).toBeTruthy();
      expect(response.body.payments.length).toBe(1);
      expect(Array.isArray(response.body.collateral)).toBeTruthy();
      expect(response.body.collateral.length).toBe(1);
    });
    
    it('should return 404 for a non-existent loan', async () => {
      // Create mock data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', amount: 50000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      const response = await request(server)
        .get('/api/loan/nonexistent/full')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
    });
  });
  
  // Test error handling for file loading
  describe('Error handling for data loading', () => {
    it('should handle file not found errors gracefully', async () => {
      // Mock the existsSync to return false (file not found)
      fs.existsSync.mockReturnValueOnce(false);
      
      const response = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
    
    it('should handle file reading errors gracefully', async () => {
      // Mock readFileSync to throw an error
      fs.readFileSync.mockImplementationOnce(() => {
        throw new Error('File reading error');
      });
      
      const response = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
    
    it('should handle JSON parsing errors gracefully', async () => {
      // Mock readFileSync to return invalid JSON
      fs.readFileSync.mockReturnValueOnce('invalid json');
      
      const response = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });
  
  // Additional routes for better coverage
  describe('Additional API routes', () => {
    it('should handle nonexistent routes', async () => {
      const response = await request(server)
        .get('/api/nonexistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
    });
    
    it('should handle root path', async () => {
      const response = await request(server)
        .get('/')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
    });
  });
}); 