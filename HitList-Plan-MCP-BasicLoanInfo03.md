# MCP Risk Assessment Implementation Plan

## Executive Summary

Based on our testing of the chatbot, we've successfully implemented the basic loan information functions (`getActiveLoans`, `getLoanStatus`, and `getLoanSummary`), but the risk assessment functions are still failing. This document outlines a comprehensive plan to implement the missing risk assessment endpoints in the LoanOfficerAI MCP system.

## Current Issues

Testing revealed that the following risk assessment functions are not working:

1. **Default Risk Assessment**: `getBorrowerDefaultRisk` function fails with "system limitations"
2. **Collateral Sufficiency**: `evaluateCollateralSufficiency` function fails with "system limitations"
3. **Non-Accrual Risk**: `getBorrowerNonAccrualRisk` function fails with "system limitations"

## Root Cause Analysis

Similar to the previously fixed loan information functions, the risk assessment functions are failing because:

1. The corresponding endpoints in the `callInternalApi` function are missing or incomplete:

   - `/api/risk/default/{borrowerId}` endpoint is not implemented
   - `/api/risk/collateral-sufficiency/{loanId}` endpoint is not implemented
   - `/api/risk/non-accrual/{borrowerId}` endpoint is not implemented

2. The data service is not properly handling risk-related data:
   - Risk scores and assessment data are not being properly calculated or returned

## Implementation Plan

### 1. Update `callInternalApi` Function

Add the missing risk assessment endpoints to the `callInternalApi` function in `mcpFunctionRegistry.js`:

```javascript
// server/services/mcpFunctionRegistry.js - Updated callInternalApi function

async function callInternalApi(endpoint, method = "GET", data = null) {
  try {
    // Existing code...

    // Route the request based on the endpoint
    switch (segments[0]) {
      case "loans": {
        // Existing loan endpoints...
        break;
      }

      case "borrowers": {
        // Existing borrower endpoints...
        break;
      }

      case "risk": {
        // Handle risk-related endpoints

        // FIX #1: Add default risk endpoint
        if (segments[1] === "default" && segments[2]) {
          const borrowerId = segments[2].toUpperCase();

          // Input validation
          if (!borrowerId || typeof borrowerId !== "string") {
            return {
              error: "Invalid borrower ID provided",
              borrower_id: borrowerId,
            };
          }

          // Add enhanced logging
          LogService.info(`Processing default risk request`, {
            borrowerId,
            endpoint: `/api/risk/default/${borrowerId}`,
            timestamp: new Date().toISOString(),
            requestSource: "MCP_FUNCTION",
          });

          const borrowers = dataService.loadData(dataService.paths.borrowers);
          const loans = dataService.loadData(dataService.paths.loans);
          const payments = dataService.loadData(dataService.paths.payments);

          const borrower = borrowers.find((b) => b.borrower_id === borrowerId);
          if (!borrower) {
            return { error: "Borrower not found", borrower_id: borrowerId };
          }

          // Get borrower's loans
          const borrowerLoans = loans.filter(
            (l) => l.borrower_id === borrowerId
          );

          // Get borrower's payment history
          const borrowerPayments = payments.filter((p) =>
            borrowerLoans.some((l) => l.loan_id === p.loan_id)
          );

          // Calculate risk factors
          const creditScoreFactor = calculateCreditScoreFactor(
            borrower.credit_score
          );
          const paymentHistoryFactor =
            calculatePaymentHistoryFactor(borrowerPayments);
          const debtToIncomeFactor = calculateDebtToIncomeFactor(
            borrowerLoans,
            borrower.annual_income
          );
          const loanToValueFactor = calculateLoanToValueFactor(borrowerLoans);

          // Calculate overall risk score (lower is better)
          const riskScore = (
            creditScoreFactor * 0.3 +
            paymentHistoryFactor * 0.4 +
            debtToIncomeFactor * 0.2 +
            loanToValueFactor * 0.1
          ).toFixed(2);

          // Determine risk category
          let riskCategory;
          if (riskScore < 0.2) {
            riskCategory = "Very Low";
          } else if (riskScore < 0.4) {
            riskCategory = "Low";
          } else if (riskScore < 0.6) {
            riskCategory = "Moderate";
          } else if (riskScore < 0.8) {
            riskCategory = "High";
          } else {
            riskCategory = "Very High";
          }

          return {
            borrower_id: borrowerId,
            default_risk_score: parseFloat(riskScore),
            risk_category: riskCategory,
            factors: [
              {
                factor: "Credit Score",
                impact: getCreditScoreImpact(creditScoreFactor),
                weight: 0.3,
              },
              {
                factor: "Payment History",
                impact: getFactorImpact(paymentHistoryFactor),
                weight: 0.4,
              },
              {
                factor: "Debt-to-Income Ratio",
                impact: getFactorImpact(debtToIncomeFactor),
                weight: 0.2,
              },
              {
                factor: "Loan-to-Value Ratio",
                impact: getFactorImpact(loanToValueFactor),
                weight: 0.1,
              },
            ],
            assessment_date: new Date().toISOString(),
          };
        }

        // FIX #2: Add collateral sufficiency endpoint
        if (segments[1] === "collateral" && segments[2]) {
          const loanId = segments[2].toUpperCase();

          // Input validation
          if (!loanId || typeof loanId !== "string") {
            return { error: "Invalid loan ID provided", loan_id: loanId };
          }

          // Add enhanced logging
          LogService.info(`Processing collateral sufficiency request`, {
            loanId,
            endpoint: `/api/risk/collateral/${loanId}`,
            timestamp: new Date().toISOString(),
            requestSource: "MCP_FUNCTION",
          });

          const loans = dataService.loadData(dataService.paths.loans);
          const collaterals = dataService.loadData(
            dataService.paths.collateral
          );

          const loan = loans.find((l) => l.loan_id === loanId);
          if (!loan) {
            return { error: "Loan not found", loan_id: loanId };
          }

          const loanCollateral = collaterals.filter(
            (c) => c.loan_id === loanId
          );
          if (!loanCollateral || loanCollateral.length === 0) {
            return {
              error: "No collateral found for this loan",
              loan_id: loanId,
              message:
                "This loan does not have any associated collateral records.",
            };
          }

          const collateralValue = loanCollateral.reduce(
            (sum, c) => sum + c.value,
            0
          );
          const loanToValueRatio = loan.loan_amount / collateralValue;

          // Industry standard threshold is typically 0.8 (80%)
          const isSufficient = loanToValueRatio < 0.8;

          return {
            loan_id: loanId,
            collateral_value: collateralValue,
            loan_amount: loan.loan_amount,
            loan_to_value_ratio: parseFloat(loanToValueRatio.toFixed(2)),
            is_sufficient: isSufficient,
            industry_standard_threshold: 0.8,
            assessment: isSufficient
              ? "Collateral is sufficient"
              : "Collateral is insufficient",
            collateral_items: loanCollateral.map((c) => ({
              type: c.type,
              description: c.description,
              value: c.value,
            })),
          };
        }

        // FIX #3: Add non-accrual risk endpoint
        if (segments[1] === "non-accrual" && segments[2]) {
          const borrowerId = segments[2].toUpperCase();

          // Input validation
          if (!borrowerId || typeof borrowerId !== "string") {
            return {
              error: "Invalid borrower ID provided",
              borrower_id: borrowerId,
            };
          }

          // Add enhanced logging
          LogService.info(`Processing non-accrual risk request`, {
            borrowerId,
            endpoint: `/api/risk/non-accrual/${borrowerId}`,
            timestamp: new Date().toISOString(),
            requestSource: "MCP_FUNCTION",
          });

          const borrowers = dataService.loadData(dataService.paths.borrowers);
          const loans = dataService.loadData(dataService.paths.loans);
          const payments = dataService.loadData(dataService.paths.payments);

          const borrower = borrowers.find((b) => b.borrower_id === borrowerId);
          if (!borrower) {
            return { error: "Borrower not found", borrower_id: borrowerId };
          }

          // Get borrower's loans
          const borrowerLoans = loans.filter(
            (l) => l.borrower_id === borrowerId
          );
          if (!borrowerLoans || borrowerLoans.length === 0) {
            return {
              borrower_id: borrowerId,
              non_accrual_risk_score: 0,
              risk_category: "None",
              message: "No active loans found for this borrower",
            };
          }

          // Get borrower's payment history
          const borrowerPayments = payments.filter((p) =>
            borrowerLoans.some((l) => l.loan_id === p.loan_id)
          );

          // Calculate days past due for each loan
          const loanStatus = borrowerLoans.map((loan) => {
            const loanPayments = borrowerPayments.filter(
              (p) => p.loan_id === loan.loan_id
            );
            const missedPayments = loanPayments.filter(
              (p) => p.status === "Late" || p.status === "Missed"
            );
            const daysPastDue = missedPayments.reduce(
              (total, payment) => total + (payment.days_late || 0),
              0
            );

            return {
              loan_id: loan.loan_id,
              status: loan.status,
              days_past_due: daysPastDue,
              missed_payments: missedPayments.length,
              total_payments: loanPayments.length,
            };
          });

          // Calculate non-accrual risk
          // Industry standard: loans 90+ days past due are at risk of non-accrual
          const loansAtRisk = loanStatus.filter((l) => l.days_past_due >= 90);
          const totalLoanAmount = borrowerLoans.reduce(
            (sum, loan) => sum + loan.loan_amount,
            0
          );
          const amountAtRisk = loansAtRisk.reduce((sum, status) => {
            const loan = borrowerLoans.find(
              (l) => l.loan_id === status.loan_id
            );
            return sum + (loan ? loan.loan_amount : 0);
          }, 0);

          // Calculate risk score (0-1, higher is worse)
          const riskScore =
            totalLoanAmount > 0 ? amountAtRisk / totalLoanAmount : 0;

          // Determine risk category
          let riskCategory;
          if (riskScore === 0) {
            riskCategory = "None";
          } else if (riskScore < 0.2) {
            riskCategory = "Low";
          } else if (riskScore < 0.5) {
            riskCategory = "Moderate";
          } else if (riskScore < 0.8) {
            riskCategory = "High";
          } else {
            riskCategory = "Critical";
          }

          return {
            borrower_id: borrowerId,
            non_accrual_risk_score: parseFloat(riskScore.toFixed(2)),
            risk_category: riskCategory,
            loans_at_risk: loansAtRisk.length,
            total_loans: borrowerLoans.length,
            amount_at_risk: amountAtRisk,
            total_loan_amount: totalLoanAmount,
            loan_details: loanStatus,
            assessment_date: new Date().toISOString(),
          };
        }

        break;
      }

      // Other cases...
      default:
        return { error: "Endpoint not implemented", endpoint };
    }

    // Default response if no matching endpoint
    return { error: "Endpoint not implemented", endpoint };
  } catch (error) {
    LogService.error(`Error in internal API call to ${endpoint}:`, error);
    return {
      error: "Internal API call failed",
      details: error.message,
    };
  }
}

// Helper functions for risk calculations
function calculateCreditScoreFactor(creditScore) {
  if (!creditScore) return 0.5; // Default to moderate risk if no credit score

  if (creditScore >= 800) return 0.1;
  if (creditScore >= 740) return 0.2;
  if (creditScore >= 670) return 0.4;
  if (creditScore >= 580) return 0.6;
  if (creditScore >= 500) return 0.8;
  return 1.0;
}

function calculatePaymentHistoryFactor(payments) {
  if (!payments || payments.length === 0) return 0.5; // Default to moderate risk if no payment history

  const totalPayments = payments.length;
  const latePayments = payments.filter((p) => p.status === "Late").length;
  const missedPayments = payments.filter((p) => p.status === "Missed").length;

  // Calculate late/missed payment ratio (higher is worse)
  const problemRatio =
    totalPayments > 0
      ? (latePayments * 0.5 + missedPayments * 1.0) / totalPayments
      : 0;

  return Math.min(1.0, problemRatio * 2); // Scale up to make it more sensitive
}

function calculateDebtToIncomeFactor(loans, annualIncome) {
  if (!loans || loans.length === 0 || !annualIncome) return 0.5; // Default to moderate risk

  const totalDebt = loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const debtToIncomeRatio = totalDebt / annualIncome;

  // DTI ratios: < 0.36 is good, > 0.43 is concerning
  if (debtToIncomeRatio < 0.2) return 0.1;
  if (debtToIncomeRatio < 0.36) return 0.3;
  if (debtToIncomeRatio < 0.43) return 0.5;
  if (debtToIncomeRatio < 0.5) return 0.7;
  return 1.0;
}

function calculateLoanToValueFactor(loans) {
  // This is a simplified version; ideally would use actual collateral data
  // For now, assume a moderate risk factor
  return 0.5;
}

function getCreditScoreImpact(factor) {
  if (factor <= 0.3) return "Positive";
  if (factor <= 0.6) return "Neutral";
  return "Negative";
}

function getFactorImpact(factor) {
  if (factor <= 0.3) return "Positive";
  if (factor <= 0.6) return "Neutral";
  return "Negative";
}
```

### 2. Create Mock Data for Risk Assessment

Ensure that the necessary mock data exists in the data service:

```javascript
// server/data/collateral.json
[
  {
    collateral_id: "C001",
    loan_id: "L001",
    type: "Equipment",
    description: "John Deere Tractor - Model 8R 410",
    value: 65000,
  },
  {
    collateral_id: "C002",
    loan_id: "L001",
    type: "Property",
    description: "Storage Barn - 5000 sq ft",
    value: 120000,
  },
  {
    collateral_id: "C003",
    loan_id: "L002",
    type: "Equipment",
    description: "Irrigation System",
    value: 35000,
  },
  {
    collateral_id: "C004",
    loan_id: "L003",
    type: "Property",
    description: "Farm Land - 20 acres",
    value: 180000,
  },
];
```

```javascript
// server/data/payments.json
[
  {
    payment_id: "P001",
    loan_id: "L001",
    amount: 1200,
    date: "2024-02-01",
    status: "Paid",
  },
  {
    payment_id: "P002",
    loan_id: "L001",
    amount: 1200,
    date: "2024-03-01",
    status: "Paid",
  },
  {
    payment_id: "P003",
    loan_id: "L001",
    amount: 1200,
    date: "2024-04-01",
    status: "Late",
    days_late: 5,
  },
  {
    payment_id: "P004",
    loan_id: "L001",
    amount: 1200,
    date: "2024-05-01",
    status: "Paid",
  },
  {
    payment_id: "P005",
    loan_id: "L002",
    amount: 950,
    date: "2024-02-15",
    status: "Paid",
  },
  {
    payment_id: "P006",
    loan_id: "L002",
    amount: 950,
    date: "2024-03-15",
    status: "Paid",
  },
  {
    payment_id: "P007",
    loan_id: "L002",
    amount: 950,
    date: "2024-04-15",
    status: "Missed",
    days_late: 30,
  },
];
```

### 3. Update Data Service to Include New Data Files

```javascript
// server/services/dataService.js - Update paths object

const paths = {
  loans: "./server/data/loans.json",
  borrowers: "./server/data/borrowers.json",
  collateral: "./server/data/collateral.json",
  payments: "./server/data/payments.json",
};
```

### 4. Create Unit Tests for Risk Assessment Functions

```javascript
// server/tests/unit/riskFunctions.test.js

const { expect } = require("chai");
const sinon = require("sinon");
const mcpFunctionRegistry = require("../../services/mcpFunctionRegistry");
const dataService = require("../../services/dataService");

describe("Risk Assessment MCP Functions", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getBorrowerDefaultRisk Function", () => {
    it("should return default risk assessment for valid borrower ID", async () => {
      // Arrange
      const mockBorrowers = [
        {
          borrower_id: "B001",
          name: "John Smith",
          credit_score: 720,
          annual_income: 85000,
        },
      ];

      const mockLoans = [
        {
          loan_id: "L001",
          borrower_id: "B001",
          loan_amount: 50000,
          status: "Active",
        },
      ];

      const mockPayments = [
        {
          payment_id: "P001",
          loan_id: "L001",
          status: "Paid",
        },
        {
          payment_id: "P002",
          loan_id: "L001",
          status: "Paid",
        },
      ];

      sandbox.stub(dataService, "loadData").callsFake((path) => {
        if (path.includes("borrowers")) return mockBorrowers;
        if (path.includes("loans")) return mockLoans;
        if (path.includes("payments")) return mockPayments;
        return [];
      });

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getBorrowerDefaultRisk",
        {
          borrower_id: "B001",
        }
      );

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.borrower_id).to.equal("B001");
      expect(result.data).to.have.property("default_risk_score");
      expect(result.data).to.have.property("risk_category");
      expect(result.data).to.have.property("factors");
      expect(result.data.factors).to.be.an("array");
    });

    it("should handle non-existent borrower ID", async () => {
      // Arrange
      sandbox.stub(dataService, "loadData").returns([]);

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getBorrowerDefaultRisk",
        {
          borrower_id: "NONEXISTENT",
        }
      );

      // Assert
      expect(result.success).to.be.false;
      expect(result.error.message).to.include("not found");
    });
  });

  describe("evaluateCollateralSufficiency Function", () => {
    it("should evaluate if collateral is sufficient", async () => {
      // Arrange
      const mockLoans = [
        {
          loan_id: "L001",
          borrower_id: "B001",
          loan_amount: 50000,
          status: "Active",
        },
      ];

      const mockCollateral = [
        {
          collateral_id: "C001",
          loan_id: "L001",
          type: "Equipment",
          value: 65000,
        },
      ];

      sandbox.stub(dataService, "loadData").callsFake((path) => {
        if (path.includes("loans")) return mockLoans;
        if (path.includes("collateral")) return mockCollateral;
        return [];
      });

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "evaluateCollateralSufficiency",
        {
          loan_id: "L001",
        }
      );

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.loan_id).to.equal("L001");
      expect(result.data).to.have.property("is_sufficient");
      expect(result.data).to.have.property("loan_to_value_ratio");
      expect(result.data).to.have.property("assessment");
    });

    it("should handle loan without collateral", async () => {
      // Arrange
      const mockLoans = [
        {
          loan_id: "L001",
          borrower_id: "B001",
          loan_amount: 50000,
          status: "Active",
        },
      ];

      sandbox.stub(dataService, "loadData").callsFake((path) => {
        if (path.includes("loans")) return mockLoans;
        if (path.includes("collateral")) return [];
        return [];
      });

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "evaluateCollateralSufficiency",
        {
          loan_id: "L001",
        }
      );

      // Assert
      expect(result.success).to.be.false;
      expect(result.error.message).to.include("No collateral found");
    });
  });

  describe("getBorrowerNonAccrualRisk Function", () => {
    it("should assess non-accrual risk for borrower", async () => {
      // Arrange
      const mockBorrowers = [
        {
          borrower_id: "B001",
          name: "John Smith",
        },
      ];

      const mockLoans = [
        {
          loan_id: "L001",
          borrower_id: "B001",
          loan_amount: 50000,
          status: "Active",
        },
      ];

      const mockPayments = [
        {
          payment_id: "P001",
          loan_id: "L001",
          status: "Paid",
        },
        {
          payment_id: "P002",
          loan_id: "L001",
          status: "Late",
          days_late: 10,
        },
      ];

      sandbox.stub(dataService, "loadData").callsFake((path) => {
        if (path.includes("borrowers")) return mockBorrowers;
        if (path.includes("loans")) return mockLoans;
        if (path.includes("payments")) return mockPayments;
        return [];
      });

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getBorrowerNonAccrualRisk",
        {
          borrower_id: "B001",
        }
      );

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.borrower_id).to.equal("B001");
      expect(result.data).to.have.property("non_accrual_risk_score");
      expect(result.data).to.have.property("risk_category");
      expect(result.data).to.have.property("loans_at_risk");
    });

    it("should handle borrower with no loans", async () => {
      // Arrange
      const mockBorrowers = [
        {
          borrower_id: "B001",
          name: "John Smith",
        },
      ];

      sandbox.stub(dataService, "loadData").callsFake((path) => {
        if (path.includes("borrowers")) return mockBorrowers;
        return [];
      });

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getBorrowerNonAccrualRisk",
        {
          borrower_id: "B001",
        }
      );

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.borrower_id).to.equal("B001");
      expect(result.data.non_accrual_risk_score).to.equal(0);
      expect(result.data.risk_category).to.equal("None");
      expect(result.data).to.have.property("message");
    });
  });
});
```

### 5. Create Simple Test Script

```javascript
// test-risk-functions.js

/**
 * Simple test script to verify MCP risk functions
 */
const mcpFunctionRegistry = require("./server/services/mcpFunctionRegistry");

// Test helper function
async function testMcpFunction(functionName, args) {
  console.log(`\n=== Testing ${functionName} ===`);
  console.log(`Args: ${JSON.stringify(args)}`);

  try {
    const result = await mcpFunctionRegistry.executeFunction(
      functionName,
      args
    );
    console.log("Result:");
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error("Error:");
    console.error(error);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log("=== MCP Risk Functions Test ===");

  // Test default risk assessment
  await testMcpFunction("getBorrowerDefaultRisk", { borrower_id: "B001" });

  // Test collateral sufficiency
  await testMcpFunction("evaluateCollateralSufficiency", { loan_id: "L001" });

  // Test non-accrual risk
  await testMcpFunction("getBorrowerNonAccrualRisk", { borrower_id: "B001" });

  // Test with invalid IDs
  await testMcpFunction("getBorrowerDefaultRisk", {
    borrower_id: "NONEXISTENT",
  });
  await testMcpFunction("evaluateCollateralSufficiency", {
    loan_id: "NONEXISTENT",
  });

  console.log("\n=== Tests Complete ===");
}

// Run the tests
runTests().catch((error) => {
  console.error("Test execution failed:");
  console.error(error);
});
```

## Implementation Steps

1. **Create Mock Data Files**

   - Create `collateral.json` in the server/data directory
   - Create `payments.json` in the server/data directory
   - Update the dataService to include paths to these files

2. **Update `mcpFunctionRegistry.js`**

   - Add the missing risk assessment endpoints
   - Implement the helper functions for risk calculations
   - Add proper error handling and validation

3. **Test the Implementation**

   - Run the test script to verify the functions work as expected
   - Test edge cases (non-existent entities, validation errors)
   - Verify integration with the chatbot

4. **Update Documentation**
   - Add details about the new risk assessment functions to the MCP documentation
   - Document the risk calculation methodologies

## Expected Outcomes

After implementing these changes:

1. The `getBorrowerDefaultRisk` function will successfully return risk assessments for borrowers
2. The `evaluateCollateralSufficiency` function will evaluate if a loan's collateral is sufficient
3. The `getBorrowerNonAccrualRisk` function will assess the risk of loans going into non-accrual status
4. The chatbot will be able to answer questions about risk assessments

## Conclusion

This implementation plan addresses the missing risk assessment functions in the MCP system. By adding the necessary endpoints and risk calculation logic, we'll enable the chatbot to provide valuable risk insights to loan officers. The implementation follows the same pattern as our successful loan information functions, ensuring consistency and reliability across the system.
