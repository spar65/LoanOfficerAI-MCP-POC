# MCP Basic Loan Information Implementation Plan - Phase 2

## Reviewer Assessment

Looking at your Phase 2 implementation plan, this is an excellent and comprehensive solution that addresses all the critical issues I identified in my earlier evaluation. Here's my detailed assessment:

### ✅ Strengths of Your Solution

#### 1. Correctly Identifies and Fixes Root Causes

- You've accurately pinpointed the exact issue: missing endpoint handlers in callInternalApi
- The fixes for both /api/loans/status/{loanId} and /api/loans/summary are complete and well-implemented
- The portfolio summary calculation is particularly robust with proper error handling for empty datasets

#### 2. Enhanced Data Quality

Your loan summary endpoint provides rich, contextual data:

```javascript
return {
  total_loans: totalLoans,
  active_loans: activeLoans,
  pending_loans: pendingLoans,
  closed_loans: closedLoans,
  defaulted_loans: defaultedLoans,
  total_loan_amount: totalAmount,
  active_loan_amount: activeAmount,
  average_loan_amount: avgLoanAmount,
  average_interest_rate: Math.round(avgInterestRate * 100) / 100,
  summary_generated_at: new Date().toISOString(),
  portfolio_health: {
    default_rate:
      totalLoans > 0
        ? Math.round((defaultedLoans / totalLoans) * 100 * 100) / 100
        : 0,
    active_rate:
      totalLoans > 0
        ? Math.round((activeLoans / totalLoans) * 100 * 100) / 100
        : 0,
  },
};
```

This goes beyond basic fixes to provide business intelligence that loan officers actually need.

#### 3. Comprehensive Error Handling Strategy

The createMcpFunctionHandler pattern with:

- Input validation
- Pre-flight entity checks
- Retry logic with exponential backoff
- Fallback mechanisms
- Enhanced logging

This is enterprise-grade error handling that follows best practices.

#### 4. Thorough Testing Approach

Your testing strategy covers:

- Unit tests for individual functions
- Integration tests for full MCP workflows
- Edge cases (empty data, missing entities)
- Performance testing
- End-to-end testing

This ensures reliability and prevents regressions.

#### 5. Client-Side Resilience

The enhanced useMcpFunction hook with:

- Caching with configurable TTL
- Automatic retries
- Fallback mechanisms
- Request cancellation
- Progressive loading states

This provides a much better user experience than the current implementation.

### ⚠️ Minor Suggestions for Improvement

#### 1. Add Input Validation

Consider adding parameter validation to the new endpoints:

```javascript
// In loan status endpoint
if (!loanId || typeof loanId !== "string") {
  return { error: "Invalid loan ID provided", loan_id: loanId };
}
```

#### 2. Enhance Logging Context

Add more contextual information to logs:

```javascript
LogService.mcp(`Processing loan status request`, {
  loanId,
  endpoint: `/api/loans/status/${loanId}`,
  timestamp: new Date().toISOString(),
  requestSource: "MCP_FUNCTION",
});
```

#### 3. Consider Data Consistency

For the portfolio summary, you might want to add a timestamp check to ensure data freshness:

```javascript
const dataFreshness = {
  last_data_refresh: loans.length > 0 ?
    Math.max(...loans.map(l => new Date(l.last_updated || l.start_date).getTime())) :
    null,
  data_age_minutes: // Calculate age
};
```

### ✅ Implementation Readiness Assessment

Your solution is production-ready with:

- Complete Implementation: All necessary code changes are detailed
- Proper Testing: Comprehensive test coverage planned
- Error Handling: Robust error scenarios covered
- Documentation: Clear implementation steps provided
- Performance Considerations: Caching and optimization included

### 🚀 Recommended Implementation Order

1. Phase 1 (Critical): Implement the callInternalApi fixes immediately
2. Phase 2 (Enhancement): Add the enhanced error handling patterns
3. Phase 3 (Testing): Implement the comprehensive test suite
4. Phase 4 (Client): Deploy the improved client-side integration

### Final Verdict: ✅ EXCELLENT SOLUTION

This solution demonstrates:

- Deep understanding of the MCP architecture
- Professional-grade implementation practices
- Forward-thinking approach to reliability and user experience
- Comprehensive coverage of all identified issues

Your implementation plan is thorough, well-structured, and follows enterprise best practices. It not only fixes the immediate issues but also significantly improves the overall system architecture and user experience.
I strongly recommend proceeding with this implementation. It addresses all the critical issues while building a more robust foundation for future MCP function development.

## Executive Summary

This document outlines the implementation plan to fix the critical issues in the Model Control Protocol (MCP) functions for basic loan information in the LoanOfficerAI system. Currently, only the "Active Loans" query is working correctly, while "Loan Status" and "Portfolio Summary" queries are failing due to missing API endpoints. This document provides a comprehensive analysis of the issues and detailed implementation solutions.

## Current Issue Analysis

Based on analysis of the codebase, we have identified two fundamental problems:

1. **Missing `/api/loans/status/{loanId}` endpoint** - causing "Loan Status" queries to fail
2. **Missing `/api/loans/summary` endpoint** - causing "Portfolio Summary" queries to fail

The root cause is in the `callInternalApi` function in `mcpFunctionRegistry.js` - these endpoint handlers simply don't exist in the current implementation.

## Implementation Plan

### 1. Fix the `callInternalApi` Function

The most critical fix is to update the `callInternalApi` function to handle the missing endpoints:

```javascript
// server/services/mcpFunctionRegistry.js - Updated callInternalApi function

async function callInternalApi(endpoint, method = "GET", data = null) {
  try {
    // Simulate API call by directly accessing data
    const segments = endpoint.split("/").filter((s) => s);

    if (segments[0] === "api") {
      segments.shift(); // Remove 'api'
    }

    // Route the request based on the endpoint
    switch (segments[0]) {
      case "loans": {
        // Handle loan-related endpoints
        if (segments[1] === "details" && segments[2]) {
          const loanId = segments[2].toUpperCase();
          const loans = dataService.loadData(dataService.paths.loans);
          const loan = loans.find((l) => l.loan_id === loanId);

          if (!loan) {
            return { error: "Loan not found", loan_id: loanId };
          }

          return loan;
        }

        if (segments[1] === "active") {
          const loans = dataService.loadData(dataService.paths.loans);
          return loans.filter((l) => l.status === "Active");
        }

        // FIX #1: Add missing loan status endpoint
        if (segments[1] === "status" && segments[2]) {
          const loanId = segments[2].toUpperCase();
          const loans = dataService.loadData(dataService.paths.loans);
          const loan = loans.find((l) => l.loan_id === loanId);

          if (!loan) {
            return { error: "Loan not found", loan_id: loanId };
          }

          return {
            loan_id: loanId,
            status: loan.status,
            last_updated: loan.last_updated || new Date().toISOString(),
            status_history: loan.status_history || [],
          };
        }

        // FIX #2: Add missing loan summary endpoint
        if (segments[1] === "summary") {
          const loans = dataService.loadData(dataService.paths.loans);

          if (!loans || loans.length === 0) {
            return {
              total_loans: 0,
              active_loans: 0,
              pending_loans: 0,
              closed_loans: 0,
              total_loan_amount: 0,
              average_interest_rate: 0,
              message: "No loan data available",
            };
          }

          // Calculate summary statistics
          const totalLoans = loans.length;
          const activeLoans = loans.filter((l) => l.status === "Active").length;
          const pendingLoans = loans.filter(
            (l) => l.status === "Pending"
          ).length;
          const closedLoans = loans.filter((l) => l.status === "Closed").length;
          const defaultedLoans = loans.filter(
            (l) => l.status === "Default"
          ).length;

          const totalAmount = loans.reduce(
            (sum, loan) => sum + (loan.loan_amount || 0),
            0
          );
          const avgInterestRate =
            loans.length > 0
              ? loans.reduce(
                  (sum, loan) => sum + (loan.interest_rate || 0),
                  0
                ) / loans.length
              : 0;

          // Calculate additional useful metrics
          const avgLoanAmount = totalLoans > 0 ? totalAmount / totalLoans : 0;
          const activeAmount = loans
            .filter((l) => l.status === "Active")
            .reduce((sum, loan) => sum + (loan.loan_amount || 0), 0);

          return {
            total_loans: totalLoans,
            active_loans: activeLoans,
            pending_loans: pendingLoans,
            closed_loans: closedLoans,
            defaulted_loans: defaultedLoans,
            total_loan_amount: totalAmount,
            active_loan_amount: activeAmount,
            average_loan_amount: avgLoanAmount,
            average_interest_rate: Math.round(avgInterestRate * 100) / 100, // Round to 2 decimal places
            summary_generated_at: new Date().toISOString(),
            portfolio_health: {
              default_rate:
                totalLoans > 0
                  ? Math.round((defaultedLoans / totalLoans) * 100 * 100) / 100
                  : 0,
              active_rate:
                totalLoans > 0
                  ? Math.round((activeLoans / totalLoans) * 100 * 100) / 100
                  : 0,
            },
          };
        }

        if (segments[1] === "borrower" && segments[2]) {
          const borrowerId = segments[2].toUpperCase();
          const loans = dataService.loadData(dataService.paths.loans);
          const borrowerLoans = loans.filter(
            (l) => l.borrower_id === borrowerId
          );

          if (borrowerLoans.length === 0) {
            return {
              note: "No loans found for this borrower",
              borrower_id: borrowerId,
            };
          }

          return borrowerLoans;
        }

        break;
      }

      // Other cases for borrowers, risk, etc.
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
```

### 2. Enhanced Error Handling

To improve reliability and user experience, we'll implement enhanced error handling:

```javascript
/**
 * Enhanced MCP function handler with comprehensive error handling
 */
const createMcpFunctionHandler = (functionName, apiEndpoint, options = {}) => {
  return MCPServiceWithLogging.createFunction(functionName, async (args) => {
    const startTime = Date.now();

    try {
      // Input validation
      const validationResult = validateMcpArgs(functionName, args);
      if (!validationResult.valid) {
        return mcpResponseFormatter.formatValidationError(
          validationResult.errors,
          functionName
        );
      }

      // Pre-flight checks (entity existence)
      if (options.requiresEntity) {
        const entityCheck = await callInternalApi(options.entityCheckEndpoint);
        if (entityCheck.error) {
          return mcpResponseFormatter.formatNotFound(
            options.entityType,
            args[options.entityIdField],
            functionName
          );
        }
      }

      // Main API call with retry logic
      let result;
      let attempt = 1;
      const maxAttempts = options.maxRetries || 3;

      while (attempt <= maxAttempts) {
        try {
          result = await callInternalApi(apiEndpoint);

          if (!result.error) {
            break; // Success, exit retry loop
          }

          // If it's the last attempt or a non-retryable error, throw
          if (attempt === maxAttempts || isNonRetryableError(result.error)) {
            throw new Error(result.error);
          }

          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt - 1) * 1000)
          );
        } catch (error) {
          if (attempt === maxAttempts) {
            throw error;
          }
        }

        attempt++;
      }

      // Fallback mechanism
      if (result.error && options.fallbackEndpoint) {
        LogService.warn(
          `Primary endpoint failed for ${functionName}, trying fallback`
        );
        try {
          const fallbackResult = await callInternalApi(
            options.fallbackEndpoint
          );
          if (!fallbackResult.error) {
            result = { ...fallbackResult, _source: "fallback" };
          }
        } catch (fallbackError) {
          LogService.error(
            `Fallback also failed for ${functionName}:`,
            fallbackError
          );
        }
      }

      // Response enhancement
      if (!result.error && options.enhanceResponse) {
        result = await options.enhanceResponse(result, args);
      }

      const duration = Date.now() - startTime;
      LogService.info(
        `MCP function ${functionName} completed in ${duration}ms`
      );

      return mcpResponseFormatter.formatSuccess(result, functionName);
    } catch (error) {
      const duration = Date.now() - startTime;
      LogService.error(
        `MCP function ${functionName} failed after ${duration}ms:`,
        {
          error: error.message,
          args,
          stack: error.stack,
        }
      );

      return mcpResponseFormatter.formatError(error, functionName, args);
    }
  });
};

// Helper function to determine if an error should not be retried
function isNonRetryableError(error) {
  const nonRetryableErrors = [
    "not found",
    "unauthorized",
    "forbidden",
    "validation error",
    "invalid parameter",
  ];

  const errorLower = error.toLowerCase();
  return nonRetryableErrors.some((err) => errorLower.includes(err));
}
```

### 3. Comprehensive Testing Strategy

To ensure reliability and prevent future regressions, we'll implement a comprehensive testing suite:

```javascript
const { expect } = require("chai");
const sinon = require("sinon");
const mcpFunctionRegistry = require("../server/services/mcpFunctionRegistry");
const dataService = require("../server/services/dataService");

describe("MCP Function Registry", () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    // Clear any cached data
    dataService.clearCache();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getLoanStatus Function", () => {
    it("should return loan status for valid loan ID", async () => {
      // Arrange
      const mockLoans = [
        { loan_id: "L001", status: "Active", last_updated: "2024-01-01" },
      ];
      sandbox.stub(dataService, "loadData").returns(mockLoans);

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getLoanStatus",
        {
          loan_id: "L001",
        }
      );

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.loan_id).to.equal("L001");
      expect(result.data.status).to.equal("Active");
    });

    it("should handle non-existent loan ID", async () => {
      // Arrange
      sandbox.stub(dataService, "loadData").returns([]);

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getLoanStatus",
        {
          loan_id: "NONEXISTENT",
        }
      );

      // Assert
      expect(result.success).to.be.false;
      expect(result.error.message).to.include("not found");
    });

    it("should handle missing loan_id parameter", async () => {
      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getLoanStatus",
        {}
      );

      // Assert
      expect(result.success).to.be.false;
      expect(result.error.type).to.equal("validation");
    });
  });

  describe("getLoanSummary Function", () => {
    it("should return portfolio summary with correct calculations", async () => {
      // Arrange
      const mockLoans = [
        {
          loan_id: "L001",
          status: "Active",
          loan_amount: 50000,
          interest_rate: 3.5,
        },
        {
          loan_id: "L002",
          status: "Active",
          loan_amount: 30000,
          interest_rate: 4.0,
        },
        {
          loan_id: "L003",
          status: "Pending",
          loan_amount: 20000,
          interest_rate: 3.0,
        },
        {
          loan_id: "L004",
          status: "Closed",
          loan_amount: 40000,
          interest_rate: 3.8,
        },
      ];
      sandbox.stub(dataService, "loadData").returns(mockLoans);

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getLoanSummary",
        {}
      );

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.total_loans).to.equal(4);
      expect(result.data.active_loans).to.equal(2);
      expect(result.data.pending_loans).to.equal(1);
      expect(result.data.closed_loans).to.equal(1);
      expect(result.data.total_loan_amount).to.equal(140000);
      expect(result.data.average_interest_rate).to.be.closeTo(3.575, 0.01);
    });

    it("should handle empty loan portfolio", async () => {
      // Arrange
      sandbox.stub(dataService, "loadData").returns([]);

      // Act
      const result = await mcpFunctionRegistry.executeFunction(
        "getLoanSummary",
        {}
      );

      // Assert
      expect(result.success).to.be.true;
      expect(result.data.total_loans).to.equal(0);
      expect(result.data.message).to.include("No loan data available");
    });
  });

  // Integration tests
  describe("MCP End-to-End Integration", () => {
    const request = require("supertest");
    const app = require("../server/app"); // Your Express app

    it("should handle full MCP workflow for loan status query", async () => {
      const response = await request(app)
        .post("/api/openai/chat")
        .send({
          messages: [
            { role: "user", content: "What is the status of loan L001?" },
          ],
          function_call: "auto",
        })
        .expect(200);

      expect(response.body.content).to.include("L001");
      expect(response.body.content).to.include("status");
    });

    it("should handle full MCP workflow for portfolio summary", async () => {
      const response = await request(app)
        .post("/api/openai/chat")
        .send({
          messages: [
            {
              role: "user",
              content: "Give me a summary of the loan portfolio",
            },
          ],
          function_call: "auto",
        })
        .expect(200);

      expect(response.body.content).to.include("total");
      expect(response.body.content).to.include("loans");
    });
  });
});
```

### 4. Client-Side Improvements

To enhance the client-side experience, we'll implement an improved React hook for MCP functions:

```javascript
import { useState, useEffect, useCallback, useRef } from "react";

export function useMcpFunction(functionName, args, options = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    lastUpdated: null,
  });

  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef(null);

  // Execute function with caching, retries and error handling
  const execute = useCallback(
    async (overrideArgs = null, retryAttempt = 0) => {
      const executeArgs = overrideArgs || args;

      // Cancel previous request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Check cache first if enabled
      if (retryAttempt === 0 && options.enableCache) {
        const cachedData = getCachedData(
          functionName,
          executeArgs,
          options.cacheTimeout
        );
        if (cachedData) {
          setState({
            data: cachedData,
            error: null,
            isLoading: false,
            isSuccess: true,
            lastUpdated: Date.now(),
          });
          return cachedData;
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        // Direct fetch call to OpenAI endpoint
        const response = await fetch("/api/openai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Call the ${functionName} function with args: ${JSON.stringify(
                  executeArgs
                )}`,
              },
            ],
            function_call: { name: functionName },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the result from the OpenAI response
        const result = data.content ? JSON.parse(data.content) : data;

        // Cache successful result if caching is enabled
        if (options.enableCache) {
          setCachedData(functionName, executeArgs, result);
        }

        setState({
          data: result,
          error: null,
          isLoading: false,
          isSuccess: true,
          lastUpdated: Date.now(),
        });

        setRetryCount(0); // Reset retry count on success
        return result;
      } catch (error) {
        // Don't update state if request was aborted
        if (error.name === "AbortError") {
          return;
        }

        // Implement retry logic for transient errors
        const maxRetries = options.maxRetries || 2;
        const isRetryableError = isTransientError(error);

        if (isRetryableError && retryAttempt < maxRetries) {
          const delay = Math.pow(2, retryAttempt) * 1000; // Exponential backoff

          setTimeout(() => {
            execute(executeArgs, retryAttempt + 1);
          }, delay);

          setRetryCount(retryAttempt + 1);
          return;
        }

        // Try fallback if available
        if (options.fallback && retryAttempt === 0) {
          try {
            const fallbackResult = await options.fallback(executeArgs);

            setState({
              data: fallbackResult,
              error: null,
              isLoading: false,
              isSuccess: true,
              lastUpdated: Date.now(),
            });

            return fallbackResult;
          } catch (fallbackError) {
            console.warn("Fallback also failed:", fallbackError);
          }
        }

        setState({
          data: null,
          error: formatError(error),
          isLoading: false,
          isSuccess: false,
          lastUpdated: Date.now(),
        });

        if (options.throwError) {
          throw error;
        }
      }
    },
    [functionName, args, options]
  );

  // Auto-execute on mount and dependency changes
  useEffect(() => {
    if (options.manual !== true && functionName && args) {
      execute();
    }

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [functionName, JSON.stringify(args), execute, options.manual]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    ...state,
    execute,
    refresh,
    retryCount,
    isRetrying: retryCount > 0,
  };
}

// Example component using the hook
export function LoanStatusDashboard() {
  const {
    data: activeLoans,
    error: activeLoansError,
    isLoading: activeLoansLoading,
    refresh: refreshActiveLoans,
  } = useMcpFunction(
    "getActiveLoans",
    {},
    {
      enableCache: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      maxRetries: 2,
    }
  );

  const {
    data: portfolioSummary,
    error: summaryError,
    isLoading: summaryLoading,
    refresh: refreshSummary,
  } = useMcpFunction(
    "getLoanSummary",
    {},
    {
      enableCache: true,
      cacheTimeout: 10 * 60 * 1000, // 10 minutes
      fallback: async () => {
        // Fallback to calculating summary from active loans
        if (activeLoans) {
          return {
            total_loans: activeLoans.length,
            active_loans: activeLoans.length,
            message: "Summary calculated from cached active loans data",
          };
        }
        throw new Error("No fallback data available");
      },
    }
  );

  const handleRefreshAll = () => {
    refreshActiveLoans();
    refreshSummary();
  };

  if (activeLoansLoading || summaryLoading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Loan Portfolio Dashboard</h1>
        <button onClick={handleRefreshAll}>Refresh All</button>
      </div>

      {summaryError && (
        <div className="error-alert">
          <h3>Portfolio Summary Unavailable</h3>
          <p>{summaryError.message}</p>
          <button onClick={refreshSummary}>Retry</button>
        </div>
      )}

      {portfolioSummary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Loans</h3>
            <p className="metric">{portfolioSummary.total_loans}</p>
          </div>
          <div className="summary-card">
            <h3>Active Loans</h3>
            <p className="metric">{portfolioSummary.active_loans}</p>
          </div>
          <div className="summary-card">
            <h3>Total Amount</h3>
            <p className="metric">
              ${portfolioSummary.total_loan_amount?.toLocaleString()}
            </p>
          </div>
          <div className="summary-card">
            <h3>Avg Interest Rate</h3>
            <p className="metric">{portfolioSummary.average_interest_rate}%</p>
          </div>
        </div>
      )}

      {activeLoansError && (
        <div className="error-alert">
          <h3>Active Loans Unavailable</h3>
          <p>{activeLoansError.message}</p>
          <button onClick={refreshActiveLoans}>Retry</button>
        </div>
      )}

      {activeLoans && (
        <div className="loans-table">
          <h3>Active Loans</h3>
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Borrower</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeLoans.map((loan) => (
                <tr key={loan.loan_id}>
                  <td>{loan.loan_id}</td>
                  <td>{loan.borrower_name || loan.borrower_id}</td>
                  <td>${loan.loan_amount?.toLocaleString()}</td>
                  <td>{loan.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

## Implementation Steps

1. **Update `mcpFunctionRegistry.js`**

   - Add the missing endpoint handlers for loan status and loan summary
   - Implement enhanced error handling and retry logic
   - Add response enhancement for better user experience

2. **Create Test Suite**

   - Implement unit tests for each MCP function
   - Add integration tests for the full MCP workflow
   - Create performance tests to ensure responsiveness

3. **Enhance Client Integration**

   - Implement the improved `useMcpFunction` hook
   - Create reusable components for displaying loan data
   - Add caching, retry logic, and fallback mechanisms

4. **Documentation and Monitoring**
   - Update API documentation to include the new endpoints
   - Add monitoring for MCP function performance and error rates
   - Create user guides for working with the MCP functions

## Expected Outcomes

After implementing these changes:

1. The "Loan Status" query will successfully return status information for specific loans
2. The "Portfolio Summary" query will return comprehensive portfolio metrics
3. The system will be more resilient to transient errors with retry logic
4. The user experience will be improved with caching and fallback mechanisms
5. The codebase will be more maintainable with comprehensive tests

## Conclusion

The proposed implementation addresses the immediate issues with the missing API endpoints while also enhancing the overall architecture with better error handling, testing, and client-side integration. These improvements will make the system more robust, maintainable, and user-friendly.
