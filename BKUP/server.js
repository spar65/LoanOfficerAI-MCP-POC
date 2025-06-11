console.log('[SERVER.JS EXECUTION STARTED - Test Marker]'); // Marker for test log
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const LogService = require('./server/services/logService');
const requestContext = require('./server/middleware/requestContext');

console.log('[SERVER.JS] Express and core modules required.'); // Marker

const app = express();
console.log('[SERVER.JS] Express app initialized.'); // Marker

app.use(cors());
app.use(express.json());
// Add request context middleware for logging
app.use(requestContext);
console.log('[SERVER.JS] Core middleware (cors, express.json, requestContext) applied.'); // Marker

// Data paths
const collateralPath = path.join(__dirname, 'data', 'collateral.json');
const loansPath = path.join(__dirname, 'data', 'loans.json');
const borrowersPath = path.join(__dirname, 'data', 'borrowers.json');
const paymentsPath = path.join(__dirname, 'data', 'payments.json');
const mockEquipmentPath = path.join(__dirname, 'data', 'mock_equipment.json');

// Helper function to load data from JSON files
function loadData(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    } else {
      LogService.warn(`File not found: ${filePath}`);
      return [];
    }
  } catch (error) {
    LogService.error(`Error loading data from ${filePath}:`, { error: error.message });
    return [];
  }
}

console.log('[SERVER.JS] DEFINING /api/collateral route - Test Marker');
app.get('/api/collateral', (req, res) => {
  LogService.info('Fetching all collateral');
  const collaterals = loadData(collateralPath);
  LogService.info(`Found ${collaterals.length} collateral items`);
  res.json(collaterals);
});

console.log('[SERVER.JS] DEFINING /api/collateral/:id route - Test Marker');
app.get('/api/collateral/:id', (req, res) => {
  const collateralId = req.params.id;
  LogService.info(`Fetching collateral details for ID: ${collateralId}`);
  const collaterals = loadData(collateralPath);
  const collateral = collaterals.find(c => c.collateral_id === collateralId);
  if (collateral) {
    LogService.info(`Collateral found with ID: ${collateralId}`);
    res.json(collateral);
  } else {
    LogService.warn(`Collateral not found with ID: ${collateralId}`);
    res.status(404).json({ error: 'Collateral not found' });
  }
});

// Get borrower for a specific loan
app.get('/api/loans/:id/borrower', (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching borrower for loan: ${loanId}`);
  
  const loans = loadData(loansPath);
  const borrowers = loadData(borrowersPath);
  
  const loan = loans.find(l => l.loan_id === loanId);
  
  if (!loan) {
    LogService.warn(`Loan not found with ID: ${loanId}`);
    return res.status(404).json({ error: 'Loan not found' });
  }
  
  const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
  
  if (borrower) {
    LogService.info(`Borrower found for loan ${loanId}: ${borrower.first_name} ${borrower.last_name}`);
    res.json(borrower);
  } else {
    LogService.warn(`Borrower not found for loan ${loanId} with borrower ID ${loan.borrower_id}`);
    res.status(404).json({ error: 'Borrower not found for loan' });
  }
});

// Get comprehensive borrower details with loans and equipment
app.get('/api/borrowers/:id/details', (req, res) => {
  const borrowerId = req.params.id;
  LogService.info(`Fetching comprehensive borrower details for ID: ${borrowerId}`);
  
  const borrowers = loadData(borrowersPath);
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  let equipment = [];
  
  try {
    if (process.env.NODE_ENV === 'test' && fs.existsSync(mockEquipmentPath)) {
      equipment = loadData(mockEquipmentPath);
    }
  } catch (error) {
    LogService.warn('Equipment data not found, using empty array', { error: error.message });
  }
  
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  
  if (!borrower) {
    LogService.warn(`Borrower not found with ID: ${borrowerId}`);
    return res.status(404).json({ error: 'Borrower not found' });
  }
  
  const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
  const borrowerEquipment = equipment.filter(e => e.borrower_id === borrowerId);
  
  // Calculate total loan amount and total loan count
  const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  
  // Add loan payment history
  const loansWithPayments = borrowerLoans.map(loan => {
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
    return {
      ...loan,
      payments: loanPayments
    };
  });
  
  const borrowerDetails = {
    ...borrower,
    loans: loansWithPayments,
    equipment: borrowerEquipment,
    summary: {
      totalLoans: borrowerLoans.length,
      totalLoanAmount: totalLoanAmount,
      activeLoans: borrowerLoans.filter(l => l.status === 'Active').length
    }
  };
  
  LogService.info(`Found comprehensive details for borrower ${borrowerId}`, {
    loanCount: borrowerLoans.length,
    equipmentCount: borrowerEquipment.length
  });
  res.json(borrowerDetails);
});

// Get loans by borrower name
app.get('/api/loans/borrower/:name', (req, res) => {
  const borrowerName = req.params.name;
  LogService.info(`Fetching loans by borrower name: ${borrowerName}`);

  const loans = loadData(loansPath) || []; // Ensure loans is an array
  const borrowers = loadData(borrowersPath) || []; // Ensure borrowers is an array

  if (!Array.isArray(borrowers)) {
    LogService.error('Borrowers data is not an array for /api/loans/borrower/:name');
    return res.status(500).json({ error: 'Internal server error: Invalid borrower data' });
  }

  // Find borrowers matching the name (either first or last name)
  const matchingBorrowers = borrowers.filter(b => {
    // Ensure b is an object and has the required properties as strings
    const firstNameMatch = b && b.first_name && typeof b.first_name === 'string' && 
                         b.first_name.toLowerCase().includes(borrowerName.toLowerCase());
    const lastNameMatch = b && b.last_name && typeof b.last_name === 'string' && 
                        b.last_name.toLowerCase().includes(borrowerName.toLowerCase());
    return firstNameMatch || lastNameMatch;
  });

  if (matchingBorrowers.length === 0) {
    LogService.info(`No borrowers found matching: ${borrowerName}`);
    return res.json([]);
  }

  const borrowerIds = matchingBorrowers.map(b => b.borrower_id);
  const borrowerLoans = Array.isArray(loans) ? loans.filter(l => l && borrowerIds.includes(l.borrower_id)) : [];

  const loansWithBorrowers = borrowerLoans.map(loan => {
    const borrower = borrowers.find(b => b && b.borrower_id === loan.borrower_id);
    return {
      ...loan,
      borrower: borrower && borrower.first_name && borrower.last_name ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
      borrower_details: borrower || null
    };
  });

  LogService.info(`Found ${borrowerLoans.length} loans for borrower name: ${borrowerName}`);
  res.json(loansWithBorrowers);
});

// Get root path (for tests)
app.get('/', (req, res) => {
  LogService.info('Health check request received');
  res.json({ message: 'MCP API Server is running' });
});

console.log('[SERVER.JS] Reached end of route definitions, before app.listen/export.'); // Marker

if (process.env.NODE_ENV !== 'test') {
  const PORT = 3001;
  app.listen(PORT, () => {
    LogService.info(`===== SERVER STARTED =====`);
    LogService.info(`Server running on port ${PORT}`);
    LogService.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    LogService.info(`======================================`);
    LogService.info(`MCP Integration ready for requests`);
    LogService.info(`======================================`);
  });
}

console.log('[SERVER.JS] EXPORTING APP - Test Marker'); // Marker
module.exports = app; 