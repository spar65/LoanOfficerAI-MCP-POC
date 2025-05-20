const request = require('supertest');
const server = require('../../server');

describe('API Integration Flow', () => {
  let loanId;
  let borrowerId;

  it('should fetch all loans', async () => {
    const response = await request(server)
      .get('/api/loans')
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Save a loan ID for later tests
    loanId = response.body[0].loan_id;
    borrowerId = response.body[0].borrower_id;
  });

  it('should fetch details for a specific loan', async () => {
    const response = await request(server)
      .get(`/api/loans/${loanId}`)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body.loan_id).toBe(loanId);
    expect(response.body.borrower_id).toBe(borrowerId);
  });

  it('should fetch payments for a specific loan', async () => {
    const response = await request(server)
      .get(`/api/loans/${loanId}/payments`)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.every(payment => payment.loan_id === loanId)).toBe(true);
  });

  it('should fetch loans for a specific borrower', async () => {
    const response = await request(server)
      .get(`/api/borrowers/${borrowerId}/loans`)
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.every(loan => loan.borrower_id === borrowerId)).toBe(true);
  });

  it('should fetch loan summary statistics', async () => {
    const response = await request(server)
      .get('/api/loan-summary')
      .set('Accept', 'application/json');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalLoans');
    expect(response.body).toHaveProperty('activeLoans');
    expect(response.body).toHaveProperty('totalAmount');
    expect(response.body).toHaveProperty('delinquencyRate');
  });
}); 