/**
 * Migration script to transfer data from JSON files to SQL database
 * 
 * This script reads data from the existing JSON files and populates
 * the SQL database tables with the data.
 */

const path = require('path');
// Load environment variables from the root .env file
const envPath = path.resolve(__dirname, '..', '.env');
require('dotenv').config({ path: envPath });

const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const DatabaseManager = require('../utils/database');

// Configuration
const DATA_DIR = path.join(__dirname, '../server/data');
const JSON_FILES = {
  users: 'users.json',
  borrowers: 'borrowers.json',
  loans: 'loans.json',
  payments: 'payments.json',
  collateral: 'collateral.json',
  equipment: 'equipment.json'
};

/**
 * Read a JSON file
 * @param {string} filename - Name of the JSON file
 * @returns {Array|Object} - Parsed JSON data
 */
function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filename} not found, skipping...`);
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
}

/**
 * Insert users into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} users - User data
 */
async function migrateUsers(users) {
  console.log(`Migrating ${users.length} users...`);
  for (const user of users) {
    try {
      await DatabaseManager.executeQuery(
        `INSERT INTO Users (id, username, email, passwordHash, firstName, lastName, role, tenantId, active) VALUES (@id, @username, @email, @passwordHash, @firstName, @lastName, @role, @tenantId, @active)`,
        { id: user.id || uuidv4(), username: user.username, email: user.email, passwordHash: user.passwordHash, firstName: user.firstName, lastName: user.lastName, role: user.role || 'loan_officer', tenantId: user.tenantId || 'default', active: user.active !== undefined ? user.active : 1 }
      );
    } catch (error) { console.error(`Error inserting user ${user.username}:`, error.message); }
  }
}

/**
 * Insert borrowers into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} borrowers - Borrower data
 */
async function migrateBorrowers(borrowers) {
  console.log(`Migrating ${borrowers.length} borrowers...`);
  for (const borrower of borrowers) {
    try {
      await DatabaseManager.executeQuery(
        `INSERT INTO Borrowers (borrower_id, first_name, last_name, email, phone, credit_score, debt_to_income_ratio) VALUES (@borrower_id, @first_name, @last_name, @email, @phone, @credit_score, @debt_to_income_ratio)`,
        { 
          borrower_id: borrower.borrower_id, 
          first_name: borrower.first_name, 
          last_name: borrower.last_name, 
          email: borrower.email || null, 
          phone: borrower.phone || null, 
          credit_score: borrower.credit_score || null, 
          debt_to_income_ratio: borrower.debt_to_income_ratio !== undefined ? borrower.debt_to_income_ratio : null 
        }
      );
    } catch (error) { console.error(`Error inserting borrower ${borrower.borrower_id}:`, error.message); }
  }
}

/**
 * Insert loans into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} loans - Loan data
 */
async function migrateLoans(loans) {
  console.log(`Migrating ${loans.length} loans...`);
  for (const loan of loans) {
    try {
      const startDate = new Date(loan.start_date);
      const endDate = loan.end_date ? new Date(loan.end_date) : new Date(startDate.getFullYear() + (loan.term_length || 120) / 12, startDate.getMonth(), startDate.getDate());
      await DatabaseManager.executeQuery(
        `INSERT INTO Loans (loan_id, borrower_id, loan_amount, interest_rate, term_months, status, loan_type) VALUES (@loan_id, @borrower_id, @loan_amount, @interest_rate, @term_months, @status, @loan_type)`,
        { loan_id: loan.loan_id, borrower_id: loan.borrower_id, loan_amount: loan.loan_amount, interest_rate: loan.interest_rate, term_months: loan.term_length || 120, status: loan.status || 'pending', loan_type: loan.loan_type }
      );
    } catch (error) { console.error(`Error inserting loan ${loan.loan_id}:`, error.message); }
  }
}

/**
 * Insert collateral into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} collaterals - Collateral data
 */
async function migrateCollateral(collaterals) {
  console.log(`Migrating ${collaterals.length} collateral items...`);
  for (const collateral of collaterals) {
    try {
      await DatabaseManager.executeQuery(
        `INSERT INTO Collateral (collateral_id, loan_id, type, description, value) VALUES (@collateral_id, @loan_id, @type, @description, @value)`,
        { 
          collateral_id: collateral.collateral_id, 
          loan_id: collateral.loan_id, 
          type: collateral.type || 'Real Estate', 
          description: collateral.description, 
          value: collateral.value 
        }
      );
    } catch (error) { console.error(`Error inserting collateral ${collateral.collateral_id}:`, error.message); }
  }
}

/**
 * Insert payments into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} payments - Payment data
 */
async function migratePayments(payments) {
  console.log(`Migrating ${payments.length} payments...`);
  for (const payment of payments) {
    try {
      const daysLate = payment.status === 'Late' ? Math.floor(Math.random() * 30) + 1 : 0;
      const lateFee = daysLate > 0 ? Math.round(payment.amount * 0.05 * 100) / 100 : 0;
      await DatabaseManager.executeQuery(
        `INSERT INTO Payments (payment_id, loan_id, payment_date, amount, status, payment_method) VALUES (@payment_id, @loan_id, @payment_date, @amount, @status, @payment_method)`,
        { payment_id: payment.payment_id, loan_id: payment.loan_id, payment_date: payment.payment_date, amount: payment.amount, status: payment.status, payment_method: payment.payment_method || 'ACH' }
      );
    } catch (error) { console.error(`Error inserting payment ${payment.payment_id}:`, error.message); }
  }
}

/**
 * Insert equipment into database
 * @param {Array} equipment - Equipment data
 */
async function migrateEquipmentItems(equipment) {
  console.log(`Migrating ${equipment.length} equipment items...`);
  for (const item of equipment) {
    try {
      const purchaseDate = item.purchase_date ? new Date(item.purchase_date) : null;
      const currentDate = new Date();
      const yearsSincePurchase = purchaseDate ? (currentDate - purchaseDate) / (365 * 24 * 60 * 60 * 1000) : 0;
      const depreciationRate = item.depreciation_rate || 0.1;
      const currentValue = item.purchase_price && purchaseDate ? item.purchase_price * Math.pow(1 - depreciationRate, yearsSincePurchase) : item.purchase_price;
      
      await DatabaseManager.executeQuery(
        `INSERT INTO Equipment (equipment_id, borrower_id, type, purchase_date, condition, purchase_price, current_value, depreciation_rate, maintenance_cost_ytd) VALUES (@equipment_id, @borrower_id, @type, @purchase_date, @condition, @purchase_price, @current_value, @depreciation_rate, @maintenance_cost_ytd)`,
        { 
          equipment_id: item.equipment_id, 
          borrower_id: item.borrower_id, 
          type: item.type || 'Unknown', 
          purchase_date: item.purchase_date || null, 
          condition: item.condition || null, 
          purchase_price: item.purchase_price || 0,
          current_value: currentValue || 0,
          depreciation_rate: depreciationRate,
          maintenance_cost_ytd: item.maintenance_cost_ytd || 0
        }
      );
      
      if (item.maintenance_records && Array.isArray(item.maintenance_records)) {
        for (const record of item.maintenance_records) {
          await DatabaseManager.executeQuery(
            `INSERT INTO MaintenanceRecords (equipment_id, date, type, cost, description, predicted_next_maintenance, ai_maintenance_score) VALUES (@equipment_id, @date, @type, @cost, @description, @predicted_next_maintenance, @ai_maintenance_score)`,
            { 
              equipment_id: item.equipment_id, 
              date: record.date, 
              type: record.type, 
              cost: record.cost || 0, 
              description: record.description || record.type, 
              predicted_next_maintenance: record.predicted_next_maintenance || new Date(new Date(record.date).setFullYear(new Date(record.date).getFullYear() + 1)).toISOString().split('T')[0], 
              ai_maintenance_score: record.ai_maintenance_score || 0.7 
            }
          );
        }
      }
    } catch (error) { 
      console.error(`Error inserting equipment ${item.equipment_id}:`, error.message); 
    }
  }
}

// New migration functions for analytics tables

// Similar functions for CropYields and MarketPrices
// Assume crop_yields.json and market_prices.json exist
async function migrateCropYields() {
  const cropYields = readJsonFile('crop_yields.json');
  console.log(`\nMigrating ${cropYields.length} crop yield records...`);
  for (const item of cropYields) {
    try {
      await DatabaseManager.executeQuery(
        `INSERT INTO CropYields (crop_id, borrower_id, crop_type, season, yield_amount, risk_score, risk_factors)
         VALUES (@crop_id, @borrower_id, @crop_type, @season, @yield_amount, @risk_score, @risk_factors)`,
        { 
          crop_id: item.crop_id, 
          borrower_id: item.borrower_id, 
          crop_type: item.crop_type, 
          season: item.season, 
          yield_amount: item.yield_amount || 0, 
          risk_score: item.risk_score || 0, 
          risk_factors: JSON.stringify(item.risk_factors || []) 
        }
      );
      console.log(`✓ Crop yield ${item.crop_id} inserted`);
    } catch (error) {
      console.error(`✗ Error inserting crop yield ${item.crop_id}:`, error.message);
    }
  }
}

async function migrateMarketPrices() {
  const marketPrices = readJsonFile('market_prices.json');
  console.log(`\nMigrating ${marketPrices.length} market price records...`);
  for (const item of marketPrices) {
    try {
      await DatabaseManager.executeQuery(
        `INSERT INTO MarketPrices (market_id, commodity, price, price_change_percent, impact_analysis)
         VALUES (@market_id, @commodity, @price, @price_change_percent, @impact_analysis)`,
        { 
          market_id: item.market_id, 
          commodity: item.commodity, 
          price: item.price, 
          price_change_percent: item.price_change_percent || 0, 
          impact_analysis: JSON.stringify(item.impact_analysis || {}) 
        }
      );
      console.log(`✓ Market price ${item.market_id} inserted`);
    } catch (error) {
      console.error(`✗ Error inserting market price ${item.market_id}:`, error.message);
    }
  }
}

/**
 * Migrate all JSON data to the database
 */
async function migrateJsonToDatabase() {
  try {
    console.log('Initializing database...');
    await DatabaseManager.initializeDatabase();

    console.log('Connecting to database for migration...');
    await DatabaseManager.connect();
    
    // Clear existing data from tables (order matters due to foreign keys)
    console.log('Clearing existing data...');
    try {
      await DatabaseManager.executeQuery('DELETE FROM MaintenanceRecords');
    } catch (error) {
      console.log('MaintenanceRecords table may not exist yet');
    }
    try {
      await DatabaseManager.executeQuery('DELETE FROM MarketPrices');
    } catch (error) {
      console.log('MarketPrices table may not exist yet');
    }
    try {
      await DatabaseManager.executeQuery('DELETE FROM CropYields');
    } catch (error) {
      console.log('CropYields table may not exist yet');
    }
    await DatabaseManager.executeQuery('DELETE FROM Payments');
    await DatabaseManager.executeQuery('DELETE FROM Collateral');
    await DatabaseManager.executeQuery('DELETE FROM Equipment');
    await DatabaseManager.executeQuery('DELETE FROM Loans');
    await DatabaseManager.executeQuery('DELETE FROM Borrowers');
    await DatabaseManager.executeQuery('DELETE FROM Users');
    
    // Read all JSON files
    const users = readJsonFile(JSON_FILES.users);
    const borrowers = readJsonFile(JSON_FILES.borrowers);
    const loans = readJsonFile(JSON_FILES.loans);
    const payments = readJsonFile(JSON_FILES.payments);
    const collateral = readJsonFile(JSON_FILES.collateral);
    const equipment = readJsonFile(JSON_FILES.equipment);
    
    // Migrate data
    await migrateUsers(users);
    await migrateBorrowers(borrowers);
    await migrateLoans(loans);
    await migrateCollateral(collateral);
    await migratePayments(payments);
    await migrateEquipmentItems(equipment);
    await migrateCropYields();
    await migrateMarketPrices();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await DatabaseManager.disconnect();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  migrateJsonToDatabase();
}

module.exports = { migrateJsonToDatabase }; 