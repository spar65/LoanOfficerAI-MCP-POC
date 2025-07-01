# MCP Infrastructure Tests

This directory contains tests for the MCP infrastructure components in the LoanOfficerAI-MCP-POC project.

## Test Categories

### MCP Function Registry Tests

- `mcpFunctionRegistry.test.js` - Tests the MCP function registry:
  - Function registration
  - Function validation
  - Error handling
  - Function execution

### MCP Functions Tests

- `mcpFunctions.test.js` - Tests individual MCP functions:
  - Function implementation
  - Input validation
  - Output formatting
  - Error cases

### MCP Service Tests

- `mcpServiceWithLogging.test.js` - Tests the MCP service with logging:
  - Logging of function calls
  - Logging of function results
  - Error handling and logging
  - Request context handling

### OpenAI Integration Tests

- `openai-schemas.test.js` - Tests OpenAI schema validation:

  - Function definitions
  - Response formatting
  - Schema validation

- `openai-integration.test.js` - Tests OpenAI integration:
  - Function calling
  - Response handling
  - Error handling

## Running Tests

To run these tests, you can use the following commands:

```bash
# Run all MCP tests
npm run test:mcp

# Run individual tests using Jest
npx jest tests/mcp-infrastructure/mcpFunctionRegistry.test.js
npx jest tests/mcp-infrastructure/mcpServiceWithLogging.test.js
```

## Test Requirements

- These tests use Jest for unit testing
- Some tests may require mocking of external dependencies
- The tests focus on the internal implementation of MCP components
