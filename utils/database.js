/**
 * Database utility module for MCP Loan Management System
 * Provides connection management and query execution
 */
const sql = require('mssql');
const { v4: uuidv4 } = require('uuid');
const LogService = require('../services/logService');

class DatabaseManager {
  constructor() {
    // Parse server and port from DB_SERVER env var
    const serverConfig = process.env.DB_SERVER || 'localhost';
    
    this.config = {
      server: serverConfig.split(',')[0], // Extract server name without port
      database: process.env.DB_NAME || 'LoanOfficerDB', // Default to LoanOfficerDB
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || 'YourStrong@Passw0rd',
      options: { 
        trustServerCertificate: true,
        encrypt: false
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      port: serverConfig.includes(',') ? parseInt(serverConfig.split(',')[1]) : 1433 // Parse port if provided
    };
    
    this.pool = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.connectionRetries = 0;
    this.maxRetries = 3;
    this.dbInitialized = false;
  }

  /**
   * Initialize database - create if it doesn't exist
   */
  async initializeDatabase() {
    if (this.dbInitialized) {
      return;
    }
    
    try {
      // Try to connect directly to the target database first
      const dbName = this.config.database;
      
      try {
        // Attempt direct connection to the database
        await this.connect();
        LogService.info(`Connected to existing database '${dbName}'`);
        
        // Create schema if needed
        await this.createSchema();
        
        this.dbInitialized = true;
        return;
      } catch (connectError) {
        // If direct connection fails, try to create the database
        LogService.info(`Direct connection to '${dbName}' failed, attempting to create database...`);
        
        // Connect to master database
        const masterPool = await sql.connect({
          ...this.config,
          database: 'master'
        });
        
        // Check if our database exists
        const dbCheckResult = await masterPool.request()
          .input('dbName', sql.VarChar, dbName)
          .query('SELECT database_id FROM sys.databases WHERE name = @dbName');
        
        // If database doesn't exist, create it
        if (dbCheckResult.recordset.length === 0) {
          LogService.info(`Creating database ${dbName}...`);
          await masterPool.request()
            .query(`CREATE DATABASE [${dbName}]`);
          
          LogService.info(`Database ${dbName} created successfully`);
        }
        
        // Close master connection
        await masterPool.close();
        
        // Connect to our database and create schema if needed
        await this.createSchema();
        
        this.dbInitialized = true;
      }
    } catch (error) {
      LogService.error('Error initializing database', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Create database schema
   */
  async createSchema() {
    try {
      const pool = await this.connect();
      
      // Check if tables exist
      const tableCheckResult = await pool.request()
        .query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = \'BASE TABLE\'');
      
      const existingTables = tableCheckResult.recordset.map(r => r.TABLE_NAME);
      
      // Create tables if they don't exist
      if (!existingTables.includes('Borrowers')) {
        LogService.info('Creating Borrowers table...');
        await pool.request().query(`
          CREATE TABLE Borrowers (
            borrower_id VARCHAR(50) PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            credit_score INT,
            debt_to_income_ratio DECIMAL(5,2),
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE()
          )
        `);
      }
      
      if (!existingTables.includes('Loans')) {
        LogService.info('Creating Loans table...');
        await pool.request().query(`
          CREATE TABLE Loans (
            loan_id VARCHAR(50) PRIMARY KEY,
            borrower_id VARCHAR(50) NOT NULL,
            loan_amount DECIMAL(18,2) NOT NULL,
            interest_rate DECIMAL(5,2) NOT NULL,
            term_months INT NOT NULL,
            status VARCHAR(50) NOT NULL,
            loan_type VARCHAR(50) NOT NULL,
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (borrower_id) REFERENCES Borrowers(borrower_id)
          )
        `);
      }
      
      if (!existingTables.includes('Collateral')) {
        LogService.info('Creating Collateral table...');
        await pool.request().query(`
          CREATE TABLE Collateral (
            collateral_id VARCHAR(50) PRIMARY KEY,
            loan_id VARCHAR(50) NOT NULL,
            type VARCHAR(100) NOT NULL,
            description VARCHAR(255),
            value DECIMAL(18,2) NOT NULL,
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
          )
        `);
      }
      
      if (!existingTables.includes('MCPConversations')) {
        LogService.info('Creating MCPConversations table...');
        await pool.request().query(`
          CREATE TABLE MCPConversations (
            conversation_id VARCHAR(50) PRIMARY KEY,
            user_id VARCHAR(50) NOT NULL,
            query NVARCHAR(MAX),
            response NVARCHAR(MAX),
            timestamp DATETIME,
            created_at DATETIME DEFAULT GETDATE()
          )
        `);
      }
      
      if (!existingTables.includes('Users')) {
        LogService.info('Creating Users table...');
        await pool.request().query(`
          CREATE TABLE Users (
            id VARCHAR(50) PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            passwordHash VARCHAR(255) NOT NULL,
            firstName VARCHAR(50),
            lastName VARCHAR(50),
            role VARCHAR(50) DEFAULT 'loan_officer',
            tenantId VARCHAR(50) NOT NULL DEFAULT 'default',
            active BIT DEFAULT 1,
            lastLogin DATETIME,
            preferredAIModel VARCHAR(50) DEFAULT 'claude-sonnet-4',
            createdAt DATETIME DEFAULT GETDATE(),
            updatedAt DATETIME DEFAULT GETDATE()
          )
        `);
      }
      
      if (!existingTables.includes('Payments')) {
        LogService.info('Creating Payments table...');
        await pool.request().query(`
          CREATE TABLE Payments (
            payment_id VARCHAR(50) PRIMARY KEY,
            loan_id VARCHAR(50) NOT NULL,
            payment_date DATE NOT NULL,
            amount DECIMAL(15,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            payment_method VARCHAR(50) DEFAULT 'ACH',
            late_fee DECIMAL(15,2) DEFAULT 0,
            days_late INT DEFAULT 0,
            created_at DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (loan_id) REFERENCES Loans(loan_id)
          )
        `);
      }
      
      if (!existingTables.includes('Equipment')) {
        LogService.info('Creating Equipment table...');
        await pool.request().query(`
          CREATE TABLE Equipment (
            equipment_id VARCHAR(50) PRIMARY KEY,
            borrower_id VARCHAR(50) NOT NULL,
            type VARCHAR(50) NOT NULL,
            purchase_date DATE,
            condition VARCHAR(20),
            purchase_price DECIMAL(15,2),
            current_value DECIMAL(15,2),
            depreciation_rate DECIMAL(5,2),
            maintenance_cost_ytd DECIMAL(15,2) DEFAULT 0,
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (borrower_id) REFERENCES Borrowers(borrower_id)
          )
        `);
      }
      
      if (!existingTables.includes('MaintenanceRecords')) {
        LogService.info('Creating MaintenanceRecords table...');
        await pool.request().query(`
          CREATE TABLE MaintenanceRecords (
            record_id VARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
            equipment_id VARCHAR(50) NOT NULL,
            date DATE NOT NULL,
            type VARCHAR(50) NOT NULL,
            cost DECIMAL(15,2) DEFAULT 0,
            description VARCHAR(255),
            predicted_next_maintenance DATE,
            ai_maintenance_score DECIMAL(3,2) DEFAULT 0.7,
            created_at DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (equipment_id) REFERENCES Equipment(equipment_id)
          )
        `);
      }
      
      if (!existingTables.includes('CropYields')) {
        LogService.info('Creating CropYields table...');
        await pool.request().query(`
          CREATE TABLE CropYields (
            crop_id VARCHAR(50) PRIMARY KEY,
            borrower_id VARCHAR(50) NOT NULL,
            crop_type VARCHAR(50) NOT NULL,
            season VARCHAR(20) NOT NULL,
            yield_amount DECIMAL(15,2) DEFAULT 0,
            risk_score DECIMAL(3,2) DEFAULT 0,
            risk_factors NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE(),
            FOREIGN KEY (borrower_id) REFERENCES Borrowers(borrower_id)
          )
        `);
      }
      
      if (!existingTables.includes('MarketPrices')) {
        LogService.info('Creating MarketPrices table...');
        await pool.request().query(`
          CREATE TABLE MarketPrices (
            market_id VARCHAR(50) PRIMARY KEY,
            commodity VARCHAR(50) NOT NULL,
            price DECIMAL(15,2) NOT NULL,
            price_change_percent DECIMAL(5,2) DEFAULT 0,
            impact_analysis NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE(),
            updated_at DATETIME DEFAULT GETDATE()
          )
        `);
      }
      
      LogService.info('Database schema setup complete');
    } catch (error) {
      LogService.error('Error creating database schema', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Connect to the database with retry logic
   * @returns {Promise<sql.ConnectionPool>} The connection pool
   */
  async connect() {
    // If already connected, return the pool
    if (this.pool && this.pool.connected) {
      return this.pool;
    }
    
    // If connection is in progress, return the promise
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }
    
    // Set connecting flag and create promise
    this.isConnecting = true;
    
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        LogService.debug('Connecting to database', {
          server: this.config.server,
          database: this.config.database
        });
        
        this.pool = await sql.connect(this.config);
        this.connectionRetries = 0;
        LogService.info('Successfully connected to database', {
          server: this.config.server,
          database: this.config.database
        });
        
        resolve(this.pool);
      } catch (error) {
        if (this.connectionRetries < this.maxRetries) {
          this.connectionRetries++;
          const delay = Math.pow(2, this.connectionRetries) * 1000; // Exponential backoff
          
          LogService.warn(`Database connection failed, retrying in ${delay}ms`, {
            attempt: this.connectionRetries,
            maxRetries: this.maxRetries,
            error: error.message
          });
          
          setTimeout(async () => {
            this.isConnecting = false;
            try {
              const pool = await this.connect();
              resolve(pool);
            } catch (retryError) {
              reject(retryError);
            }
          }, delay);
        } else {
          LogService.error('Database connection failed after max retries', {
            error: error.message,
            stack: error.stack
          });
          reject(error);
        }
      } finally {
        this.isConnecting = false;
      }
    });
    
    return this.connectionPromise;
  }
  
  /**
   * Execute a parameterized query
   * @param {string} queryText - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<sql.IResult<any>>} Query result
   */
  async query(queryText, params = []) {
    try {
      await this.initializeDatabase();
      const pool = await this.connect();
      const request = pool.request();
      
      // Add parameters if provided
      if (params && params.length > 0) {
        // Convert to named parameters
        let modifiedQuery = queryText;
        params.forEach((param, index) => {
          const paramName = `p${index}`;
          request.input(paramName, param);
          modifiedQuery = modifiedQuery.replace('@param' + index, '@' + paramName);
        });
        queryText = modifiedQuery;
      }
      
      const start = Date.now();
      const result = await request.query(queryText);
      const duration = Date.now() - start;
      
      // Log query performance
      if (duration > 100) {
        LogService.debug('Slow database query', {
          duration,
          query: queryText.substring(0, 100) + (queryText.length > 100 ? '...' : '')
        });
      }
      
      return result;
    } catch (error) {
      LogService.error('Database query failed', {
        error: error.message,
        query: queryText.substring(0, 100) + (queryText.length > 100 ? '...' : '')
      });
      throw error;
    }
  }

  /**
   * Execute a query with named parameters
   * @param {string} query - SQL query text
   * @param {Object} inputs - Named parameters object
   * @returns {Promise<sql.IResult<any>>} Query result
   */
  async executeQuery(query, inputs = {}) {
    try {
      await this.initializeDatabase();
      const pool = await this.connect();
      const request = pool.request();

      // Add inputs to request with proper type handling
      Object.entries(inputs).forEach(([key, value]) => {
        if (value === null) {
          // Handle null values explicitly
          request.input(key, sql.VarChar, null);
        } else if (
          typeof value === "object" &&
          value !== null &&
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
      LogService.error("Query execution failed:", error.message);
      LogService.error("Query:", query);
      LogService.error("Inputs:", inputs);
      throw error;
    }
  }

  /**
   * Execute a stored procedure
   * @param {string} procedureName - Stored procedure name
   * @param {Object} inputs - Named parameters object
   * @returns {Promise<sql.IResult<any>>} Query result
   */
  async executeStoredProcedure(procedureName, inputs = {}) {
    try {
      await this.initializeDatabase();
      const pool = await this.connect();
      const request = pool.request();

      Object.entries(inputs).forEach(([key, value]) => {
        if (value === null) {
          // Handle null values explicitly
          request.input(key, sql.VarChar, null);
        } else if (
          typeof value === "object" &&
          value !== null &&
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
      LogService.error("Stored procedure execution failed:", error.message);
      throw error;
    }
  }
  
  /**
   * Execute a transaction with multiple queries
   * @param {Function} callback - Transaction callback that receives a transaction object
   * @returns {Promise<any>} Transaction result
   */
  async transaction(callback) {
    await this.initializeDatabase();
    const pool = await this.connect();
    const transaction = new sql.Transaction(pool);
    
    try {
      await transaction.begin();
      
      // Create a request instance linked to the transaction
      const request = new sql.Request(transaction);
      
      // Call the callback with the transaction request
      const result = await callback(request);
      
      // Commit the transaction
      await transaction.commit();
      
      return result;
    } catch (error) {
      // Rollback the transaction on error
      LogService.error('Transaction failed, rolling back', {
        error: error.message
      });
      
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        LogService.error('Transaction rollback failed', {
          error: rollbackError.message
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Generate a unique ID
   * @returns {string} UUID v4
   */
  generateId() {
    return uuidv4();
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      const result = await this.executeQuery("SELECT 1 as test");
      LogService.info("✅ Database connection test passed");
      return true;
    } catch (error) {
      LogService.error("❌ Database connection test failed:", error.message);
      return false;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect() {
    if (this.pool) {
      try {
        await this.pool.close();
        LogService.info('Database connection closed');
      } catch (error) {
        LogService.error('Error closing database connection', {
          error: error.message
        });
      } finally {
        this.pool = null;
      }
    }
  }
}

// Create and export a singleton instance
module.exports = new DatabaseManager(); 