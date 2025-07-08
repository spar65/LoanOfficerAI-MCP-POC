#!/usr/bin/env node

/**
 * Database Integration Tests Runner
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const LogService = require('./services/logService');

// Load environment variables
dotenv.config();

// Set SQL Server connection info for Docker
process.env.DB_SERVER = process.env.DB_SERVER || 'localhost,1433';
process.env.DB_NAME = process.env.DB_NAME || 'LoanOfficerDB';
process.env.DB_USER = process.env.DB_USER || 'sa';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'YourStrong@Passw0rd';

// Print header
console.log('==============================================');
console.log('   MCP Database Integration Test Runner      ');
console.log('==============================================\n');

// Function to run the integration tests
async function runDatabaseIntegrationTests() {
  console.log('🔍 Running database integration tests...\n');
  
  try {
    // Import database manager
    const db = require('./utils/database');
    
    // Test database connection
    console.log('✅ Testing database connection...');
    const isConnected = await db.testConnection();
    
    if (!isConnected) {
      console.error('❌ Database connection failed. Please check your connection settings.');
      return { success: false, error: 'Database connection failed' };
    }
    
    console.log('✅ Database connection successful!\n');
    
    // Import database test module
    const DbIntegrationTest = require('./tests/integration/db-integration-test');
    
    // Run tests
    const result = await DbIntegrationTest.runAllTests();
    
    if (result.success) {
      console.log('✅ Database integration tests passed!');
    } else {
      console.log('❌ Database integration tests failed:', result.error);
    }
    
    // Disconnect from database
    await db.disconnect();
    
    return result;
  } catch (error) {
    console.log('❌ Error running database integration tests:', error.message);
    console.error(error);
    return { success: false, error: error.message };
  } finally {
    console.log('\n✅ Database integration tests completed\n');
  }
}

// Run the tests
runDatabaseIntegrationTests()
  .then(result => {
    if (!result.success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 