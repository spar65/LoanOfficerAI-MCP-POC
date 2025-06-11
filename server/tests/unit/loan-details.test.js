const request = require('supertest');
const fs = require('fs');

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

const server = require('../../server');

describe('Loan Details Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/loan/:id', () => {
    it('should return comprehensive loan details with related data', async () => {
      // Mock loans data
      const mockLoans = [
        {
          loan_id: 'L001',
          borrower_id: 'B001',
          loan_amount: 50000,
          interest_rate: 3.5,
          term_length: 60,
          status: 'Active'
        }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock borrowers data
      const mockBorrowers = [
        {
          borrower_id: 'B001',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));
      
      // Mock payments data
      const mockPayments = [
        { payment_id: 'P001', loan_id: 'L001', amount: 1000, status: 'On Time' },
        { payment_id: 'P002', loan_id: 'L001', amount: 1000, status: 'On Time' },
        { payment_id: 'P003', loan_id: 'L002', amount: 1500, status: 'Late' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));
      
      // Mock collateral data
      const mockCollateral = [
        { collateral_id: 'C001', loan_id: 'L001', description: 'Farm Equipment', value: 30000 },
        { collateral_id: 'C002', loan_id: 'L002', description: 'Land', value: 100000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockCollateral));

      const response = await request(server)
        .get('/api/loan/L001')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.loan_id).toBe('L001');
      expect(response.body.borrower_id).toBe('B001');
      expect(response.body.loan_amount).toBe(50000);
      
      // Check for borrower details
      expect(response.body.borrower).toBe('John Doe');
      expect(response.body.borrower_details.first_name).toBe('John');
      expect(response.body.borrower_details.last_name).toBe('Doe');
      
      // Check for related payments
      expect(Array.isArray(response.body.payments)).toBeTruthy();
      expect(response.body.payments.length).toBe(2);
      expect(response.body.payments[0].payment_id).toBe('P001');
      
      // Check for related collateral
      expect(Array.isArray(response.body.collateral)).toBeTruthy();
      expect(response.body.collateral.length).toBe(1);
      expect(response.body.collateral[0].collateral_id).toBe('C001');
    });

    it('should handle case with no borrower found', async () => {
      // Mock loans data
      const mockLoans = [
        {
          loan_id: 'L001',
          borrower_id: 'B999', // Borrower that doesn't exist
          loan_amount: 50000
        }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock empty borrowers data
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));
      
      // Mock payments data
      const mockPayments = [];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));
      
      // Mock collateral data
      const mockCollateral = [];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockCollateral));

      const response = await request(server)
        .get('/api/loan/L001')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.loan_id).toBe('L001');
      expect(response.body.borrower).toBe('Unknown');
      expect(response.body.borrower_details).toBeNull();
      expect(response.body.payments).toEqual([]);
      expect(response.body.collateral).toEqual([]);
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
}); 