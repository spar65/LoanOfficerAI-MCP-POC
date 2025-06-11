# MCP Composition Patterns

This guide demonstrates how to compose multiple MCP functions together to create complex workflows while maintaining modularity and reusability.

## Table of Contents

1. [Introduction](#introduction)
2. [Function Composition](#function-composition)
3. [Middleware Chains](#middleware-chains)
4. [Workflow Orchestration](#workflow-orchestration)
5. [Service Aggregation](#service-aggregation)

## Introduction

Individual MCP functions should be atomic, focused, and reusable. Complex business logic should be implemented by composing multiple functions together, rather than creating monolithic functions. This approach has several benefits:

- **Reusability**: Atomic functions can be reused in different contexts
- **Testability**: Smaller functions are easier to test
- **Maintainability**: Simpler functions are easier to understand and modify
- **Performance**: Functions can be executed in parallel when appropriate
- **Fault Isolation**: Failures in one function don't affect others

## Function Composition

### Basic Function Composition

```javascript
// Basic function composition
async function getLoanApplicationSummary(applicationId, context) {
  // Get basic application details
  const application = await mcpClient.execute("getLoanApplication", {
    id: applicationId,
  });

  // Get detailed borrower information
  const borrower = await mcpClient.execute("getCustomerProfile", {
    customerId: application.borrowerId,
  });

  // Get credit report summary
  const creditReport = await mcpClient.execute("getCreditReportSummary", {
    customerId: application.borrowerId,
  });

  // Get property valuation if applicable
  let property = null;
  if (application.propertyAddress) {
    property = await mcpClient.execute("getPropertyValuation", {
      address: application.propertyAddress,
    });
  }

  // Combine all data into a comprehensive summary
  return {
    applicationId: application.id,
    status: application.status,
    loanType: application.loanType,
    requestedAmount: application.requestedAmount,
    term: application.term,
    interestRate: application.interestRate,
    submittedDate: application.submittedDate,
    borrower: {
      id: borrower.id,
      name: borrower.name,
      email: borrower.email,
      phone: borrower.phone,
      creditScore: creditReport.score,
      monthlyIncome: borrower.income?.monthly || 0,
      debtToIncomeRatio: creditReport.debtToIncomeRatio,
    },
    property: property
      ? {
          address: property.address,
          type: property.propertyType,
          estimatedValue: property.estimatedValue,
          comparableSales: property.comparableSales?.length || 0,
        }
      : null,
  };
}
```

### Declarative Composition

```javascript
// Declarative function composition
const functionCompositions = {
  getLoanApplicationSummary: {
    description: "Get comprehensive loan application summary",
    steps: [
      {
        function: "getLoanApplication",
        mapParams: (args) => ({ id: args.applicationId }),
        resultKey: "application",
      },
      {
        function: "getCustomerProfile",
        mapParams: (args, prevResults) => ({
          customerId: prevResults.application.borrowerId,
        }),
        resultKey: "borrower",
      },
      {
        function: "getCreditReportSummary",
        mapParams: (args, prevResults) => ({
          customerId: prevResults.application.borrowerId,
        }),
        resultKey: "creditReport",
      },
      {
        function: "getPropertyValuation",
        condition: (args, prevResults) =>
          Boolean(prevResults.application.propertyAddress),
        mapParams: (args, prevResults) => ({
          address: prevResults.application.propertyAddress,
        }),
        resultKey: "property",
      },
    ],
    mapResult: (args, results) => ({
      applicationId: results.application.id,
      status: results.application.status,
      loanType: results.application.loanType,
      requestedAmount: results.application.requestedAmount,
      term: results.application.term,
      interestRate: results.application.interestRate,
      submittedDate: results.application.submittedDate,
      borrower: {
        id: results.borrower.id,
        name: results.borrower.name,
        email: results.borrower.email,
        phone: results.borrower.phone,
        creditScore: results.creditReport.score,
        monthlyIncome: results.borrower.income?.monthly || 0,
        debtToIncomeRatio: results.creditReport.debtToIncomeRatio,
      },
      property: results.property
        ? {
            address: results.property.address,
            type: results.property.propertyType,
            estimatedValue: results.property.estimatedValue,
            comparableSales: results.property.comparableSales?.length || 0,
          }
        : null,
    }),
  },
};

// Function composition executor
async function executeComposition(compositionName, args, context) {
  const composition = functionCompositions[compositionName];

  if (!composition) {
    throw new Error(`Function composition not found: ${compositionName}`);
  }

  // Store intermediate results
  const results = {};

  // Execute each step
  for (const step of composition.steps) {
    // Check condition if present
    if (step.condition && !step.condition(args, results)) {
      continue;
    }

    // Map parameters
    const stepParams = step.mapParams ? step.mapParams(args, results) : args;

    // Execute function
    const result = await mcpClient.execute(step.function, stepParams, context);

    // Store result
    if (step.resultKey) {
      results[step.resultKey] = result;
    }
  }

  // Map final result
  return composition.mapResult ? composition.mapResult(args, results) : results;
}

// Using the composition
async function getLoanSummary(applicationId) {
  return executeComposition("getLoanApplicationSummary", { applicationId });
}
```

### Parallel Execution

```javascript
// Parallel function execution
async function getCombinedLoanData(loanId) {
  // Execute multiple MCP functions in parallel
  const [loanDetails, paymentHistory, relatedDocuments] = await Promise.all([
    mcpClient.execute("getLoanDetails", { id: loanId }),
    mcpClient.execute("getLoanPaymentHistory", { loanId }),
    mcpClient.execute("getLoanDocuments", { loanId }),
  ]);

  // Combine results
  return {
    ...loanDetails,
    payments: paymentHistory.payments,
    documents: relatedDocuments.documents,
  };
}
```

## Middleware Chains

### Creating Middleware Chain

```javascript
// Middleware chain implementation
function createMiddlewareChain(middlewareList, handler) {
  // Build chain from the end to start
  return middlewareList.reduceRight((next, middleware) => {
    return (context) => middleware(next)(context);
  }, handler);
}

// Example middlewares
const loggingMiddleware = (next) => async (context) => {
  console.log(`Executing function: ${context.functionName}`);
  const startTime = Date.now();

  try {
    const result = await next(context);

    console.log(
      `Completed ${context.functionName} in ${Date.now() - startTime}ms`
    );
    return result;
  } catch (error) {
    console.error(`Error in ${context.functionName}: ${error.message}`);
    throw error;
  }
};

const cacheMiddleware = (next) => async (context) => {
  const { functionName, args } = context;
  const cacheKey = `${functionName}:${JSON.stringify(args)}`;

  // Check cache
  const cachedResult = await cache.get(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  // Execute function
  const result = await next(context);

  // Store in cache
  await cache.set(cacheKey, result, 60 * 5); // 5 minute cache

  return result;
};

const authMiddleware = (next) => async (context) => {
  const { user, functionName } = context;

  if (!user) {
    throw new Error("Authentication required");
  }

  // Check if user has permission to execute this function
  const hasPermission = await authService.canExecuteFunction(
    user.id,
    functionName
  );

  if (!hasPermission) {
    throw new Error(`User does not have permission to execute ${functionName}`);
  }

  return next(context);
};

// Apply middlewares to a function
function getLoanDetails(args, context) {
  // Original function implementation
  return db.loans.findOne({ id: args.id });
}

const enhancedGetLoanDetails = createMiddlewareChain(
  [loggingMiddleware, cacheMiddleware, authMiddleware],
  getLoanDetails
);

// Using the enhanced function
const result = await enhancedGetLoanDetails(
  { id: "loan123" },
  {
    functionName: "getLoanDetails",
    user: { id: "user456" },
  }
);
```

### Configurable Middleware

```javascript
// Configurable middleware
const validationMiddleware = (schema) => (next) => async (context) => {
  const { args } = context;

  // Validate args against schema
  const validationResult = await schema.validate(args, {
    abortEarly: false,
    stripUnknown: true,
  });

  // Update context with validated args
  context.args = validationResult;

  // Continue execution
  return next(context);
};

const rateLimitMiddleware = (limit, windowMs) => (next) => async (context) => {
  const { user } = context;

  // Enforce rate limit
  const rateLimitKey = `ratelimit:${user.id}`;
  const currentCount = (await redis.get(rateLimitKey)) || 0;

  if (currentCount >= limit) {
    throw new Error("Rate limit exceeded. Try again later.");
  }

  // Increment counter
  await redis.incr(rateLimitKey);

  // Set expiration if not already set
  if (currentCount === 0) {
    await redis.expire(rateLimitKey, windowMs / 1000);
  }

  // Continue execution
  return next(context);
};

// Schema for loan creation
const createLoanSchema = yup.object({
  customerId: yup.string().required(),
  amount: yup.number().required().positive(),
  term: yup.number().required().positive(),
  interestRate: yup.number().required().positive(),
});

// Apply configurable middlewares
const createLoanFunction = createMiddlewareChain(
  [
    loggingMiddleware,
    authMiddleware,
    validationMiddleware(createLoanSchema),
    rateLimitMiddleware(10, 60 * 1000), // 10 requests per minute
  ],
  createLoan
);
```

## Workflow Orchestration

### Workflow Definition

```javascript
// Workflow definition
const loanApplicationWorkflow = {
  name: "processLoanApplication",
  description: "Process a new loan application from submission to decision",
  steps: [
    {
      id: "validateApplication",
      function: "validateLoanApplication",
      description: "Validate the loan application data",
      mapParams: (data) => ({ application: data.application }),
      onSuccess: "checkCreditScore",
      onError: "handleValidationError",
    },
    {
      id: "checkCreditScore",
      function: "checkBorrowerCreditScore",
      description: "Check the borrower's credit score",
      mapParams: (data, prevResults) => ({
        customerId: data.application.borrowerId,
      }),
      onSuccess: (results) => {
        // Dynamic routing based on credit score
        if (results.checkCreditScore.score >= 700) {
          return "calculateRiskScore";
        } else if (results.checkCreditScore.score >= 600) {
          return "checkDebtToIncome";
        } else {
          return "automaticRejection";
        }
      },
      onError: "handleCreditCheckError",
    },
    {
      id: "checkDebtToIncome",
      function: "calculateDebtToIncomeRatio",
      description: "Calculate the borrower's debt-to-income ratio",
      mapParams: (data, prevResults) => ({
        customerId: data.application.borrowerId,
        loanAmount: data.application.amount,
        loanTerm: data.application.term,
        interestRate: data.application.interestRate,
      }),
      onSuccess: (results) => {
        // Dynamic routing based on DTI ratio
        return results.checkDebtToIncome.ratio <= 0.43
          ? "calculateRiskScore"
          : "automaticRejection";
      },
      onError: "handleFinancialCheckError",
    },
    {
      id: "calculateRiskScore",
      function: "calculateLoanRiskScore",
      description: "Calculate the overall risk score for the loan",
      mapParams: (data, prevResults) => ({
        application: data.application,
        creditScore: prevResults.checkCreditScore.score,
        debtToIncome: prevResults.checkDebtToIncome?.ratio,
      }),
      onSuccess: (results) => {
        // Dynamic routing based on risk score
        if (results.calculateRiskScore.score <= 30) {
          return "automaticApproval";
        } else if (results.calculateRiskScore.score <= 70) {
          return "manualReview";
        } else {
          return "automaticRejection";
        }
      },
      onError: "handleRiskAnalysisError",
    },
    {
      id: "automaticApproval",
      function: "approveLoanApplication",
      description: "Automatically approve the loan application",
      mapParams: (data, prevResults) => ({
        applicationId: data.application.id,
        approvalReason: "Low risk profile",
        riskScore: prevResults.calculateRiskScore.score,
      }),
      onSuccess: "notifyApproval",
      onError: "handleApprovalError",
    },
    {
      id: "automaticRejection",
      function: "rejectLoanApplication",
      description: "Automatically reject the loan application",
      mapParams: (data, prevResults) => {
        let reason = "High risk profile";

        if (prevResults.checkCreditScore.score < 600) {
          reason = "Insufficient credit score";
        } else if (prevResults.checkDebtToIncome?.ratio > 0.43) {
          reason = "Debt-to-income ratio too high";
        }

        return {
          applicationId: data.application.id,
          rejectionReason: reason,
        };
      },
      onSuccess: "notifyRejection",
      onError: "handleRejectionError",
    },
    {
      id: "manualReview",
      function: "queueForManualReview",
      description: "Queue the application for manual review",
      mapParams: (data, prevResults) => ({
        applicationId: data.application.id,
        riskScore: prevResults.calculateRiskScore.score,
        creditScore: prevResults.checkCreditScore.score,
        debtToIncome: prevResults.checkDebtToIncome?.ratio,
      }),
      onSuccess: "notifyManualReview",
      onError: "handleQueueError",
    },
    {
      id: "notifyApproval",
      function: "sendApprovalNotification",
      description: "Send approval notification to borrower",
      mapParams: (data, prevResults) => ({
        applicationId: data.application.id,
        borrowerId: data.application.borrowerId,
        approvalDetails: prevResults.automaticApproval,
      }),
      onSuccess: "complete",
      onError: "handleNotificationError",
    },
    {
      id: "notifyRejection",
      function: "sendRejectionNotification",
      description: "Send rejection notification to borrower",
      mapParams: (data, prevResults) => ({
        applicationId: data.application.id,
        borrowerId: data.application.borrowerId,
        rejectionDetails: prevResults.automaticRejection,
      }),
      onSuccess: "complete",
      onError: "handleNotificationError",
    },
    {
      id: "notifyManualReview",
      function: "sendManualReviewNotification",
      description: "Send manual review notification to borrower",
      mapParams: (data, prevResults) => ({
        applicationId: data.application.id,
        borrowerId: data.application.borrowerId,
        reviewDetails: prevResults.manualReview,
      }),
      onSuccess: "complete",
      onError: "handleNotificationError",
    },
    {
      id: "handleValidationError",
      function: "logApplicationError",
      description: "Log application validation error",
      mapParams: (data, prevResults, error) => ({
        applicationId: data.application.id,
        errorSource: "validation",
        errorDetails: error.message,
      }),
      onSuccess: "notifyValidationError",
      onError: "complete",
    },
    // Additional error handlers...
    {
      id: "complete",
      description: "Workflow complete",
      isTerminal: true,
    },
  ],
};

// Workflow executor
async function executeWorkflow(workflowName, data, context = {}) {
  const workflow = workflows[workflowName];

  if (!workflow) {
    throw new Error(`Workflow not found: ${workflowName}`);
  }

  // Initialize workflow execution
  const executionId = generateUuid();
  const results = {};
  let currentStepId = workflow.steps[0].id;

  // Execute steps until completion or max steps
  const maxSteps = 100;
  let stepCount = 0;

  while (currentStepId && stepCount < maxSteps) {
    stepCount++;

    // Find current step
    const step = workflow.steps.find((s) => s.id === currentStepId);

    if (!step) {
      throw new Error(`Step not found: ${currentStepId}`);
    }

    // Check if terminal step
    if (step.isTerminal) {
      return {
        executionId,
        status: "completed",
        results,
      };
    }

    try {
      // Map parameters for the step
      const stepParams = step.mapParams ? step.mapParams(data, results) : data;

      // Execute function
      if (step.function) {
        const result = await mcpClient.execute(step.function, stepParams, {
          ...context,
          workflowExecution: executionId,
        });

        // Store result
        results[step.id] = result;

        // Determine next step
        if (typeof step.onSuccess === "function") {
          currentStepId = step.onSuccess(results);
        } else {
          currentStepId = step.onSuccess;
        }
      } else {
        // Step without function (e.g., a router step)
        currentStepId = step.next;
      }
    } catch (error) {
      // Store error
      const stepError = {
        message: error.message,
        stack: error.stack,
        code: error.code,
      };

      results[`${step.id}_error`] = stepError;

      // Handle error
      if (step.onError) {
        if (typeof step.onError === "function") {
          currentStepId = step.onError(results, stepError);
        } else {
          currentStepId = step.onError;
        }
      } else {
        // No error handler, end workflow
        return {
          executionId,
          status: "failed",
          error: stepError,
          lastStepId: step.id,
          results,
        };
      }
    }
  }

  // If we reach here, we've exceeded max steps
  return {
    executionId,
    status: "exceeded_max_steps",
    lastStepId: currentStepId,
    results,
  };
}
```

## Service Aggregation

### Aggregating Data from Multiple Services

```javascript
// Service aggregation pattern
async function getLoanDashboardData(customerId) {
  // Define the data we need
  const dataRequests = [
    {
      service: "loan-service",
      function: "getActiveLoans",
      params: { customerId },
      resultKey: "loans",
    },
    {
      service: "payment-service",
      function: "getUpcomingPayments",
      params: { customerId },
      resultKey: "payments",
    },
    {
      service: "notification-service",
      function: "getPendingNotifications",
      params: { userId: customerId },
      resultKey: "notifications",
    },
    {
      service: "document-service",
      function: "getPendingDocuments",
      params: { customerId },
      resultKey: "documents",
    },
  ];

  // Execute all requests in parallel
  const results = await Promise.all(
    dataRequests.map(async (request) => {
      try {
        const client = serviceRegistry.getClient(request.service);
        const result = await client.execute(request.function, request.params);

        return {
          key: request.resultKey,
          data: result,
          error: null,
        };
      } catch (error) {
        console.error(`Error fetching ${request.resultKey}:`, error);
        return {
          key: request.resultKey,
          data: null,
          error: {
            message: error.message,
            service: request.service,
            function: request.function,
          },
        };
      }
    })
  );

  // Combine results into a single response
  const dashboard = {
    customerId,
    timestamp: new Date().toISOString(),
    data: {},
    errors: {},
  };

  // Process results
  results.forEach((result) => {
    if (result.error) {
      dashboard.errors[result.key] = result.error;
      dashboard.data[result.key] = null;
    } else {
      dashboard.data[result.key] = result.data;
    }
  });

  // Calculate summary information
  if (dashboard.data.loans) {
    dashboard.summary = {
      totalLoans: dashboard.data.loans.length,
      totalBalance: dashboard.data.loans.reduce(
        (sum, loan) => sum + loan.currentBalance,
        0
      ),
      upcomingPayments: dashboard.data.payments?.length || 0,
      pendingDocuments: dashboard.data.documents?.length || 0,
      unreadNotifications: dashboard.data.notifications?.unreadCount || 0,
    };
  }

  return dashboard;
}
```

### Batching Operations

```javascript
// Function batching for efficient operations
async function batchUpdateLoanStatuses(loanIds, newStatus, userId) {
  // Check if the service supports batching
  const loanService = serviceRegistry.getClient("loan-service");

  if (loanService.supportsBatching) {
    // Use native batch operation if supported
    return await loanService.execute("updateLoansStatus", {
      loanIds,
      status: newStatus,
      updatedBy: userId,
    });
  } else {
    // Implement client-side batching
    const results = {
      successful: [],
      failed: [],
    };

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < loanIds.length; i += batchSize) {
      const batch = loanIds.slice(i, i + batchSize);

      // Execute updates in parallel
      const batchResults = await Promise.allSettled(
        batch.map((loanId) =>
          loanService.execute("updateLoanStatus", {
            loanId,
            status: newStatus,
            updatedBy: userId,
          })
        )
      );

      // Process batch results
      batchResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.successful.push({
            loanId: batch[index],
            result: result.value,
          });
        } else {
          results.failed.push({
            loanId: batch[index],
            error: result.reason.message,
          });
        }
      });
    }

    return results;
  }
}
```

For more advanced examples of MCP composition patterns, including error handling strategies and advanced workflow patterns, see [04-mcp-real-time-systems.md](04-mcp-real-time-systems.md).

For comprehensive implementation guidelines on composition patterns, refer to rule [509-mcp-composition-patterns.mdc](../../509-mcp-composition-patterns.mdc) in the `.cursor/rules` directory.
