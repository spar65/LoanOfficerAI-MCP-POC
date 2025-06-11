/**
 * Jest configuration for the server tests
 */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    'mcp/**/*.js',
    '!**/node_modules/**'
  ],
  
  // Test timeout
  testTimeout: 30000,
  
  // Display verbose test output
  verbose: true,
  
  // Setup files to run before tests
  setupFiles: ['./tests/setup.js'],
  
  // Set test environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'test',
    TEST_PORT: '3002',
    ALLOW_TEST_AUTH: 'true'
  },
  
  // Global setup/teardown
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  
  // Prevent tests from starting server multiple times
  maxConcurrency: 1,
  maxWorkers: 1,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Detect open handles (connections, timers, etc.) that aren't properly closed
  detectOpenHandles: true,
  
  // Set a shorter timeout for graceful shutdown
  testEnvironmentOptions: {
    ...module.exports?.testEnvironmentOptions,
    teardown: {
      // Time to wait for cleanup (ms)
      shutdownTimeout: 5000
    }
  }
}; 