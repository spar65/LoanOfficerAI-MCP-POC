/**
 * Simple migration script to populate database with test data
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../utils/database');

async function simpleMigrate() {
  try {
    console.log('Starting simple migration...');
    
    // Initialize database
    await db.initializeDatabase();
    
    // Clear existing data
    console.log('Clearing existing data...');
    await db.executeQuery('DELETE FROM Payments');
    await db.executeQuery('DELETE FROM Collateral');
    await db.executeQuery('DELETE FROM Equipment');
    await db.executeQuery('DELETE FROM Loans');
    await db.executeQuery('DELETE FROM Borrowers');
    
    // Insert a test borrower
    console.log('Inserting test borrower...');
    await db.executeQuery(`
      INSERT INTO Borrowers (borrower_id, first_name, last_name, email, phone, credit_score, debt_to_income_ratio)
      VALUES ('B001', 'John', 'Doe', 'john@example.com', '555-1234', 750, NULL)
    `);
    
    // Insert a test loan
    console.log('Inserting test loan...');
    await db.executeQuery(`
      INSERT INTO Loans (loan_id, borrower_id, loan_amount, interest_rate, term_months, status, loan_type)
      VALUES ('L001', 'B001', 50000, 3.5, 60, 'Active', 'Land')
    `);
    
    // Insert test collateral
    console.log('Inserting test collateral...');
    await db.executeQuery(`
      INSERT INTO Collateral (collateral_id, loan_id, type, description, value)
      VALUES ('C001', 'L001', 'Real Estate', '100 acres of farmland', 75000)
    `);
    
    console.log('Migration completed successfully!');
    
    // Test query
    const result = await db.executeQuery('SELECT * FROM Loans WHERE loan_id = @loanId', { loanId: 'L001' });
    console.log('Test query result:', result.recordset);
    
  } catch (error) {
    console.error('Migration error:', error.message);
    console.error(error.stack);
  } finally {
    await db.disconnect();
  }
}

simpleMigrate(); 