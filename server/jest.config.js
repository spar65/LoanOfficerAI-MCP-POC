/**
 * Jest configuration for the server tests
 */
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'auth/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/unit/**/*.test.js',
    '**/tests/integration/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/deprecated/',
    '/tests/mcp-core/',
    '/tests/mcp-infrastructure/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1,
  // Handle ES6 modules
  transform: {
    '^.+\\\\.js$': 'babel-jest'
  },
  // Transform node_modules if needed
  transformIgnorePatterns: [
    'node_modules/(?!(chai)/)'
  ],
  // Module name mapping for problematic modules
  moduleNameMapper: {
    '^chai$': '<rootDir>/node_modules/chai/lib/chai.js'
  },
  // Use require instead of import for certain modules
  moduleFileExtensions: ['js', 'json'],
  testTimeout: 30000
}; 