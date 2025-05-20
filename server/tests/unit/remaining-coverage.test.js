const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock fs module with default jest.fn()
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  accessSync: jest.fn()
}));

let server;

describe('Tests for Remaining Coverage', () => {
  const mockDataRoot = path.resolve(__dirname, '../mock-data');

  beforeEach(() => {
    jest.resetModules();
    server = require('../../server');
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
  });

  // Helper to set up fs mocks for a specific file
  const setupFsMocks = (fileName, data) => {
    const mockFilePath = path.normalize(path.join(mockDataRoot, fileName));
    fs.existsSync.mockImplementation((p) => path.normalize(p) === mockFilePath);
    fs.readFileSync.mockImplementation((p, enc) => {
      if (path.normalize(p) === mockFilePath) {
        return JSON.stringify(data);
      }
      return undefined;
    });
  };
  
  const setupFsMocksForMultipleFiles = (filesData) => { 
    fs.existsSync.mockImplementation((p) => {
        const normalizedP = path.normalize(p);
        const requestedFile = path.basename(normalizedP);
        const mockFilePathConstructed = path.normalize(path.join(mockDataRoot, requestedFile));
        return filesData.hasOwnProperty(requestedFile) && normalizedP === mockFilePathConstructed;
    });
    fs.readFileSync.mockImplementation((p, enc) => {
        const normalizedP = path.normalize(p);
        const requestedFile = path.basename(normalizedP);
        const mockFilePathConstructed = path.normalize(path.join(mockDataRoot, requestedFile));
        if (filesData.hasOwnProperty(requestedFile) && normalizedP === mockFilePathConstructed) {
            return JSON.stringify(filesData[requestedFile]);
        }
        return undefined;
    });
  };

  describe('GET /api/loan/status/:id', () => {
    it('should return the status of a loan', async () => {
      const mockLoans = [{ loan_id: 'L001', status: 'Active' }];
      setupFsMocks('loans.json', mockLoans);
      const response = await request(server).get('/api/loan/status/L001');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Active');
    });

    it('should return 404 for a non-existent loan', async () => {
      setupFsMocks('loans.json', []);
      const response = await request(server).get('/api/loan/status/L999');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/loans/borrower/:name', () => {
    it('should find loans by borrower first name', async () => {
      const mockBorrowers = [{ borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }];
      const mockLoans = [{ loan_id: 'L001', borrower_id: 'B001' }];
      setupFsMocksForMultipleFiles({
        'borrowers.json': mockBorrowers,
        'loans.json': mockLoans
      });
      const response = await request(server).get('/api/loans/borrower/John');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].borrower_id).toBe('B001');
    });

    it('should return empty array when no borrowers match the name', async () => {
        setupFsMocksForMultipleFiles({
            'borrowers.json': [],
            'loans.json': []
        });
      const response = await request(server).get('/api/loans/borrower/NonExistent');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/borrower/:id', () => {
    it('should return details for a specific borrower', async () => {
      const mockBorrowers = [{ borrower_id: 'B001', first_name: 'Test' }];
      setupFsMocks('borrowers.json', mockBorrowers);
      const response = await request(server).get('/api/borrower/B001');
      expect(response.status).toBe(200);
      expect(response.body.first_name).toBe('Test');
    });

    it('should return 404 for a non-existent borrower', async () => {
      setupFsMocks('borrowers.json', []);
      const response = await request(server).get('/api/borrower/B999');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/loan/:id/collateral', () => {
    it('should return collateral for a specific loan', async () => {
      const mockCollateral = [{ loan_id: 'L001', type: 'Land' }];
      setupFsMocks('collateral.json', mockCollateral);
      const response = await request(server).get('/api/loan/L001/collateral');
      expect(response.status).toBe(200);
      expect(response.body[0].type).toBe('Land');
    });
  });

  describe('Equipment Endpoints', () => {
    it('should return all equipment', async () => {
      const mockEquipment = [{ equipment_id: 'E001' }];
      setupFsMocks('equipment.json', mockEquipment);
      const response = await request(server).get('/api/equipment');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });

    it('should return equipment for a specific borrower', async () => {
      const mockEquipment = [{ equipment_id: 'E001', borrower_id: 'B001' }];
      setupFsMocks('equipment.json', mockEquipment);
      const response = await request(server).get('/api/borrowers/B001/equipment');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });
  });
}); 