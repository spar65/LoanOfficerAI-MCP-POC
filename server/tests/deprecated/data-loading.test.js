const fs = require('fs');
const path = require('path');
const request = require('supertest');

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(() => true),
  accessSync: jest.fn()
}));

// Import server
const server = require('../../server');
const mockDataDir = path.join(__dirname, '..', 'mock-data');

describe('Data Loading Function', () => {
  let originalNodeEnv;
  
  beforeEach(() => {
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    jest.clearAllMocks();
    
    // Default implementation for existsSync
    fs.existsSync.mockImplementation(() => true);
  });
  
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
  
  it('should load data from mock files when in test environment', async () => {
    // Create mock data for loans
    const mockLoans = [
      { loan_id: 'L001', borrower_id: 'B001', amount: 50000 }
    ];
    
    // Setup readFileSync mock
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(mockLoans));
    
    // Make a request to the API
    const response = await request(server)
      .get('/api/loans')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(1);
  });
  
  it('should handle file not existing gracefully', async () => {
    // Mock existsSync to return false
    fs.existsSync.mockReturnValueOnce(false);
    
    // Make a request to the API
    const response = await request(server)
      .get('/api/loans')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  it('should handle file read errors gracefully', async () => {
    // Mock existsSync to return true, but readFileSync to throw an error
    fs.existsSync.mockReturnValueOnce(true);
    fs.readFileSync.mockImplementationOnce(() => {
      throw new Error('File reading error');
    });
    
    // Make a request to the API
    const response = await request(server)
      .get('/api/loans')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
  
  it('should handle JSON parsing errors gracefully', async () => {
    // Mock existsSync to return true, but readFileSync to return invalid JSON
    fs.existsSync.mockReturnValueOnce(true);
    fs.readFileSync.mockReturnValueOnce('invalid json');
    
    // Make a request to the API
    const response = await request(server)
      .get('/api/loans')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBeTruthy();
    expect(response.body.length).toBe(0);
  });
}); 