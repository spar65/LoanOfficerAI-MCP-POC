/**
 * Database setup script
 * 
 * Creates the database schema and tables for the Loan Officer AI application.
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
const LogService = require('../server/services/logService');

// Configuration
const config = {
  server: process.env.DB_SERVER || '(localdb)\\MSSQLLocalDB',
  database: 'master', // Connect to master initially to create our database
  options: { 
    trustedConnection: true,
    enableArithAbort: true,
    trustServerCertificate: true,
    encrypt: false
  }
};

// Target database name
const DB_NAME = process.env.DB_NAME || 'LoanOfficerDB';

// Read the schema file
function readSchemaFile() {
  try {
    const schemaPath = path.join(__dirname, '../database/createSchema.sql');
    return fs.readFileSync(schemaPath, 'utf8');
  } catch (error) {
    console.error('Error reading schema file:', error.message);
    process.exit(1);
  }
}

// Split SQL script into individual statements
function splitSqlStatements(sql) {
  // Split on semicolons but keep CREATE TABLE blocks together
  const statements = [];
  let currentStatement = '';
  let inCreateTable = false;
  
  sql.split(';').forEach(statement => {
    statement = statement.trim();
    if (statement) {
      if (statement.toUpperCase().includes('CREATE TABLE')) {
        inCreateTable = true;
        currentStatement = statement;
      } else if (inCreateTable) {
        currentStatement += ';' + statement;
        if (statement.includes(')')) {
          inCreateTable = false;
          statements.push(currentStatement);
          currentStatement = '';
        }
      } else {
        statements.push(statement);
      }
    }
  });
  
  return statements.filter(s => s.trim());
}

// Create database if it doesn't exist
async function createDatabase() {
  try {
    console.log(`Connecting to SQL Server to create database '${DB_NAME}'...`);
    const pool = await sql.connect(config);
    
    // Check if database exists
    const result = await pool.request()
      .input('dbName', sql.VarChar, DB_NAME)
      .query`SELECT DB_ID(@dbName) as dbId`;
    
    if (!result.recordset[0].dbId) {
      console.log(`Creating database '${DB_NAME}'...`);
      await pool.request().query`CREATE DATABASE ${sql.raw(DB_NAME)}`;
      console.log(`Database '${DB_NAME}' created successfully`);
    } else {
      console.log(`Database '${DB_NAME}' already exists`);
    }
    
    await pool.close();
    return true;
  } catch (error) {
    console.error('Error creating database:', error.message);
    return false;
  }
}

// Create tables and other database objects
async function createTables() {
  // Connect to the application database
  const dbConfig = { ...config, database: DB_NAME };
  
  try {
    console.log(`Connecting to database '${DB_NAME}' to create schema...`);
    const pool = await sql.connect(dbConfig);
    
    // Read and split the schema file
    const schemaContent = readSchemaFile();
    const statements = splitSqlStatements(schemaContent);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        // Skip empty statements
        if (!statement.trim()) continue;
        
        // Log first 50 chars of statement
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await pool.request().query(statement);
      } catch (error) {
        console.error(`Error executing statement: ${error.message}`);
        console.error(`Failed statement: ${statement}`);
        // Continue with other statements
      }
    }
    
    console.log('Database schema created successfully');
    await pool.close();
    return true;
  } catch (error) {
    console.error('Error creating database schema:', error.message);
    return false;
  }
}

// Main setup function
async function setupDatabase() {
  try {
    // Create database if it doesn't exist
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      console.error('Failed to create database. Setup aborted.');
      return false;
    }
    
    // Create tables and other database objects
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      console.error('Failed to create database schema. Setup incomplete.');
      return false;
    }
    
    console.log('Database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Database setup failed:', error.message);
    return false;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(success => {
      if (success) {
        console.log('✅ Database setup completed successfully');
      } else {
        console.error('❌ Database setup failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Unexpected error during database setup:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabase }; 