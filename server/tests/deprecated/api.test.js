/**
 * API Endpoint Tests
 * 
 * This file tests the core API endpoints using supertest without starting the server.
 */

const { apiRequest } = require('../helpers/test-utils');
const { expect } = require('chai');

describe('API Endpoints', () => {
  describe('GET /api/loans', () => {
    it('should return all loans', async () => {
      // Use the apiRequest helper which handles authentication
      const response = await apiRequest('get', '/api/loans');
      
      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('loan_id');
    });
    
    it('should support filtering by status', async () => {
      const response = await apiRequest('get', '/api/loans?status=Active');
      
      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.every(loan => loan.status === 'Active')).to.be.true;
    });
  });
  
  describe('GET /api/loans/:id', () => {
    it('should return a specific loan', async () => {
      const response = await apiRequest('get', '/api/loans/L001');
      
      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('loan_id', 'L001');
    });
    
    it('should return 404 for non-existent loan', async () => {
      const response = await apiRequest('get', '/api/loans/NONEXISTENT');
      
      // Assertions
      expect(response.status).to.equal(404);
    });
  });
  
  describe('GET /api/loan-summary', () => {
    it('should return loan summary statistics', async () => {
      const response = await apiRequest('get', '/api/loans/summary');
      
      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('totalLoans');
      expect(response.body).to.have.property('activeLoans');
      expect(response.body).to.have.property('totalAmount');
    });
  });
  
  describe('GET /api/borrowers', () => {
    it('should return all borrowers', async () => {
      const response = await apiRequest('get', '/api/borrowers');
      
      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body[0]).to.have.property('borrower_id');
    });
  });
  
  describe('GET /api/borrowers/:id', () => {
    it('should return a specific borrower', async () => {
      const response = await apiRequest('get', '/api/borrowers/B001');
      
      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('borrower_id', 'B001');
      expect(response.body).to.have.property('first_name');
      expect(response.body).to.have.property('last_name');
    });
  });
}); 