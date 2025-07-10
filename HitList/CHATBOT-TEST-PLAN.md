# 🧪 Comprehensive Chatbot Query Test Plan

## Overview

This test plan covers all 14 query types available in the LoanOfficerAI chatbot interface, organized into three main categories as shown in the UI:

1. **Basic Loan Information** (5 tests)
2. **Risk Assessment** (4 tests)
3. **Predictive Analytics** (5 tests)

## Test Categories & Coverage

### 1️⃣ Basic Loan Information 🟢

| Query Type            | Test Query                                | Expected Function    | Validation Points                       |
| --------------------- | ----------------------------------------- | -------------------- | --------------------------------------- |
| **Active Loans**      | "Show me all active loans"                | `getActiveLoans`     | loan_id, status, borrower               |
| **Loan Details**      | "Show me details for loan L001"           | `getLoanDetails`     | loan_id, principal, interest_rate, term |
| **Loan Status**       | "What's the status of loan L002?"         | `getLoanStatus`      | loan_id, status                         |
| **Borrower Loans**    | "Show me all loans for borrower B001"     | `getLoansByBorrower` | borrower, loans                         |
| **Portfolio Summary** | "Give me a summary of our loan portfolio" | `getLoanSummary`     | total_loans, active_loans, total_value  |

### 2️⃣ Risk Assessment 🟡

| Query Type                 | Test Query                                                    | Expected Function               | Validation Points                            |
| -------------------------- | ------------------------------------------------------------- | ------------------------------- | -------------------------------------------- |
| **Default Risk**           | "What's the default risk for borrower B003?"                  | `getBorrowerDefaultRisk`        | borrower_id, risk_score, risk_level          |
| **Non-Accrual Risk**       | "Is there a risk that borrower B001 will become non-accrual?" | `getBorrowerNonAccrualRisk`     | borrower_id, non_accrual_risk, risk_factors  |
| **High-Risk Farmers**      | "Which farmers are at high risk of default?"                  | `getHighRiskFarmers`            | farmers, risk_level                          |
| **Collateral Sufficiency** | "Is the collateral sufficient for loan L001?"                 | `evaluateCollateralSufficiency` | loan_id, collateral_value, sufficiency_ratio |

### 3️⃣ Predictive Analytics 🔵

| Query Type              | Test Query                                                                       | Expected Function              | Validation Points                         |
| ----------------------- | -------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------- |
| **Equipment Costs**     | "What are the expected equipment maintenance costs for borrower B001 next year?" | `forecastEquipmentMaintenance` | borrower_id, forecast, equipment          |
| **Crop Yield Risk**     | "What's the crop yield risk for borrower B002 this season?"                      | `assessCropYieldRisk`          | borrower_id, crop_type, risk_assessment   |
| **Market Impact**       | "How will market prices affect borrower B003?"                                   | `analyzeMarketPriceImpact`     | borrower_id, impact_analysis, commodities |
| **Refinancing Options** | "What refinancing options are available for loan L001?"                          | `getRefinancingOptions`        | loan_id, options, savings                 |
| **Payment Patterns**    | "Show me the payment patterns for borrower B001 over the last year"              | `analyzePaymentPatterns`       | borrower_id, patterns, on_time_rate       |

## Test Execution Plan

### 📋 Pre-Test Checklist

- [ ] Server is running on port 3001
- [ ] OpenAI API key is configured
- [ ] Test data (B001, B002, B003, L001, L002) exists
- [ ] System health check passes (`/api/system/status`)
- [ ] MCP functions are registered (`/api/mcp/functions`)

### 🔄 Test Execution Order

1. **System Health Verification**

   - Check server status
   - Verify MCP registry
   - Confirm test data availability

2. **Category Testing** (Sequential)

   - Basic Loan Information (5 tests)
   - Risk Assessment (4 tests)
   - Predictive Analytics (5 tests)

3. **Post-Test Analysis**
   - Generate test report
   - Save results to JSON file
   - Calculate pass rates by category

### ⏱️ Timing & Performance

- **Delay between tests**: 1 second (to avoid rate limiting)
- **Expected total runtime**: ~20-30 seconds
- **Timeout per test**: 30 seconds (OpenAI default)

## Test Validation Criteria

### ✅ Pass Criteria

A test passes when:

1. API returns HTTP 200 status
2. Response contains all expected data fields
3. No error messages in response
4. Function call matches expected function name

### ❌ Fail Criteria

A test fails when:

1. API returns error status (4xx, 5xx)
2. Missing expected data fields in response
3. Unexpected error in response
4. Network timeout or connection failure

### ⚠️ Known Limitations

- Tests use mock data (B001, B002, B003, L001, L002)
- OpenAI responses may vary slightly between runs
- Rate limiting may affect rapid test execution
- Some functions may not be fully implemented

## Running the Tests

### Quick Start

```bash
# From project root
node test-chatbot-queries-comprehensive.js
```

### Expected Output

```
🚀 COMPREHENSIVE CHATBOT QUERY TESTS
===================================
✅ Server is running: operational
✅ MCP Registry: 12 functions available

============================================================
Basic Loan Information Tests
============================================================
[1/5] Active Loans
✅ PASSED: Contains all expected data

[2/5] Loan Details
✅ PASSED: Contains all expected data

... (continues for all 14 tests)

============================================================
TEST SUMMARY
============================================================
Basic Loan Information:
  ✓ Passed: 5/5 (100.0%)

Risk Assessment:
  ✓ Passed: 4/4 (100.0%)

Predictive Analytics:
  ✓ Passed: 5/5 (100.0%)

============================================================
OVERALL: 14/14 tests passed (100.0%)
============================================================

📄 Detailed results saved to: test-results-2025-01-22.json
```

## Test Data Requirements

### Required Borrowers

- **B001**: John Smith (primary test borrower)
- **B002**: Test borrower for crop yield risk
- **B003**: Sarah Johnson (high-risk test borrower)

### Required Loans

- **L001**: Primary test loan
- **L002**: Secondary test loan

## Troubleshooting Guide

### Common Issues

1. **"Server is not running"**

   - Solution: Start server with `cd server && npm start`

2. **"Invalid borrower ID" errors**

   - Solution: Ensure test data exists in database
   - Check: `/api/borrowers/B001` returns data

3. **OpenAI timeout errors**

   - Solution: Check API key validity
   - Verify: Network connection to OpenAI

4. **Missing function errors**
   - Solution: Verify all MCP functions are registered
   - Check: `/api/mcp/functions` lists all expected functions

## Next Steps

After successful test execution:

1. **Review failed tests** - Identify patterns in failures
2. **Update implementations** - Fix any broken functions
3. **Add edge cases** - Test invalid inputs, edge conditions
4. **Performance testing** - Measure response times
5. **Integration testing** - Test with real UI interactions

---

_Last Updated: January 2025_
