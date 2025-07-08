/**
 * Test script to verify database connection
 */

// Set environment variable to use database
process.env.USE_DATABASE = 'true';

const DatabaseManager = require('./utils/database');

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Try to connect to the database
    console.log('Connecting to database...');
    const isConnected = await DatabaseManager.testConnection();
    
    if (isConnected) {
      console.log('✅ Database connection successful!');
      
      // Try a simple query to check structure
      try {
        console.log('Running test query...');
        const tables = await DatabaseManager.query(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE'
          ORDER BY TABLE_NAME
        `);
        
        console.log(`\nDatabase contains ${tables.recordset.length} tables:`);
        tables.recordset.forEach((table, index) => {
          console.log(`${index + 1}. ${table.TABLE_NAME}`);
        });
      } catch (queryError) {
        console.error('❌ Database query failed:', queryError.message);
      }
    } else {
      console.error('❌ Database connection test failed');
    }
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    console.error(error);
  } finally {
    // Close database connection
    try {
      await DatabaseManager.disconnect();
      console.log('Database connection closed.');
    } catch (error) {
      console.error('Error closing database connection:', error.message);
    }
  }
}

// Run the test
testDatabaseConnection().catch(console.error); 