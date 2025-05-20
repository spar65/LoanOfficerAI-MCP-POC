# Testing for LoanOfficer MCP POC

## Overview

This project contains both skipped tests (from the original implementation) and working tests that have been created specifically for the POC. The skipped tests are kept for reference but are not intended to run as part of the POC validation.

## Test Categories

- **Simple Tests**: Basic tests that validate the testing framework itself
- **Mock Data Tests**: Tests that validate data structures and simple operations using mock data
- **Utility Tests**: Tests for pure utility functions that don't rely on external dependencies
- **Skipped Tests**: More complex tests (integration, auth, etc.) that are kept for reference but skipped for the POC

## Running Tests

To run only the tests that are designed to work in the POC:

```bash
npm run test:poc
```

Other test commands:

```bash
# Run all tests (many will be skipped or fail)
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## Test Files

### Working Tests (POC)

- `tests/unit/simple.test.js`: Basic tests to verify the test framework is working
- `tests/unit/mock-data.test.js`: Tests for data structures using mocks
- `tests/unit/utils.test.js`: Tests for utility functions without external dependencies

### Skipped Tests (Reference Only)

- `tests/unit/api.test.js`: Tests for API endpoints (skipped)
- `tests/unit/loan-details.test.js`: Tests for loan details functionality
- `tests/unit/loan-summary.test.js`: Tests for loan summary functionality
- `tests/integration/api-flow.test.js`: Tests for API flows (skipped)
- `tests/integration/api.test.js`: Integration tests for API endpoints (skipped)
- `tests/integration/auth-api.test.js`: Authentication API tests (skipped)

## Test Configuration

The test configuration is defined in `jest.config.js`. This includes:

- Test patterns
- Coverage thresholds
- Setup files
- Test timeout
- Verbose output

## Notes for Future Development

1. The auth-related tests are currently skipped due to dependencies on external modules and configuration.
2. Test coverage is intentionally not enforced for the POC.
3. To run the full test suite in the future, dependencies like bcrypt will need to be properly installed and configured.
