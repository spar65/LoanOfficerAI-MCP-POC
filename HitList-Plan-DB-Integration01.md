# Database Integration Plan for MCP Loan Management System

## Overview

This plan outlines the strategy for integrating a SQL database with our MCP Loan Management System. The goal is to replace the current JSON file-based data storage with a robust database solution while preserving the MCP architecture and function interfaces.

## Architecture Changes

### Current Architecture

```
Client → MCP Client API → Server → MCP Function Registry → JSON Files
```

### Target Architecture

```
Client → MCP Client API → Server → MCP Function Registry → Database Service → SQL Database
```

## Implementation Strategy

### Phase 1: Database Setup (Week 1)

- Create SQL database schema with all tables and indexes
- Develop database utility module for connection management
- Create data migration scripts to transfer JSON data to database

### Phase 2: Data Service Layer (Week 2)

- Develop `DatabaseService` with CRUD operations for all entities
- Create `MCPDatabaseService` with MCP-specific operations
- Implement data validation and error handling
- Add transaction support for multi-table operations

### Phase 3: MCP Function Registry Updates (Week 3)

- Refactor MCP functions to use database services
- Maintain identical function signatures for backward compatibility
- Add performance monitoring and logging for database operations
- Implement caching for frequently accessed data

### Phase 4: Testing & Deployment (Week 4)

- Create database integration tests
- Validate all MCP functions with database backend
- Performance testing and optimization
- Staged deployment with fallback to JSON if needed

## Detailed Implementation Plan

### 1. Database Implementation

Create the database utility module:

```javascript
// utils/database.js
const sql = require("mssql");

class DatabaseManager {
  constructor() {
    this.config = {
      server: process.env.DB_SERVER || "(localdb)\\MSSQLLocalDB",
      database: process.env.DB_NAME || "LoanOfficerDB",
      options: {
        trustedConnection: true,
        enableArithAbort: true,
        trustServerCertificate: true,
        encrypt: false,
      },
    };

    // Use SQL authentication if provided
    if (process.env.DB_USER && process.env.DB_PASSWORD) {
      this.config.user = process.env.DB_USER;
      this.config.password = process.env.DB_PASSWORD;
      delete this.config.options.trustedConnection;
    }

    this.pool = null;
  }

  async connect() {
    if (!this.pool) {
      this.pool = await sql.connect(this.config);
    }
    return this.pool;
  }

  async query(query, params = []) {
    const pool = await this.connect();
    const request = pool.request();

    // Add parameters if provided
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });

    return request.query(query);
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
    }
  }
}

module.exports = new DatabaseManager();
```

### 2. Data Service Implementation

Create entity-specific data services:

```javascript
// services/borrowerService.js
const db = require("../utils/database");
const { v4: uuidv4 } = require("uuid");

class BorrowerService {
  async getBorrowerById(borrowerId) {
    const result = await db.query(
      "SELECT * FROM Borrowers WHERE borrower_id = @param0",
      [borrowerId]
    );
    return result.recordset[0];
  }

  async getAllBorrowers() {
    const result = await db.query("SELECT * FROM Borrowers");
    return result.recordset;
  }

  async createBorrower(borrowerData) {
    const borrowerId =
      borrowerData.borrower_id || `B${uuidv4().substring(0, 6)}`;

    await db.query(
      `
      INSERT INTO Borrowers (
        borrower_id, first_name, last_name, address, phone, email,
        credit_score, income, farm_size, farm_type, debt_to_income_ratio,
        risk_score, ai_risk_assessment, last_risk_update
      ) VALUES (
        @param0, @param1, @param2, @param3, @param4, @param5,
        @param6, @param7, @param8, @param9, @param10,
        @param11, @param12, @param13
      )
    `,
      [
        borrowerId,
        borrowerData.first_name,
        borrowerData.last_name,
        borrowerData.address,
        borrowerData.phone,
        borrowerData.email,
        borrowerData.credit_score,
        borrowerData.income,
        borrowerData.farm_size,
        borrowerData.farm_type,
        borrowerData.debt_to_income_ratio || null,
        borrowerData.risk_score || null,
        JSON.stringify(borrowerData.ai_risk_assessment || {}),
        borrowerData.last_risk_update || new Date(),
      ]
    );

    return this.getBorrowerById(borrowerId);
  }

  // Add update and delete methods
}

module.exports = new BorrowerService();
```

### 3. MCP Function Registry Updates

Update the MCP function registry to use the database services:

```javascript
// services/mcpFunctionRegistry.js
const borrowerService = require("./borrowerService");
const loanService = require("./loanService");
const LogService = require("./logService");

class McpFunctionRegistry {
  constructor() {
    this.registry = {
      // Replace JSON file access with database service calls
      getBorrowerDetails: async (args) => {
        try {
          return await borrowerService.getBorrowerById(args.borrower_id);
        } catch (error) {
          LogService.error("Error in getBorrowerDetails", { error, args });
          throw error;
        }
      },

      getLoanDetails: async (args) => {
        try {
          return await loanService.getLoanById(args.loan_id);
        } catch (error) {
          LogService.error("Error in getLoanDetails", { error, args });
          throw error;
        }
      },

      // Additional MCP functions...
    };

    this.functionSchemas = {
      // Keep existing function schemas
    };
  }

  // Keep existing methods
}

module.exports = new McpFunctionRegistry();
```

### 4. Migration Script

Create a script to migrate JSON data to the database:

```javascript
// scripts/migrateJsonToDb.js
const fs = require("fs");
const path = require("path");
const borrowerService = require("../services/borrowerService");
const loanService = require("../services/loanService");
const paymentService = require("../services/paymentService");
const collateralService = require("../services/collateralService");

async function migrateJsonToDatabase() {
  try {
    // Migrate borrowers
    console.log("Migrating borrowers...");
    const borrowersPath = path.join(__dirname, "../data/borrowers.json");
    const borrowersData = JSON.parse(fs.readFileSync(borrowersPath, "utf8"));

    for (const borrower of borrowersData) {
      await borrowerService.createBorrower(borrower);
    }

    // Migrate loans
    console.log("Migrating loans...");
    const loansPath = path.join(__dirname, "../data/loans.json");
    const loansData = JSON.parse(fs.readFileSync(loansPath, "utf8"));

    for (const loan of loansData) {
      await loanService.createLoan(loan);
    }

    // Continue with other entities...

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrateJsonToDatabase();
```

## Testing Strategy

1. Unit tests for each database service
2. Integration tests for MCP functions with database
3. Performance comparison tests (JSON vs. DB)
4. Load testing to ensure scalability

## Rollback Plan

1. Maintain JSON files as backup during initial deployment
2. Implement feature flag to switch between JSON and DB backends
3. Create database snapshot before deployment

## Timeline

| Week | Tasks                                 | Deliverables                          |
| ---- | ------------------------------------- | ------------------------------------- |
| 1    | Database schema setup, utility module | Working database with schema          |
| 2    | Data services implementation          | CRUD operations for all entities      |
| 3    | MCP function registry updates         | Updated MCP functions using DB        |
| 4    | Testing, optimization, deployment     | Production-ready database integration |

## Implementation Summary

We have successfully completed the following steps for database integration:

1. **Database Schema Design**:

   - Created a comprehensive schema with core tables (Users, Borrowers, Loans, etc.)
   - Added MCP-specific tables for AI interactions and recommendations
   - Designed proper relationships between tables
   - Added appropriate indexes for performance optimization

2. **Database Infrastructure**:

   - Created `database/createSchema.sql` with complete table definitions
   - Implemented `utils/database.js` for connection management
   - Added proper error handling and transaction support
   - Implemented performance monitoring for queries

3. **MCP Database Service Layer**:

   - Created `mcpDatabaseService.js` as intermediary between MCP and database
   - Implemented all CRUD operations for MCP functions
   - Added proper validation and error handling
   - Ensured backward compatibility with existing function signatures

4. **Data Migration**:

   - Created `migrateJsonToDb.js` to transfer data from JSON files to database
   - Added data transformation logic to match database schema
   - Implemented transaction support for all-or-nothing migration
   - Added proper logging and error handling

5. **Function Registry Updates**:

   - Updated `mcpFunctionRegistry.js` to use database services
   - Maintained backward compatibility for client applications
   - Improved error reporting and recovery mechanisms
   - Set up fallback to JSON when needed for incomplete functions

6. **Setup and Configuration**:

   - Created `setupDatabase.js` for database creation and schema setup
   - Added `dbSetup.sh` for automated setup process
   - Implemented proper environment variable support
   - Created comprehensive setup documentation

7. **Documentation**:
   - Created comprehensive DB integration guide
   - Documented database schema and relationships
   - Provided troubleshooting instructions
   - Added best practices for database performance

This implementation successfully transforms the application from using static JSON files to a fully functional SQL Server database while maintaining all existing functionality and interfaces.
