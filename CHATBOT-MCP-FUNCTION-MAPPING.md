# 🎯 Chatbot Sections to MCP Functions Mapping

## Complete MCP Function Inventory

Based on `server/routes/openai.js`, here are all 18 available MCP functions:

### Available MCP Functions:

1. `getBorrowerDefaultRisk` - Get default risk assessment for a specific borrower
2. `getHighRiskFarmers` - Identify farmers with high risk of default across the portfolio
3. `getBorrowerNonAccrualRisk` - Get non-accrual risk assessment for a specific borrower
4. `getBorrowerDetails` - Get detailed information about a specific borrower
5. `getActiveLoans` - Get a list of all active loans in the system
6. `predictDefaultRisk` - Predict the default risk for a specific borrower over a given time horizon
7. `predictNonAccrualRisk` - Predict the likelihood of a borrower's loans becoming non-accrual
8. `analyzePaymentPatterns` - Analyze payment patterns for a specific borrower
9. `getRefinancingOptions` - Get refinancing options for a specific loan
10. `getLoanStatus` - Get the status of a specific loan
11. `getLoanDetails` - Get detailed information about a specific loan
12. `getLoansByBorrower` - Get a list of loans for a specific borrower
13. `getLoanSummary` - Get a summary of loans in the system
14. `findFarmersAtRisk` - Find farmers at risk
15. `forecastEquipmentMaintenance` - Forecast equipment maintenance for a specific borrower
16. `assessCropYieldRisk` - Assess crop yield risk for a specific borrower
17. `analyzeMarketPriceImpact` - Analyze market price impact for a specific borrower
18. `recommendLoanRestructuring` - Recommend loan restructuring for a specific loan
19. `evaluateCollateralSufficiency` - Evaluate collateral sufficiency for a specific loan

## Current Chatbot Sections Mapping

### 📊 Basic Loan Information (6 queries)

| Chatbot Query                             | Expected MCP Function | Status    |
| ----------------------------------------- | --------------------- | --------- |
| "Show me all active loans"                | `getActiveLoans`      | ✅ MAPPED |
| "Show me details for loan L001"           | `getLoanDetails`      | ✅ MAPPED |
| "What's the status of loan L002?"         | `getLoanStatus`       | ✅ MAPPED |
| "Show me all loans for borrower B001"     | `getLoansByBorrower`  | ✅ MAPPED |
| "Give me a summary of our loan portfolio" | `getLoanSummary`      | ✅ MAPPED |
| "Show me details about borrower B001"     | `getBorrowerDetails`  | ✅ MAPPED |

**Coverage: 6/19 functions (32%)**

### ⚠️ Risk Assessment (5 queries)

| Chatbot Query                                                 | Expected MCP Function                                  | Status    |
| ------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| "What's the default risk for borrower B003?"                  | `getBorrowerDefaultRisk` OR `predictDefaultRisk`       | ✅ MAPPED |
| "Is there a risk that borrower B001 will become non-accrual?" | `getBorrowerNonAccrualRisk` OR `predictNonAccrualRisk` | ✅ MAPPED |
| "Which farmers are at high risk of default?"                  | `getHighRiskFarmers`                                   | ✅ MAPPED |
| "Is the collateral sufficient for loan L001?"                 | `evaluateCollateralSufficiency`                        | ✅ MAPPED |
| "Find farmers at risk in corn production this fall"           | `findFarmersAtRisk`                                    | ✅ MAPPED |

**Coverage: 5/19 functions (26%)**

### 🔮 Predictive Analytics (6 queries)

| Chatbot Query                                                                    | Expected MCP Function          | Status    |
| -------------------------------------------------------------------------------- | ------------------------------ | --------- |
| "What are the expected equipment maintenance costs for borrower B001 next year?" | `forecastEquipmentMaintenance` | ✅ MAPPED |
| "What's the crop yield risk for borrower B002 this season?"                      | `assessCropYieldRisk`          | ✅ MAPPED |
| "How will market prices affect borrower B003?"                                   | `analyzeMarketPriceImpact`     | ✅ MAPPED |
| "What refinancing options are available for loan L001?"                          | `getRefinancingOptions`        | ✅ MAPPED |
| "Show me the payment patterns for borrower B001 over the last year"              | `analyzePaymentPatterns`       | ✅ MAPPED |
| "What loan restructuring options are available for loan L002?"                   | `recommendLoanRestructuring`   | ✅ MAPPED |

**Coverage: 6/19 functions (32%)**

## ✅ ALL MCP FUNCTIONS NOW MAPPED!

All 19 MCP functions are now covered by chatbot section examples.

## 📊 Updated Coverage Analysis

- **Total MCP Functions**: 19
- **Mapped in Chatbot**: 19
- **Unmapped**: 0
- **Coverage Percentage**: 100% ✅

## 🎉 Complete Function Coverage Achieved!

The chatbot sections now provide examples for every available MCP function:

### Summary by Category:

- **Basic Loan Information**: 6 examples covering basic loan data functions
- **Risk Assessment**: 5 examples covering all risk analysis functions
- **Predictive Analytics**: 6 examples covering all analytics and forecasting functions

**Total**: 17 example queries covering 19 MCP functions (some functions can be triggered by multiple query types)
