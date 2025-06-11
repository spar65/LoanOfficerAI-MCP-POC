# LoanOfficerAI Testing Guide

## Overview

This document describes the testing infrastructure for the LoanOfficerAI application and how to run tests effectively.

## Test Structure

The tests are organized into the following categories:

- **Unit Tests**: Tests for individual functions and components
- **Integration Tests**: Tests for API endpoints and service interactions
- **OpenAI Tests**: Tests for OpenAI integration and function calling
- **Logging Tests**: Tests for logging functionality
- **Performance Tests**: Tests for application performance
- **Security Tests**: Tests for security features

## Running Tests

Use the following npm scripts to run tests:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run jest tests with coverage
npm run test:coverage

# Run OpenAI integration tests
npm run test:openai

# Run logging tests
npm run test:logging

# Run performance tests
npm run test:performance

# Run security tests
npm run test:security

# Run custom test suite
npm run test:custom
```

## Test Architecture

The test infrastructure is designed to:

1. **Prevent Port Conflicts**: Tests use a different port (3002) than the development server
2. **Avoid Server Hanging**: Tests properly close all resources after completion
3. **Support Test Authentication**: A special test token is available for authentication
4. **Use Supertest**: API tests use supertest to make requests without starting a server

## Troubleshooting Test Issues

### Tests Hanging

If tests are hanging or not exiting properly, check the following:

1. **Timer Cleanup**: Make sure all timers are properly cleared (especially in tokenService.js)
2. **Connection Cleanup**: Ensure connections are properly closed in test server
3. **Use --forceExit**: Add `--forceExit` to Jest command if necessary
4. **Check Global Teardown**: Make sure globalTeardown.js is properly cleaning up resources

### Port Already in Use

If you get "port already in use" errors:

1. Kill any running node processes: `pkill node` or `killall node`
2. Check if another process is using port 3002: `lsof -i :3002`
3. Change the TEST_PORT in test-utils.js

### Test Authentication Issues

If authentication fails in tests:

1. Make sure AUTH_MIDDLEWARE has TEST_TOKEN support
2. Check that the TEST_TOKEN is recognized in authMiddleware.js
3. Verify that the test request has the proper Authorization header

## Recent Fixes

The following issues were fixed in the latest version:

1. **Hanging Tests**: Fixed by properly closing server connections and stopping intervals
2. **TokenService Cleanup**: Added stopCleanupInterval to properly clean up timers
3. **Test Server Shutdown**: Enhanced the stopTestServer function to force close connections
4. **Environment Detection**: Added NODE_ENV=test check to prevent starting unnecessary services
5. **Test Isolation**: Improved test-utils.js to avoid circular dependencies

## Writing New Tests

When writing new tests:

1. Use the test-utils.js helpers for API requests
2. Set proper test environment variables
3. Clean up any resources created during tests
4. Use Jest's beforeAll/afterAll for setup and teardown
5. Mock external services where appropriate

## Notes for CI/CD

For continuous integration environments:

1. Set NODE_ENV=test
2. Use --forceExit with Jest
3. Use --detectOpenHandles to identify potential resource leaks
4. Set maxWorkers=1 to prevent port conflicts
