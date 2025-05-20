console.log('[SERVER.JS EXECUTION STARTED - Test Marker]'); // Marker for test log
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

console.log('[SERVER.JS] Express and core modules required.'); // Marker

const app = express();
console.log('[SERVER.JS] Express app initialized.'); // Marker

app.use(cors());
app.use(express.json());
console.log('[SERVER.JS] Core middleware (cors, express.json) applied.'); // Marker

// Data paths
const collateralPath = path.join(__dirname, 'data', 'collateral.json');
const loansPath = path.join(__dirname, 'data', 'loans.json');
const borrowersPath = path.join(__dirname, 'data', 'borrowers.json');
const paymentsPath = path.join(__dirname, 'data', 'payments.json');
const mockEquipmentPath = path.join(__dirname, 'data', 'mock_equipment.json');

// ... (fs.existsSync polyfill)
// ... (loadData function)
// ... (request logging middleware)
// ... (getRelatedData helper)

console.log('[SERVER.JS] DEFINING /api/collateral route - Test Marker');
app.get('/api/collateral', (req, res) => {
  console.log('GET /api/collateral - Fetching all collateral');
  const collaterals = loadData(collateralPath);
  console.log(`Found ${collaterals.length} collateral items`);
  res.json(collaterals);
});

console.log('[SERVER.JS] DEFINING /api/collateral/:id route - Test Marker');
app.get('/api/collateral/:id', (req, res) => {
  const collateralId = req.params.id;
  console.log(`GET /api/collateral/${collateralId} - Fetching collateral details`);
  const collaterals = loadData(collateralPath);
  const collateral = collaterals.find(c => c.collateral_id === collateralId);
  if (collateral) {
    console.log(`Collateral found with ID: ${collateralId}`);
    res.json(collateral);
  } else {
    console.log(`Collateral not found with ID: ${collateralId}`);
    res.status(404).json({ error: 'Collateral not found' });
  }
});

// Get borrower for a specific loan
app.get('/api/loans/:id/borrower', (req, res) => {
  const loanId = req.params.id;
  console.log(`GET /api/loans/${loanId}/borrower - Fetching borrower for loan`);
  
  const loans = loadData(loansPath);
  const borrowers = loadData(borrowersPath);
  
  const loan = loans.find(l => l.loan_id === loanId);
  
  if (!loan) {
    console.log(`Loan not found with ID: ${loanId}`);
    return res.status(404).json({ error: 'Loan not found' });
  }
  
  const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
  
  if (borrower) {
    console.log(`Borrower found for loan ${loanId}: ${borrower.first_name} ${borrower.last_name}`);
    res.json(borrower);
  } else {
    console.log(`Borrower not found for loan ${loanId} with borrower ID ${loan.borrower_id}`);
    res.status(404).json({ error: 'Borrower not found for loan' });
  }
});

// Get comprehensive borrower details with loans and equipment
app.get('/api/borrowers/:id/details', (req, res) => {
  const borrowerId = req.params.id;
  console.log(`GET /api/borrowers/${borrowerId}/details - Fetching comprehensive borrower details`);
  
  const borrowers = loadData(borrowersPath);
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  let equipment = [];
  
  try {
    if (process.env.NODE_ENV === 'test' && fs.existsSync(mockEquipmentPath)) {
      equipment = loadData(mockEquipmentPath);
    }
  } catch (error) {
    console.log('Equipment data not found, using empty array');
  }
  
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  
  if (!borrower) {
    console.log(`Borrower not found with ID: ${borrowerId}`);
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
  
  console.log(`Found comprehensive details for borrower ${borrowerId}`);
  res.json(borrowerDetails);
});

// Get loans by borrower name
app.get('/api/loans/borrower/:name', (req, res) => {
  const borrowerName = req.params.name;
  console.log(`GET /api/loans/borrower/${borrowerName} - Fetching loans by borrower name`);

  const loans = loadData(loansPath) || []; // Ensure loans is an array
  const borrowers = loadData(borrowersPath) || []; // Ensure borrowers is an array

  if (!Array.isArray(borrowers)) {
    console.error('Borrowers data is not an array for /api/loans/borrower/:name');
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
    console.log(`No borrowers found matching: ${borrowerName}`);
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

  console.log(`Found ${borrowerLoans.length} loans for borrower name: ${borrowerName}`);
  res.json(loansWithBorrowers);
});

// Get root path (for tests)
app.get('/', (req, res) => {
  res.json({ message: 'MCP API Server is running' });
});

console.log('[SERVER.JS] Reached end of route definitions, before app.listen/export.'); // Marker

if (process.env.NODE_ENV !== 'test') {
  const PORT = 3001;
  app.listen(PORT, () => {
    // ... listen logs ...
  });
}

console.log('[SERVER.JS] EXPORTING APP - Test Marker'); // Marker
module.exports = app; 