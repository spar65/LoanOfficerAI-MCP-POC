# Risk Assessment MCP Implementation Plan

## Current State Analysis

### 1. Analysis of Chatbot Risk Assessment Functions

Based on the review of the codebase, the first three chatbot actions shown in the screenshot (risk assessments queries) are failing to provide results. The user interface shows "I apologize, but I'm unable to..." responses for all risk-related queries:

- "What is the default risk for borrower B001?"
- "Evaluate collateral sufficiency for loan L002"
- "What is the non-accrual risk for borrower B003?"

### 2. MCP Integration Status

The Chatbot component (`client/src/components/Chatbot.js`) uses OpenAI to process queries and can call MCP functions. However, the current implementation has several issues:

1. **Missing MCP Function Schemas**: The risk assessment functions (`getBorrowerDefaultRisk`, `evaluateCollateralSufficiency`, `getBorrowerNonAccrualRisk`) are properly defined in the MCP Function Registry (`server/services/mcpFunctionRegistry.js`), but are not included in the schema definitions presented to OpenAI in the client (`MCP_FUNCTIONS` array in Chatbot.js).

2. **Incomplete Integration**: The client-side `mcpClient.js` has implementations for risk assessment functions, but they're not being processed by the Chatbot component.

3. **UI-Server Disconnection**: The UI is set up to handle risk assessment requests, but the connection to the backend services is incomplete.

## Detailed Issue Analysis

### 1. Missing OpenAI Function Definitions

The Chatbot.js file defines the following MCP functions for OpenAI:

```javascript
const MCP_FUNCTIONS = [
  { name: "getAllLoans", ... },
  { name: "getLoanDetails", ... },
  { name: "getLoanStatus", ... },
  { name: "getActiveLoans", ... },
  { name: "getLoansByBorrower", ... },
  { name: "getLoanPayments", ... },
  { name: "getLoanCollateral", ... },
  { name: "getLoanSummary", ... }
];
```

But it's missing the risk assessment functions:

- `getBorrowerDefaultRisk`
- `evaluateCollateralSufficiency`
- `getBorrowerNonAccrualRisk`

### 2. Backend Implementation Status

The backend implementation of the risk assessment functions exists in:

- `server/services/mcpFunctionRegistry.js` - Function registration
- `server/routes/risk.js` - Actual implementation of risk endpoints
- `server/routes/analytics.js` - Additional analytics endpoints

The functions are properly implemented on the backend, but not accessible from the frontend.

### 3. Client-Side Integration Status

The client-side `mcpClient.js` has implementations for these risk assessment functions:

```javascript
// Inside mcpClient
async getBorrowerDefaultRisk(borrowerId, timeHorizon = 'medium_term') { ... }
async evaluateCollateralSufficiency(loanId, marketConditions = 'stable') { ... }
async getBorrowerNonAccrualRisk(borrowerId) { ... }
```

But these functions are not being connected to the OpenAI function calling mechanism.

## Implementation Plan

### 1. Update Chatbot.js MCP Function Definitions

Add the missing risk assessment functions to the `MCP_FUNCTIONS` array in `client/src/components/Chatbot.js`:

```javascript
const MCP_FUNCTIONS = [
  // Existing functions...

  // Add these risk assessment functions
  {
    name: "getBorrowerDefaultRisk",
    description: "Get the default risk assessment for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to assess for default risk",
        },
      },
      required: ["borrower_id"],
    },
  },
  {
    name: "evaluateCollateralSufficiency",
    description: "Evaluate if collateral is sufficient for a loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description:
            "The ID of the loan to evaluate collateral sufficiency for",
        },
      },
      required: ["loan_id"],
    },
  },
  {
    name: "getBorrowerNonAccrualRisk",
    description: "Get the non-accrual risk assessment for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower to assess for non-accrual risk",
        },
      },
      required: ["borrower_id"],
    },
  },
];
```

### 2. Update Chatbot.js Function Call Processing

Update the `processFunctionCall` function in `client/src/components/Chatbot.js` to handle the risk assessment functions:

```javascript
// Add to the switch statement in processFunctionCall
switch (name) {
  // Existing cases...

  case "getBorrowerDefaultRisk":
    result = await mcpClient[name](args.borrower_id);
    break;

  case "evaluateCollateralSufficiency":
    result = await mcpClient[name](args.loan_id);
    break;

  case "getBorrowerNonAccrualRisk":
    result = await mcpClient[name](args.borrower_id);
    break;
}
```

### 3. Update Server-Side Endpoint Integration

Ensure the server.js routes are correctly configured to handle these endpoints by verifying the API routes are properly set up. The current files look good, but we should verify the API paths match between client and server.

- Verify risk routes are correctly registered in the main server.js file:

```javascript
app.use("/api/risk", require("./routes/risk"));
```

### 4. Implement Role-Based Access Control (Optional)

If these risk assessment functions should be limited to certain user roles, update the authentication middleware to enforce role-based permissions.

### 5. Update Error Handling

Enhance error handling for these specific MCP functions in both:

- `server/utils/mcpResponseFormatter.js` - For consistent error formatting
- `client/src/mcp/client.js` - For user-friendly error handling

### 6. Testing Plan

1. Create integration tests for each risk assessment function
2. Test the OpenAI integration with these functions
3. Test the UI response for each risk query type

## Implementation Steps

### Step 1: Update the MCP_FUNCTIONS Array in Chatbot.js

Edit `client/src/components/Chatbot.js` to add the missing function definitions.

### Step 2: Update the processFunctionCall Method

Edit the switch statement in the `processFunctionCall` method to handle the new functions.

### Step 3: Test the Integration

Test each risk assessment query:

- "What is the default risk for borrower B001?"
- "Evaluate collateral sufficiency for loan L002"
- "What is the non-accrual risk for borrower B003?"

### Step 4: Validate Error Handling

Ensure proper error messages are shown when:

- Borrower/loan IDs are not found
- Backend services are unavailable
- Data is incomplete

### Step 5: Update Documentation

Update the MCP Functions documentation to include these risk assessment functions.

## Estimated Timeline

1. Implementation of changes: 1 day
2. Testing and validation: 1 day
3. Documentation updates: 0.5 day

Total: 2.5 days

## Conclusion

The core issue is that while the backend functionality exists for risk assessment, the OpenAI integration in the Chatbot component isn't properly configured to use these functions. By adding the missing function definitions and updating the function call processing, we should be able to enable these risk assessment features.
