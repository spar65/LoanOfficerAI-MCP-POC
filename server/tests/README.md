# LoanOfficerAI-MCP-POC Test Structure

This directory contains tests for the LoanOfficerAI-MCP-POC project. The tests are organized into the following directories:

## Test Organization

### MCP Core Tests (`/mcp-core`)

These tests focus on the core MCP functions that provide business functionality:

- **Basic Loan Information**: Tests for loan details, borrower details, active loans, etc.
- **Risk Assessment**: Tests for default risk, non-accrual risk, high-risk farmers, etc.
- **Predictive Analytics**: Tests for loan restructuring, crop yield risk, market price impact, etc.

### MCP Infrastructure Tests (`/mcp-infrastructure`)

These tests focus on the infrastructure components that support MCP functions:

- **MCP Function Registry**: Tests for function registration, validation, and execution
- **MCP Service**: Tests for the MCP service with logging
- **OpenAI Integration**: Tests for function calling, response handling, and schema validation
- **Logging**: Tests for enhanced MCP logging

### Deprecated Tests (`/deprecated`)

These tests have been deprecated as part of the test restructuring effort:

- **API Tests**: Direct API endpoint tests that have been replaced by MCP-driven tests
- **Data Loading Tests**: Tests for loading data from JSON files
- **Edge Case Tests**: Tests for edge cases in the API
- **Coverage Tests**: Tests designed primarily to increase code coverage

## Running Tests

### Running All MCP Tests

```bash
cd server
node run-mcp-tests.js
```

### Running Individual Tests

```bash
# Run a core test
node tests/mcp-core/test-basic-loan-info.js

# Run an infrastructure test
node tests/mcp-infrastructure/test-logging.js
```

## Test Requirements

- The server must be running for most tests to work
- Some tests require an OpenAI API key to be set in the environment

## Recent Changes

The test structure was recently reorganized to:

1. Separate MCP core and infrastructure tests
2. Deprecate API-driven tests in favor of MCP-driven tests
3. Remove duplicate tests
4. Fix path issues in moved tests

This reorganization makes the tests more maintainable and focused on the MCP functionality, which is the core of the project.
