const fs = require('fs');
const path = require('path');
const request = require('supertest');

// Mock the fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Import the server
const server = require('../../server');

// Tests for API Endpoints
describe('API Endpoints', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/loans', () => {
    it('should return all loans', async () => {
      // Mock the fs.readFileSync to return test data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active' },
        { loan_id: 'L002', borrower_id: 'B002', status: 'Active' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make the request
      const response = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].loan_id).toBe('L001');
    });
  });

  describe('GET /api/loans/:id', () => {
    it('should return a specific loan', async () => {
      // Mock the fs.readFileSync to return test data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active' },
        { loan_id: 'L002', borrower_id: 'B002', status: 'Active' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make the request
      const response = await request(server)
        .get('/api/loans/L001')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.loan_id).toBe('L001');
    });

    it('should return 404 for non-existent loan', async () => {
      // Mock the fs.readFileSync to return test data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active' },
        { loan_id: 'L002', borrower_id: 'B002', status: 'Active' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make the request
      const response = await request(server)
        .get('/api/loans/L999')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/loan-summary', () => {
    it('should return loan summary statistics', async () => {
      // Mock the fs.readFileSync to return test data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active', loan_amount: 50000 },
        { loan_id: 'L002', borrower_id: 'B002', status: 'Active', loan_amount: 75000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make the request
      const response = await request(server)
        .get('/api/loan-summary')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.totalLoans).toBe(2);
      expect(response.body.activeLoans).toBe(2);
      expect(response.body.totalAmount).toBe(125000);
    });
  });
}); 