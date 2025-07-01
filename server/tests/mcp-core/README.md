# MCP Core Tests

This directory contains tests for the core MCP functions in the LoanOfficerAI-MCP-POC project.

## Test Categories

### Basic Loan Information Tests

- `test-basic-loan-info.js` - Tests the core loan information MCP functions:
  - getLoanDetails
  - getBorrowerDetails
  - getActiveLoans
  - getLoansByBorrower
  - getLoanSummary
  - OpenAI function calling integration

### Risk Assessment Tests

- `test-risk-assessment-combined.js` - Tests risk assessment MCP functions:
  - getBorrowerDefaultRisk
  - evaluateNonAccrualRisk
  - identifyHighRiskFarmers
  - evaluateCollateralSufficiency

### Predictive Analytics Tests

- `predictiveAnalytics.test.js` - Tests predictive analytics MCP functions:
  - recommendLoanRestructuring
  - assessCropYieldRisk
  - analyzeMarketPriceImpact

### Manual Tests

- `manual-analytics-test.js` - Manual testing of predictive analytics functions

## Running Tests

To run these tests, you can use the following commands:

```bash
# Run all MCP tests
npm run test:mcp

# Run individual tests
node tests/mcp-core/test-basic-loan-info.js
node tests/mcp-core/test-risk-assessment-combined.js
```

## Test Requirements

- The server must be running for these tests to work
- The tests use the internal API endpoints to validate MCP functionality
