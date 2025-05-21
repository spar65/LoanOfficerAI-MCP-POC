# HitList: MCP as a Service Protocol

## Overview

This hitlist outlines how to expand the Model Completion Protocol (MCP) beyond AI function calling to serve as a general-purpose service protocol framework. The approach unifies service communications under a consistent, structured model while supporting advanced patterns like real-time operations and function composition.

## Key Concepts

- **Unified Protocol**: Use MCP for all service communications regardless of whether AI is involved
- **Function-Based Design**: Express all operations as explicit, well-defined functions with schemas
- **Domain-Oriented Structure**: Group functions by domain rather than operation type
- **Progressive Enhancement**: Start with basic data operations, add AI capabilities incrementally
- **Consistent Interfaces**: Standardized request/response format for all operations
- **Schema Validation**: Strong typing and validation for all operations

## Implementation Steps

1. **Create MCP Router**

   - Implement centralized function registration
   - Support domain-prefixed function routing
   - Implement standardized response formatting
   - Add support for batched operations

2. **Define Service Handlers**

   - Create domain-specific handlers with consistent interfaces
   - Implement CRUD operations as explicit functions
   - Document functions with complete schemas
   - Support progressive enhancement with AI features

3. **Setup API Endpoints**

   - Create a centralized MCP endpoint
   - Support authentication and authorization
   - Add batching capabilities
   - Provide function discovery mechanisms

4. **Client Implementation**

   - Create unified client interfaces
   - Support both request-response and streaming patterns
   - Implement transparent error handling
   - Add observability and logging

5. **Function Composition**
   - Build complex operations from atomic functions
   - Support parallel execution when appropriate
   - Implement middleware chains for cross-cutting concerns
   - Create workflow orchestration for complex processes

## Benefits

- **Unified API Surface**: One consistent pattern for all service interactions
- **Reduced Architectural Complexity**: No separate REST and MCP infrastructures
- **Schema Enforcement**: Standardized parameter validation across all operations
- **AI-Readiness**: Services designed to easily integrate AI capabilities
- **Simplified Client Development**: Clients use one pattern for all server communication
- **Strong Typing**: Type-safe interfaces with clear function signatures
- **Improved Testability**: Explicit functions are easier to test than REST endpoints
- **Better Documentation**: Function definitions directly document capabilities
- **Centralized Logging**: Consistent monitoring across all operations
- **Flexible Communication**: Support for request-response, streaming, and batching

## Examples

### 1. Basic MCP Service Function

```javascript
// Define a function
{
  name: "borrowers.getById",
  description: "Get a borrower by ID",
  parameters: {
    type: "object",
    properties: {
      id: {
        type: "string",
        description: "The ID of the borrower (e.g., B001)"
      }
    },
    required: ["id"]
  }
}

// Implement the handler
async getById(args, context) {
  const { id } = args;

  try {
    const borrower = dataService.getBorrower(id);

    if (!borrower) {
      return mcpRouter.createErrorResponse(
        `Borrower with ID ${id} not found`,
        'ENTITY_NOT_FOUND'
      );
    }

    return mcpRouter.createSuccessResponse(borrower);
  } catch (error) {
    return mcpRouter.createErrorResponse(error);
  }
}
```

### 2. Client Usage

```javascript
// Execute a function via MCP client
const borrower = await mcpClient.execute("borrowers.getById", { id: "B001" });

// Batch operations
const results = await mcpClient.executeBatch([
  { function: "borrowers.getById", arguments: { id: "B001" } },
  { function: "loans.getByBorrower", arguments: { borrowerId: "B001" } },
]);
```

### 3. Real-Time Operations

```javascript
// Server-side streaming function
const streamingFunction = {
  name: "subscribeLoanUpdates",
  description: "Subscribe to real-time updates for a loan",
  parameters: {
    type: "object",
    properties: {
      loanId: {
        type: "string",
        description: "ID of the loan to monitor",
      },
    },
    required: ["loanId"],
  },
  events: {
    status_changed: {
      description: "Loan status has changed",
    },
    payment_received: {
      description: "Payment has been received for this loan",
    },
  },
};

// Client-side usage
const { data, events } = useMcpStream("subscribeLoanUpdates", {
  loanId: "L001",
});
```

### 4. Progressive Enhancement with AI

```javascript
// Function that works with or without AI
async function handleGetBorrowerDefaultRisk(args, context) {
  const { borrowerId, useAI = true } = args;

  // First, get basic borrower data (non-AI operation)
  const borrower = await dataService.findById(borrowerId);

  // Calculate basic risk metrics (non-AI operation)
  const basicRiskMetrics = calculateBasicRiskMetrics(borrower);

  // If AI is not requested or unavailable, return basic metrics
  if (!useAI || !config.aiEnabled) {
    return createSuccessResponse({
      risk_score: basicRiskMetrics.riskScore,
      ai_enhanced: false,
    });
  }

  // Enhance with AI if requested and available
  try {
    const aiRiskAssessment = await AiService.assessDefaultRisk({
      borrower,
      basicMetrics: basicRiskMetrics,
    });

    return createSuccessResponse({
      risk_score: aiRiskAssessment.riskScore,
      recommendations: aiRiskAssessment.recommendations,
      explanation: aiRiskAssessment.explanation,
      ai_enhanced: true,
    });
  } catch (aiError) {
    // AI enhancement failed, fall back to basic metrics
    return createSuccessResponse({
      risk_score: basicRiskMetrics.riskScore,
      ai_enhanced: false,
    });
  }
}
```

## Guiding Principles

1. **Functions First**: Design with explicit functions rather than resources + verbs
2. **Domain Orientation**: Organize by business domain instead of technical layers
3. **Progressive Disclosure**: Start simple, enhance with advanced capabilities as needed
4. **Consistent Patterns**: Use the same approach across all services
5. **Graceful Degradation**: Handle failures gracefully with fallbacks
6. **Explicit Contracts**: Define clear schemas for all operations
7. **Observability**: Design for monitoring and debugging from the start
8. **Future-Proofing**: Build for extension without modification

## Migration Strategy

1. **Identify High-Value Services**: Start with services that benefit most from this approach
2. **Create Parallel Implementations**: Maintain existing REST endpoints during transition
3. **Implement Adapters**: Bridge between REST and MCP during migration
4. **Add Progressive AI Enhancement**: Gradually introduce AI capabilities
5. **Document Migration Path**: Provide clear guidance for API consumers

## Technical Debt Prevention

- **Avoid REST/MCP Duplication**: Prevent maintaining two parallel APIs long-term
- **Standardize Response Formats**: Use consistent patterns for success/error responses
- **Centralized Schema Registry**: Maintain schemas in a central location
- **Automated Testing**: Test both MCP function execution and schemas
- **Versioning Strategy**: Plan for evolution without breaking changes

## Next Steps

- Evaluate current services for MCP migration suitability
- Create POC implementation for a single domain
- Develop standard patterns and templates
- Create client libraries for common languages
- Establish monitoring and observability framework
