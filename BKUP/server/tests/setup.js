// Jest setup file for server tests
const path = require('path');
const fs = require('fs');

// Mock data helper
global.getMockData = (filename) => {
  const filePath = path.join(__dirname, 'mock-data', `${filename}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

// Create test logger to avoid console output during tests
global.testLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Global setup
beforeAll(() => {
  // Set test environment variables if needed
  process.env.NODE_ENV = 'test';
});

// Reset mocks before each test
beforeEach(() => {
  jest.resetAllMocks();
});

// Global teardown
afterAll(() => {
  // Cleanup test environment if needed
}); 