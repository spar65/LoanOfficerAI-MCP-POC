# Complete Cursor Implementation Guide - MCP Database Integration

## 🚀 Pre-Implementation Setup Commands for Cursor

Execute these commands in sequence in Cursor terminal:

```bash
# 1. Create project structure
mkdir -p database scripts utils services tests/integration data

# 2. Install all required dependencies
npm install mssql uuid zod express dotenv
npm install --save-dev jest supertest nodemon

# 3. Create environment configuration
echo "# Database Configuration
DB_SERVER=(localdb)\\MSSQLLocalDB
DB_NAME=LoanOfficerDB
USE_DATABASE=false
NODE_ENV=development
PORT=3000" > .env

# 4. Update package.json scripts
npm pkg set scripts.start="node server.js"
npm pkg set scripts.dev="nodemon server.js"
npm pkg set scripts.test="jest"
npm pkg set scripts.migrate="node scripts/migrateJsonToDb.js"
```

---

## 📋 Phase 1: Database Foundation Setup

### Step 1.1: Create Enhanced Database Schema

**File: `database/createSchema.sql`**

```sql
-- Enhanced schema with all necessary tables and relationships
USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'LoanOfficerDB')
BEGIN
    CREATE DATABASE LoanOfficerDB;
END
GO

USE LoanOfficerDB;
GO

-- Drop tables if they exist (for clean setup)
IF OBJECT_ID('dbo.MCPConversations', 'U') IS NOT NULL DROP TABLE dbo.MCPConversations;
IF OBJECT_ID('dbo.AIRecommendations', 'U') IS NOT NULL DROP TABLE dbo.AIRecommendations;
IF OBJECT_ID('dbo.AuditLog', 'U') IS NOT NULL DROP TABLE dbo.AuditLog;
IF OBJECT_ID('dbo.LoanAnalysis', 'U') IS NOT NULL DROP TABLE dbo.LoanAnalysis;
IF OBJECT_ID('dbo.MaintenanceRecords', 'U') IS NOT NULL DROP TABLE dbo.MaintenanceRecords;
IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL DROP TABLE dbo.Payments;
IF OBJECT_ID('dbo.Collateral', 'U') IS NOT NULL DROP TABLE dbo.Collateral;
IF OBJECT_ID('dbo.Equipment', 'U') IS NOT NULL DROP TABLE dbo.Equipment;
IF OBJECT_ID('dbo.Loans', 'U') IS NOT NULL DROP TABLE dbo.Loans;
IF OBJECT_ID('dbo.Borrowers', 'U') IS NOT NULL DROP TABLE dbo.Borrowers;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;

-- Core tables
CREATE TABLE Users (
    id NVARCHAR(50) PRIMARY KEY,
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    passwordHash NVARCHAR(100) NOT NULL,
    firstName NVARCHAR(50),
    lastName NVARCHAR(50),
    role NVARCHAR(50) DEFAULT 'loan_officer',
    tenantId NVARCHAR(50) NOT NULL,
    active BIT DEFAULT 1,
    lastLogin DATETIME,
    preferredAIModel NVARCHAR(50) DEFAULT 'claude-sonnet-4',
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Borrowers (
    borrower_id NVARCHAR(50) PRIMARY KEY,
    first_name NVARCHAR(50) NOT NULL,
    last_name NVARCHAR(50) NOT NULL,
    address NVARCHAR(255),
    phone NVARCHAR(20),
    email NVARCHAR(100),
    credit_score INT CHECK (credit_score >= 300 AND credit_score <= 850),
    income DECIMAL(15,2),
    farm_size DECIMAL(10,2),
    farm_type NVARCHAR(50),
    debt_to_income_ratio DECIMAL(5,2),
    risk_score DECIMAL(5,2),
    ai_risk_assessment NVARCHAR(MAX), -- JSON field
    last_risk_update DATETIME,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE Loans (
    loan_id NVARCHAR(50) PRIMARY KEY,
    borrower_id NVARCHAR(50) NOT NULL,
    loan_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    term_length INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    loan_type NVARCHAR(50),
    payment_history_score DECIMAL(5,2),
    ai_approval_recommendation NVARCHAR(MAX), -- JSON field
    ai_confidence_score DECIMAL(5,2),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (borrower_id) REFERENCES Borrowers(borrower_id)
);

CREATE TABLE Collateral (
    collateral_id NVARCHAR(50) PRIMARY KEY,
    loan_id NVARCHAR(50) NOT NULL,
    description NVARCHAR(255),
    value DECIMAL(15,2),
    appraised_value DECIMAL(15,2),
    appraisal_date DATE,
    current_condition NVARCHAR(50),
    ai_valuation DECIMAL(15,2),
    ai_valuation_confidence DECIMAL(5,2),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
);

CREATE TABLE Payments (
    payment_id NVARCHAR(50) PRIMARY KEY,
    loan_id NVARCHAR(50) NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    payment_method NVARCHAR(50),
    late_fee DECIMAL(15,2) DEFAULT 0,
    days_late INT DEFAULT 0,
    ai_risk_flag BIT DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
);

CREATE TABLE Equipment (
    equipment_id NVARCHAR(50) PRIMARY KEY,
    borrower_id NVARCHAR(50) NOT NULL,
    type NVARCHAR(50) NOT NULL,
    purchase_date DATE,
    condition NVARCHAR(20),
    purchase_price DECIMAL(15,2),
    current_value DECIMAL(15,2),
    depreciation_rate DECIMAL(5,2),
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (borrower_id) REFERENCES Borrowers(borrower_id)
);

CREATE TABLE MaintenanceRecords (
    record_id INT PRIMARY KEY IDENTITY(1,1),
    equipment_id NVARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    type NVARCHAR(50),
    cost DECIMAL(15,2),
    description NVARCHAR(MAX),
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (equipment_id) REFERENCES Equipment(equipment_id)
);

-- MCP-specific tables
CREATE TABLE MCPConversations (
    conversation_id NVARCHAR(50) PRIMARY KEY,
    user_id NVARCHAR(50) NOT NULL,
    session_id NVARCHAR(100),
    context_type NVARCHAR(50),
    context_id NVARCHAR(50),
    model_used NVARCHAR(50),
    started_at DATETIME DEFAULT GETDATE(),
    ended_at DATETIME,
    total_tokens INT DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

CREATE TABLE AIRecommendations (
    recommendation_id NVARCHAR(50) PRIMARY KEY,
    conversation_id NVARCHAR(50),
    target_type NVARCHAR(50),
    target_id NVARCHAR(50),
    recommendation_type NVARCHAR(50),
    recommendation_text NVARCHAR(MAX),
    confidence_score DECIMAL(5,2),
    reasoning NVARCHAR(MAX), -- JSON field
    implemented BIT DEFAULT 0,
    implemented_by NVARCHAR(50),
    implemented_at DATETIME,
    createdAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (conversation_id) REFERENCES MCPConversations(conversation_id)
);

CREATE TABLE LoanAnalysis (
    analysis_id NVARCHAR(50) PRIMARY KEY,
    loan_id NVARCHAR(50) NOT NULL,
    analysis_type NVARCHAR(50),
    risk_factors NVARCHAR(MAX), -- JSON
    approval_probability DECIMAL(5,2),
    recommended_interest_rate DECIMAL(5,2),
    recommended_terms NVARCHAR(MAX), -- JSON
    model_version NVARCHAR(50),
    analyzed_at DATETIME DEFAULT GETDATE(),
    expires_at DATETIME,
    FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
);

CREATE TABLE AuditLog (
    audit_id NVARCHAR(50) PRIMARY KEY,
    user_id NVARCHAR(50),
    action_type NVARCHAR(50),
    target_table NVARCHAR(50),
    target_id NVARCHAR(50),
    old_values NVARCHAR(MAX), -- JSON
    new_values NVARCHAR(MAX), -- JSON
    ai_involved BIT DEFAULT 0,
    confidence_score DECIMAL(5,2),
    reason NVARCHAR(MAX),
    timestamp DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);

-- Create performance indexes
CREATE INDEX IX_Loans_Status_Date ON Loans(status, start_date);
CREATE INDEX IX_Loans_BorrowerId ON Loans(borrower_id);
CREATE INDEX IX_Payments_LoanId_Date ON Payments(loan_id, payment_date DESC);
CREATE INDEX IX_Payments_Status ON Payments(status);
CREATE INDEX IX_Collateral_LoanId ON Collateral(loan_id);
CREATE INDEX IX_Equipment_BorrowerId ON Equipment(borrower_id);
CREATE INDEX IX_MCPConversations_User ON MCPConversations(user_id, started_at DESC);
CREATE INDEX IX_AIRecommendations_Target ON AIRecommendations(target_type, target_id);
CREATE INDEX IX_AuditLog_User_Time ON AuditLog(user_id, timestamp DESC);

PRINT 'Database schema created successfully!';
```

### Step 1.2: Create Enhanced Database Manager

**File: `utils/database.js`**

```javascript
const sql = require("mssql");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const config = {
  server: process.env.DB_SERVER || "(localdb)\\MSSQLLocalDB",
  database: process.env.DB_NAME || "LoanOfficerDB",
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    trustedConnection: process.env.DB_USER ? false : true,
    enableArithAbort: true,
    trustServerCertificate: true,
    encrypt: false,
    connectionTimeout: 15000,
    requestTimeout: 15000,
  },
};

// Add username/password if provided
if (process.env.DB_USER) {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
}

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnecting = false;
  }

  async connect() {
    if (this.pool && this.pool.connected) {
      return this.pool;
    }

    if (this.isConnecting) {
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return this.pool;
    }

    this.isConnecting = true;

    try {
      console.log("Connecting to database...");
      this.pool = await new sql.ConnectionPool(config).connect();

      this.pool.on("error", (err) => {
        console.error("Database pool error:", err);
        this.pool = null;
      });

      console.log("✅ Connected to SQL Server LocalDB");
      return this.pool;
    } catch (err) {
      console.error("❌ Database connection failed:", err.message);
      throw err;
    } finally {
      this.isConnecting = false;
    }
  }

  async executeQuery(query, inputs = {}) {
    try {
      const pool = await this.connect();
      const request = pool.request();

      // Add inputs to request with proper type handling
      Object.entries(inputs).forEach(([key, value]) => {
        if (
          typeof value === "object" &&
          value.type &&
          value.hasOwnProperty("value")
        ) {
          request.input(key, value.type, value.value);
        } else {
          request.input(key, value);
        }
      });

      const result = await request.query(query);
      return result;
    } catch (error) {
      console.error("Query execution failed:", error.message);
      console.error("Query:", query);
      console.error("Inputs:", inputs);
      throw error;
    }
  }

  async executeStoredProcedure(procedureName, inputs = {}) {
    try {
      const pool = await this.connect();
      const request = pool.request();

      Object.entries(inputs).forEach(([key, value]) => {
        if (
          typeof value === "object" &&
          value.type &&
          value.hasOwnProperty("value")
        ) {
          request.input(key, value.type, value.value);
        } else {
          request.input(key, value);
        }
      });

      return await request.execute(procedureName);
    } catch (error) {
      console.error("Stored procedure execution failed:", error.message);
      throw error;
    }
  }

  async transaction(callback) {
    const pool = await this.connect();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();
      const request = transaction.request();
      const result = await callback(request);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  generateId() {
    return uuidv4();
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log("🔌 Database connection closed");
    }
  }

  async testConnection() {
    try {
      const result = await this.executeQuery("SELECT 1 as test");
      console.log("✅ Database connection test passed");
      return true;
    } catch (error) {
      console.error("❌ Database connection test failed:", error.message);
      return false;
    }
  }
}

module.exports = new DatabaseManager();
```

---

## 📋 Phase 2: Enhanced Data Migration

### Step 2.1: Create JSON Data Migration Script

**File: `scripts/migrateJsonToDb.js`**

```javascript
const fs = require("fs");
const path = require("path");
const db = require("../utils/database");
const { v4: uuidv4 } = require("uuid");
const sql = require("mssql");

async function migrateJsonToDatabase() {
  try {
    console.log("🚀 Starting JSON to Database migration...");

    // Test database connection first
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error("Database connection failed");
    }

    // Migrate Users (if users.json exists)
    await migrateUsers();

    // Migrate Borrowers
    await migrateBorrowers();

    // Migrate Loans (if loans.json exists)
    await migrateLoans();

    // Migrate Collateral (if collateral.json exists)
    await migrateCollateral();

    // Migrate Payments (if payments.json exists)
    await migratePayments();

    // Migrate Equipment (if equipment.json exists)
    await migrateEquipment();

    console.log("✅ Migration completed successfully!");

    // Display summary
    await displayMigrationSummary();
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await db.disconnect();
  }
}

async function migrateUsers() {
  const filePath = path.join(__dirname, "../data/users.json");
  if (!fs.existsSync(filePath)) {
    console.log("⏭️  users.json not found, creating default admin user...");

    const defaultUser = {
      id: "admin-001",
      username: "admin",
      email: "admin@loanmanagement.com",
      passwordHash: "$2b$10$defaultHashForDemo",
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      tenantId: "default-tenant",
      active: true,
      lastLogin: new Date().toISOString(),
    };

    await insertUser(defaultUser);
    console.log("✅ Default admin user created");
    return;
  }

  const usersData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`📥 Migrating ${usersData.length} users...`);

  for (const user of usersData) {
    await insertUser(user);
  }

  console.log("✅ Users migrated successfully");
}

async function insertUser(user) {
  const query = `
    INSERT INTO Users (id, username, email, passwordHash, firstName, lastName, role, tenantId, active, lastLogin, preferredAIModel)
    VALUES (@id, @username, @email, @passwordHash, @firstName, @lastName, @role, @tenantId, @active, @lastLogin, @preferredAIModel)`;

  const inputs = {
    id: { type: sql.NVarChar(50), value: user.id || uuidv4() },
    username: { type: sql.NVarChar(50), value: user.username },
    email: { type: sql.NVarChar(100), value: user.email },
    passwordHash: { type: sql.NVarChar(100), value: user.passwordHash },
    firstName: { type: sql.NVarChar(50), value: user.firstName },
    lastName: { type: sql.NVarChar(50), value: user.lastName },
    role: { type: sql.NVarChar(50), value: user.role || "loan_officer" },
    tenantId: {
      type: sql.NVarChar(50),
      value: user.tenantId || "default-tenant",
    },
    active: { type: sql.Bit, value: user.active !== false },
    lastLogin: {
      type: sql.DateTime,
      value: user.lastLogin ? new Date(user.lastLogin) : new Date(),
    },
    preferredAIModel: {
      type: sql.NVarChar(50),
      value: user.preferredAIModel || "claude-sonnet-4",
    },
  };

  await db.executeQuery(query, inputs);
}

async function migrateBorrowers() {
  const filePath = path.join(__dirname, "../data/borrowers.json");
  if (!fs.existsSync(filePath)) {
    console.log("⏭️  borrowers.json not found, skipping borrower migration");
    return;
  }

  const borrowersData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`📥 Migrating ${borrowersData.length} borrowers...`);

  for (const borrower of borrowersData) {
    await insertBorrower(borrower);
  }

  console.log("✅ Borrowers migrated successfully");
}

async function insertBorrower(borrower) {
  const query = `
    INSERT INTO Borrowers (borrower_id, first_name, last_name, address, phone, email, credit_score, income, farm_size, farm_type, debt_to_income_ratio, risk_score, ai_risk_assessment, last_risk_update)
    VALUES (@borrowerId, @firstName, @lastName, @address, @phone, @email, @creditScore, @income, @farmSize, @farmType, @debtToIncomeRatio, @riskScore, @aiRiskAssessment, @lastRiskUpdate)`;

  const inputs = {
    borrowerId: {
      type: sql.NVarChar(50),
      value: borrower.borrower_id || `B${uuidv4().substring(0, 6)}`,
    },
    firstName: { type: sql.NVarChar(50), value: borrower.first_name },
    lastName: { type: sql.NVarChar(50), value: borrower.last_name },
    address: { type: sql.NVarChar(255), value: borrower.address },
    phone: { type: sql.NVarChar(20), value: borrower.phone },
    email: { type: sql.NVarChar(100), value: borrower.email },
    creditScore: { type: sql.Int, value: borrower.credit_score },
    income: { type: sql.Decimal(15, 2), value: borrower.income },
    farmSize: { type: sql.Decimal(10, 2), value: borrower.farm_size },
    farmType: { type: sql.NVarChar(50), value: borrower.farm_type },
    debtToIncomeRatio: {
      type: sql.Decimal(5, 2),
      value: borrower.debt_to_income_ratio || null,
    },
    riskScore: {
      type: sql.Decimal(5, 2),
      value: borrower.risk_score || calculateInitialRiskScore(borrower),
    },
    aiRiskAssessment: {
      type: sql.NVarChar(sql.MAX),
      value: JSON.stringify(borrower.ai_risk_assessment || {}),
    },
    lastRiskUpdate: {
      type: sql.DateTime,
      value: borrower.last_risk_update
        ? new Date(borrower.last_risk_update)
        : new Date(),
    },
  };

  await db.executeQuery(query, inputs);
}

async function migrateLoans() {
  const filePath = path.join(__dirname, "../data/loans.json");
  if (!fs.existsSync(filePath)) {
    console.log("⏭️  loans.json not found, skipping loan migration");
    return;
  }

  const loansData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`📥 Migrating ${loansData.length} loans...`);

  for (const loan of loansData) {
    await insertLoan(loan);
  }

  console.log("✅ Loans migrated successfully");
}

async function insertLoan(loan) {
  const query = `
    INSERT INTO Loans (loan_id, borrower_id, loan_amount, interest_rate, term_length, start_date, end_date, status, loan_type, payment_history_score, ai_approval_recommendation, ai_confidence_score)
    VALUES (@loanId, @borrowerId, @loanAmount, @interestRate, @termLength, @startDate, @endDate, @status, @loanType, @paymentHistoryScore, @aiApprovalRecommendation, @aiConfidenceScore)`;

  const inputs = {
    loanId: {
      type: sql.NVarChar(50),
      value: loan.loan_id || `L${uuidv4().substring(0, 6)}`,
    },
    borrowerId: { type: sql.NVarChar(50), value: loan.borrower_id },
    loanAmount: { type: sql.Decimal(15, 2), value: loan.loan_amount },
    interestRate: { type: sql.Decimal(5, 2), value: loan.interest_rate },
    termLength: { type: sql.Int, value: loan.term_length },
    startDate: { type: sql.Date, value: new Date(loan.start_date) },
    endDate: { type: sql.Date, value: new Date(loan.end_date) },
    status: { type: sql.NVarChar(20), value: loan.status || "pending" },
    loanType: { type: sql.NVarChar(50), value: loan.loan_type },
    paymentHistoryScore: {
      type: sql.Decimal(5, 2),
      value: loan.payment_history_score || null,
    },
    aiApprovalRecommendation: {
      type: sql.NVarChar(sql.MAX),
      value: JSON.stringify(loan.ai_approval_recommendation || {}),
    },
    aiConfidenceScore: {
      type: sql.Decimal(5, 2),
      value: loan.ai_confidence_score || null,
    },
  };

  await db.executeQuery(query, inputs);
}

async function migrateCollateral() {
  const filePath = path.join(__dirname, "../data/collateral.json");
  if (!fs.existsExists(filePath)) {
    console.log("⏭️  collateral.json not found, skipping collateral migration");
    return;
  }

  const collateralData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`📥 Migrating ${collateralData.length} collateral items...`);

  for (const collateral of collateralData) {
    await insertCollateral(collateral);
  }

  console.log("✅ Collateral migrated successfully");
}

async function insertCollateral(collateral) {
  const query = `
    INSERT INTO Collateral (collateral_id, loan_id, description, value, appraised_value, appraisal_date, current_condition, ai_valuation, ai_valuation_confidence)
    VALUES (@collateralId, @loanId, @description, @value, @appraisedValue, @appraisalDate, @currentCondition, @aiValuation, @aiValuationConfidence)`;

  const inputs = {
    collateralId: {
      type: sql.NVarChar(50),
      value: collateral.collateral_id || `C${uuidv4().substring(0, 6)}`,
    },
    loanId: { type: sql.NVarChar(50), value: collateral.loan_id },
    description: { type: sql.NVarChar(255), value: collateral.description },
    value: { type: sql.Decimal(15, 2), value: collateral.value },
    appraisedValue: {
      type: sql.Decimal(15, 2),
      value: collateral.appraised_value || collateral.value,
    },
    appraisalDate: {
      type: sql.Date,
      value: collateral.appraisal_date
        ? new Date(collateral.appraisal_date)
        : new Date(),
    },
    currentCondition: {
      type: sql.NVarChar(50),
      value: collateral.current_condition || "good",
    },
    aiValuation: {
      type: sql.Decimal(15, 2),
      value: collateral.ai_valuation || null,
    },
    aiValuationConfidence: {
      type: sql.Decimal(5, 2),
      value: collateral.ai_valuation_confidence || null,
    },
  };

  await db.executeQuery(query, inputs);
}

async function migratePayments() {
  const filePath = path.join(__dirname, "../data/payments.json");
  if (!fs.existsSync(filePath)) {
    console.log("⏭️  payments.json not found, skipping payment migration");
    return;
  }

  const paymentsData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`📥 Migrating ${paymentsData.length} payments...`);

  for (const payment of paymentsData) {
    await insertPayment(payment);
  }

  console.log("✅ Payments migrated successfully");
}

async function insertPayment(payment) {
  const query = `
    INSERT INTO Payments (payment_id, loan_id, payment_date, amount, status, payment_method, late_fee, days_late, ai_risk_flag)
    VALUES (@paymentId, @loanId, @paymentDate, @amount, @status, @paymentMethod, @lateFee, @daysLate, @aiRiskFlag)`;

  const inputs = {
    paymentId: {
      type: sql.NVarChar(50),
      value: payment.payment_id || `P${uuidv4().substring(0, 6)}`,
    },
    loanId: { type: sql.NVarChar(50), value: payment.loan_id },
    paymentDate: { type: sql.Date, value: new Date(payment.payment_date) },
    amount: { type: sql.Decimal(15, 2), value: payment.amount },
    status: { type: sql.NVarChar(20), value: payment.status || "pending" },
    paymentMethod: {
      type: sql.NVarChar(50),
      value: payment.payment_method || "check",
    },
    lateFee: { type: sql.Decimal(15, 2), value: payment.late_fee || 0 },
    daysLate: { type: sql.Int, value: payment.days_late || 0 },
    aiRiskFlag: { type: sql.Bit, value: payment.ai_risk_flag || false },
  };

  await db.executeQuery(query, inputs);
}

async function migrateEquipment() {
  const filePath = path.join(__dirname, "../data/equipment.json");
  if (!fs.existsSync(filePath)) {
    console.log("⏭️  equipment.json not found, skipping equipment migration");
    return;
  }

  const equipmentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
  console.log(`📥 Migrating ${equipmentData.length} equipment items...`);

  for (const equipment of equipmentData) {
    await insertEquipment(equipment);

    // Migrate maintenance records if they exist
    if (
      equipment.maintenance_records &&
      Array.isArray(equipment.maintenance_records)
    ) {
      for (const record of equipment.maintenance_records) {
        await insertMaintenanceRecord(equipment.equipment_id, record);
      }
    }
  }

  console.log("✅ Equipment migrated successfully");
}

async function insertEquipment(equipment) {
  const query = `
    INSERT INTO Equipment (equipment_id, borrower_id, type, purchase_date, condition, purchase_price, current_value, depreciation_rate)
    VALUES (@equipmentId, @borrowerId, @type, @purchaseDate, @condition, @purchasePrice, @currentValue, @depreciationRate)`;

  const inputs = {
    equipmentId: {
      type: sql.NVarChar(50),
      value: equipment.equipment_id || `E${uuidv4().substring(0, 6)}`,
    },
    borrowerId: { type: sql.NVarChar(50), value: equipment.borrower_id },
    type: { type: sql.NVarChar(50), value: equipment.type },
    purchaseDate: {
      type: sql.Date,
      value: equipment.purchase_date
        ? new Date(equipment.purchase_date)
        : new Date(),
    },
    condition: { type: sql.NVarChar(20), value: equipment.condition || "good" },
    purchasePrice: {
      type: sql.Decimal(15, 2),
      value: equipment.purchase_price || null,
    },
    currentValue: {
      type: sql.Decimal(15, 2),
      value: equipment.current_value || equipment.purchase_price || null,
    },
    depreciationRate: {
      type: sql.Decimal(5, 2),
      value: equipment.depreciation_rate || null,
    },
  };

  await db.executeQuery(query, inputs);
}

async function insertMaintenanceRecord(equipmentId, record) {
  const query = `
    INSERT INTO MaintenanceRecords (equipment_id, date, type, cost, description)
    VALUES (@equipmentId, @date, @type, @cost, @description)`;

  const inputs = {
    equipmentId: { type: sql.NVarChar(50), value: equipmentId },
    date: { type: sql.Date, value: new Date(record.date) },
    type: { type: sql.NVarChar(50), value: record.type },
    cost: { type: sql.Decimal(15, 2), value: record.cost || null },
    description: {
      type: sql.NVarChar(sql.MAX),
      value: record.description || "",
    },
  };

  await db.executeQuery(query, inputs);
}

function calculateInitialRiskScore(borrower) {
  let score = 50; // Base score

  if (borrower.credit_score) {
    if (borrower.credit_score >= 750) score -= 20;
    else if (borrower.credit_score >= 700) score -= 10;
    else if (borrower.credit_score < 600) score += 30;
  }

  if (borrower.income && borrower.income < 50000) score += 15;
  if (borrower.farm_size && borrower.farm_size < 50) score += 10;

  return Math.max(0, Math.min(100, score));
}

async function displayMigrationSummary() {
  console.log("\n📊 Migration Summary:");

  const tables = [
    "Users",
    "Borrowers",
    "Loans",
    "Collateral",
    "Payments",
    "Equipment",
    "MaintenanceRecords",
  ];

  for (const table of tables) {
    try {
      const result = await db.executeQuery(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      const count = result.recordset[0].count;
      console.log(`   ${table}: ${count} records`);
    } catch (error) {
      console.log(`   ${table}: Error getting count`);
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateJsonToDatabase().catch(console.error);
}

module.exports = { migrateJsonToDatabase };
```

---

## 📋 Phase 3: Repository and Service Layer

### Step 3.1: Create Repository Pattern

**File: `repositories/borrowerRepository.js`**

```javascript
const db = require("../utils/database");
const sql = require("mssql");

class BorrowerRepository {
  async findById(borrowerId) {
    const query = `
      SELECT b.*, 
             COUNT(l.loan_id) as loan_count,
             SUM(l.loan_amount) as total_loan_amount,
             AVG(l.interest_rate) as avg_interest_rate
      FROM Borrowers b
      LEFT JOIN Loans l ON b.borrower_id = l.borrower_id
      WHERE b.borrower_id = @borrowerId
      GROUP BY b.borrower_id, b.first_name, b.last_name, b.address, 
               b.phone, b.email, b.credit_score, b.income, 
               b.farm_size, b.farm_type, b.debt_to_income_ratio, 
               b.risk_score, b.ai_risk_assessment, b.last_risk_update, 
               b.createdAt, b.updatedAt`;

    const inputs = {
      borrowerId: { type: sql.NVarChar(50), value: borrowerId },
    };

    const result = await db.executeQuery(query, inputs);
    return result.recordset[0];
  }

  async findAll(limit = 50, offset = 0) {
    const query = `
      SELECT b.*, 
             COUNT(l.loan_id) as loan_count,
             SUM(l.loan_amount) as total_loan_amount
      FROM Borrowers b
      LEFT JOIN Loans l ON b.borrower_id = l.borrower_id
      GROUP BY b.borrower_id, b.first_name, b.last_name, b.address, 
               b.phone, b.email, b.credit_score, b.income, 
               b.farm_size, b.farm_type, b.debt_to_income_ratio, 
               b.risk_score, b.ai_risk_assessment, b.last_risk_update, 
               b.createdAt, b.updatedAt
      ORDER BY b.updatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY`;

    const inputs = {
      limit: { type: sql.Int, value: limit },
      offset: { type: sql.Int, value: offset },
    };

    const result = await db.executeQuery(query, inputs);
    return result.recordset;
  }

  async findByRiskLevel(riskLevel, limit = 10) {
    const riskRanges = {
      high: { min: 70, max: 100 },
      medium: { min: 40, max: 69 },
      low: { min: 0, max: 39 },
    };

    const range = riskRanges[riskLevel] || riskRanges["medium"];

    const query = `
      SELECT TOP (@limit) b.*, 
             COUNT(l.loan_id) as loan_count,
             SUM(CASE WHEN p.status = 'Late' THEN 1 ELSE 0 END) as late_payments
      FROM Borrowers b
      LEFT JOIN Loans l ON b.borrower_id = l.borrower_id
      LEFT JOIN Payments p ON l.loan_id = p.loan_id
      WHERE b.risk_score BETWEEN @minRisk AND @maxRisk
      GROUP BY b.borrower_id, b.first_name, b.last_name, b.risk_score,
               b.address, b.phone, b.email, b.credit_score, b.income, 
               b.farm_size, b.farm_type, b.debt_to_income_ratio, 
               b.ai_risk_assessment, b.last_risk_update, b.createdAt, b.updatedAt
      ORDER BY b.risk_score DESC`;

    const inputs = {
      limit: { type: sql.Int, value: limit },
      minRisk: { type: sql.Decimal(5, 2), value: range.min },
      maxRisk: { type: sql.Decimal(5, 2), value: range.max },
    };

    const result = await db.executeQuery(query, inputs);
    return result.recordset;
  }

  async updateRiskAssessment(borrowerId, riskScore, aiAssessment) {
    const query = `
      UPDATE Borrowers 
      SET risk_score = @riskScore,
          ai_risk_assessment = @aiAssessment,
          last_risk_update = GETDATE(),
          updatedAt = GETDATE()
      WHERE borrower_id = @borrowerId`;

    const inputs = {
      borrowerId: { type: sql.NVarChar(50), value: borrowerId },
      riskScore: { type: sql.Decimal(5, 2), value: riskScore },
      aiAssessment: {
        type: sql.NVarChar(sql.MAX),
        value: JSON.stringify(aiAssessment),
      },
    };

    const result = await db.executeQuery(query, inputs);
    return result.rowsAffected[0] > 0;
  }

  async create(borrowerData) {
    const borrowerId =
      borrowerData.borrower_id || `B${db.generateId().substring(0, 6)}`;

    const query = `
      INSERT INTO Borrowers (borrower_id, first_name, last_name, address, phone, email, credit_score, income, farm_size, farm_type, debt_to_income_ratio, risk_score, ai_risk_assessment, last_risk_update)
      VALUES (@borrowerId, @firstName, @lastName, @address, @phone, @email, @creditScore, @income, @farmSize, @farmType, @debtToIncomeRatio, @riskScore, @aiRiskAssessment, @lastRiskUpdate)`;

    const inputs = {
      borrowerId: { type: sql.NVarChar(50), value: borrowerId },
      firstName: { type: sql.NVarChar(50), value: borrowerData.first_name },
      lastName: { type: sql.NVarChar(50), value: borrowerData.last_name },
      address: { type: sql.NVarChar(255), value: borrowerData.address },
      phone: { type: sql.NVarChar(20), value: borrowerData.phone },
      email: { type: sql.NVarChar(100), value: borrowerData.email },
      creditScore: { type: sql.Int, value: borrowerData.credit_score },
      income: { type: sql.Decimal(15, 2), value: borrowerData.income },
      farmSize: { type: sql.Decimal(10, 2), value: borrowerData.farm_size },
      farmType: { type: sql.NVarChar(50), value: borrowerData.farm_type },
      debtToIncomeRatio: {
        type: sql.Decimal(5, 2),
        value: borrowerData.debt_to_income_ratio || null,
      },
      riskScore: {
        type: sql.Decimal(5, 2),
        value: borrowerData.risk_score || null,
      },
      aiRiskAssessment: {
        type: sql.NVarChar(sql.MAX),
        value: JSON.stringify(borrowerData.ai_risk_assessment || {}),
      },
      lastRiskUpdate: {
        type: sql.DateTime,
        value: borrowerData.last_risk_update || new Date(),
      },
    };

    await db.executeQuery(query, inputs);
    return this.findById(borrowerId);
  }
}

module.exports = new BorrowerRepository();
```

### Step 3.2: Create Loan Repository

**File: `repositories/loanRepository.js`**

```javascript
const db = require("../utils/database");
const sql = require("mssql");

class LoanRepository {
  async findById(loanId) {
    const query = `
      SELECT l.*, b.first_name, b.last_name, b.credit_score,
             COUNT(p.payment_id) as payment_count,
             SUM(CASE WHEN p.status = 'Late' THEN 1 ELSE 0 END) as late_payment_count,
             MAX(p.payment_date) as last_payment_date
      FROM Loans l
      LEFT JOIN Borrowers b ON l.borrower_id = b.borrower_id
      LEFT JOIN Payments p ON l.loan_id = p.loan_id
      WHERE l.loan_id = @loanId
      GROUP BY l.loan_id, l.borrower_id, l.loan_amount, l.interest_rate, 
               l.term_length, l.start_date, l.end_date, l.status, l.loan_type,
               l.payment_history_score, l.ai_approval_recommendation, 
               l.ai_confidence_score, l.createdAt, l.updatedAt,
               b.first_name, b.last_name, b.credit_score`;

    const inputs = {
      loanId: { type: sql.NVarChar(50), value: loanId },
    };

    const result = await db.executeQuery(query, inputs);
    return result.recordset[0];
  }

  async findByBorrowerId(borrowerId) {
    const query = `
      SELECT l.*,
             COUNT(p.payment_id) as payment_count,
             SUM(CASE WHEN p.status = 'Late' THEN 1 ELSE 0 END) as late_payment_count
      FROM Loans l
      LEFT JOIN Payments p ON l.loan_id = p.loan_id
      WHERE l.borrower_id = @borrowerId
      GROUP BY l.loan_id, l.borrower_id, l.loan_amount, l.interest_rate, 
               l.term_length, l.start_date, l.end_date, l.status, l.loan_type,
               l.payment_history_score, l.ai_approval_recommendation, 
               l.ai_confidence_score, l.createdAt, l.updatedAt
      ORDER BY l.start_date DESC`;

    const inputs = {
      borrowerId: { type: sql.NVarChar(50), value: borrowerId },
    };

    const result = await db.executeQuery(query, inputs);
    return result.recordset;
  }

  async findByStatus(status, limit = 50) {
    const query = `
      SELECT TOP (@limit) l.*, b.first_name, b.last_name,
             COUNT(p.payment_id) as payment_count,
             SUM(CASE WHEN p.status = 'Late' THEN 1 ELSE 0 END) as late_payment_count
      FROM Loans l
      LEFT JOIN Borrowers b ON l.borrower_id = b.borrower_id
      LEFT JOIN Payments p ON l.loan_id = p.loan_id
      WHERE l.status = @status
      GROUP BY l.loan_id, l.borrower_id, l.loan_amount, l.interest_rate, 
               l.term_length, l.start_date, l.end_date, l.status, l.loan_type,
               l.payment_history_score, l.ai_approval_recommendation, 
               l.ai_confidence_score, l.createdAt, l.updatedAt,
               b.first_name, b.last_name
      ORDER BY l.updatedAt DESC`;

    const inputs = {
      status: { type: sql.NVarChar(20), value: status },
      limit: { type: sql.Int, value: limit },
    };

    const result = await db.executeQuery(query, inputs);
    return result.recordset;
  }

  async getCollateralForLoan(loanId) {
    const query = `
      SELECT * FROM Collateral 
      WHERE loan_id = @loanId
      ORDER BY createdAt`;

    const inputs = {
      loanId: { type: sql.NVarChar(50), value: loanId },
    };

    const result = await db.executeQuery(query, inputs);
    return result.recordset;
  }

  async getPaymentsForLoan(loanId) {
    const query = `
      SELECT * FROM Payments 
      WHERE loan_id = @loanId
      ORDER BY payment_date DESC`;

    const inputs = {
      loanId: { type: sql.NVarChar(50), value: loanId },
    };

    const result = await db.executeQuery(query, inputs);
    return result.recordset;
  }
}

module.exports = new LoanRepository();
```

### Step 3.3: Create MCP Database Service

**File: `services/mcpDatabaseService.js`**

```javascript
const db = require("../utils/database");
const sql = require("mssql");
const BorrowerRepository = require("../repositories/borrowerRepository");
const LoanRepository = require("../repositories/loanRepository");

class MCPDatabaseService {
  // MCP Conversation Management
  async startConversation(
    userId,
    contextType,
    contextId,
    modelUsed = "claude-sonnet-4"
  ) {
    const conversationId = db.generateId();
    const sessionId = db.generateId();

    const query = `
      INSERT INTO MCPConversations (conversation_id, user_id, session_id, context_type, context_id, model_used)
      VALUES (@conversationId, @userId, @sessionId, @contextType, @contextId, @modelUsed)`;

    const inputs = {
      conversationId: { type: sql.NVarChar(50), value: conversationId },
      userId: { type: sql.NVarChar(50), value: userId },
      sessionId: { type: sql.NVarChar(100), value: sessionId },
      contextType: { type: sql.NVarChar(50), value: contextType },
      contextId: { type: sql.NVarChar(50), value: contextId },
      modelUsed: { type: sql.NVarChar(50), value: modelUsed },
    };

    await db.executeQuery(query, inputs);
    return { conversationId, sessionId };
  }

  async logAIRecommendation(
    conversationId,
    targetType,
    targetId,
    recommendationType,
    recommendationText,
    confidenceScore,
    reasoning
  ) {
    const recommendationId = db.generateId();

    const query = `
      INSERT INTO AIRecommendations 
      (recommendation_id, conversation_id, target_type, target_id, recommendation_type, 
       recommendation_text, confidence_score, reasoning)
      VALUES (@recommendationId, @conversationId, @targetType, @targetId, 
              @recommendationType, @recommendationText, @confidenceScore, @reasoning)`;

    const inputs = {
      recommendationId: { type: sql.NVarChar(50), value: recommendationId },
      conversationId: { type: sql.NVarChar(50), value: conversationId },
      targetType: { type: sql.NVarChar(50), value: targetType },
      targetId: { type: sql.NVarChar(50), value: targetId },
      recommendationType: { type: sql.NVarChar(50), value: recommendationType },
      recommendationText: {
        type: sql.NVarChar(sql.MAX),
        value: recommendationText,
      },
      confidenceScore: { type: sql.Decimal(5, 2), value: confidenceScore },
      reasoning: {
        type: sql.NVarChar(sql.MAX),
        value: JSON.stringify(reasoning),
      },
    };

    await db.executeQuery(query, inputs);
    return recommendationId;
  }

  // Core MCP Functions
  async getBorrowerDetails(borrowerId) {
    const borrower = await BorrowerRepository.findById(borrowerId);
    if (!borrower) {
      throw new Error(`Borrower ${borrowerId} not found`);
    }
    return borrower;
  }

  async getBorrowerDefaultRisk(borrowerId) {
    const borrower = await this.getBorrowerDetails(borrowerId);
    const loans = await LoanRepository.findByBorrowerId(borrowerId);

    // Calculate comprehensive risk score
    let riskScore = 50; // Base score
    const riskFactors = [];

    // Credit score analysis
    if (borrower.credit_score) {
      if (borrower.credit_score >= 750) {
        riskScore -= 15;
        riskFactors.push("Excellent credit score");
      } else if (borrower.credit_score >= 700) {
        riskScore -= 10;
        riskFactors.push("Good credit score");
      } else if (borrower.credit_score < 600) {
        riskScore += 20;
        riskFactors.push(`Poor credit score: ${borrower.credit_score}`);
      }
    }

    // Loan portfolio analysis
    const totalLoanAmount = loans.reduce(
      (sum, loan) => sum + loan.loan_amount,
      0
    );
    if (borrower.income > 0) {
      const loanToIncomeRatio = totalLoanAmount / borrower.income;
      if (loanToIncomeRatio > 5) {
        riskScore += 25;
        riskFactors.push(
          `Very high loan-to-income ratio: ${loanToIncomeRatio.toFixed(1)}`
        );
      } else if (loanToIncomeRatio > 3) {
        riskScore += 15;
        riskFactors.push(
          `High loan-to-income ratio: ${loanToIncomeRatio.toFixed(1)}`
        );
      }
    }

    // Farm-specific factors
    if (borrower.farm_size && borrower.farm_size < 50) {
      riskScore += 10;
      riskFactors.push("Small farm operation - higher volatility risk");
    }

    riskScore = Math.max(0, Math.min(100, riskScore));

    return {
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      risk_score: riskScore,
      risk_level: riskScore > 70 ? "high" : riskScore > 40 ? "medium" : "low",
      risk_factors: riskFactors,
      total_loan_amount: totalLoanAmount,
      loan_count: loans.length,
    };
  }

  async evaluateCollateralSufficiency(loanId, marketConditions = "stable") {
    const loan = await LoanRepository.findById(loanId);
    if (!loan) {
      throw new Error(`Loan ${loanId} not found`);
    }

    const collateral = await LoanRepository.getCollateralForLoan(loanId);

    if (collateral.length === 0) {
      return {
        loan_id: loanId,
        is_sufficient: false,
        current_loan_balance: loan.loan_amount,
        collateral_value: 0,
        loan_to_value_ratio: Infinity,
        assessment: "No collateral found for this loan.",
      };
    }

    // Calculate collateral value with market adjustments
    let collateralValue = collateral.reduce(
      (sum, c) => sum + (c.appraised_value || c.value),
      0
    );
    const marketAdjustment =
      marketConditions === "declining"
        ? 0.8
        : marketConditions === "improving"
        ? 1.1
        : 1.0;

    const adjustedCollateralValue = collateralValue * marketAdjustment;
    const loanToValueRatio = loan.loan_amount / adjustedCollateralValue;
    const isSufficient = loanToValueRatio <= 0.8;

    let assessment = "";
    if (loanToValueRatio < 0.5) assessment = "Collateral is highly sufficient.";
    else if (loanToValueRatio < 0.7) assessment = "Collateral is adequate.";
    else if (loanToValueRatio <= 0.8)
      assessment = "Collateral is minimally sufficient.";
    else if (loanToValueRatio < 1.0)
      assessment = "Collateral below recommended levels.";
    else assessment = "Insufficient collateral.";

    return {
      loan_id: loanId,
      loan_type: loan.loan_type,
      is_sufficient: isSufficient,
      industry_standard_threshold: 0.8,
      current_loan_balance: loan.loan_amount,
      collateral_value: adjustedCollateralValue,
      loan_to_value_ratio: Number(loanToValueRatio.toFixed(2)),
      market_conditions: marketConditions,
      market_adjustment_factor: marketAdjustment,
      collateral_items: collateral.length,
      collateral_details: collateral.map((c) => ({
        id: c.collateral_id,
        description: c.description,
        value: c.appraised_value || c.value,
        condition: c.current_condition,
      })),
      assessment: assessment,
    };
  }

  async logAudit(
    userId,
    actionType,
    targetTable,
    targetId,
    oldValues,
    newValues,
    aiInvolved = false,
    confidenceScore = null,
    reason = ""
  ) {
    const auditId = db.generateId();

    const query = `
      INSERT INTO AuditLog 
      (audit_id, user_id, action_type, target_table, target_id, old_values, 
       new_values, ai_involved, confidence_score, reason)
      VALUES (@auditId, @userId, @actionType, @targetTable, @targetId, 
              @oldValues, @newValues, @aiInvolved, @confidenceScore, @reason)`;

    const inputs = {
      auditId: { type: sql.NVarChar(50), value: auditId },
      userId: { type: sql.NVarChar(50), value: userId },
      actionType: { type: sql.NVarChar(50), value: actionType },
      targetTable: { type: sql.NVarChar(50), value: targetTable },
      targetId: { type: sql.NVarChar(50), value: targetId },
      oldValues: {
        type: sql.NVarChar(sql.MAX),
        value: JSON.stringify(oldValues),
      },
      newValues: {
        type: sql.NVarChar(sql.MAX),
        value: JSON.stringify(newValues),
      },
      aiInvolved: { type: sql.Bit, value: aiInvolved },
      confidenceScore: { type: sql.Decimal(5, 2), value: confidenceScore },
      reason: { type: sql.NVarChar(sql.MAX), value: reason },
    };

    await db.executeQuery(query, inputs);
    return auditId;
  }
}

module.exports = new MCPDatabaseService();
```

---

## 📋 Phase 4: Enhanced MCP Server Implementation

### Step 4.1: Create Enhanced MCP Server

**File: `server.js`**

```javascript
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");
const LogService = require("../services/logService");
const MCPDatabaseService = require("../services/mcpDatabaseService");

class LoanOfficerMCPServer {
  constructor() {
    this.server = new McpServer({
      name: "LoanOfficerAI-MCP",
      version: "2.0.0",
      description:
        "Enhanced MCP server for agricultural lending system with database integration",
    });

    this.setupTools();
    this.transports = new Map();

    // Enable graceful shutdown
    process.on("SIGTERM", () => this.stop());
    process.on("SIGINT", () => this.stop());
  }

  setupTools() {
    // Enhanced risk assessment tool
    this.server.tool(
      "getBorrowerNonAccrualRisk",
      {
        borrowerId: z.string().describe("The ID of the borrower (e.g., B001)"),
        includeRecommendations: z.boolean().optional().default(true),
        userId: z.string().optional().describe("User ID for audit logging"),
      },
      async ({ borrowerId, includeRecommendations = true, userId }) => {
        try {
          LogService.mcp(
            `Evaluating non-accrual risk for borrower ${borrowerId}`
          );

          // Start MCP conversation tracking
          const conversation = userId
            ? await MCPDatabaseService.startConversation(
                userId,
                "risk_assessment",
                borrowerId
              )
            : { conversationId: null };

          const riskAssessment =
            await MCPDatabaseService.getBorrowerDefaultRisk(
              borrowerId.toUpperCase().trim()
            );

          // Log the AI recommendation
          if (conversation.conversationId) {
            await MCPDatabaseService.logAIRecommendation(
              conversation.conversationId,
              "borrower",
              borrowerId,
              "risk_assessment",
              `Risk level: ${riskAssessment.risk_level}`,
              0.85, // Confidence score
              riskAssessment
            );
          }

          const response = {
            borrower_id: riskAssessment.borrower_id,
            borrower_name: riskAssessment.borrower_name,
            non_accrual_risk: riskAssessment.risk_level,
            risk_score: riskAssessment.risk_score,
            risk_factors: riskAssessment.risk_factors,
            total_loan_amount: riskAssessment.total_loan_amount,
            loan_count: riskAssessment.loan_count,
            calculated_at: new Date().toISOString(),
          };

          if (includeRecommendations) {
            response.recommendations = this.generateRiskRecommendations(
              riskAssessment.risk_level,
              riskAssessment.risk_score
            );
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } catch (error) {
          LogService.error(
            `Error in getBorrowerNonAccrualRisk: ${error.message}`,
            {
              borrowerId,
              stack: error.stack,
            }
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: "Failed to assess non-accrual risk",
                  details: error.message,
                  borrower_id: borrowerId,
                }),
              },
            ],
          };
        }
      }
    );

    // Enhanced collateral evaluation tool
    this.server.tool(
      "evaluateCollateralSufficiency",
      {
        loanId: z.string().describe("The ID of the loan"),
        marketConditions: z
          .enum(["stable", "declining", "improving"])
          .optional()
          .default("stable"),
        userId: z.string().optional(),
      },
      async ({ loanId, marketConditions = "stable", userId }) => {
        try {
          LogService.mcp(
            `Evaluating collateral for loan ${loanId} with market conditions: ${marketConditions}`
          );

          const conversation = userId
            ? await MCPDatabaseService.startConversation(
                userId,
                "collateral_analysis",
                loanId
              )
            : { conversationId: null };

          const collateralAnalysis =
            await MCPDatabaseService.evaluateCollateralSufficiency(
              loanId.toUpperCase().trim(),
              marketConditions
            );

          // Log the AI recommendation
          if (conversation.conversationId) {
            await MCPDatabaseService.logAIRecommendation(
              conversation.conversationId,
              "loan",
              loanId,
              "collateral_assessment",
              collateralAnalysis.assessment,
              0.9, // High confidence for collateral calculations
              collateralAnalysis
            );
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(collateralAnalysis, null, 2),
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
                  loan_id: loanId,
                }),
              },
            ],
          };
        }
      }
    );

    // Default risk assessment tool
    this.server.tool(
      "getBorrowerDefaultRisk",
      {
        borrowerId: z.string().describe("The ID of the borrower"),
        timeHorizon: z
          .enum(["short_term", "medium_term", "long_term"])
          .optional()
          .default("medium_term"),
        userId: z.string().optional(),
      },
      async ({ borrowerId, timeHorizon = "medium_term", userId }) => {
        try {
          LogService.mcp(
            `Assessing default risk for borrower ${borrowerId} with time horizon: ${timeHorizon}`
          );

          const defaultRisk = await MCPDatabaseService.getBorrowerDefaultRisk(
            borrowerId.toUpperCase().trim()
          );

          // Add time horizon considerations
          defaultRisk.time_horizon = timeHorizon;
          defaultRisk.recommendations = this.generateDefaultRiskRecommendations(
            defaultRisk.risk_level,
            timeHorizon
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(defaultRisk, null, 2),
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
                  borrower_id: borrowerId,
                }),
              },
            ],
          };
        }
      }
    );

    LogService.info("Enhanced MCP server tools configured");
  }

  generateRiskRecommendations(riskLevel, riskScore) {
    const recommendations = [];

    if (riskLevel === "high") {
      recommendations.push("Implement enhanced monitoring procedures");
      recommendations.push("Consider requiring additional collateral");
      recommendations.push("Schedule immediate borrower meeting");
      if (riskScore > 80) {
        recommendations.push("Consider loan restructuring options");
        recommendations.push("Evaluate early intervention strategies");
      }
    } else if (riskLevel === "medium") {
      recommendations.push("Schedule quarterly review meetings");
      recommendations.push("Monitor seasonal payment patterns");
      recommendations.push("Discuss risk mitigation strategies with borrower");
    } else {
      recommendations.push("Continue standard monitoring procedures");
      recommendations.push("Annual risk assessment sufficient");
    }

    return recommendations;
  }

  generateDefaultRiskRecommendations(riskLevel, timeHorizon) {
    const recommendations = [];

    const timeMultiplier =
      timeHorizon === "short_term"
        ? 0.8
        : timeHorizon === "long_term"
        ? 1.2
        : 1.0;

    if (riskLevel === "high") {
      recommendations.push(
        `Increase monitoring frequency for ${timeHorizon} assessment`
      );
      recommendations.push("Consider portfolio diversification strategies");
      if (timeHorizon === "long_term") {
        recommendations.push(
          "Evaluate long-term sustainability of farm operations"
        );
      }
    } else if (riskLevel === "medium") {
      recommendations.push(`Standard ${timeHorizon} monitoring protocols`);
      recommendations.push("Track market condition impacts");
    } else {
      recommendations.push(
        `Low-risk classification for ${timeHorizon} horizon`
      );
      recommendations.push("Standard review procedures adequate");
    }

    return recommendations;
  }

  // Enhanced request handling with better session management
  async handleMCPRequest(req, res, isInitializeRequest = false) {
    const sessionId = req.headers["mcp-session-id"];
    const startTime = Date.now();

    try {
      let transport = this.getOrCreateTransport(sessionId, isInitializeRequest);

      if (!transport) {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },
          id: null,
        });
      }

      await transport.handleRequest(req, res, req.body);

      // Log performance metrics
      const duration = Date.now() - startTime;
      LogService.mcp(`MCP request completed in ${duration}ms`, {
        sessionId: transport.sessionId,
        method: req.body?.method,
        duration,
      });
    } catch (error) {
      LogService.error(`MCP request failed: ${error.message}`, {
        sessionId,
        method: req.body?.method,
        stack: error.stack,
      });

      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal error" },
        id: req.body?.id || null,
      });
    }
  }

  async handleSessionRequest(req, res) {
    const sessionId = req.headers["mcp-session-id"];
    if (!sessionId || !this.transports.has(sessionId)) {
      res.status(400).send("Invalid or missing session ID");
      return;
    }

    const transport = this.transports.get(sessionId);
    await transport.handleRequest(req, res);
  }

  getOrCreateTransport(sessionId, isInitializeRequest) {
    if (sessionId && this.transports.has(sessionId)) {
      return this.transports.get(sessionId);
    }

    if (!sessionId && isInitializeRequest) {
      const crypto = require("crypto");
      const newSessionId = crypto.randomUUID();

      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (sessionId) => {
          this.transports.set(sessionId, transport);
          LogService.info(`MCP session initialized: ${sessionId}`);
        },
      });

      transport.onclose = () => {
        if (transport.sessionId) {
          this.transports.delete(transport.sessionId);
          LogService.info(`MCP session closed: ${transport.sessionId}`);
        }
      };

      this.server.connect(transport);
      return transport;
    }

    return null;
  }

  async stop() {
    LogService.info("Stopping MCP server...");

    // Close all transports gracefully
    const closePromises = Array.from(this.transports.values()).map(
      (transport) =>
        new Promise((resolve) => {
          transport.onclose = resolve;
          transport.close();
        })
    );

    await Promise.all(closePromises);
    this.transports.clear();

    LogService.info("MCP server stopped");
  }
}

module.exports = LoanOfficerMCPServer;
```

### Step 4.2: Create Server Configuration

**File: `mcpServer.js`**

```javascript
const LoanOfficerMCPServer = require("./server");
const LogService = require("../services/logService");
const DatabaseManager = require("../utils/database");

let mcpServer = null;

async function configureMCP(app) {
  try {
    // Ensure database connection first
    LogService.info("Initializing database connection...");
    const isConnected = await DatabaseManager.testConnection();

    if (!isConnected) {
      throw new Error(
        "Database connection failed during MCP server initialization"
      );
    }

    // Initialize MCP server
    mcpServer = new LoanOfficerMCPServer();

    // Add MCP routes with enhanced error handling
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

    // Health check endpoint
    app.get("/mcp/health", async (req, res) => {
      try {
        const dbHealth = await DatabaseManager.testConnection();
        res.json({
          status: "healthy",
          database: dbHealth ? "connected" : "disconnected",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        res.status(500).json({
          status: "unhealthy",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    LogService.info("MCP server configured at /mcp endpoint");

    // Handle graceful shutdown
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
    await mcpServer.stop();
    await DatabaseManager.disconnect();
    LogService.info("Database connection closed");
    mcpServer = null;
  }
}

module.exports = {
  configureMCP,
  stopMCPServer,
};
```

---

## 📋 Phase 5: Testing and Deployment

### Step 5.1: Create Integration Tests

**File: `tests/integration/mcpServer.test.js`**

```javascript
const request = require("supertest");
const express = require("express");
const { configureMCP } = require("../../mcpServer");
const DatabaseManager = require("../../utils/database");

describe("MCP Server Integration Tests", () => {
  let app;
  let server;

  beforeAll(async () => {
    // Create test app
    app = express();
    app.use(express.json());

    // Configure MCP
    await configureMCP(app);

    // Start server
    server = app.listen(0); // Use random port
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await DatabaseManager.disconnect();
  });

  describe("MCP Initialization", () => {
    it("should initialize MCP session successfully", async () => {
      const response = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "initialize",
          params: {
            protocol_version: "0.1",
            client_info: { name: "test-client" },
          },
          id: 1,
        });

      expect(response.status).toBe(200);
      expect(response.headers["mcp-session-id"]).toBeDefined();
    });
  });

  describe("Risk Assessment Tools", () => {
    let sessionId;

    beforeEach(async () => {
      const initResponse = await request(app)
        .post("/mcp")
        .send({
          jsonrpc: "2.0",
          method: "initialize",
          params: { protocol_version: "0.1" },
          id: 1,
        });

      sessionId = initResponse.headers["mcp-session-id"];
    });

    it("should assess borrower non-accrual risk", async () => {
      const response = await request(app)
        .post("/mcp")
        .set("mcp-session-id", sessionId)
        .send({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "getBorrowerNonAccrualRisk",
            arguments: { borrowerId: "B001" },
          },
          id: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.result).toBeDefined();

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.borrower_id).toBe("B001");
      expect(result.risk_score).toBeDefined();
      expect(result.non_accrual_risk).toMatch(/^(low|medium|high)$/);
    });

    it("should evaluate collateral sufficiency", async () => {
      const response = await request(app)
        .post("/mcp")
        .set("mcp-session-id", sessionId)
        .send({
          jsonrpc: "2.0",
          method: "tools/call",
          params: {
            name: "evaluateCollateralSufficiency",
            arguments: {
              loanId: "L001",
              marketConditions: "stable",
            },
          },
          id: 3,
        });

      expect(response.status).toBe(200);

      const result = JSON.parse(response.body.result.content[0].text);
      expect(result.loan_id).toBe("L001");
      expect(result.is_sufficient).toBeDefined();
      expect(result.loan_to_value_ratio).toBeDefined();
    });
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/mcp/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("healthy");
      expect(response.body.database).toBe("connected");
    });
  });
});
```

### Step 5.2: Create Deployment Scripts

**File: `scripts/deploy.js`**

```javascript
const DatabaseManager = require("../utils/database");
const { migrateJsonToDatabase } = require("./migrateJsonToDb");
const LogService = require("../services/logService");

async function deploySystem() {
  try {
    console.log("🚀 Starting MCP Loan Management System deployment...");

    // Step 1: Test database connection
    console.log("📡 Testing database connection...");
    const isConnected = await DatabaseManager.testConnection();

    if (!isConnected) {
      throw new Error("Database connection failed");
    }

    // Step 2: Check if data migration is needed
    console.log("📊 Checking data migration status...");
    const borrowerCount = await DatabaseManager.executeQuery(
      "SELECT COUNT(*) as count FROM Borrowers"
    );

    if (borrowerCount.recordset[0].count === 0) {
      console.log("📦 Running data migration...");
      await migrateJsonToDatabase();
    } else {
      console.log("✅ Data already migrated, skipping migration step");
    }

    // Step 3: Verify system health
    console.log("🔍 Verifying system health...");
    await verifySystemHealth();

    console.log("✅ Deployment completed successfully!");
    console.log("\n🎯 Next steps:");
    console.log("   1. Start the server: npm start");
    console.log("   2. Test MCP endpoints: http://localhost:3000/mcp/health");
    console.log("   3. Check logs for any issues");
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  } finally {
    await DatabaseManager.disconnect();
  }
}

async function verifySystemHealth() {
  // Test key database queries
  const tests = [
    {
      name: "Borrowers table",
      query: "SELECT COUNT(*) as count FROM Borrowers",
    },
    { name: "Loans table", query: "SELECT COUNT(*) as count FROM Loans" },
    { name: "Users table", query: "SELECT COUNT(*) as count FROM Users" },
    {
      name: "MCP tables",
      query: "SELECT COUNT(*) as count FROM MCPConversations",
    },
  ];

  for (const test of tests) {
    try {
      const result = await DatabaseManager.executeQuery(test.query);
      console.log(`   ✅ ${test.name}: ${result.recordset[0].count} records`);
    } catch (error) {
      console.log(`   ❌ ${test.name}: Error - ${error.message}`);
      throw error;
    }
  }
}

// Run deployment if called directly
if (require.main === module) {
  deploySystem().catch(console.error);
}

module.exports = { deploySystem, verifySystemHealth };
```

### Step 5.3: Create Main Server File

**File: `app.js`**

```javascript
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { configureMCP } = require("./mcpServer");
const LogService = require("./services/logService");
const DatabaseManager = require("./utils/database");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  LogService.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
  next();
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbHealth = await DatabaseManager.testConnection();
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbHealth ? "connected" : "disconnected",
      version: "2.0.0",
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Basic API routes
app.get("/api/borrowers", async (req, res) => {
  try {
    const result = await DatabaseManager.executeQuery(`
      SELECT TOP 10 borrower_id, first_name, last_name, credit_score, risk_score 
      FROM Borrowers 
      ORDER BY updatedAt DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    LogService.error("Error fetching borrowers:", error);
    res.status(500).json({ error: "Failed to fetch borrowers" });
  }
});

app.get("/api/loans", async (req, res) => {
  try {
    const result = await DatabaseManager.executeQuery(`
      SELECT TOP 10 l.loan_id, l.loan_amount, l.status, b.first_name, b.last_name
      FROM Loans l
      LEFT JOIN Borrowers b ON l.borrower_id = b.borrower_id
      ORDER BY l.updatedAt DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    LogService.error("Error fetching loans:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

// Initialize MCP server
async function startServer() {
  try {
    LogService.info("🚀 Starting MCP Loan Management System...");

    // Test database connection
    const dbConnected = await DatabaseManager.testConnection();
    if (!dbConnected) {
      throw new Error("Database connection failed");
    }

    // Configure MCP server
    await configureMCP(app);

    // Start HTTP server
    const server = app.listen(PORT, () => {
      LogService.info(`🌟 Server running on port ${PORT}`);
      LogService.info(`📊 Health check: http://localhost:${PORT}/health`);
      LogService.info(`🤖 MCP endpoint: http://localhost:${PORT}/mcp`);
      LogService.info(`📈 API endpoints: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      LogService.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        LogService.info("HTTP server closed");
        await DatabaseManager.disconnect();
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    LogService.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Error handling middleware
app.use((error, req, res, next) => {
  LogService.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = app;
```

### Step 5.4: Create Log Service

**File: `services/logService.js`**

```javascript
class LogService {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || "info";
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr =
      Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  info(message, meta = {}) {
    console.log(this.formatMessage("info", message, meta));
  }

  error(message, meta = {}) {
    console.error(this.formatMessage("error", message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage("warn", message, meta));
  }

  debug(message, meta = {}) {
    if (this.logLevel === "debug") {
      console.log(this.formatMessage("debug", message, meta));
    }
  }

  mcp(message, meta = {}) {
    this.info(`[MCP] ${message}`, meta);
  }
}

module.exports = new LogService();
```

---

## 🚀 Final Cursor Execution Commands

### Execute these commands in sequence:

```bash
# 1. Create all directories and install dependencies
mkdir -p database scripts utils services repositories tests/integration data
npm install mssql uuid zod express dotenv cors
npm install --save-dev jest supertest nodemon

# 2. Set up environment
echo "DB_SERVER=(localdb)\\MSSQLLocalDB
DB_NAME=LoanOfficerDB
USE_DATABASE=true
NODE_ENV=development
PORT=3000
LOG_LEVEL=info" > .env

# 3. Update package.json
npm pkg set scripts.start="node app.js"
npm pkg set scripts.dev="nodemon app.js"
npm pkg set scripts.test="jest"
npm pkg set scripts.migrate="node scripts/migrateJsonToDb.js"
npm pkg set scripts.deploy="node scripts/deploy.js"
npm pkg set scripts.db:setup="sqlcmd -S (localdb)\\MSSQLLocalDB -i database/createSchema.sql"

# 4. Create database schema (run this in SQL Management Studio or Azure Data Studio)
# Execute the SQL from database/createSchema.sql

# 5. Run migration and deployment
npm run migrate
npm run deploy

# 6. Test the system
npm test

# 7. Start the server
npm start
```

### Verification Steps:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test MCP health
curl http://localhost:3000/mcp/health

# Test basic API
curl http://localhost:3000/api/borrowers

# Test MCP initialization
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocol_version":"0.1"},"id":1}'
```

## 📋 Summary

This complete implementation provides:

✅ **Enhanced Database Schema** - Full MCP integration with AI tracking  
✅ **Robust Data Migration** - Handles JSON to SQL conversion safely  
✅ **Repository Pattern** - Clean data access layer  
✅ **MCP Database Service** - Core business logic for AI operations  
✅ **Enhanced MCP Server** - Production-ready with error handling  
✅ **Comprehensive Testing** - Integration tests for all components  
✅ **Deployment Scripts** - Automated setup and verification  
✅ **Production Server** - Full Express app with health checks  
✅ **Logging Service** - Structured logging for debugging

**The system is now ready for Cursor to execute step-by-step!** 🎯
