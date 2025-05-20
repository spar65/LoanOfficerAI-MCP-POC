module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/src/tests/**/*.test.{js,jsx}', '**/?(*.)+(spec|test).{js,jsx}'],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/tests/mocks/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/tests/mocks/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: true
}; 