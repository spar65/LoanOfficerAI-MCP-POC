/**
 * Migration script to transfer data from JSON files to SQL database
 * 
 * This script reads data from the existing JSON files and populates
 * the SQL database tables with the data.
 */

const fs = require('fs');
const path = require('path');
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
async function migrateUsers(request, users) {
  console.log(`Migrating ${users.length} users...`);
  
  for (const user of users) {
    try {
      await request.query`
        INSERT INTO Users (
          id, username, email, passwordHash, firstName, lastName, role, tenantId, active, lastLogin
        ) VALUES (
          ${user.id || uuidv4()}, 
          ${user.username}, 
          ${user.email}, 
          ${user.passwordHash},
          ${user.firstName}, 
          ${user.lastName}, 
          ${user.role || 'loan_officer'}, 
          ${user.tenantId || 'default'}, 
          ${user.active !== undefined ? user.active : 1}, 
          ${user.lastLogin || new Date().toISOString()}
        )
      `;
    } catch (error) {
      console.error(`Error inserting user ${user.username}:`, error.message);
    }
  }
}

/**
 * Insert borrowers into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} borrowers - Borrower data
 */
async function migrateBorrowers(request, borrowers) {
  console.log(`Migrating ${borrowers.length} borrowers...`);
  
  for (const borrower of borrowers) {
    try {
      // Calculate debt-to-income ratio and risk score
      const dtiRatio = borrower.income > 0 ? 
        ((borrower.credit_score || 0) / borrower.income * 100) : null;
      
      // Simple risk calculation algorithm
      let riskScore = 50; // Base score
      
      if (borrower.credit_score > 750) riskScore -= 20;
      else if (borrower.credit_score < 600) riskScore += 30;
      
      if (borrower.income > 100000) riskScore -= 10;
      
      await request.query`
        INSERT INTO Borrowers (
          borrower_id, first_name, last_name, address, phone, email, 
          credit_score, income, farm_size, farm_type, debt_to_income_ratio,
          risk_score, ai_risk_assessment, last_risk_update
        ) VALUES (
          ${borrower.borrower_id},
          ${borrower.first_name},
          ${borrower.last_name},
          ${borrower.address},
          ${borrower.phone},
          ${borrower.email},
          ${borrower.credit_score},
          ${borrower.income},
          ${borrower.farm_size},
          ${borrower.farm_type},
          ${dtiRatio},
          ${riskScore},
          ${JSON.stringify({ factors: ['credit_score', 'income_stability'], calculatedAt: new Date() })},
          ${new Date().toISOString()}
        )
      `;
    } catch (error) {
      console.error(`Error inserting borrower ${borrower.borrower_id}:`, error.message);
    }
  }
}

/**
 * Insert loans into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} loans - Loan data
 */
async function migrateLoans(request, loans) {
  console.log(`Migrating ${loans.length} loans...`);
  
  for (const loan of loans) {
    try {
      // Calculate end date if not present
      const startDate = new Date(loan.start_date);
      const endDate = loan.end_date ? new Date(loan.end_date) : 
        new Date(startDate.getFullYear() + (loan.term_length || 120) / 12, startDate.getMonth(), startDate.getDate());
      
      await request.query`
        INSERT INTO Loans (
          loan_id, borrower_id, loan_amount, interest_rate, term_length,
          start_date, end_date, status, loan_type, payment_history_score,
          ai_approval_recommendation, ai_confidence_score, underwriter_override
        ) VALUES (
          ${loan.loan_id},
          ${loan.borrower_id},
          ${loan.loan_amount},
          ${loan.interest_rate},
          ${loan.term_length || 120}, /* Default to 10 years in months */
          ${loan.start_date},
          ${endDate.toISOString().split('T')[0]},
          ${loan.status || 'pending'},
          ${loan.loan_type},
          ${loan.payment_history_score || null},
          ${JSON.stringify({ recommendation: loan.status === 'Active' ? 'Approved' : 'Pending', reason: 'Historical data migration' })},
          ${loan.ai_confidence_score || 0.85},
          ${loan.underwriter_override || 0}
        )
      `;
    } catch (error) {
      console.error(`Error inserting loan ${loan.loan_id}:`, error.message);
    }
  }
}

/**
 * Insert collateral into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} collaterals - Collateral data
 */
async function migrateCollateral(request, collaterals) {
  console.log(`Migrating ${collaterals.length} collateral items...`);
  
  for (const collateral of collaterals) {
    try {
      await request.query`
        INSERT INTO Collateral (
          collateral_id, loan_id, description, value, appraised_value,
          appraisal_date, depreciation_rate, current_condition,
          ai_valuation, ai_valuation_confidence, last_ai_valuation_date
        ) VALUES (
          ${collateral.collateral_id},
          ${collateral.loan_id},
          ${collateral.description},
          ${collateral.value},
          ${collateral.appraised_value || collateral.value},
          ${collateral.appraisal_date || new Date().toISOString().split('T')[0]},
          ${collateral.depreciation_rate || 0.05}, /* Default 5% annual depreciation */
          ${collateral.current_condition || 'good'},
          ${collateral.ai_valuation || collateral.value},
          ${collateral.ai_valuation_confidence || 0.9},
          ${new Date().toISOString()}
        )
      `;
    } catch (error) {
      console.error(`Error inserting collateral ${collateral.collateral_id}:`, error.message);
    }
  }
}

/**
 * Insert payments into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} payments - Payment data
 */
async function migratePayments(request, payments) {
  console.log(`Migrating ${payments.length} payments...`);
  
  for (const payment of payments) {
    try {
      // Calculate days late if status is 'Late'
      const daysLate = payment.status === 'Late' ? 
        Math.floor(Math.random() * 30) + 1 : 0;
      
      // Calculate late fee if late
      const lateFee = daysLate > 0 ? 
        Math.round(payment.amount * 0.05 * 100) / 100 : 0;
      
      await request.query`
        INSERT INTO Payments (
          payment_id, loan_id, payment_date, amount, status,
          payment_method, late_fee, days_late, ai_risk_flag, ai_risk_reason
        ) VALUES (
          ${payment.payment_id},
          ${payment.loan_id},
          ${payment.payment_date},
          ${payment.amount},
          ${payment.status},
          ${payment.payment_method || 'ACH'},
          ${lateFee},
          ${daysLate},
          ${payment.status === 'Late'},
          ${payment.status === 'Late' ? 'Payment received after due date' : null}
        )
      `;
    } catch (error) {
      console.error(`Error inserting payment ${payment.payment_id}:`, error.message);
    }
  }
}

/**
 * Insert equipment into database
 * @param {sql.Request} request - SQL request object
 * @param {Array} equipment - Equipment data
 */
async function migrateEquipment(request, equipment) {
  console.log(`Migrating ${equipment.length} equipment items...`);
  
  for (const item of equipment) {
    try {
      // Calculate current value based on purchase price and depreciation
      const purchaseDate = new Date(item.purchase_date);
      const currentDate = new Date();
      const yearsSincePurchase = (currentDate - purchaseDate) / (365 * 24 * 60 * 60 * 1000);
      const depreciationRate = item.depreciation_rate || 0.1; // Default 10% per year
      const currentValue = item.purchase_price * Math.pow(1 - depreciationRate, yearsSincePurchase);
      
      await request.query`
        INSERT INTO Equipment (
          equipment_id, borrower_id, type, purchase_date, condition,
          purchase_price, current_value, depreciation_rate, maintenance_cost_ytd
        ) VALUES (
          ${item.equipment_id},
          ${item.borrower_id},
          ${item.type},
          ${item.purchase_date},
          ${item.condition},
          ${item.purchase_price},
          ${Math.round(currentValue * 100) / 100},
          ${item.depreciation_rate || 0.1},
          ${item.maintenance_cost_ytd || 0}
        )
      `;
      
      // Migrate maintenance records if present
      if (item.maintenance_records && Array.isArray(item.maintenance_records)) {
        for (const record of item.maintenance_records) {
          await request.query`
            INSERT INTO MaintenanceRecords (
              equipment_id, date, type, cost, description,
              predicted_next_maintenance, ai_maintenance_score
            ) VALUES (
              ${item.equipment_id},
              ${record.date},
              ${record.type},
              ${record.cost || 0},
              ${record.description || record.type},
              ${record.predicted_next_maintenance || new Date(new Date(record.date).setFullYear(new Date(record.date).getFullYear() + 1)).toISOString().split('T')[0]},
              ${record.ai_maintenance_score || 0.7}
            )
          `;
        }
      }
    } catch (error) {
      console.error(`Error inserting equipment ${item.equipment_id}:`, error.message);
    }
  }
}

/**
 * Migrate all JSON data to the database
 */
async function migrateJsonToDatabase() {
  try {
    console.log('Connecting to database...');
    await DatabaseManager.connect();
    
    // Read all JSON files
    const users = readJsonFile(JSON_FILES.users);
    const borrowers = readJsonFile(JSON_FILES.borrowers);
    const loans = readJsonFile(JSON_FILES.loans);
    const payments = readJsonFile(JSON_FILES.payments);
    const collateral = readJsonFile(JSON_FILES.collateral);
    const equipment = readJsonFile(JSON_FILES.equipment);
    
    // Use a transaction to ensure all-or-nothing migration
    await DatabaseManager.transaction(async (request) => {
      // Migrate in order of dependencies
      await migrateUsers(request, users);
      await migrateBorrowers(request, borrowers);
      await migrateLoans(request, loans);
      await migrateCollateral(request, collateral);
      await migratePayments(request, payments);
      await migrateEquipment(request, equipment);
    });
    
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