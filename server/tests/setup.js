// Jest setup file for server tests
const path = require('path');
const fs = require('fs');

// Mock data helper
global.getMockData = (filename) => {
  try {
    const filePath = path.join(__dirname, 'mock-data', `${filename}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      // console.warn(`Mock data file not found: ${filePath}`); // Keep this commented for cleaner test output unless debugging this function
      return [];
    }
  } catch (error) {
    // console.error(`Error loading mock data: ${error.message}`); // Keep this commented
    return [];
  }
};

// Create test logger to avoid console output during tests
global.testLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Set test environment
process.env.NODE_ENV = 'test';

// Ensure fs.existsSync is properly defined (polyfill if necessary, though Jest mock should override)
fs.existsSync = fs.existsSync || ((pathToCheck) => { 
  try { 
    fs.accessSync(pathToCheck); 
    return true; 
  } catch (e) { 
    return false; 
  } 
});

// Set up Jest globals if not already available
if (typeof jest === 'undefined') {
  global.jest = {
    fn: () => jest.fn() // Basic mock for jest.fn if not in Jest env (e.g. utility files)
  };
}

// Comment out console mocking for debugging purposes
/*
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.log = jest.fn();
console.error = jest.fn();
console.warn = jest.fn();

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
*/

// Global test configurations
beforeAll(() => {
  jest.setTimeout(10000); // 10 second timeout for all tests
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 