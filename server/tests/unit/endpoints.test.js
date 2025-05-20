const request = require('supertest');
const fs = require('fs');
const path = require('path');
// const { getMockData } = require('../test-utils'); // getMockData might not be needed if we mock fs directly

// Mock fs module with default jest.fn()
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  accessSync: jest.fn() // Though not directly used by loadData, good to have
}));

let server; // Declare server variable

describe('Additional Endpoint Tests', () => {
  const mockDataRoot = path.resolve(__dirname, '../mock-data');

  beforeEach(() => {
    jest.resetModules(); // Reset modules before each test to get a fresh server instance
    server = require('../../server'); // Require server inside beforeEach after reset
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks(); // Clear all mocks
  });

  // Helper to set up fs mocks for a specific file
  const setupFsMocks = (fileName, data) => {
    const mockFilePath = path.normalize(path.join(mockDataRoot, fileName));
    fs.existsSync.mockImplementation((p) => {
      const result = path.normalize(p) === mockFilePath;
      // console.log(`[existsSync mock] for ${fileName}: path ${path.normalize(p)} === ${mockFilePath}? ${result}`);
      return result;
    });
    fs.readFileSync.mockImplementation((p, enc) => {
      const normalizedP = path.normalize(p);
      console.log(`[readFileSync mock for ${fileName}] CALLED. Path p: ${normalizedP}, Expected mockFilePath: ${mockFilePath}`);
      if (normalizedP === mockFilePath) {
        console.log(`[readFileSync mock for ${fileName}] MATCH! Path: ${normalizedP}. Data BEFORE stringify:`, data);
        const stringifiedData = JSON.stringify(data);
        console.log(`[readFileSync mock for ${fileName}] Stringified: ${stringifiedData.substring(0, 100)}...`);
        return stringifiedData;
      }
      // console.log(`[readFileSync mock for ${fileName}] NO MATCH. Path: ${normalizedP}, Expected: ${mockFilePath}`);
      return undefined; 
    });
  };
  
  const setupFsMocksForMultipleFiles = (filesData) => { // filesData is an object: { "filename.json": data, ... }
    fs.existsSync.mockImplementation((p) => {
        const normalizedP = path.normalize(p);
        const requestedFile = path.basename(normalizedP);
        const mockFilePathConstructed = path.normalize(path.join(mockDataRoot, requestedFile));
        const doesExist = filesData.hasOwnProperty(requestedFile) && normalizedP === mockFilePathConstructed;
        // console.log(`[existsSync mock multi] for ${normalizedP}, looking for ${requestedFile}, mockPath: ${mockFilePathConstructed}, exists: ${doesExist}`);
        return doesExist;
    });
    fs.readFileSync.mockImplementation((p, enc) => {
        const normalizedP = path.normalize(p);
        const requestedFile = path.basename(normalizedP);
        const mockFilePathConstructed = path.normalize(path.join(mockDataRoot, requestedFile));
        console.log(`[readFileSync mock multi for ${requestedFile}] CALLED. Path p: ${normalizedP}, Expected mockFilePath: ${mockFilePathConstructed}`);
        if (filesData.hasOwnProperty(requestedFile) && normalizedP === mockFilePathConstructed) {
            console.log(`[readFileSync mock multi for ${requestedFile}] MATCH! Path: ${normalizedP}. Data BEFORE stringify:`, filesData[requestedFile]);
            const stringifiedData = JSON.stringify(filesData[requestedFile]);
            console.log(`[readFileSync mock multi for ${requestedFile}] Stringified: ${stringifiedData.substring(0,100)}...`);
            return stringifiedData;
        }
        return undefined; 
    });
  };


  // Test loan status endpoint
  describe('GET /api/loan/status/:id', () => {
    it('should return loan status for valid loan ID', async () => {
      const mockLoans = [{ loan_id: 'L001', status: 'Active', borrower_id: 'B001' }];
      setupFsMocks('loans.json', mockLoans);

      const response = await request(server)
        .get('/api/loan/status/L001')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Active');
    });

    it('should return 404 for non-existent loan', async () => {
      const mockLoans = [{ loan_id: 'L001', status: 'Active', borrower_id: 'B001' }];
      setupFsMocks('loans.json', mockLoans);

      const response = await request(server)
        .get('/api/loan/status/nonexistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
    });
  });

  // Test loans with status query parameter
  describe('GET /api/loans?status=X', () => {
    it('should return only active loans', async () => {
      const mockLoansData = [
        { loan_id: 'L001', status: 'Active', borrower_id: 'B001' },
        { loan_id: 'L002', status: 'Active', borrower_id: 'B002' },
        { loan_id: 'L003', status: 'Closed', borrower_id: 'B001' }
      ];
      const mockBorrowersData = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' },
        { borrower_id: 'B002', first_name: 'Jane', last_name: 'Smith' }
      ];
      setupFsMocksForMultipleFiles({
        'loans.json': mockLoansData,
        'borrowers.json': mockBorrowersData
      });

      const response = await request(server)
        .get('/api/loans?status=Active')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      response.body.forEach(loan => {
        expect(loan.status).toBe('Active');
      });
    });

    it('should handle case with no matching status loans', async () => {
      const mockLoansData = [
        { loan_id: 'L001', status: 'Active', borrower_id: 'B001' },
        { loan_id: 'L002', status: 'Active', borrower_id: 'B002' }
      ];
      const mockBorrowersData = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      setupFsMocksForMultipleFiles({
        'loans.json': mockLoansData,
        'borrowers.json': mockBorrowersData
      });

      const response = await request(server)
        .get('/api/loans?status=NonExistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });

  // Test borrower loans endpoint
  describe('GET /api/loans/borrower/:name', () => {
    it('should return loans for borrower with matching name', async () => {
      const mockBorrowersData = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' },
        { borrower_id: 'B002', first_name: 'Jane', last_name: 'Smith' }
      ];
      const mockLoansData = [
        { loan_id: 'L001', borrower_id: 'B001', status: 'Active' },
        { loan_id: 'L002', borrower_id: 'B002', status: 'Active' }
      ];
      // This endpoint calls loadData for loansPath then borrowersPath, then borrowersPath again for mapping
      setupFsMocksForMultipleFiles({
        'loans.json': mockLoansData,
        'borrowers.json': mockBorrowersData 
      });

      const response = await request(server)
        .get('/api/loans/borrower/John')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
      expect(response.body[0].borrower_id).toBe('B001');
      expect(response.body[0].loan_id).toBe('L001');
    });

    it('should return empty array when no borrowers match the name', async () => {
      const mockBorrowersData = [
        { borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }
      ];
      // Only borrowers.json is needed here as loans.json won't be reached if no matching borrowers
      setupFsMocks('borrowers.json', mockBorrowersData);


      const response = await request(server)
        .get('/api/loans/borrower/NonExistent')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });

  // Test loan collateral endpoint
  describe('GET /api/loan/:id/collateral', () => {
    it('should return collateral for a loan', async () => {
      const mockCollateralData = [
        { collateral_id: 'C001', loan_id: 'L001', description: 'Farm Equipment', value: 30000 },
        { collateral_id: 'C002', loan_id: 'L001', description: 'Land', value: 100000 }
      ];
      setupFsMocks('collateral.json', mockCollateralData);

      const response = await request(server)
        .get('/api/loan/L001/collateral')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2); 
      response.body.forEach(item => {
        expect(item.loan_id).toBe('L001');
      });
    });
  });

  // Test equipment endpoints
  describe('Equipment Endpoints', () => {
    it('should handle equipment data correctly for /api/equipment', async () => {
      const mockEquipmentData = [
        { equipment_id: 'E001', borrower_id: 'B001', description: 'Tractor', value: 50000 }
      ];
      setupFsMocks('equipment.json', mockEquipmentData);

      const response = await request(server)
        .get('/api/equipment')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(1);
    });
    
    it('should handle borrower equipment data with empty array if mock file does not exist', async () => {
      // Make existsSync return false for equipment.json for this specific test
      const mockEquipmentFilePath = path.join(mockDataRoot, 'equipment.json');
      fs.existsSync.mockImplementation((p) => p !== mockEquipmentFilePath); // False for equipment, true for others if any
      // readFileSync will not be called for equipment.json if existsSync is false

      const response = await request(server)
        .get('/api/borrowers/B001/equipment')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /api/collateral', () => {
    it.only('should return all collateral items', async () => {
      const mockCollateralData = [
        { collateral_id: 'C001', loan_id: 'L001', description: 'Land' },
        { collateral_id: 'C002', loan_id: 'L002', description: 'Equipment' }
      ];
      console.log('[Test /api/collateral] Mock data object being passed to setupFsMocks:', mockCollateralData);
      setupFsMocks('collateral.json', mockCollateralData);

      console.log('[Test /api/collateral] Registered routes on server instance:');
      if (server && server._router && server._router.stack) {
        server._router.stack.forEach(function(r){
          if (r.route && r.route.path){
            console.log(r.route.path);
          }
        });
      } else {
        console.log('[Test /api/collateral] server._router.stack not available.');
      }

      console.log('[Test /api/collateral] Making request...');
      const response = await request(server)
        .get('/api/collateral') 
        .set('Accept', 'application/json');
      
      console.log('[Test /api/collateral] Response status from Supertest:', response.status);
      console.log('[Test /api/collateral] Response body from Supertest:', JSON.stringify(response.body).substring(0, 200));

      if(response.status !== 200) {
        console.error('[Test /api/collateral] UNEXPECTED STATUS! Headers:', response.headers);
        console.error('[Test /api/collateral] UNEXPECTED STATUS! Full Body:', response.text);
      }

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(2);
      expect(response.body[0].collateral_id).toBe('C001');
    });
  });

  describe('GET /api/collateral/:id', () => {
    it('should return a specific collateral item', async () => {
      const mockCollateralData = [
        { collateral_id: 'C001', loan_id: 'L001', description: 'Land' },
        { collateral_id: 'C002', loan_id: 'L002', description: 'Equipment' }
      ];
      console.log('[Test /api/collateral/:id] Setting up mock for collateral.json with data:', JSON.stringify(mockCollateralData));
      setupFsMocks('collateral.json', mockCollateralData);

      const response = await request(server)
        .get('/api/collateral/C001')
        .set('Accept', 'application/json');

      console.log('[Test /api/collateral/:id] Response status:', response.status);
      console.log('[Test /api/collateral/:id] Response body:', JSON.stringify(response.body));

      expect(response.status).toBe(200); 
      expect(response.body.collateral_id).toBe('C001');
    });

    it('should return 404 for nonexistent collateral ID', async () => {
      const mockCollateralData = [{ collateral_id: 'C001', loan_id: 'L001', description: 'Land' }];
      setupFsMocks('collateral.json', mockCollateralData);
      const response = await request(server).get('/api/collateral/nonexistent');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/loans/:id/borrower', () => {
    it('should return borrower details for a loan', async () => {
      const mockLoansData = [{ loan_id: 'L001', borrower_id: 'B001', amount: 50000 }];
      const mockBorrowersData = [{ borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }];
      console.log('[Test /api/loans/:id/borrower] Setting up mocks with loans:', JSON.stringify(mockLoansData), 'and borrowers:', JSON.stringify(mockBorrowersData));
      setupFsMocksForMultipleFiles({
        'loans.json': mockLoansData,
        'borrowers.json': mockBorrowersData
      });

      const response = await request(server).get('/api/loans/L001/borrower');
      console.log('[Test /api/loans/:id/borrower] Response status:', response.status);
      console.log('[Test /api/loans/:id/borrower] Response body:', JSON.stringify(response.body));
      expect(response.status).toBe(200);
      expect(response.body.borrower_id).toBe('B001');
    });

    it('should return 404 for nonexistent loan ID', async () => {
      const mockLoansData = [{ loan_id: 'L001', borrower_id: 'B001', amount: 50000 }];
      // borrowers.json won't be loaded if loan is not found
      setupFsMocks('loans.json', mockLoansData);


      const response = await request(server)
        .get('/api/loans/nonexistent/borrower')
        .set('Accept', 'application/json');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/borrowers/:id/details', () => {
    it('should return comprehensive details for a borrower', async () => {
      const mockBorrowersData = [{ borrower_id: 'B001', first_name: 'John', last_name: 'Doe' }];
      const mockLoansData = [{ loan_id: 'L001', borrower_id: 'B001', amount: 50000 }];
      const mockPaymentsData = [{ payment_id: 'P001', loan_id: 'L001', amount: 1000 }];
      const mockEquipmentData = [{ equipment_id: 'E001', borrower_id: 'B001', description: 'Tractor' }];
      const mockCollateralFileData = []; // Explicitly empty for this detailed test unless collateral is primary
      
      console.log('[Test /api/borrowers/:id/details] Setting up mocks...');
      setupFsMocksForMultipleFiles({
        'borrowers.json': mockBorrowersData,
        'loans.json': mockLoansData,
        'payments.json': mockPaymentsData,
        'equipment.json': mockEquipmentData,
        'collateral.json': mockCollateralFileData 
      });
      
      const response = await request(server).get('/api/borrowers/B001/details');
      console.log('[Test /api/borrowers/:id/details] Response status:', response.status);
      console.log('[Test /api/borrowers/:id/details] Response body:', JSON.stringify(response.body));
      expect(response.status).toBe(200);
      expect(response.body.borrower_id).toBe('B001');
      // ... further assertions
    });
  });
}); 