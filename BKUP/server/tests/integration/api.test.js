const request = require('supertest');
const server = require('../../server');

// Use actual data files for integration tests
describe('API Integration Tests', () => {
  
  describe('Borrowers API', () => {
    it('should return all borrowers', async () => {
      const response = await request(server)
        .get('/api/borrowers')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return a single borrower by ID', async () => {
      // First, get all borrowers
      const allBorrowersResponse = await request(server)
        .get('/api/borrowers')
        .set('Accept', 'application/json');
      
      // Use the first borrower's ID for subsequent test
      const firstBorrowerId = allBorrowersResponse.body[0].borrower_id;
      
      const response = await request(server)
        .get(`/api/borrowers/${firstBorrowerId}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.borrower_id).toBe(firstBorrowerId);
    });

    it('should return 404 for non-existent borrower ID', async () => {
      const response = await request(server)
        .get('/api/borrowers/nonexistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
    });
  });

  describe('Loans API', () => {
    it('should return all loans', async () => {
      const response = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return a single loan by ID', async () => {
      // First, get all loans
      const allLoansResponse = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');
      
      // Use the first loan's ID for subsequent test
      const firstLoanId = allLoansResponse.body[0].loan_id;
      
      const response = await request(server)
        .get(`/api/loans/${firstLoanId}`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.loan_id).toBe(firstLoanId);
    });

    it('should return loans for a specific borrower', async () => {
      // First, get all borrowers
      const allBorrowersResponse = await request(server)
        .get('/api/borrowers')
        .set('Accept', 'application/json');
      
      // Use the first borrower's ID for subsequent test
      const firstBorrowerId = allBorrowersResponse.body[0].borrower_id;
      
      const response = await request(server)
        .get(`/api/borrowers/${firstBorrowerId}/loans`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // All returned loans should belong to the borrower
      response.body.forEach(loan => {
        expect(loan.borrower_id).toBe(firstBorrowerId);
      });
    });

    it('should return loans by status', async () => {
      const response = await request(server)
        .get('/api/loans?status=Active')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // All returned loans should have Active status
      response.body.forEach(loan => {
        expect(loan.status).toBe('Active');
      });
    });
  });

  describe('Payments API', () => {
    it('should return all payments', async () => {
      const response = await request(server)
        .get('/api/payments')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return payments for a specific loan', async () => {
      // First, get all loans
      const allLoansResponse = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');
      
      // Use the first loan's ID for subsequent test
      const firstLoanId = allLoansResponse.body[0].loan_id;
      
      const response = await request(server)
        .get(`/api/loans/${firstLoanId}/payments`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // All returned payments should belong to the loan
      response.body.forEach(payment => {
        expect(payment.loan_id).toBe(firstLoanId);
      });
    });
  });

  describe('Equipment API', () => {
    it('should return all equipment', async () => {
      const response = await request(server)
        .get('/api/equipment')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return equipment for a specific borrower', async () => {
      // First, get all borrowers
      const allBorrowersResponse = await request(server)
        .get('/api/borrowers')
        .set('Accept', 'application/json');
      
      // Use the first borrower's ID for subsequent test
      const firstBorrowerId = allBorrowersResponse.body[0].borrower_id;
      
      const response = await request(server)
        .get(`/api/borrowers/${firstBorrowerId}/equipment`)
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      // All returned equipment should belong to the borrower
      response.body.forEach(equipment => {
        expect(equipment.borrower_id).toBe(firstBorrowerId);
      });
    });
  });
}); 