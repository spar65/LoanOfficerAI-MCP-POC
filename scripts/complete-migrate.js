/**
 * Complete migration script to populate database with all JSON data
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../utils/database');
const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '../server/data');

async function loadJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
}

async function completeMigration() {
  try {
    console.log('Starting complete migration...');
    
    // Initialize database
    await db.initializeDatabase();
    
    // Clear existing data in reverse order of dependencies
    console.log('\nClearing existing data...');
    await db.executeQuery('DELETE FROM Payments');
    await db.executeQuery('DELETE FROM Collateral');
    await db.executeQuery('DELETE FROM Equipment');
    await db.executeQuery('DELETE FROM Loans');
    await db.executeQuery('DELETE FROM Borrowers');
    await db.executeQuery('DELETE FROM Users');
    
    // Load JSON data
    const users = await loadJsonFile('users.json');
    const borrowers = await loadJsonFile('borrowers.json');
    const loans = await loadJsonFile('loans.json');
    const payments = await loadJsonFile('payments.json');
    const collateral = await loadJsonFile('collateral.json');
    const equipment = await loadJsonFile('equipment.json');
    
    // Migrate Users
    console.log(`\nMigrating ${users.length} users...`);
    for (const user of users) {
      try {
        await db.executeQuery(`
          INSERT INTO Users (id, username, email, passwordHash, firstName, lastName, role, tenantId, active)
          VALUES (@id, @username, @email, @passwordHash, @firstName, @lastName, @role, @tenantId, @active)
        `, {
          id: user.id,
          username: user.username,
          email: user.email,
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role || 'loan_officer',
          tenantId: user.tenantId || 'default',
          active: user.active !== undefined ? user.active : 1
        });
        console.log(`✓ User ${user.username} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting user ${user.username}:`, error.message);
      }
    }
    
    // Migrate Borrowers
    console.log(`\nMigrating ${borrowers.length} borrowers...`);
    for (const borrower of borrowers) {
      try {
        // Build query based on available fields
        const fields = ['borrower_id', 'first_name', 'last_name'];
        const values = ['@borrower_id', '@first_name', '@last_name'];
        const params = {
          borrower_id: borrower.borrower_id,
          first_name: borrower.first_name,
          last_name: borrower.last_name
        };
        
        if (borrower.email) {
          fields.push('email');
          values.push('@email');
          params.email = borrower.email;
        }
        
        if (borrower.phone) {
          fields.push('phone');
          values.push('@phone');
          params.phone = borrower.phone;
        }
        
        if (borrower.credit_score !== undefined) {
          fields.push('credit_score');
          values.push('@credit_score');
          params.credit_score = borrower.credit_score;
        }
        
        if (borrower.debt_to_income_ratio !== undefined) {
          fields.push('debt_to_income_ratio');
          values.push('@debt_to_income_ratio');
          params.debt_to_income_ratio = borrower.debt_to_income_ratio;
        }
        
        const query = `INSERT INTO Borrowers (${fields.join(', ')}) VALUES (${values.join(', ')})`;
        await db.executeQuery(query, params);
        console.log(`✓ Borrower ${borrower.borrower_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting borrower ${borrower.borrower_id}:`, error.message);
      }
    }
    
    // Migrate Loans
    console.log(`\nMigrating ${loans.length} loans...`);
    for (const loan of loans) {
      try {
        await db.executeQuery(`
          INSERT INTO Loans (loan_id, borrower_id, loan_amount, interest_rate, term_months, status, loan_type)
          VALUES (@loan_id, @borrower_id, @loan_amount, @interest_rate, @term_months, @status, @loan_type)
        `, {
          loan_id: loan.loan_id,
          borrower_id: loan.borrower_id,
          loan_amount: loan.loan_amount,
          interest_rate: loan.interest_rate,
          term_months: loan.term_length || 60,
          status: loan.status || 'Active',
          loan_type: loan.loan_type || 'General'
        });
        console.log(`✓ Loan ${loan.loan_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting loan ${loan.loan_id}:`, error.message);
      }
    }
    
    // Migrate Collateral
    console.log(`\nMigrating ${collateral.length} collateral items...`);
    for (const item of collateral) {
      try {
        await db.executeQuery(`
          INSERT INTO Collateral (collateral_id, loan_id, type, description, value)
          VALUES (@collateral_id, @loan_id, @type, @description, @value)
        `, {
          collateral_id: item.collateral_id,
          loan_id: item.loan_id,
          type: item.type || 'Real Estate',
          description: item.description || '',
          value: item.value || 0
        });
        console.log(`✓ Collateral ${item.collateral_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting collateral ${item.collateral_id}:`, error.message);
      }
    }
    
    // Migrate Payments
    console.log(`\nMigrating ${payments.length} payments...`);
    for (const payment of payments) {
      try {
        // Check if Payments table has these columns
        await db.executeQuery(`
          INSERT INTO Payments (payment_id, loan_id, payment_date, amount, status)
          VALUES (@payment_id, @loan_id, @payment_date, @amount, @status)
        `, {
          payment_id: payment.payment_id,
          loan_id: payment.loan_id,
          payment_date: payment.payment_date,
          amount: payment.amount,
          status: payment.status || 'Pending'
        });
        console.log(`✓ Payment ${payment.payment_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting payment ${payment.payment_id}:`, error.message);
      }
    }
    
    // Migrate Equipment
    console.log(`\nMigrating ${equipment.length} equipment items...`);
    for (const item of equipment) {
      try {
        // Build query based on available fields
        const fields = ['equipment_id', 'borrower_id', 'type'];
        const values = ['@equipment_id', '@borrower_id', '@type'];
        const params = {
          equipment_id: item.equipment_id,
          borrower_id: item.borrower_id,
          type: item.type
        };
        
        if (item.purchase_date) {
          fields.push('purchase_date');
          values.push('@purchase_date');
          params.purchase_date = item.purchase_date;
        }
        
        if (item.condition) {
          fields.push('condition');
          values.push('@condition');
          params.condition = item.condition;
        }
        
        if (item.purchase_price !== undefined) {
          fields.push('purchase_price');
          values.push('@purchase_price');
          params.purchase_price = item.purchase_price || 0;
        }
        
        const query = `INSERT INTO Equipment (${fields.join(', ')}) VALUES (${values.join(', ')})`;
        await db.executeQuery(query, params);
        console.log(`✓ Equipment ${item.equipment_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting equipment ${item.equipment_id}:`, error.message);
      }
    }
    
    // Summary
    console.log('\n=== Migration Summary ===');
    
    const userCount = await db.executeQuery('SELECT COUNT(*) as count FROM Users');
    const borrowerCount = await db.executeQuery('SELECT COUNT(*) as count FROM Borrowers');
    const loanCount = await db.executeQuery('SELECT COUNT(*) as count FROM Loans');
    const collateralCount = await db.executeQuery('SELECT COUNT(*) as count FROM Collateral');
    const paymentCount = await db.executeQuery('SELECT COUNT(*) as count FROM Payments');
    const equipmentCount = await db.executeQuery('SELECT COUNT(*) as count FROM Equipment');
    
    console.log(`Users: ${userCount.recordset[0].count}`);
    console.log(`Borrowers: ${borrowerCount.recordset[0].count}`);
    console.log(`Loans: ${loanCount.recordset[0].count}`);
    console.log(`Collateral: ${collateralCount.recordset[0].count}`);
    console.log(`Payments: ${paymentCount.recordset[0].count}`);
    console.log(`Equipment: ${equipmentCount.recordset[0].count}`);
    
    console.log('\nMigration completed!');
    
  } catch (error) {
    console.error('Migration error:', error.message);
    console.error(error.stack);
  } finally {
    await db.disconnect();
  }
}

completeMigration(); 