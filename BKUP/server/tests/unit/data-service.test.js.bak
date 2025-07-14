const fs = require('fs');
const path = require('path');
const request = require('supertest');

// Mock the fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Import the function we want to test
const server = require('../../server');

describe('Data Service', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBorrowers', () => {
    it('should return all borrowers when no id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockBorrowers = getMockData('borrowers');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(mockBorrowers.length);
      expect(response.body[0].borrower_id).toBe('B001');
      expect(response.body[1].borrower_id).toBe('B002');
    });

    it('should return a specific borrower when id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockBorrowers = getMockData('borrowers');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers/B001')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.borrower_id).toBe('B001');
      expect(response.body.first_name).toBe('John');
      expect(response.body.last_name).toBe('Doe');
    });

    it('should return 404 when borrower is not found', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockBorrowers = getMockData('borrowers');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockBorrowers));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers/B999')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(404);
      expect(response.body.error).toBeTruthy();
    });
  });

  describe('getLoans', () => {
    it('should return all loans when no id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockLoans = getMockData('loans');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make a request to the API
      const response = await request(server)
        .get('/api/loans')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(mockLoans.length);
      expect(response.body[0].loan_id).toBe('L001');
      expect(response.body[1].loan_id).toBe('L002');
    });

    it('should return a specific loan when id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockLoans = getMockData('loans');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make a request to the API
      const response = await request(server)
        .get('/api/loans/L001')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body.loan_id).toBe('L001');
      expect(response.body.borrower_id).toBe('B001');
      expect(response.body.loan_amount).toBe(50000);
    });

    it('should return loans for a specific borrower', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockLoans = getMockData('loans');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers/B001/loans')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].loan_id).toBe('L001');
      expect(response.body[0].borrower_id).toBe('B001');
    });
  });

  describe('getPayments', () => {
    it('should return all payments when no id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockPayments = getMockData('payments');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));

      // Make a request to the API
      const response = await request(server)
        .get('/api/payments')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(mockPayments.length);
      expect(response.body[0].payment_id).toBe('P001');
    });

    it('should return payments for a specific loan', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockPayments = getMockData('payments');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPayments));

      // Make a request to the API
      const response = await request(server)
        .get('/api/loans/L001/payments')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].loan_id).toBe('L001');
      expect(response.body[1].loan_id).toBe('L001');
      expect(response.body[2].loan_id).toBe('L001');
    });
  });

  describe('getEquipment', () => {
    it('should return all equipment when no id is provided', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockEquipment = getMockData('equipment');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockEquipment));

      // Make a request to the API
      const response = await request(server)
        .get('/api/equipment')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(mockEquipment.length);
      expect(response.body[0].equipment_id).toBe('E001');
    });

    it('should return equipment for a specific borrower', async () => {
      // Mock the fs.readFileSync to return our test data
      const mockEquipment = getMockData('equipment');
      fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockEquipment));

      // Make a request to the API
      const response = await request(server)
        .get('/api/borrowers/B001/equipment')
        .set('Accept', 'application/json');

      // Assertions
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].equipment_id).toBe('E001');
      expect(response.body[0].borrower_id).toBe('B001');
    });
  });
}); 