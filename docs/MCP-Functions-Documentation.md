# MCP Functions Documentation

This document provides comprehensive documentation for the Model Control Protocol (MCP) functions in the LoanOfficerAI system.

## Table of Contents

1. [Overview](#overview)
2. [Function Registry](#function-registry)
3. [Loan Functions](#loan-functions)
4. [Borrower Functions](#borrower-functions)
5. [Risk Assessment Functions](#risk-assessment-functions)
6. [Client Integration](#client-integration)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

## Overview

The Model Control Protocol (MCP) provides a standardized way for AI models to call functions in the LoanOfficerAI system. This enables the AI to retrieve loan information, borrower details, and perform risk assessments while maintaining security and data integrity.

### Architecture

The MCP implementation follows a layered architecture:

1. **Function Registry**: Central repository of all available functions
2. **Service Layer**: Handles business logic and data access
3. **API Layer**: Provides HTTP endpoints for function execution
4. **Client Integration**: React hooks for easy consumption in the UI

## Function Registry

The function registry (`mcpFunctionRegistry.js`) is the central component that:

1. Defines available functions and their schemas
2. Validates function inputs
3. Executes functions with proper error handling
4. Formats responses consistently

### Core Components

- **registry**: Object containing all MCP function implementations
- **functionSchemas**: Object containing function schemas for OpenAI function calling
- **executeFunction**: Method to execute a function by name with arguments
- **callInternalApi**: Helper method to access internal API endpoints

## Loan Functions

### getLoanDetails

Retrieves detailed information about a specific loan.

**Parameters:**

- `loan_id` (string, required): ID of the loan to retrieve details for

**Response:**

```json
{
  "loan_id": "L001",
  "borrower_id": "B001",
  "loan_amount": 50000,
  "interest_rate": 3.5,
  "term_months": 60,
  "start_date": "2023-01-15",
  "status": "Active",
  "last_updated": "2023-06-10T14:30:00Z"
}
```

### getLoanStatus

Retrieves the current status of a specific loan.

**Parameters:**

- `loan_id` (string, required): ID of the loan to retrieve status for

**Response:**

```json
{
  "loan_id": "L001",
  "status": "Active",
  "last_updated": "2023-06-10T14:30:00Z",
  "status_history": [
    {
      "status": "Pending",
      "date": "2023-01-10T09:15:00Z"
    },
    {
      "status": "Active",
      "date": "2023-01-15T11:30:00Z"
    }
  ]
}
```

### getLoanSummary

Retrieves a summary of the entire loan portfolio.

**Parameters:** None

**Response:**

```json
{
  "total_loans": 120,
  "active_loans": 85,
  "pending_loans": 15,
  "closed_loans": 18,
  "defaulted_loans": 2,
  "total_loan_amount": 4750000,
  "active_loan_amount": 3200000,
  "average_loan_amount": 39583.33,
  "average_interest_rate": 3.75,
  "summary_generated_at": "2023-06-15T08:45:00Z",
  "data_freshness": {
    "last_data_refresh": 1686818700000,
    "data_age_minutes": 45
  },
  "portfolio_health": {
    "default_rate": 1.67,
    "active_rate": 70.83
  }
}
```

### getActiveLoans

Retrieves a list of all active loans in the system.

**Parameters:** None

**Response:**

```json
[
  {
    "loan_id": "L001",
    "borrower_id": "B001",
    "borrower_name": "John Smith",
    "loan_amount": 50000,
    "interest_rate": 3.5,
    "status": "Active"
  },
  {
    "loan_id": "L002",
    "borrower_id": "B002",
    "borrower_name": "Jane Doe",
    "loan_amount": 75000,
    "interest_rate": 3.25,
    "status": "Active"
  }
]
```

### getLoansByBorrower

Retrieves a list of loans for a specific borrower.

**Parameters:**

- `borrower_id` (string, required): ID of the borrower to retrieve loans for

**Response:**

```json
[
  {
    "loan_id": "L001",
    "borrower_id": "B001",
    "loan_amount": 50000,
    "interest_rate": 3.5,
    "status": "Active"
  },
  {
    "loan_id": "L003",
    "borrower_id": "B001",
    "loan_amount": 25000,
    "interest_rate": 4.0,
    "status": "Closed"
  }
]
```

## Borrower Functions

### getBorrowerDetails

Retrieves detailed information about a specific borrower.

**Parameters:**

- `borrower_id` (string, required): ID of the borrower to retrieve details for

**Response:**

```json
{
  "borrower_id": "B001",
  "name": "John Smith",
  "contact_info": {
    "email": "john.smith@example.com",
    "phone": "555-123-4567"
  },
  "credit_score": 720,
  "annual_income": 85000,
  "farm_size_acres": 150
}
```

### getBorrowerDefaultRisk

Assesses the default risk for a specific borrower.

**Parameters:**

- `borrower_id` (string, required): ID of the borrower to assess

**Response:**

```json
{
  "borrower_id": "B001",
  "default_risk_score": 0.15,
  "risk_category": "Low",
  "factors": [
    {
      "factor": "Credit Score",
      "impact": "Positive",
      "weight": 0.3
    },
    {
      "factor": "Payment History",
      "impact": "Positive",
      "weight": 0.4
    },
    {
      "factor": "Debt-to-Income Ratio",
      "impact": "Neutral",
      "weight": 0.2
    }
  ]
}
```

## Risk Assessment Functions

### evaluateCollateralSufficiency

Evaluates if collateral is sufficient for a loan.

**Parameters:**

- `loan_id` (string, required): ID of the loan to evaluate

**Response:**

```json
{
  "loan_id": "L001",
  "collateral_value": 65000,
  "loan_amount": 50000,
  "loan_to_value_ratio": 0.77,
  "is_sufficient": true,
  "industry_standard_threshold": 0.8,
  "assessment": "Collateral is sufficient"
}
```

## Client Integration

### React Hook: useMcpFunction

A custom React hook for executing MCP functions with enhanced features:

- Automatic and manual execution modes
- Caching with configurable TTL
- Retry logic with exponential backoff
- Request cancellation
- Fallback mechanisms
- Loading, error, and success states

**Usage:**

```jsx
import { useMcpFunction } from "../hooks/useMcpFunction";

function LoanStatusComponent() {
  const {
    data: loanStatus,
    error,
    isLoading,
    refresh,
  } = useMcpFunction(
    "getLoanStatus",
    { loan_id: "L001" },
    {
      enableCache: true,
      cacheTimeout: 60000, // 1 minute
      maxRetries: 2,
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Loan Status</h3>
      <p>Status: {loanStatus.status}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## Testing

### Unit Tests

Unit tests for MCP functions are located in `server/tests/unit/mcpFunctions.test.js` and can be run with:

```bash
npm run test:unit
```

### Integration Tests

Integration tests that verify the full MCP workflow are located in `server/tests/integration/mcpIntegration.test.js` and can be run with:

```bash
npm run test:integration
```

## Troubleshooting

### Common Issues

1. **Function Not Found**

   - Check that the function name matches exactly what's in the registry
   - Verify that the function is properly exported

2. **Validation Errors**

   - Ensure all required parameters are provided
   - Check parameter types match the schema

3. **Data Not Found**
   - Verify that the entity (loan, borrower) exists in the database
   - Check for typos in IDs

### Debugging

The MCP implementation includes comprehensive logging:

- Function calls are logged at INFO level
- Errors are logged at ERROR level with stack traces
- Performance metrics are included in logs

To increase log verbosity, set the `LOG_LEVEL` environment variable to `debug`.

### Support

For additional help, contact the development team at dev-support@loanofficer-ai.example.com.
