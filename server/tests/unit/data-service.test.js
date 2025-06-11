const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { getMockData } = require('../test-utils');

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  accessSync: jest.fn()
}));

// Import server
const server = require('../../server');

describe('Data Service', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
    fs.existsSync.mockImplementation(() => true);
  });

  // Tests for borrowers
  describe('getBorrowers', () => {
    it('should return all borrowers when no id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockBorrowers = getMockData('borrowers') || [];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });

    it('should return a specific borrower when id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers/B001')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.borrower_id).toBe('B001');
    });

    it('should return 404 when borrower is not found', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockBorrowers = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers/nonexistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
    });
  });

  // Tests for loans
  describe('getLoans', () => {
    it('should return all loans when no id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockLoans = getMockData('loans') || [];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
      fs.readFileSync.mockReturnValueOnce(JSON.stringify([])); // for borrowers

      // Make a request to the API
      const response = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });

    it('should return a specific loan when id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001', loan_amount: 50000 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make a request to the API
      const response = await request(server)
        .get('/api/loans/L001')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.loan_id).toBe('L001');
    });

    it('should return loans for a specific borrower', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockLoans = [
        { loan_id: 'L001', borrower_id: 'B001' },
        { loan_id: 'L002', borrower_id: 'B002' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers/B001/loans')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].loan_id).toBe('L001');
    });
  });

  // Tests for payments
  describe('getPayments', () => {
    it('should return all payments when no id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockPayments = getMockData('payments') || [];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));

      // Make a request to the API
      const response = await request(server)
        .get('/api/payments')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
    });

    it('should return payments for a specific loan', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockPayments = [
        { payment_id: 'P001', loan_id: 'L001', amount: 1000 },
        { payment_id: 'P002', loan_id: 'L001', amount: 1000 },
        { payment_id: 'P003', loan_id: 'L002', amount: 1500 }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));

      // Make a request to the API
      const response = await request(server)
        .get('/api/loans/L001/payments')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      expect(response.body[0].loan_id).toBe('L001');
    });
  });

  // Tests for equipment
  describe('getEquipment', () => {
    it('should return all equipment when no id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockEquipment = [
        { equipment_id: 'E001', borrower_id: 'B001', description: 'Tractor' },
        { equipment_id: 'E002', borrower_id: 'B002', description: 'Harvester' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockEquipment));

      // Make a request to the API
      const response = await request(server)
        .get('/api/equipment')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
    });

    it('should return equipment for a specific borrower', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockEquipment = [
        { equipment_id: 'E001', borrower_id: 'B001', description: 'Tractor' },
        { equipment_id: 'E002', borrower_id: 'B002', description: 'Harvester' }
      ];
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockEquipment));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers/B001/equipment')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].equipment_id).toBe('E001');
    });
  });
}); 