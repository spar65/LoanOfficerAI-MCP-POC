#!/usr/bin/env node

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../utils/database');
const fs = require('fs');
const path = require('path');

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

async function loadFullData() {
  try {
    console.log('🚀 Starting full data migration...');
    
    // Initialize database
    await db.initializeDatabase();
    
    // Clear existing data from tables that exist
    console.log('\n🧹 Clearing existing data...');
    await db.executeQuery('DELETE FROM Payments');
    await db.executeQuery('DELETE FROM Collateral');  
    await db.executeQuery('DELETE FROM Equipment');
    await db.executeQuery('DELETE FROM Loans');
    await db.executeQuery('DELETE FROM Borrowers');
    console.log('✅ Existing data cleared');
    
    // Load JSON data
    const borrowers = await loadJsonFile('borrowers.json');
    const loans = await loadJsonFile('loans.json');
    const payments = await loadJsonFile('payments.json');
    const collateral = await loadJsonFile('collateral.json');
    const equipment = await loadJsonFile('equipment.json');
    
    console.log(`\n📊 Data to migrate:`);
    console.log(`   Borrowers: ${borrowers.length}`);
    console.log(`   Loans: ${loans.length}`);
    console.log(`   Payments: ${payments.length}`);
    console.log(`   Collateral: ${collateral.length}`);
    console.log(`   Equipment: ${equipment.length}`);
    
    // Migrate Borrowers
    console.log(`\n👥 Migrating ${borrowers.length} borrowers...`);
    for (const borrower of borrowers) {
      try {
        await db.executeQuery(`
          INSERT INTO Borrowers (borrower_id, first_name, last_name, address, phone, email, credit_score, income, farm_size, farm_type)
          VALUES (@borrower_id, @first_name, @last_name, @address, @phone, @email, @credit_score, @income, @farm_size, @farm_type)
        `, {
          borrower_id: borrower.borrower_id,
          first_name: borrower.first_name,
          last_name: borrower.last_name,
          address: borrower.address || '',
          phone: borrower.phone || '',
          email: borrower.email || '',
          credit_score: borrower.credit_score || 700,
          income: borrower.income || 0,
          farm_size: borrower.farm_size || 0,
          farm_type: borrower.farm_type || 'General'
        });
        console.log(`✓ Borrower ${borrower.borrower_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting borrower ${borrower.borrower_id}:`, error.message);
      }
    }
    
    // Migrate Loans
    console.log(`\n💰 Migrating ${loans.length} loans...`);
    for (const loan of loans) {
      try {
        await db.executeQuery(`
                  INSERT INTO Loans (loan_id, borrower_id, loan_amount, interest_rate, term_months, loan_type, status, application_date, maturity_date)
        VALUES (@loan_id, @borrower_id, @loan_amount, @interest_rate, @term_months, @loan_type, @status, @application_date, @maturity_date)
        `, {
          loan_id: loan.loan_id,
          borrower_id: loan.borrower_id,
          loan_amount: loan.loan_amount,
          interest_rate: loan.interest_rate,
          term_months: loan.term_length || 60,
          loan_type: loan.loan_type || 'General',
          status: loan.status || 'Active',
          application_date: loan.start_date || new Date().toISOString().split('T')[0],
          maturity_date: loan.end_date || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
        });
        console.log(`✓ Loan ${loan.loan_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting loan ${loan.loan_id}:`, error.message);
      }
    }
    
    // Migrate Collateral
    console.log(`\n🏠 Migrating ${collateral.length} collateral items...`);
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
    console.log(`\n💳 Migrating ${payments.length} payments...`);
    for (const payment of payments) {
      try {
        await db.executeQuery(`
                  INSERT INTO Payments (payment_id, loan_id, payment_date, amount, payment_method)
        VALUES (@payment_id, @loan_id, @payment_date, @amount, @payment_method)
        `, {
          payment_id: payment.payment_id,
          loan_id: payment.loan_id,
                      payment_date: payment.payment_date,
            amount: payment.amount,
            payment_method: payment.payment_type || 'Regular'
        });
        console.log(`✓ Payment ${payment.payment_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting payment ${payment.payment_id}:`, error.message);
      }
    }
    
    // Migrate Equipment
    console.log(`\n🚜 Migrating ${equipment.length} equipment items...`);
    for (const item of equipment) {
      try {
        await db.executeQuery(`
                  INSERT INTO Equipment (equipment_id, borrower_id, equipment_type, condition_status, purchase_price, current_value)
        VALUES (@equipment_id, @borrower_id, @equipment_type, @condition_status, @purchase_price, @current_value)
        `, {
          equipment_id: item.equipment_id,
          borrower_id: item.borrower_id,
          equipment_type: item.type || 'General',
          condition_status: item.condition || 'Good',
          purchase_price: item.purchase_price || 0,
          current_value: item.current_value || 0
        });
        console.log(`✓ Equipment ${item.equipment_id} inserted`);
      } catch (error) {
        console.error(`✗ Error inserting equipment ${item.equipment_id}:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
    // Verify data
    console.log('\n🔍 Verifying migration...');
    const loanCount = await db.executeQuery('SELECT COUNT(*) as count FROM Loans');
    const borrowerCount = await db.executeQuery('SELECT COUNT(*) as count FROM Borrowers');
    console.log(`   Loans in database: ${loanCount.recordset[0].count}`);
    console.log(`   Borrowers in database: ${borrowerCount.recordset[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    await db.disconnect();
  }
}

// Run migration
loadFullData(); 