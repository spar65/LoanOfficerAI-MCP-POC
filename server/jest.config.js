module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/tests/**',
    '!**/jest.config.js'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 65,
      lines: 70
    }
  },
  setupFilesAfterEnv: ['./tests/setup.js'],
  testTimeout: 10000,
  verbose: true
}; 