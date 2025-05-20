const request = require('supertest');
const fs = require('fs');

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

const server = require('../../server');

describe('Loan Summary Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/loan-summary', () => {
    it('should return correct summary statistics with both active and late loans', async () => {
      // Mock loan data
      const mockLoans = [
        { loan_id: 'L001', status: 'Active', loan_amount: 50000 },
        { loan_id: 'L002', status: 'Active', loan_amount: 75000 },
        { loan_id: 'L003', status: 'Closed', loan_amount: 25000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock payment data with late payments for L001
      const mockPayments = [
        { payment_id: 'P001', loan_id: 'L001', status: 'Late' },
        { payment_id: 'P002', loan_id: 'L002', status: 'On Time' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));

      const response = await request(server)
        .get('/api/loan-summary')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.totalLoans).toBe(3);
      expect(response.body.activeLoans).toBe(2);
      expect(response.body.totalAmount).toBe(150000);
      // 1 out of 3 loans has late payments = 33.33%
      expect(response.body.delinquencyRate).toBeCloseTo(33.33, 1);
    });

    it('should handle empty loan data', async () => {
      // Mock empty loan data
      fs.readFileSync.mockReturnValueOnce(JSON.stringify([]));
      
      // Mock empty payment data
      fs.readFileSync.mockReturnValueOnce(JSON.stringify([]));

      const response = await request(server)
        .get('/api/loan-summary')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.totalLoans).toBe(0);
      expect(response.body.activeLoans).toBe(0);
      expect(response.body.totalAmount).toBe(0);
      expect(response.body.delinquencyRate).toBe(0);
    });

    it('should handle case with no late payments', async () => {
      // Mock loan data
      const mockLoans = [
        { loan_id: 'L001', status: 'Active', loan_amount: 50000 },
        { loan_id: 'L002', status: 'Active', loan_amount: 75000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock payment data with no late payments
      const mockPayments = [
        { payment_id: 'P001', loan_id: 'L001', status: 'On Time' },
        { payment_id: 'P002', loan_id: 'L002', status: 'On Time' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));

      const response = await request(server)
        .get('/api/loan-summary')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.totalLoans).toBe(2);
      expect(response.body.activeLoans).toBe(2);
      expect(response.body.totalAmount).toBe(125000);
      expect(response.body.delinquencyRate).toBe(0);
    });
  });

  describe('GET /api/loan-summary (backwards compatibility)', () => {
    it('should return the same result as /api/loans/summary endpoint', async () => {
      // Mock loan data for both calls
      const mockLoans = [
        { loan_id: 'L001', status: 'Active', loan_amount: 50000 },
        { loan_id: 'L002', status: 'Active', loan_amount: 75000 }
      ];
      fs.readFileSync
        .mockReturnValueOnce(JSON.stringify(mockLoans))  // First call for /api/loans/summary
        .mockReturnValueOnce(JSON.stringify(mockLoans)); // Second call for /api/loan-summary
      
      // Mock payment data for both calls
      const mockPayments = [
        { payment_id: 'P001', loan_id: 'L001', status: 'On Time' },
        { payment_id: 'P002', loan_id: 'L002', status: 'On Time' }
      ];
      fs.readFileSync
        .mockReturnValueOnce(JSON.stringify(mockPayments))  // First call for /api/loans/summary 
        .mockReturnValueOnce(JSON.stringify(mockPayments)); // Second call for /api/loan-summary

      // Get results from both endpoints
      const response1 = await request(server)
        .get('/api/loans/summary')
        .set('Accept', 'application/json');

      const response2 = await request(server)
        .get('/api/loan-summary')
        .set('Accept', 'application/json');

      // Compare responses
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response1.body).toEqual(response2.body);
    });
  });
}); 