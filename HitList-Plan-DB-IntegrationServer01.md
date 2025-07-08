# MCP Server Database Integration Plan

## Overview

This document outlines the strategy for integrating the MCP Server component of our Loan Officer AI application with the SQL Server database. The MCP Server is responsible for handling client requests and executing MCP functions, which currently access data from JSON files. This integration will modify the MCP Server to use the database for all data operations while maintaining the same interface for client applications.

## Current Architecture

```
Client → MCP Client API → MCP Server → MCP Function Registry → JSON Files
```

## Target Architecture

```
Client → MCP Client API → MCP Server → MCP Function Registry → MCP Database Service → SQL Database
```

## Implementation Strategy

### Phase 1: Server Infrastructure Updates

1. Update the MCP Server to establish database connection at startup
2. Implement connection pooling and error handling
3. Add graceful shutdown to close database connections

### Phase 2: MCP Request Handling

1. Modify MCP request handlers to use database services
2. Implement proper error handling for database failures
3. Ensure proper authentication and authorization for database access

### Phase 3: Tool Implementation

1. Update MCP tools to use database services instead of JSON files
2. Implement caching for frequently used data
3. Add performance monitoring for database operations

### Phase 4: Testing and Deployment

1. Create integration tests for MCP Server with database
2. Performance test the database-enabled MCP Server
3. Implement staged rollout with fallback to JSON if needed

## Implementation Details

### 1. Server Configuration Updates

Update the MCP Server initialization to establish database connection:

```javascript
// mcpServer.js
const express = require("express");
const LoanOfficerMCPServer = require("./server");
const LogService = require("../services/logService");
const DatabaseManager = require("../utils/database");

let mcpServer = null;

async function configureMCP(app) {
  try {
    // Connect to database before setting up MCP server
    await DatabaseManager.connect();

    mcpServer = new LoanOfficerMCPServer();

    app.post("/mcp", async (req, res) => {
      const isInitializeRequest = req.body && req.body.method === "initialize";
      await mcpServer.handleMCPRequest(req, res, isInitializeRequest);
    });

    app.get("/mcp", async (req, res) => {
      await mcpServer.handleSessionRequest(req, res);
    });

    app.delete("/mcp", async (req, res) => {
      await mcpServer.handleSessionRequest(req, res);
    });

    LogService.info("MCP server configured at /mcp endpoint");

    // Set up graceful shutdown
    process.on("SIGTERM", stopMCPServer);
    process.on("SIGINT", stopMCPServer);

    return mcpServer;
  } catch (error) {
    LogService.error(`Failed to configure MCP server: ${error.message}`, {
      stack: error.stack,
    });
    throw error;
  }
}

async function stopMCPServer() {
  if (mcpServer) {
    LogService.info("Stopping MCP server...");
    mcpServer.stop();
    mcpServer = null;

    // Close database connection
    await DatabaseManager.disconnect();
    LogService.info("Database connection closed");
  }
}

module.exports = { configureMCP, stopMCPServer };
```

### 2. MCP Server Class Updates

Update the LoanOfficerMCPServer class to use mcpDatabaseService:

```javascript
// server.js
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");
const mcpDatabaseService = require("../services/mcpDatabaseService");
const LogService = require("../services/logService");

class LoanOfficerMCPServer {
  constructor() {
    this.server = new McpServer({
      name: "LoanOfficerAI-MCP",
      version: "1.0.0",
      description: "MCP server for agricultural lending system",
    });

    this.setupTools();
    this.transports = new Map();
  }

  setupTools() {
    this.server.tool(
      "getBorrowerNonAccrualRisk",
      {
        borrowerId: z.string().describe("The ID of the borrower (e.g., B001)"),
      },
      async ({ borrowerId }) => {
        try {
          LogService.mcp(
            `Evaluating non-accrual risk for borrower ${borrowerId}`
          );

          // Use mcpDatabaseService instead of direct JSON access
          const nonAccrualRisk =
            await mcpDatabaseService.getBorrowerNonAccrualRisk(borrowerId);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(nonAccrualRisk),
              },
            ],
          };
        } catch (error) {
          LogService.error(
            `Error in getBorrowerNonAccrualRisk: ${error.message}`
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Failed to assess non-accrual risk",
                  details: error.message,
                }),
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "evaluateCollateralSufficiency",
      {
        loanId: z.string().describe("The ID of the loan (e.g., L001)"),
        marketConditions: z
          .enum(["stable", "declining", "improving"])
          .optional()
          .default("stable"),
      },
      async ({ loanId, marketConditions = "stable" }) => {
        try {
          LogService.mcp(
            `Evaluating collateral for loan ${loanId} with market conditions: ${marketConditions}`
          );

          // Use mcpDatabaseService instead of direct JSON access
          const sufficiencyResult =
            await mcpDatabaseService.evaluateCollateralSufficiency(loanId);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(sufficiencyResult),
              },
            ],
          };
        } catch (error) {
          LogService.error(
            `Error in evaluateCollateralSufficiency: ${error.message}`
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Failed to evaluate collateral sufficiency",
                  details: error.message,
                }),
              },
            ],
          };
        }
      }
    );

    this.server.tool(
      "getBorrowerDefaultRisk",
      {
        borrowerId: z.string().describe("The ID of the borrower (e.g., B001)"),
        timeHorizon: z
          .enum(["short_term", "medium_term", "long_term"])
          .optional()
          .default("medium_term"),
      },
      async ({ borrowerId, timeHorizon = "medium_term" }) => {
        try {
          LogService.mcp(
            `Assessing default risk for borrower ${borrowerId} with time horizon: ${timeHorizon}`
          );

          // Use mcpDatabaseService instead of direct JSON access
          const defaultRisk = await mcpDatabaseService.getBorrowerDefaultRisk(
            borrowerId
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(defaultRisk),
              },
            ],
          };
        } catch (error) {
          LogService.error(`Error in getBorrowerDefaultRisk: ${error.message}`);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Failed to assess default risk",
                  details: error.message,
                }),
              },
            ],
          };
        }
      }
    );

    // Add additional tools here...

    LogService.info("MCP server tools configured");
  }

  // Retain existing request handling methods...
}
```

### 3. Database Service Method Enhancements

Enhance mcpDatabaseService methods for MCP Server integration:

```javascript
// mcpDatabaseService.js (enhancements)

// Add method for handling market conditions in collateral evaluation
async evaluateCollateralSufficiencyWithMarket(loanId, marketConditions = 'stable') {
  try {
    const result = await this.evaluateCollateralSufficiency(loanId);

    // Apply market condition adjustments
    const marketAdjustment = marketConditions === 'declining' ? 0.8 :
                            marketConditions === 'improving' ? 1.1 : 1.0;

    const adjustedCollateralValue = result.collateral_value * marketAdjustment;
    const adjustedLoanToValueRatio = result.loan_amount / adjustedCollateralValue;
    const isSufficientAdjusted = adjustedLoanToValueRatio <= 0.8;

    // Return enhanced result with market adjustments
    return {
      ...result,
      market_conditions: marketConditions,
      market_adjustment_factor: marketAdjustment,
      adjusted_collateral_value: adjustedCollateralValue,
      adjusted_loan_to_value_ratio: parseFloat(adjustedLoanToValueRatio.toFixed(2)),
      is_sufficient_adjusted: isSufficientAdjusted,
      assessment: this._getCollateralAssessment(adjustedLoanToValueRatio)
    };
  } catch (error) {
    LogService.error('Error evaluating collateral with market conditions', {
      loanId,
      marketConditions,
      error: error.message
    });
    throw error;
  }
}

// Helper method for collateral assessment text
_getCollateralAssessment(loanToValueRatio) {
  if (loanToValueRatio < 0.5) return 'Collateral is highly sufficient.';
  else if (loanToValueRatio < 0.7) return 'Collateral is adequate.';
  else if (loanToValueRatio < 0.8) return 'Collateral is minimally sufficient.';
  else if (loanToValueRatio < 1.0) return 'Collateral below recommended levels.';
  else return 'Insufficient collateral.';
}
```

### 4. Performance Optimization with Caching

Implement in-memory caching for frequently accessed data:

```javascript
// Add caching support to mcpDatabaseService.js

const CACHE_TTL = 300000; // 5 minutes in milliseconds
const cache = new Map();

/**
 * Get cached data or run query
 * @param {string} key - Cache key
 * @param {Function} queryFn - Function to run if cache miss
 * @returns {Promise<any>} - Result
 */
async function getWithCache(key, queryFn) {
  const now = Date.now();
  const cachedItem = cache.get(key);

  // Return cached item if valid
  if (cachedItem && (now - cachedItem.timestamp) < CACHE_TTL) {
    LogService.debug(`Cache hit for ${key}`);
    return cachedItem.data;
  }

  // Cache miss - run query function
  LogService.debug(`Cache miss for ${key}`);
  const data = await queryFn();

  // Store in cache
  cache.set(key, {
    timestamp: now,
    data
  });

  return data;
}

// Then enhance methods to use cache
async getBorrowerDetails(borrowerId) {
  const cacheKey = `borrower:${borrowerId}`;

  return getWithCache(cacheKey, async () => {
    const result = await db.query(
      'SELECT * FROM Borrowers WHERE borrower_id = @param0',
      [borrowerId]
    );

    if (result.recordset.length === 0) {
      throw new Error(`Borrower with ID ${borrowerId} not found`);
    }

    return result.recordset[0];
  });
}
```

### 5. Transaction Support for Complex Operations

Implement transaction support for operations that affect multiple tables:

```javascript
// Add to mcpDatabaseService.js

/**
 * Update loan with collateral in a transaction
 * @param {Object} loanData - Loan data
 * @param {Array} collateralItems - Collateral items
 * @returns {Promise<Object>} - Updated loan with collateral
 */
async updateLoanWithCollateral(loanData, collateralItems) {
  return await db.transaction(async (request) => {
    // Update loan
    await request.query(`
      UPDATE Loans
      SET loan_amount = @param1, interest_rate = @param2, status = @param3
      WHERE loan_id = @param0
    `, [loanData.loan_id, loanData.loan_amount, loanData.interest_rate, loanData.status]);

    // Delete existing collateral
    await request.query(`
      DELETE FROM Collateral WHERE loan_id = @param0
    `, [loanData.loan_id]);

    // Insert new collateral
    for (const collateral of collateralItems) {
      await request.query(`
        INSERT INTO Collateral (collateral_id, loan_id, description, value)
        VALUES (@param0, @param1, @param2, @param3)
      `, [
        collateral.collateral_id,
        loanData.loan_id,
        collateral.description,
        collateral.value
      ]);
    }

    // Return updated loan with collateral
    const loanResult = await request.query(`
      SELECT * FROM Loans WHERE loan_id = @param0
    `, [loanData.loan_id]);

    const collateralResult = await request.query(`
      SELECT * FROM Collateral WHERE loan_id = @param0
    `, [loanData.loan_id]);

    return {
      loan: loanResult.recordset[0],
      collateral: collateralResult.recordset
    };
  });
}
```

## Testing Strategy

### 1. Unit Tests

Create unit tests for each database-integrated MCP method:

```javascript
// tests/unit/mcpDatabaseService.test.js
const mcpDatabaseService = require("../../services/mcpDatabaseService");
const db = require("../../utils/database");

describe("MCP Database Service", () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it("should get borrower details", async () => {
    const borrower = await mcpDatabaseService.getBorrowerDetails("B001");
    expect(borrower).toBeDefined();
    expect(borrower.borrower_id).toBe("B001");
  });

  it("should calculate borrower default risk", async () => {
    const risk = await mcpDatabaseService.getBorrowerDefaultRisk("B001");
    expect(risk).toBeDefined();
    expect(risk.borrower_id).toBe("B001");
    expect(risk.risk_score).toBeDefined();
  });

  // Add more tests...
});
```

### 2. Integration Tests

Create integration tests for the MCP Server with database:

```javascript
// tests/integration/mcpServer.test.js
const request = require("supertest");
const { app } = require("../../server");
const db = require("../../utils/database");

describe("MCP Server with Database", () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it("should initialize an MCP session", async () => {
    const response = await request(app)
      .post("/mcp")
      .send({
        jsonrpc: "2.0",
        method: "initialize",
        params: { protocol_version: "0.1" },
        id: 1,
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toBeDefined();
    expect(response.headers["mcp-session-id"]).toBeDefined();
  });

  it("should evaluate collateral sufficiency", async () => {
    // First get a session ID
    const initResponse = await request(app)
      .post("/mcp")
      .send({
        jsonrpc: "2.0",
        method: "initialize",
        params: { protocol_version: "0.1" },
        id: 1,
      });

    const sessionId = initResponse.headers["mcp-session-id"];

    // Then call the tool
    const response = await request(app)
      .post("/mcp")
      .set("mcp-session-id", sessionId)
      .send({
        jsonrpc: "2.0",
        method: "execute",
        params: {
          name: "evaluateCollateralSufficiency",
          args: { loanId: "L001", marketConditions: "stable" },
        },
        id: 2,
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toBeDefined();

    const content = JSON.parse(response.body.result.content[0].text);
    expect(content.loan_id).toBe("L001");
    expect(content.is_sufficient).toBeDefined();
  });

  // Add more tests...
});
```

### 3. Performance Testing

Create performance tests to ensure database operations are fast enough:

```javascript
// tests/performance/database.test.js
const mcpDatabaseService = require("../../services/mcpDatabaseService");

describe("Database Performance", () => {
  it("should retrieve borrower details quickly", async () => {
    const startTime = Date.now();
    await mcpDatabaseService.getBorrowerDetails("B001");
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(100); // Less than 100ms
  });

  it("should handle multiple concurrent requests", async () => {
    const requests = [];
    for (let i = 1; i <= 10; i++) {
      const borrowerId = `B00${i}`;
      requests.push(mcpDatabaseService.getBorrowerDetails(borrowerId));
    }

    const startTime = Date.now();
    await Promise.all(requests);
    const duration = Date.now() - startTime;

    // Average time per request should be reasonable
    expect(duration / 10).toBeLessThan(50); // Less than 50ms average
  });

  // Add more tests...
});
```

## Rollout Plan

### Phase 1: Development and Testing (Week 1)

- Implement database integration for MCP Server
- Create automated tests
- Benchmark performance against JSON implementation

### Phase 2: Staging Deployment (Week 2)

- Deploy to staging environment
- Run comprehensive integration tests
- Monitor performance and resource usage

### Phase 3: Production Deployment (Week 3)

- Deploy to production with feature flag
- Gradually increase traffic to database implementation
- Monitor for issues and performance concerns

### Phase 4: Cleanup and Optimization (Week 4)

- Remove JSON fallback code
- Optimize database queries and caching
- Document lessons learned

## Fallback Strategy

1. Implement feature flag for database vs. JSON:

```javascript
const USE_DATABASE = process.env.USE_DATABASE === "true";

// In MCP function
async function getLoanDetails(loanId) {
  if (USE_DATABASE) {
    try {
      return await mcpDatabaseService.getLoanDetails(loanId);
    } catch (error) {
      LogService.error(
        `Database error, falling back to JSON: ${error.message}`
      );
      // Fall through to JSON implementation
    }
  }

  // Fallback to JSON implementation
  const loans = dataService.loadData(dataService.paths.loans);
  return loans.find((l) => l.loan_id === loanId);
}
```

2. Add monitoring to detect database issues:

```javascript
// Add to database.js
let healthStatus = "healthy";
let lastFailure = null;
let failureCount = 0;

// Monitor database health
async function checkDatabaseHealth() {
  try {
    const pool = await this.connect();
    const result = await pool.request().query("SELECT 1 AS test");

    if (result.recordset[0].test === 1) {
      healthStatus = "healthy";
      failureCount = 0;
      return true;
    }

    healthStatus = "degraded";
    lastFailure = new Date();
    failureCount++;
    return false;
  } catch (error) {
    healthStatus = "unhealthy";
    lastFailure = new Date();
    failureCount++;
    LogService.error(`Database health check failed: ${error.message}`);
    return false;
  }
}

// Add health endpoint
app.get("/api/health/database", (req, res) => {
  res.json({
    status: healthStatus,
    lastFailure,
    failureCount,
  });
});
```

## Conclusion

This integration plan provides a comprehensive approach to moving the MCP Server from using JSON files to a SQL Server database while maintaining backward compatibility and performance. By implementing proper connection management, error handling, and caching, we ensure a robust and efficient system that can scale with our needs. The phased rollout strategy minimizes risk by allowing us to detect and address issues before they impact production users.

After implementing this plan, our MCP Server will be fully integrated with the database, completing our migration from a file-based system to a robust database architecture.
