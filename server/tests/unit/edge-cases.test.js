const request = require('supertest');
const fs = require('fs');

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

const server = require('../../server');

describe('Edge Cases and Additional Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test loans with missing borrower information
  describe('Loans with missing borrower data', () => {
    it('should handle loans with non-existent borrower IDs', async () => {
      // Mock loans data with valid borrower_id
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B999', status: 'Active', loan_amount: 50000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock borrowers data without the corresponding borrower
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      const response = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body[0].borrower).toBe('Unknown');
      expect(response.body[0].borrower_details).toBeNull();
    });
  });

  // Test case with no matching loans for borrower name
  describe('GET /api/loans/borrower/:name - Edge Cases', () => {
    it('should return an empty array for a name with no borrowers', async () => {
      // Mock empty borrowers data
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));
      
      // Mock empty loans data (needed for when checking loans in the business logic)
      const mockLoans = [];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      const response = await request(server)
        .get('/api/loans/borrower/NonExistentName')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });

    it('should find borrowers by last name', async () => {
      // Mock borrowers with a specific last name
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Smith' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));
      
      // Mock loans for that borrower
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Second call for borrowers (in the mapping function)
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      const response = await request(server)
        .get('/api/loans/borrower/Smith')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].borrower_id).toBe('B001');
      expect(response.body[0].loan_id).toBe('L001');
    });
  });
  
  // Test the GET /api/loan/:id endpoint
  describe('GET /api/loan/:id - Full loan details', () => {
    it('should return loan with all related details', async () => {
      // Mock loans data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active', loan_amount: 50000 }
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
      
      // Check for borrower details
      expect(response.body.borrower).toBe('John Doe');
      expect(response.body.borrower_details.first_name).toBe('John');
      
      // Check for related data
      expect(response.body.payments.length).toBe(1);
      expect(response.body.collateral.length).toBe(1);
    });
  });

  // Test filtering by status instead of active endpoint
  describe('GET /api/loans with status filter', () => {
    it('should return active loans with borrower information', async () => {
      // Mock loans with some active and some inactive
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active', loan_amount: 50000 },
        { loan_id: 'L002', borrower_id: 'B002', status: 'Closed', loan_amount: 25000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      
      // Mock borrowers
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' },
        { borrower_id: 'B002', first_name: 'Jane', last_name: 'Smith' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      const response = await request(server)
        .get('/api/loans?status=Active')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('Active');
      expect(response.body[0].loan_id).toBe('L001');
      
      // Check borrower details are included
      expect(response.body[0].borrower).toBe('John Doe');
      expect(response.body[0].borrower_details.first_name).toBe('John');
      expect(response.body[0].borrower_details.last_name).toBe('Doe');
    });
  });
}); 