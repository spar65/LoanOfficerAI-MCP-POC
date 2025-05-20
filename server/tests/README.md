# Server Tests

This directory contains the test suite for the Loan Officer AI server application.

## Test Structure

The tests are organized into the following directories:

- `unit/`: Unit tests for isolated components and API endpoints
- `integration/`: Integration tests for API interactions
- `mock-data/`: Mock data used by tests

## Running the Tests

### All Tests

```bash
npm test
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### Coverage Report

```bash
npm run test:coverage
```

## Test Guidelines

- Every API endpoint should have both unit and integration tests
- Use the mock data from the mock-data directory for consistent test results
- Integration tests should validate API contracts and response formats
- Follow the test-first approach by writing tests before implementation

## Mocking

The tests use Jest's mocking capabilities to mock file system operations and API responses. This allows testing without actual database operations or external dependencies.

## Adding New Tests

When adding new tests, follow these guidelines:

1. Create a test file that matches the name of the file being tested (e.g., `user-service.test.js` for `user-service.js`)
2. Import required dependencies and setup mocks at the top of the file
3. Structure tests using `describe` and `it` blocks for clear organization
4. Include both positive (happy path) and negative (error handling) test cases
5. Clean up mocks and test state after each test
