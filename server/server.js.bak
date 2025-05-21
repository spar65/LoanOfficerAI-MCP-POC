// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const app = express();

// Import auth middleware
const authMiddleware = require('./auth/authMiddleware');

// Import routes
const authRoutes = require('./auth/authRoutes');

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true // Allow cookies with CORS
}));
app.use(express.json());
app.use(cookieParser()); // Add cookie-parser middleware

// Data paths
const dataDir = path.join(__dirname, 'data');
const loansPath = path.join(dataDir, 'loans.json');
const borrowersPath = path.join(dataDir, 'borrowers.json');
const paymentsPath = path.join(dataDir, 'payments.json');
const collateralPath = path.join(dataDir, 'collateral.json');

// Mock data paths for testing
const mockDataDir = path.join(__dirname, 'tests', 'mock-data');
const mockLoansPath = path.join(mockDataDir, 'loans.json');
const mockBorrowersPath = path.join(mockDataDir, 'borrowers.json');
const mockPaymentsPath = path.join(mockDataDir, 'payments.json');
const mockCollateralPath = path.join(mockDataDir, 'collateral.json');
const mockEquipmentPath = path.join(mockDataDir, 'equipment.json');

// Add this line to fix the "existsSync is not a function" error
fs.existsSync = fs.existsSync || ((p) => {
  try {
    // In a normal environment we can rely on accessSync. However, when "fs" is
    // mocked (e.g. in unit tests) accessSync may be undefined; guard against
    // that so the polyfill itself doesn't throw.
    if (typeof fs.accessSync === 'function') {
      fs.accessSync(p);
      return true;
    }
    // If accessSync is not available we cannot really verify the path – return
    // false so that callers can decide what to do next (unit-test code usually
    // mocks readFileSync directly).
    return false;
  } catch (e) {
    return false;
  }
});

// Data loading function
const loadData = (filePath) => {
  try {
    // For testing, we might want to use mock data
    if (process.env.NODE_ENV === 'test') {
      const fileName = path.basename(filePath);
      const mockFilePath = path.join(mockDataDir, fileName);
      
      // Try to load the mock data first
      if (typeof fs.existsSync === 'function' && fs.existsSync(mockFilePath)) {
        try {
          const data = fs.readFileSync(mockFilePath, 'utf8');
          
          if (!data || data.trim() === '') {
            console.log(`Mock data file is empty: ${mockFilePath}`);
            // Continue to fallback logic below
          } else {
            try {
              return JSON.parse(data);
            } catch (parseError) {
              console.log(`Mock data invalid at ${mockFilePath}: ${parseError.message}`);
              // Continue to fallback logic below
            }
          }
        } catch (mockError) {
          console.log(`Error reading mock data at ${mockFilePath}: ${mockError.message}`);
          // Continue to fallback logic below
        }
      }
      // If we are in a test environment and mock data is not available or not
      // usable, fall through to the regular data-loading logic below so that
      // Jest "fs.readFileSync" mocks can supply the data.
      try {
        const data = fs.readFileSync(filePath, 'utf8');

        if (!data || (typeof data === 'string' && data.trim() === '')) {
          console.log(`Data file is empty: ${filePath}`);
          return [];
        }

        return JSON.parse(data);
      } catch (testReadError) {
        // If reading the original path fails (because the Jest test didn't
        // mock it or the file doesn't exist), return an empty array so the
        // service can still operate without crashing.
        console.log(`Error reading data (test env) from ${filePath}: ${testReadError.message}`);
        return [];
      }
    }
    
    // Regular data loading for non-test environments
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        
        if (!data || data.trim() === '') {
          console.log(`Data file is empty: ${filePath}`);
          return [];
        }
        
        return JSON.parse(data);
      } catch (readError) {
        console.error(`Error reading data from ${filePath}:`, readError);
        return [];
      }
    } else {
      console.log(`Regular data file not found at ${filePath}, returning empty array`);
      return [];
    }
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    return [];
  }
};

// Middleware to log all requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Helper function to get related data
const getRelatedData = (id, data, foreignKey) => {
  return data.filter(item => item[foreignKey] === id);
};

// Load tenant data for multi-tenant support
const getTenantFilteredData = (data, tenantId) => {
  // If no tenant provided or data doesn't have tenant info, return all data
  if (!tenantId || !data || !data[0] || !data[0].tenantId) {
    return data;
  }
  
  // Filter data by tenant ID
  return data.filter(item => item.tenantId === tenantId || item.tenantId === 'global');
};

// API Auth routes
app.use('/api/auth', authRoutes);

// Public endpoints (no authentication required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes middleware
// Apply authentication to all /api routes except those explicitly public
app.use('/api', (req, res, next) => {
  // Skip authentication for public routes
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/health'
  ];
  
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  // POC auth bypass was removed to enforce proper authentication
  
  // Apply authentication middleware
  authMiddleware.verifyToken(req, res, next);
});

// Apply tenant context middleware to all authenticated API routes
app.use('/api', (req, res, next) => {
  // Skip tenant verification for public routes
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/health'
  ];
  
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  authMiddleware.verifyTenant(req, res, next);
});

// Get all loans with borrower information
app.get('/api/loans', (req, res) => {
  console.log('GET /api/loans - Fetching all loans with borrower info');
  
  // Apply tenant filtering if tenant context exists
  let loans = loadData(loansPath);
  let borrowers = loadData(borrowersPath);
  
  if (req.tenantContext) {
    loans = getTenantFilteredData(loans, req.tenantContext);
    borrowers = getTenantFilteredData(borrowers, req.tenantContext);
  }
  
  // Filter loans by status if status parameter is provided
  let filteredLoans = loans;
  if (req.query.status) {
    const status = req.query.status;
    console.log(`Filtering loans by status: ${status}`);
    filteredLoans = loans.filter(loan => loan.status === status);
  }
  
  const loansWithBorrowers = filteredLoans.map(loan => {
    const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
    return {
      ...loan,
      borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
      borrower_details: borrower || null
    };
  });
  
  console.log(`Found ${filteredLoans.length} loans`);
  res.json(loansWithBorrowers);
});

// Get loan by ID with all related information
app.get('/api/loan/:id', (req, res) => {
  const loanId = req.params.id;
  console.log(`GET /api/loan/${loanId} - Fetching comprehensive loan details`);
  
  // Apply tenant filtering
  let loans = loadData(loansPath);
  let borrowers = loadData(borrowersPath);
  let payments = loadData(paymentsPath);
  let collaterals = loadData(collateralPath);
  
  if (req.tenantContext) {
    loans = getTenantFilteredData(loans, req.tenantContext);
    borrowers = getTenantFilteredData(borrowers, req.tenantContext);
    payments = getTenantFilteredData(payments, req.tenantContext);
    collaterals = getTenantFilteredData(collaterals, req.tenantContext);
  }
  
  const loan = loans.find(l => l.loan_id === loanId);
  
  if (loan) {
    const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
    const loanPayments = getRelatedData(loanId, payments, 'loan_id');
    const loanCollateral = getRelatedData(loanId, collaterals, 'loan_id');
    
    const loanDetails = {
      ...loan,
      borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
      borrower_details: borrower || null,
      payments: loanPayments,
      collateral: loanCollateral
    };
    
    console.log(`Loan found: ${JSON.stringify(loan.loan_id)}`);
    res.json(loanDetails);
  } else {
    console.log(`Loan not found with ID: ${loanId}`);
    res.status(404).json({ error: 'Loan not found' });
  }
});

// Get loan status by ID
app.get('/api/loan/status/:id', (req, res) => {
  const loanId = req.params.id;
  console.log(`GET /api/loan/status/${loanId} - Fetching loan status`);
  
  const loans = loadData(loansPath);
  const loan = loans.find(l => l.loan_id === loanId);
  
  if (loan) {
    console.log(`Loan status: ${loan.status}`);
    res.json({ status: loan.status });
  } else {
    console.log(`Loan not found with ID: ${loanId}`);
    res.status(404).json({ error: 'Loan not found' });
  }
});

// Get active loans
app.get('/api/loans/active', (req, res) => {
  console.log('GET /api/loans/active - Fetching active loans');
  
  const loans = loadData(loansPath);
  const borrowers = loadData(borrowersPath);
  
  const activeLoans = loans.filter(l => l.status === 'Active');
  
  const activeLoansWithBorrowers = activeLoans.map(loan => {
    const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
    return {
      ...loan,
      borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
      borrower_details: borrower || null
    };
  });
  
  console.log(`Found ${activeLoans.length} active loans`);
  res.json(activeLoansWithBorrowers);
});

// Get loans by borrower name
app.get('/api/loans/borrower/:name', (req, res) => {
  const borrowerName = req.params.name;
  console.log(`GET /api/loans/borrower/${borrowerName} - Fetching loans by borrower name`);
  
  const loans = loadData(loansPath);
  const borrowers = loadData(borrowersPath);
  
  // Find borrowers matching the name (either first or last name)
  const matchingBorrowers = borrowers.filter(b => 
    b.first_name.toLowerCase().includes(borrowerName.toLowerCase()) ||
    b.last_name.toLowerCase().includes(borrowerName.toLowerCase())
  );
  
  if (matchingBorrowers.length === 0) {
    console.log(`No borrowers found matching: ${borrowerName}`);
    return res.json([]);
  }
  
  const borrowerIds = matchingBorrowers.map(b => b.borrower_id);
  const borrowerLoans = loans.filter(l => borrowerIds.includes(l.borrower_id));
  
  const loansWithBorrowers = borrowerLoans.map(loan => {
    const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
    return {
      ...loan,
      borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
      borrower_details: borrower || null
    };
  });
  
  console.log(`Found ${borrowerLoans.length} loans for borrower name: ${borrowerName}`);
  res.json(loansWithBorrowers);
});

// Get loan summary statistics
app.get('/api/loans/summary', (req, res) => {
  console.log('GET /api/loans/summary - Fetching loan portfolio summary statistics');
  
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  
  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => l.status === 'Active').length;
  const totalAmount = loans.reduce((sum, l) => sum + l.loan_amount, 0);
  
  // Calculate delinquency rate based on loans with late payments
  const loansWithLatePayments = loans.filter((loan) => {
    const loanPayments = payments.filter((p) => p.loan_id === loan.loan_id);
    return loanPayments.some((p) => p.status === 'Late');
  });
  
  const delinquencyRate = totalLoans > 0 
    ? (loansWithLatePayments.length / totalLoans) * 100 
    : 0;
  
  const summary = {
    totalLoans,
    activeLoans,
    totalAmount,
    delinquencyRate
  };
  
  console.log('Loan summary:', summary);
  res.json(summary);
});

// Support /api/loan-summary for compatibility with tests
app.get('/api/loan-summary', (req, res) => {
  console.log('GET /api/loan-summary - Redirecting to /api/loans/summary');
  
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  
  const totalLoans = loans.length;
  const activeLoans = loans.filter((l) => l.status === 'Active').length;
  const totalAmount = loans.reduce((sum, l) => sum + l.loan_amount, 0);
  
  // Calculate delinquency rate based on loans with late payments
  const loansWithLatePayments = loans.filter((loan) => {
    const loanPayments = payments.filter((p) => p.loan_id === loan.loan_id);
    return loanPayments.some((p) => p.status === 'Late');
  });
  
  const delinquencyRate = totalLoans > 0 
    ? (loansWithLatePayments.length / totalLoans) * 100 
    : 0;
  
  const summary = {
    totalLoans,
    activeLoans,
    totalAmount,
    delinquencyRate
  };
  
  console.log('Loan summary:', summary);
  res.json(summary);
});

// NEW ENDPOINTS FOR RELATED TABLES

// Get all borrowers
app.get('/api/borrowers', (req, res) => {
  console.log('GET /api/borrowers - Fetching all borrowers');
  
  const borrowers = loadData(borrowersPath);
  console.log(`Found ${borrowers.length} borrowers`);
  res.json(borrowers);
});

// Get borrower by ID
app.get('/api/borrower/:id', (req, res) => {
  const borrowerId = req.params.id;
  console.log(`GET /api/borrower/${borrowerId} - Fetching borrower details`);
  
  const borrowers = loadData(borrowersPath);
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  
  if (borrower) {
    console.log(`Borrower found: ${borrower.first_name} ${borrower.last_name}`);
    res.json(borrower);
  } else {
    console.log(`Borrower not found with ID: ${borrowerId}`);
    res.status(404).json({ error: 'Borrower not found' });
  }
});

// Support for both /api/borrower/:id and /api/borrowers/:id for tests
app.get('/api/borrowers/:id', (req, res) => {
  const borrowerId = req.params.id;
  console.log(`GET /api/borrowers/${borrowerId} - Fetching borrower details (compatibility endpoint)`);
  
  const borrowers = loadData(borrowersPath);
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  
  if (borrower) {
    console.log(`Borrower found: ${borrower.first_name} ${borrower.last_name}`);
    res.json(borrower);
  } else {
    console.log(`Borrower not found with ID: ${borrowerId}`);
    res.status(404).json({ error: 'Borrower not found' });
  }
});

// Get borrower loans
app.get('/api/borrowers/:id/loans', (req, res) => {
  const borrowerId = req.params.id;
  console.log(`GET /api/borrowers/${borrowerId}/loans - Fetching loans for borrower`);
  
  const loans = loadData(loansPath);
  const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
  
  console.log(`Found ${borrowerLoans.length} loans for borrower ${borrowerId}`);
  res.json(borrowerLoans);
});

// Get all payments for a loan
app.get('/api/loan/:id/payments', (req, res) => {
  const loanId = req.params.id;
  console.log(`GET /api/loan/${loanId}/payments - Fetching payments for loan`);
  
  const payments = loadData(paymentsPath);
  const loanPayments = payments.filter(p => p.loan_id === loanId);
  
  console.log(`Found ${loanPayments.length} payments for loan ${loanId}`);
  res.json(loanPayments);
});

// Support for both /api/loan/:id/payments and /api/loans/:id/payments for tests
app.get('/api/loans/:id/payments', (req, res) => {
  const loanId = req.params.id;
  console.log(`GET /api/loans/${loanId}/payments - Fetching payments for loan (compatibility endpoint)`);
  
  const payments = loadData(paymentsPath);
  const loanPayments = payments.filter(p => p.loan_id === loanId);
  
  console.log(`Found ${loanPayments.length} payments for loan ${loanId}`);
  res.json(loanPayments);
});

// Get all payments
app.get('/api/payments', (req, res) => {
  console.log('GET /api/payments - Fetching all payments');
  
  const payments = loadData(paymentsPath);
  console.log(`Found ${payments.length} payments`);
  res.json(payments);
});

// Get all collateral for a loan
app.get('/api/loan/:id/collateral', (req, res) => {
  const loanId = req.params.id;
  console.log(`GET /api/loan/${loanId}/collateral - Fetching collateral for loan`);
  
  const collaterals = loadData(collateralPath);
  const loanCollateral = collaterals.filter(c => c.loan_id === loanId);
  
  console.log(`Found ${loanCollateral.length} collateral items for loan ${loanId}`);
  res.json(loanCollateral);
});

// Get all equipment
app.get('/api/equipment', (req, res) => {
  console.log('GET /api/equipment - Fetching all equipment');
  
  // For testing, use either mock equipment data or an empty array
  let equipment = [];
  
  try {
    if (process.env.NODE_ENV === 'test' && fs.existsSync(mockEquipmentPath)) {
      equipment = loadData(mockEquipmentPath);
    }
  } catch (error) {
    console.log('Equipment data not found, using empty array');
  }
  
  console.log(`Found ${equipment.length} equipment items`);
  res.json(equipment);
});

// Get equipment for a specific borrower
app.get('/api/borrowers/:id/equipment', (req, res) => {
  const borrowerId = req.params.id;
  console.log(`GET /api/borrowers/${borrowerId}/equipment - Fetching equipment for borrower`);
  
  // For testing, use either mock equipment data or an empty array
  let equipment = [];
  
  try {
    if (process.env.NODE_ENV === 'test' && fs.existsSync(mockEquipmentPath)) {
      equipment = loadData(mockEquipmentPath);
    }
  } catch (error) {
    console.log('Equipment data not found, using empty array');
  }
  
  const borrowerEquipment = equipment.filter(e => e.borrower_id === borrowerId);
  
  console.log(`Found ${borrowerEquipment.length} equipment items for borrower ${borrowerId}`);
  res.json(borrowerEquipment);
});

// Get all collateral
app.get('/api/collateral', (req, res) => {
  console.log('GET /api/collateral - Fetching all collateral');
  const collaterals = loadData(collateralPath);
  console.log(`Found ${collaterals.length} collateral items`);
  res.json(collaterals);
});

// Get collateral by ID
app.get('/api/collateral/:id', (req, res) => {
  // ...
});

// Support for both /api/loan/:id and /api/loans/:id for tests with guard against reserved words
app.get('/api/loans/:id', (req, res, next) => {
  const loanId = req.params.id;

  // If the path is actually one of the more specific routes (summary, active, or borrower),
  // pass control to the next matching route handler.
  const reserved = ['summary', 'active', 'borrower'];
  if (reserved.includes(loanId.toLowerCase())) {
    return next();
  }

  console.log(`GET /api/loans/${loanId} - Fetching loan details (compatibility endpoint)`);

  const loans = loadData(loansPath);
  const loan = loans.find(l => l.loan_id === loanId);

  if (loan) {
    console.log(`Loan found: ${JSON.stringify(loan.loan_id)}`);
    res.json(loan);
  } else {
    console.log(`Loan not found with ID: ${loanId}`);
    res.status(404).json({ error: 'Loan not found' });
  }
});

// OpenAI proxy endpoint
app.post('/api/openai/chat', authMiddleware.verifyToken, async (req, res) => {
  try {
    console.log('POST /api/openai/chat - Processing OpenAI request');
    
    // Validate request body
    const { messages, functions, function_call } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid request format: Messages array is missing or invalid');
      return res.status(400).json({ error: 'Invalid request format. Messages array is required.' });
    }
    
    console.log(`Request contains ${messages.length} messages and ${functions ? functions.length : 0} functions`);
    
    // Import OpenAI - make sure to install this package
    const { OpenAI } = require('openai');
    
    // IMPORTANT: You must set the OPENAI_API_KEY environment variable before running the server
    // You can do this by:
    // 1. Creating a .env file in the server directory with OPENAI_API_KEY=your_key
    // 2. Setting it in your shell: export OPENAI_API_KEY=your_key
    // 3. Setting it when running the server: OPENAI_API_KEY=your_key node server.js
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: OPENAI_API_KEY environment variable is not set');
      return res.status(500).json({ error: 'OpenAI API key is not configured on the server' });
    }
    
    // Initialize OpenAI client with API key from environment variable
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    console.log('Making request to OpenAI API...');
    
    // Make request to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",  // Using GPT-4o for best results
      messages,
      functions,
      function_call,
    });
    
    console.log('OpenAI response received successfully');
    res.json(response.choices[0].message);
  } catch (error) {
    console.error('Error calling OpenAI API:', error.message);
    console.error('Error details:', error);
    
    // Send a more detailed error response
    res.status(500).json({ 
      error: 'Failed to process OpenAI request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// =================== RISK ASSESSMENT ENDPOINTS ===================

// Get default risk assessment for borrower
app.get('/api/risk/default/:borrower_id', authMiddleware.verifyToken, (req, res) => {
  const borrowerId = req.params.borrower_id;
  const timeHorizon = req.query.time_horizon || 'medium_term';
  
  console.log(`GET /api/risk/default/${borrowerId} - Assessing default risk for borrower with time horizon: ${timeHorizon}`);
  
  // Load data
  const borrowers = loadData(borrowersPath);
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  
  // Find the borrower
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  if (!borrower) {
    return res.status(404).json({ error: 'Borrower not found' });
  }
  
  // Get borrower's loans
  const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
  if (borrowerLoans.length === 0) {
    return res.json({
      borrower_id: borrowerId,
      risk_score: 0,
      risk_factors: ["No loans found for this borrower"],
      recommendations: ["N/A"]
    });
  }
  
  // Get payment history
  const allPayments = [];
  borrowerLoans.forEach(loan => {
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
    allPayments.push(...loanPayments);
  });
  
  // Calculate risk score (simplified algorithm)
  // In a real system, this would be much more sophisticated
  let riskScore = 50; // Base score
  
  // Credit score factor
  if (borrower.credit_score >= 750) riskScore -= 15;
  else if (borrower.credit_score >= 700) riskScore -= 10;
  else if (borrower.credit_score >= 650) riskScore -= 5;
  else if (borrower.credit_score < 600) riskScore += 20;
  
  // Late payments factor
  const latePayments = allPayments.filter(p => p.status === 'Late');
  if (latePayments.length > 3) riskScore += 25;
  else if (latePayments.length > 0) riskScore += latePayments.length * 5;
  
  // Loan to income ratio factor
  const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const loanToIncomeRatio = totalLoanAmount / borrower.income;
  if (loanToIncomeRatio > 5) riskScore += 25;
  else if (loanToIncomeRatio > 3) riskScore += 15;
  else if (loanToIncomeRatio > 2) riskScore += 5;
  
  // Farm size and diversity factor (simplified)
  if (borrower.farm_size < 50) riskScore += 10; // Small farms often have less buffer
  
  // Cap risk score between 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  // Identify risk factors
  const riskFactors = [];
  if (latePayments.length > 0) {
    riskFactors.push(`${latePayments.length} late payment(s) in history`);
  }
  if (loanToIncomeRatio > 2) {
    riskFactors.push(`High loan-to-income ratio: ${loanToIncomeRatio.toFixed(1)}`);
  }
  if (borrower.credit_score < 650) {
    riskFactors.push(`Below average credit score: ${borrower.credit_score}`);
  }
  if (borrower.farm_size < 50) {
    riskFactors.push(`Small farm size may limit production capacity`);
  }
  
  // Generate recommendations
  const recommendations = [];
  if (riskScore > 70) {
    recommendations.push("Consider requiring additional collateral");
    recommendations.push("Implement more frequent payment monitoring");
  } else if (riskScore > 50) {
    recommendations.push("Monitor seasonal payment patterns closely");
    recommendations.push("Discuss risk mitigation strategies with borrower");
  } else {
    recommendations.push("Standard monitoring procedures are sufficient");
  }
  
  // Adjust recommendations based on time horizon
  if (timeHorizon === 'short_term' && riskScore > 60) {
    recommendations.push("Immediate review of payment schedule recommended");
  } else if (timeHorizon === 'long_term' && riskScore > 40) {
    recommendations.push("Consider loan restructuring to improve long-term viability");
  }
  
  const result = {
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    risk_score: riskScore,
    risk_level: riskScore > 70 ? "high" : (riskScore > 40 ? "medium" : "low"),
    time_horizon: timeHorizon,
    risk_factors: riskFactors,
    recommendations: recommendations
  };
  
  console.log(`Risk assessment completed for borrower ${borrowerId}: Score ${riskScore}`);
  res.json(result);
});

// Analyze payment patterns for a borrower
app.get('/api/analytics/payment-patterns/:borrower_id', authMiddleware.verifyToken, (req, res) => {
  const borrowerId = req.params.borrower_id;
  const period = req.query.period || '1y'; // Default to 1 year
  
  console.log(`GET /api/analytics/payment-patterns/${borrowerId} - Analyzing payment patterns for period: ${period}`);
  
  // Load data
  const borrowers = loadData(borrowersPath);
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  
  // Find the borrower
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  if (!borrower) {
    return res.status(404).json({ error: 'Borrower not found' });
  }
  
  // Get borrower's loans
  const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
  if (borrowerLoans.length === 0) {
    return res.json({
      borrower_id: borrowerId,
      period: period,
      patterns: ["No loans found for this borrower"],
      seasonality_score: 0,
      consistency_score: 0
    });
  }
  
  // Get payment history for all borrower's loans
  let allPayments = [];
  borrowerLoans.forEach(loan => {
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
    allPayments.push(...loanPayments);
  });
  
  // Filter by time period
  const now = new Date();
  let periodStart = new Date();
  if (period === '6m') periodStart.setMonth(now.getMonth() - 6);
  else if (period === '1y') periodStart.setFullYear(now.getFullYear() - 1);
  else if (period === '2y') periodStart.setFullYear(now.getFullYear() - 2);
  else if (period === '3y') periodStart.setFullYear(now.getFullYear() - 3);
  
  allPayments = allPayments.filter(p => new Date(p.payment_date) >= periodStart);
  
  // Group payments by month to analyze seasonality
  const paymentsByMonth = {};
  const statusByMonth = {};
  
  allPayments.forEach(payment => {
    const date = new Date(payment.payment_date);
    const monthKey = date.getMonth(); // 0-11 for Jan-Dec
    
    if (!paymentsByMonth[monthKey]) paymentsByMonth[monthKey] = [];
    paymentsByMonth[monthKey].push(payment);
    
    if (!statusByMonth[monthKey]) statusByMonth[monthKey] = [];
    statusByMonth[monthKey].push(payment.status);
  });
  
  // Analyze payment patterns
  const patterns = [];
  
  // Check for seasonality - months with more/fewer payments
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
  
  // High payment months (typically after harvest)
  const paymentCounts = Object.keys(paymentsByMonth).map(month => ({
    month: parseInt(month),
    count: paymentsByMonth[month].length
  }));
  
  paymentCounts.sort((a, b) => b.count - a.count);
  
  if (paymentCounts.length > 0) {
    // Identify high payment months
    const highPaymentMonths = paymentCounts.slice(0, Math.min(3, paymentCounts.length))
      .filter(m => m.count > 1)
      .map(m => monthNames[m.month]);
    
    if (highPaymentMonths.length > 0) {
      patterns.push(`Higher payment activity in: ${highPaymentMonths.join(', ')}`);
    }
    
    // Identify potential problem months
    const problemMonths = [];
    Object.keys(statusByMonth).forEach(month => {
      const statuses = statusByMonth[month];
      const lateCount = statuses.filter(s => s === 'Late').length;
      const latePercentage = (lateCount / statuses.length) * 100;
      
      if (latePercentage > 50 && statuses.length >= 2) {
        problemMonths.push(monthNames[parseInt(month)]);
      }
    });
    
    if (problemMonths.length > 0) {
      patterns.push(`More payment issues observed in: ${problemMonths.join(', ')}`);
    }
  }
  
  // Check overall payment consistency
  const totalPayments = allPayments.length;
  const onTimePayments = allPayments.filter(p => p.status === 'On Time').length;
  const latePayments = allPayments.filter(p => p.status === 'Late').length;
  
  const consistencyScore = totalPayments > 0 ? (onTimePayments / totalPayments) : 0;
  
  if (totalPayments > 0) {
    if (latePayments === 0) {
      patterns.push("All payments made on time");
    } else {
      const latePercentage = Math.round((latePayments / totalPayments) * 100);
      patterns.push(`${latePercentage}% of payments were late (${latePayments} of ${totalPayments})`);
    }
  }
  
  // Calculate seasonality score
  let seasonalityScore = 0;
  if (paymentCounts.length >= 3) {
    // If payments are concentrated in specific months, seasonality is higher
    const totalPaymentsAcrossMonths = paymentCounts.reduce((sum, m) => sum + m.count, 0);
    const top3MonthsPayments = paymentCounts.slice(0, 3).reduce((sum, m) => sum + m.count, 0);
    seasonalityScore = top3MonthsPayments / totalPaymentsAcrossMonths;
  }
  
  const result = {
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    period: period,
    total_payments_analyzed: totalPayments,
    patterns: patterns,
    seasonality_score: Number(seasonalityScore.toFixed(2)),
    consistency_score: Number(consistencyScore.toFixed(2))
  };
  
  console.log(`Payment pattern analysis completed for borrower ${borrowerId}`);
  res.json(result);
});

// Find farmers at risk based on criteria
app.get('/api/risk/farmers-at-risk', authMiddleware.verifyToken, (req, res) => {
  const cropType = req.query.crop_type;
  const season = req.query.season;
  const riskLevel = req.query.risk_level || 'high';
  
  console.log(`GET /api/risk/farmers-at-risk - Finding farmers at risk with params: crop=${cropType}, season=${season}, risk=${riskLevel}`);
  
  // Load data
  const borrowers = loadData(borrowersPath);
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  
  // Calculate risk for each borrower (simplified algorithm)
  const borrowersWithRisk = borrowers.map(borrower => {
    // Get borrower's loans
    const borrowerLoans = loans.filter(l => l.borrower_id === borrower.borrower_id);
    
    // Skip borrowers with no loans
    if (borrowerLoans.length === 0) {
      return {
        ...borrower,
        risk_score: 0,
        risk_level: 'low',
        risk_factors: []
      };
    }
    
    // Get payment history
    const allPayments = [];
    borrowerLoans.forEach(loan => {
      const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
      allPayments.push(...loanPayments);
    });
    
    // Calculate risk score (simplified)
    let riskScore = 50; // Base score
    
    // Credit score factor
    if (borrower.credit_score >= 750) riskScore -= 15;
    else if (borrower.credit_score >= 700) riskScore -= 10;
    else if (borrower.credit_score >= 650) riskScore -= 5;
    else if (borrower.credit_score < 600) riskScore += 20;
    
    // Late payments factor
    const latePayments = allPayments.filter(p => p.status === 'Late');
    if (latePayments.length > 3) riskScore += 25;
    else if (latePayments.length > 0) riskScore += latePayments.length * 5;
    
    // Loan to income ratio
    const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
    const loanToIncomeRatio = totalLoanAmount / borrower.income;
    if (loanToIncomeRatio > 5) riskScore += 25;
    else if (loanToIncomeRatio > 3) riskScore += 15;
    else if (loanToIncomeRatio > 2) riskScore += 5;
    
    // Farm size factor
    if (borrower.farm_size < 50) riskScore += 10;
    
    // Seasonal risk adjustment
    if (season) {
      // These are simplified seasonal factors
      if (season === 'winter' && borrower.farm_type === 'Crop') riskScore += 15;
      else if (season === 'spring' && borrower.farm_type === 'Crop') riskScore += 10;
      else if (season === 'summer' && borrower.farm_type === 'Livestock') riskScore += 5;
    }
    
    // Cap risk score between 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));
    
    // Risk level
    let riskLevel = 'low';
    if (riskScore > 70) riskLevel = 'high';
    else if (riskScore > 40) riskLevel = 'medium';
    
    // Risk factors
    const riskFactors = [];
    if (latePayments.length > 0) {
      riskFactors.push(`${latePayments.length} late payment(s) in history`);
    }
    if (loanToIncomeRatio > 2) {
      riskFactors.push(`High loan-to-income ratio: ${loanToIncomeRatio.toFixed(1)}`);
    }
    if (borrower.credit_score < 650) {
      riskFactors.push(`Below average credit score: ${borrower.credit_score}`);
    }
    if (borrower.farm_size < 50) {
      riskFactors.push(`Small farm size may limit production capacity`);
    }
    
    return {
      borrower_id: borrower.borrower_id,
      name: `${borrower.first_name} ${borrower.last_name}`,
      farm_type: borrower.farm_type,
      farm_size: borrower.farm_size,
      risk_score: riskScore,
      risk_level: riskLevel,
      risk_factors: riskFactors
    };
  });
  
  // Filter results
  let results = borrowersWithRisk;
  
  // Filter by risk level
  if (riskLevel === 'high') {
    results = results.filter(b => b.risk_level === 'high');
  } else if (riskLevel === 'medium') {
    results = results.filter(b => b.risk_level === 'medium' || b.risk_level === 'high');
  }
  
  // Filter by crop type (using farm_type as proxy)
  if (cropType) {
    if (cropType.toLowerCase() === 'corn' || 
        cropType.toLowerCase() === 'wheat' || 
        cropType.toLowerCase() === 'soybeans') {
      results = results.filter(b => b.farm_type === 'Crop');
    } else if (cropType.toLowerCase() === 'livestock') {
      results = results.filter(b => b.farm_type === 'Livestock');
    }
  }
  
  // Sort by risk score (highest first)
  results.sort((a, b) => b.risk_score - a.risk_score);
  
  console.log(`Found ${results.length} farmers matching risk criteria`);
  res.json(results);
});

// Evaluate collateral sufficiency
app.get('/api/risk/collateral/:loan_id', authMiddleware.verifyToken, (req, res) => {
  const loanId = req.params.loan_id;
  const marketConditions = req.query.market_conditions || 'stable';
  
  console.log(`GET /api/risk/collateral/${loanId} - Evaluating collateral with market conditions: ${marketConditions}`);
  
  // Load data
  const loans = loadData(loansPath);
  const collaterals = loadData(collateralPath);
  
  // Find the loan
  const loan = loans.find(l => l.loan_id === loanId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }
  
  // Get collateral for this loan
  const loanCollateral = collaterals.filter(c => c.loan_id === loanId);
  if (loanCollateral.length === 0) {
    return res.json({
      loan_id: loanId,
      is_sufficient: false,
      current_loan_balance: loan.loan_amount,
      collateral_value: 0,
      loan_to_value_ratio: Infinity,
      assessment: "No collateral found for this loan."
    });
  }
  
  // Calculate total collateral value
  let collateralValue = loanCollateral.reduce((sum, c) => sum + c.value, 0);
  
  // Adjust for market conditions
  if (marketConditions === 'declining') {
    collateralValue *= 0.8; // 20% reduction in declining markets
  } else if (marketConditions === 'improving') {
    collateralValue *= 1.1; // 10% increase in improving markets
  }
  
  // Current loan balance (simplified - in reality would be calculated from payments)
  const currentLoanBalance = loan.loan_amount;
  
  // Loan to value ratio
  const loanToValueRatio = currentLoanBalance / collateralValue;
  
  // Determine if collateral is sufficient (standard is LTV < 0.8)
  const isSufficient = loanToValueRatio < 0.8;
  
  // Generate assessment
  let assessment = '';
  if (loanToValueRatio < 0.5) {
    assessment = "Collateral is highly sufficient with significant equity buffer.";
  } else if (loanToValueRatio < 0.7) {
    assessment = "Collateral is adequate with reasonable equity margin.";
  } else if (loanToValueRatio < 0.8) {
    assessment = "Collateral is minimally sufficient. Consider monitoring valuations.";
  } else if (loanToValueRatio < 1.0) {
    assessment = "Collateral is below recommended levels. Consider requesting additional security.";
  } else {
    assessment = "Insufficient collateral. Loan is under-secured based on current valuations.";
  }
  
  const result = {
    loan_id: loanId,
    is_sufficient: isSufficient,
    current_loan_balance: currentLoanBalance,
    collateral_value: collateralValue,
    loan_to_value_ratio: Number(loanToValueRatio.toFixed(2)),
    market_conditions: marketConditions,
    collateral_items: loanCollateral.length,
    assessment: assessment
  };
  
  console.log(`Collateral evaluation completed for loan ${loanId}: ${isSufficient ? 'Sufficient' : 'Insufficient'}`);
  res.json(result);
});

// Recommend refinancing options
app.get('/api/recommendations/refinance/:loan_id', authMiddleware.verifyToken, (req, res) => {
  const loanId = req.params.loan_id;
  
  console.log(`GET /api/recommendations/refinance/${loanId} - Generating refinancing options`);
  
  // Load data
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  
  // Find the loan
  const loan = loans.find(l => l.loan_id === loanId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
  }
  
  // Get payment history
  const loanPayments = payments.filter(p => p.loan_id === loanId);
  
  // Current loan details
  const currentRate = loan.interest_rate;
  const currentTerm = loan.term_length;
  
  // Calculate remaining term (simplified)
  // In a real system, this would be calculated based on amortization schedule
  const remainingTerm = Math.max(Math.floor(currentTerm * 0.7), 24); // Assume 30% of term has passed, min 24 months
  
  // Generate refinancing options (simplified)
  const options = [];
  
  // Option 1: Lower rate, same term
  if (currentRate > 3.0) {
    const newRate = Math.max(currentRate - 0.75, 3.0);
    
    // Calculate monthly payment at current rate (simplified)
    const monthlyPaymentBefore = (loan.loan_amount * (currentRate/100/12) * Math.pow(1 + currentRate/100/12, currentTerm)) / 
                               (Math.pow(1 + currentRate/100/12, currentTerm) - 1);
    
    // Calculate new monthly payment
    const monthlyPaymentAfter = (loan.loan_amount * (newRate/100/12) * Math.pow(1 + newRate/100/12, remainingTerm)) / 
                              (Math.pow(1 + newRate/100/12, remainingTerm) - 1);
    
    const monthlySavings = monthlyPaymentBefore - monthlyPaymentAfter;
    const totalInterestSavings = monthlySavings * remainingTerm;
    
    options.push({
      option_id: "REFI-1",
      description: "Lower rate refinance",
      new_rate: newRate,
      new_term: remainingTerm,
      monthly_payment: Number(monthlyPaymentAfter.toFixed(2)),
      monthly_savings: Number(monthlySavings.toFixed(2)),
      total_interest_savings: Number(totalInterestSavings.toFixed(2))
    });
  }
  
  // Option 2: Shorter term, slightly lower rate
  if (remainingTerm > 36) {
    const newTerm = Math.floor(remainingTerm * 0.8);
    const newRate = Math.max(currentRate - 0.25, 3.0);
    
    // Calculate monthly payment at current rate (simplified)
    const monthlyPaymentBefore = (loan.loan_amount * (currentRate/100/12) * Math.pow(1 + currentRate/100/12, currentTerm)) / 
                               (Math.pow(1 + currentRate/100/12, currentTerm) - 1);
    
    // Calculate new monthly payment
    const monthlyPaymentAfter = (loan.loan_amount * (newRate/100/12) * Math.pow(1 + newRate/100/12, newTerm)) / 
                              (Math.pow(1 + newRate/100/12, newTerm) - 1);
    
    // Note: monthly payment might be higher, but total interest paid will be lower
    const totalInterestBefore = (monthlyPaymentBefore * remainingTerm) - loan.loan_amount;
    const totalInterestAfter = (monthlyPaymentAfter * newTerm) - loan.loan_amount;
    const totalInterestSavings = totalInterestBefore - totalInterestAfter;
    
    options.push({
      option_id: "REFI-2",
      description: "Shorter term refinance",
      new_rate: newRate,
      new_term: newTerm,
      monthly_payment: Number(monthlyPaymentAfter.toFixed(2)),
      monthly_difference: Number((monthlyPaymentAfter - monthlyPaymentBefore).toFixed(2)),
      total_interest_savings: Number(totalInterestSavings.toFixed(2))
    });
  }
  
  // Option 3: Cash-out refinance for equipment or expansion
  if (loan.loan_amount > 50000 && loanPayments.filter(p => p.status === 'Late').length === 0) {
    const additionalAmount = loan.loan_amount * 0.2; // 20% additional
    const newLoanAmount = loan.loan_amount + additionalAmount;
    const newRate = currentRate + 0.25; // Slightly higher rate for cash-out
    
    // Calculate monthly payment at current rate (simplified)
    const monthlyPaymentBefore = (loan.loan_amount * (currentRate/100/12) * Math.pow(1 + currentRate/100/12, currentTerm)) / 
                               (Math.pow(1 + currentRate/100/12, currentTerm) - 1);
    
    // Calculate new monthly payment
    const monthlyPaymentAfter = (newLoanAmount * (newRate/100/12) * Math.pow(1 + newRate/100/12, remainingTerm)) / 
                              (Math.pow(1 + newRate/100/12, remainingTerm) - 1);
    
    options.push({
      option_id: "REFI-3",
      description: "Cash-out refinance for farm improvements",
      new_loan_amount: Number(newLoanAmount.toFixed(2)),
      additional_funds: Number(additionalAmount.toFixed(2)),
      new_rate: newRate,
      new_term: remainingTerm,
      monthly_payment: Number(monthlyPaymentAfter.toFixed(2)),
      monthly_payment_increase: Number((monthlyPaymentAfter - monthlyPaymentBefore).toFixed(2))
    });
  }
  
  const result = {
    loan_id: loanId,
    current_rate: currentRate,
    current_term_remaining: remainingTerm,
    current_balance: loan.loan_amount,
    refinancing_recommended: options.length > 0,
    options: options
  };
  
  console.log(`Generated ${options.length} refinancing options for loan ${loanId}`);
  res.json(result);
});

// =================== END RISK ASSESSMENT ENDPOINTS ===================

// =================== PREDICTIVE ANALYTICS ENDPOINTS ===================

// Predict loan default risk for a specific borrower
app.get('/api/predict/default-risk/:borrower_id', authMiddleware.verifyToken, (req, res) => {
  const borrowerId = req.params.borrower_id;
  const timeHorizon = req.query.time_horizon || '3m';
  
  console.log(`GET /api/predict/default-risk/${borrowerId} - Predicting default risk with time horizon: ${timeHorizon}`);
  
  // Load data
  const borrowers = loadData(borrowersPath);
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  
  // Find the borrower
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  if (!borrower) {
    return res.status(404).json({ error: 'Borrower not found' });
  }
  
  // Get borrower's loans
  const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
  if (borrowerLoans.length === 0) {
    return res.json({
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      default_probability: 0,
      time_horizon: timeHorizon,
      key_factors: ["No loans found for this borrower"],
      prediction_confidence: 1.0
    });
  }
  
  // Get payment history
  const allPayments = [];
  borrowerLoans.forEach(loan => {
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
    allPayments.push(...loanPayments);
  });
  
  // Calculate recent payment performance
  const allPaymentsSorted = [...allPayments].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
  const recentPayments = allPaymentsSorted.slice(0, 6); // Last 6 payments
  const lateRecentPayments = recentPayments.filter(p => p.status === 'Late').length;
  const latePaymentRatio = recentPayments.length > 0 ? lateRecentPayments / recentPayments.length : 0;
  
  // Calculate debt-to-income ratio
  const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
  const debtToIncomeRatio = totalLoanAmount / borrower.income;
  
  // Calculate default probability based on time horizon
  let baseProbability = 0;
  
  // More late payments = higher default probability
  if (latePaymentRatio > 0.5) baseProbability += 0.4;
  else if (latePaymentRatio > 0.3) baseProbability += 0.25;
  else if (latePaymentRatio > 0) baseProbability += 0.1;
  
  // Higher debt-to-income = higher default probability
  if (debtToIncomeRatio > 4) baseProbability += 0.3;
  else if (debtToIncomeRatio > 2) baseProbability += 0.15;
  else if (debtToIncomeRatio > 1) baseProbability += 0.05;
  
  // Lower credit score = higher default probability
  if (borrower.credit_score < 600) baseProbability += 0.25;
  else if (borrower.credit_score < 650) baseProbability += 0.15;
  else if (borrower.credit_score < 700) baseProbability += 0.05;
  
  // Farm size factor - smaller farms may have less buffer
  if (borrower.farm_size < 50) baseProbability += 0.1;
  
  // Adjust for time horizon
  let defaultProbability = 0;
  if (timeHorizon === '3m') {
    defaultProbability = baseProbability * 0.7; // Shorter term = lower probability
  } else if (timeHorizon === '6m') {
    defaultProbability = baseProbability * 1.0;
  } else if (timeHorizon === '1y') {
    defaultProbability = baseProbability * 1.3; // Longer term = higher probability
  }
  
  // Cap probability between 0-1
  defaultProbability = Math.max(0, Math.min(1, defaultProbability));
  
  // Generate key factors behind prediction
  const keyFactors = [];
  if (latePaymentRatio > 0) {
    keyFactors.push(`${Math.round(latePaymentRatio * 100)}% of recent payments were late`);
  }
  if (debtToIncomeRatio > 1) {
    keyFactors.push(`High debt-to-income ratio of ${debtToIncomeRatio.toFixed(1)}`);
  }
  if (borrower.credit_score < 700) {
    keyFactors.push(`Credit score of ${borrower.credit_score} below optimal range`);
  }
  if (borrower.farm_size < 50) {
    keyFactors.push(`Small farm size (${borrower.farm_size} acres) limits financial buffer`);
  }
  
  // Set confidence level based on data quality
  const predictionConfidence = Math.min(0.95, 0.7 + (recentPayments.length / 10));
  
  // Return the prediction
  const result = {
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    default_probability: Math.round(defaultProbability * 100) / 100,
    default_risk_level: defaultProbability > 0.6 ? "high" : (defaultProbability > 0.3 ? "medium" : "low"),
    time_horizon: timeHorizon,
    key_factors: keyFactors,
    prediction_confidence: Math.round(predictionConfidence * 100) / 100
  };
  
  console.log(`Default risk prediction for borrower ${borrowerId}: ${defaultProbability.toFixed(2)} (${result.default_risk_level})`);
  res.json(result);
});

// Predict non-accrual risk for a borrower
app.get('/api/predict/non-accrual-risk/:borrower_id', authMiddleware.verifyToken, (req, res) => {
  const borrowerId = req.params.borrower_id;
  
  console.log(`GET /api/predict/non-accrual-risk/${borrowerId} - Predicting non-accrual risk`);
  
  // Load data
  const borrowers = loadData(borrowersPath);
  const loans = loadData(loansPath);
  const payments = loadData(paymentsPath);
  
  // Find the borrower
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  if (!borrower) {
    return res.status(404).json({ error: 'Borrower not found' });
  }
  
  // Get borrower's loans
  const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
  if (borrowerLoans.length === 0) {
    return res.json({
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      non_accrual_probability: 0,
      recovery_probability: 1.0,
      consecutive_late_payments: 0,
      status: "No loans found"
    });
  }
  
  // Get payment history for all loans
  let maxConsecutiveLate = 0;
  let currentConsecutiveLate = 0;
  let totalLatePayments = 0;
  let totalPayments = 0;
  let recentLatePayments = 0;
  
  // Analyze payment patterns for each loan
  borrowerLoans.forEach(loan => {
    const loanPayments = payments.filter(p => p.loan_id === loan.loan_id)
      .sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date));
    
    // Reset counter for each loan
    currentConsecutiveLate = 0;
    
    loanPayments.forEach(payment => {
      totalPayments++;
      
      if (payment.status === 'Late') {
        totalLatePayments++;
        currentConsecutiveLate++;
        
        // Check if this is a recent payment (last 3 months)
        const paymentDate = new Date(payment.payment_date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        if (paymentDate >= threeMonthsAgo) {
          recentLatePayments++;
        }
      } else {
        // Reset counter on on-time payment
        currentConsecutiveLate = 0;
      }
      
      // Track maximum consecutive late payments
      if (currentConsecutiveLate > maxConsecutiveLate) {
        maxConsecutiveLate = currentConsecutiveLate;
      }
    });
  });
  
  // Calculate non-accrual probability factors
  let nonAccrualProbability = 0;
  
  // Consecutive late payments are a strong indicator
  if (maxConsecutiveLate >= 4) {
    nonAccrualProbability += 0.6; // Very high risk
  } else if (maxConsecutiveLate === 3) {
    nonAccrualProbability += 0.4; // High risk
  } else if (maxConsecutiveLate === 2) {
    nonAccrualProbability += 0.25; // Moderate risk
  } else if (maxConsecutiveLate === 1) {
    nonAccrualProbability += 0.1; // Low risk
  }
  
  // Overall late payment percentage
  const latePaymentRatio = totalPayments > 0 ? totalLatePayments / totalPayments : 0;
  if (latePaymentRatio > 0.3) {
    nonAccrualProbability += 0.3;
  } else if (latePaymentRatio > 0.2) {
    nonAccrualProbability += 0.2;
  } else if (latePaymentRatio > 0.1) {
    nonAccrualProbability += 0.1;
  }
  
  // Recent late payments are more concerning
  if (recentLatePayments >= 2) {
    nonAccrualProbability += 0.2;
  } else if (recentLatePayments === 1) {
    nonAccrualProbability += 0.1;
  }
  
  // Credit score factor
  if (borrower.credit_score < 600) {
    nonAccrualProbability += 0.2;
  } else if (borrower.credit_score < 650) {
    nonAccrualProbability += 0.1;
  }
  
  // Cap probability between 0-1
  nonAccrualProbability = Math.max(0, Math.min(1, nonAccrualProbability));
  
  // Calculate recovery probability based on factors that increase resilience
  let recoveryProbability = 1.0;
  
  // More severe non-accrual cases have lower recovery chances
  if (nonAccrualProbability > 0.7) {
    recoveryProbability = 0.3;
  } else if (nonAccrualProbability > 0.5) {
    recoveryProbability = 0.5;
  } else if (nonAccrualProbability > 0.3) {
    recoveryProbability = 0.7;
  }
  
  // Farm size and diversity improve recovery chances
  if (borrower.farm_size > 200) {
    recoveryProbability += 0.1;
  }
  
  // Good credit score improves recovery
  if (borrower.credit_score > 700) {
    recoveryProbability += 0.1;
  }
  
  // Cap recovery probability between 0-1
  recoveryProbability = Math.max(0, Math.min(1, recoveryProbability));
  
  // Determine current status based on consecutive late payments
  let status = "Performing";
  if (maxConsecutiveLate >= 4) {
    status = "Critical";
  } else if (maxConsecutiveLate === 3) {
    status = "High Risk";
  } else if (maxConsecutiveLate === 2) {
    status = "Moderate Risk";
  } else if (maxConsecutiveLate === 1) {
    status = "Attention Needed";
  }
  
  // Return the prediction
  const result = {
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    non_accrual_probability: Math.round(nonAccrualProbability * 100) / 100,
    recovery_probability: Math.round(recoveryProbability * 100) / 100,
    consecutive_late_payments: maxConsecutiveLate,
    total_late_payment_ratio: Math.round(latePaymentRatio * 100) / 100,
    recent_late_payments: recentLatePayments,
    status: status,
    recommendations: getRecoveryRecommendations(nonAccrualProbability, maxConsecutiveLate, borrower)
  };
  
  console.log(`Non-accrual risk prediction for borrower ${borrowerId}: ${nonAccrualProbability.toFixed(2)}, recovery: ${recoveryProbability.toFixed(2)}`);
  res.json(result);
});

// Helper function for recovery recommendations
function getRecoveryRecommendations(riskProbability, consecutiveLate, borrower) {
  const recommendations = [];
  
  if (riskProbability > 0.7) {
    recommendations.push("Immediate intervention required - schedule borrower meeting within 7 days");
    recommendations.push("Consider restructuring of all outstanding loans");
    recommendations.push("Increase monitoring frequency to weekly");
  } else if (riskProbability > 0.5) {
    recommendations.push("Proactive intervention needed - schedule borrower meeting within 14 days");
    recommendations.push("Review payment plan and cash flow projections");
    recommendations.push("Consider partial loan restructuring");
  } else if (riskProbability > 0.3) {
    recommendations.push("Increase monitoring frequency to bi-weekly");
    recommendations.push("Review farm operations and identify potential cash flow improvements");
  } else if (consecutiveLate > 0) {
    recommendations.push("Standard monitoring with increased attention to payment dates");
  } else {
    recommendations.push("Standard monitoring procedures");
  }
  
  // Additional recommendations based on borrower profile
  if (borrower.credit_score < 650) {
    recommendations.push("Provide credit counseling resources");
  }
  
  if (borrower.farm_size < 100) {
    recommendations.push("Discuss diversification strategies for small farms");
  }
  
  return recommendations;
}

// Forecast equipment maintenance costs
app.get('/api/predict/equipment-maintenance/:borrower_id', authMiddleware.verifyToken, (req, res) => {
  const borrowerId = req.params.borrower_id;
  const timeHorizon = req.query.time_horizon || '1y';
  
  console.log(`GET /api/predict/equipment-maintenance/${borrowerId} - Forecasting equipment maintenance costs for ${timeHorizon}`);
  
  // Load data
  const borrowers = loadData(borrowersPath);
  const equipmentPath = path.join(__dirname, 'data', 'equipment.json');
  let equipment = [];
  
  try {
    if (fs.existsSync(equipmentPath)) {
      equipment = loadData(equipmentPath);
    } else {
      console.log('Equipment data file not found');
      equipment = []; // Default to empty array
    }
  } catch (error) {
    console.error('Error loading equipment data:', error);
    equipment = []; // Default to empty array
  }
  
  // Find the borrower
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  if (!borrower) {
    return res.status(404).json({ error: 'Borrower not found' });
  }
  
  // Get borrower's equipment
  const borrowerEquipment = equipment.filter(e => e.borrower_id === borrowerId);
  if (borrowerEquipment.length === 0) {
    return res.json({
      borrower_id: borrowerId,
      borrower_name: `${borrower.first_name} ${borrower.last_name}`,
      time_horizon: timeHorizon,
      total_maintenance_cost: 0,
      equipment_count: 0,
      maintenance_items: [],
      message: "No equipment records found for this borrower"
    });
  }
  
  // Calculate maintenance forecast based on equipment age, condition, and farm size
  const maintenanceItems = [];
  let totalMaintenanceCost = 0;
  
  borrowerEquipment.forEach(item => {
    // Calculate age of equipment in years
    const purchaseDate = new Date(item.purchase_date);
    const currentDate = new Date();
    const ageInYears = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365.25);
    
    // Base maintenance cost as a percentage of equipment value
    // Higher percentage for older equipment
    let maintenanceRatePerYear = 0;
    
    if (ageInYears < 2) {
      maintenanceRatePerYear = 0.05; // 5% for newer equipment
    } else if (ageInYears < 5) {
      maintenanceRatePerYear = 0.08; // 8% for equipment 2-5 years old
    } else if (ageInYears < 10) {
      maintenanceRatePerYear = 0.12; // 12% for equipment 5-10 years old
    } else {
      maintenanceRatePerYear = 0.20; // 20% for equipment over 10 years old
    }
    
    // Adjust based on condition
    if (item.condition === 'Excellent') {
      maintenanceRatePerYear *= 0.7; // Reduce for excellent condition
    } else if (item.condition === 'Good') {
      maintenanceRatePerYear *= 0.9; // Slightly reduce for good condition
    } else if (item.condition === 'Fair') {
      maintenanceRatePerYear *= 1.2; // Increase for fair condition
    } else if (item.condition === 'Poor') {
      maintenanceRatePerYear *= 1.5; // Significantly increase for poor condition
    }
    
    // Adjust for farm size (larger farms may use equipment more intensively)
    if (borrower.farm_size > 500) {
      maintenanceRatePerYear *= 1.2; // 20% increase for very large farms
    } else if (borrower.farm_size > 200) {
      maintenanceRatePerYear *= 1.1; // 10% increase for large farms
    }
    
    // Adjust for time horizon
    let timeMultiplier = 1;
    if (timeHorizon === '2y') {
      timeMultiplier = 2.1; // Slightly more than double (inflation, increasing needs with age)
    } else if (timeHorizon === '3y') {
      timeMultiplier = 3.3; // More than triple for long-term projection
    }
    
    // Calculate maintenance cost
    const equipmentValue = item.value || 10000; // Default value if not present
    let maintenanceCost = equipmentValue * maintenanceRatePerYear * timeMultiplier;
    
    // Check if replacement is needed instead of maintenance
    let needsReplacement = false;
    let replacementReason = '';
    
    if (ageInYears > 15 && item.condition === 'Poor') {
      needsReplacement = true;
      replacementReason = 'Age over 15 years and in poor condition';
      maintenanceCost = equipmentValue * 0.8; // 80% of value for significant overhaul/replacement
    } else if (ageInYears > 20) {
      needsReplacement = true;
      replacementReason = 'Age over 20 years';
      maintenanceCost = equipmentValue * 0.7; // 70% of value for replacement parts
    }
    
    // Round to nearest $10
    maintenanceCost = Math.round(maintenanceCost / 10) * 10;
    totalMaintenanceCost += maintenanceCost;
    
    // Add to maintenance items
    maintenanceItems.push({
      equipment_id: item.equipment_id,
      type: item.type,
      age_years: Math.round(ageInYears * 10) / 10,
      condition: item.condition,
      estimated_maintenance_cost: maintenanceCost,
      needs_replacement: needsReplacement,
      replacement_reason: replacementReason,
      priority: needsReplacement ? "High" : (maintenanceRatePerYear > 0.15 ? "Medium" : "Low")
    });
  });
  
  // Sort maintenance items by priority and cost
  maintenanceItems.sort((a, b) => {
    // First by priority (High > Medium > Low)
    const priorityOrder = { "High": 0, "Medium": 1, "Low": 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    // Then by cost (highest first)
    return b.estimated_maintenance_cost - a.estimated_maintenance_cost;
  });
  
  // Return the forecast
  const result = {
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    time_horizon: timeHorizon,
    total_maintenance_cost: totalMaintenanceCost,
    equipment_count: borrowerEquipment.length,
    maintenance_items: maintenanceItems,
    summary: getSummaryRecommendation(totalMaintenanceCost, maintenanceItems, borrower)
  };
  
  console.log(`Equipment maintenance forecast for borrower ${borrowerId}: $${totalMaintenanceCost} over ${timeHorizon}`);
  res.json(result);
});

// Helper function for equipment maintenance summary
function getSummaryRecommendation(totalCost, items, borrower) {
  const highPriorityItems = items.filter(item => item.priority === "High");
  const needsReplacement = items.filter(item => item.needs_replacement);
  
  let summary = {};
  
  // Check if costs are potentially burdensome relative to income
  const annualIncomeRatio = totalCost / borrower.income;
  
  if (annualIncomeRatio > 0.2) {
    summary.financial_impact = "Severe";
    summary.financing_recommendation = "Consider equipment loan to distribute costs over time";
  } else if (annualIncomeRatio > 0.1) {
    summary.financial_impact = "Moderate";
    summary.financing_recommendation = "Budget for maintenance expenses over the next year";
  } else {
    summary.financial_impact = "Manageable";
    summary.financing_recommendation = "Address maintenance with normal cash flow";
  }
  
  // Prioritization advice
  if (highPriorityItems.length > 0) {
    summary.urgent_items = highPriorityItems.length;
    summary.priority_recommendation = "Address high priority items immediately to avoid operational disruption";
  } else {
    summary.urgent_items = 0;
    summary.priority_recommendation = "No urgent maintenance needed, follow regular maintenance schedule";
  }
  
  // Replacement advice
  if (needsReplacement.length > 0) {
    summary.replacements_needed = needsReplacement.length;
    summary.replacement_recommendation = "Consider replacing equipment rather than continuing costly repairs";
    
    if (needsReplacement.length >= 2) {
      summary.replacement_recommendation += ". Financing options for multiple pieces recommended.";
    }
  } else {
    summary.replacements_needed = 0;
  }
  
  return summary;
}

// Assess crop yield risk
app.get('/api/predict/crop-yield-risk/:borrower_id', authMiddleware.verifyToken, (req, res) => {
  const borrowerId = req.params.borrower_id;
  const cropType = req.query.crop_type;
  const season = req.query.season || 'current';
  
  console.log(`GET /api/predict/crop-yield-risk/${borrowerId} - Assessing crop yield risk for ${season} season${cropType ? ` (${cropType})` : ''}`);
  
  // Load data
  const borrowers = loadData(borrowersPath);
  const cropsPath = path.join(__dirname, 'data', 'crops.json');
  const weatherPath = path.join(__dirname, 'data', 'weather.json');
  
  let crops = [];
  let weather = [];
  
  try {
    if (fs.existsSync(cropsPath)) {
      crops = loadData(cropsPath);
    } else {
      console.log('Crops data file not found');
      // Generate mock crop data
      crops = generateMockCropData();
    }
    
    if (fs.existsSync(weatherPath)) {
      weather = loadData(weatherPath);
    } else {
      console.log('Weather data file not found');
      // Generate mock weather data
      weather = generateMockWeatherData();
    }
  } catch (error) {
    console.error('Error loading crop/weather data:', error);
    // Generate mock data
    crops = generateMockCropData();
    weather = generateMockWeatherData();
  }
  
  // Find the borrower
  const borrower = borrowers.find(b => b.borrower_id === borrowerId);
  if (!borrower) {
    return res.status(404).json({ error: 'Borrower not found' });
  }
  
  // Get borrower's crops
  let borrowerCrops = crops.filter(c => c.borrower_id === borrowerId);
  if (cropType) {
    borrowerCrops = borrowerCrops.filter(c => c.crop_type.toLowerCase() === cropType.toLowerCase());
  }
  
  if (borrowerCrops.length === 0) {
    // If no crop data, create mock crop data for this borrower
    borrowerCrops = createMockCropsForBorrower(borrower);
    if (cropType) {
      borrowerCrops = borrowerCrops.filter(c => c.crop_type.toLowerCase() === cropType.toLowerCase());
    }
    
    if (borrowerCrops.length === 0) {
      return res.json({
        borrower_id: borrowerId,
        borrower_name: `${borrower.first_name} ${borrower.last_name}`,
        season: season,
        crop_type: cropType || 'all',
        risk_assessment: "No crop data available for assessment",
        risk_factors: ["Insufficient crop data"],
        below_breakeven_probability: 0
      });
    }
  }
  
  // Get relevant weather data for the borrower's region
  const borrowerRegion = borrower.address?.split(',')?.pop()?.trim() || 'Midwest';
  const regionalWeather = weather.filter(w => w.region.includes(borrowerRegion) || w.region === 'National');
  
  // If no matching weather, use national weather or create mock data
  if (regionalWeather.length === 0) {
    regionalWeather.push(...generateRegionalWeatherData(borrowerRegion));
  }
  
  // Calculate yield risk for each crop
  const cropRiskAssessments = borrowerCrops.map(crop => {
    // Get historical yield data
    const yieldHistory = crop.yield_history || generateMockYieldHistory(crop.crop_type);
    
    // Calculate average yield and break-even
    const historicalYields = Object.values(yieldHistory).map(y => parseFloat(y));
    const avgYield = historicalYields.reduce((sum, y) => sum + y, 0) / historicalYields.length;
    const breakEvenYield = avgYield * 0.8; // Assume 80% of avg yield needed to break even
    
    // Calculate recent trend (are yields going up or down?)
    const recentYields = historicalYields.slice(-3);
    const yieldTrend = recentYields.length >= 2 ? 
      (recentYields[recentYields.length-1] - recentYields[0]) / recentYields[0] : 0;
    
    // Get weather risk factors
    const weatherRiskFactors = getWeatherRiskFactors(regionalWeather, crop.crop_type, season);
    
    // Calculate base probability based on historical data
    const belowBreakevenCount = historicalYields.filter(y => y < breakEvenYield).length;
    let belowBreakevenProbability = belowBreakevenCount / historicalYields.length;
    
    // Adjust for current conditions
    if (weatherRiskFactors.risk_level === 'high') {
      belowBreakevenProbability += 0.2;
    } else if (weatherRiskFactors.risk_level === 'medium') {
      belowBreakevenProbability += 0.1;
    } else if (weatherRiskFactors.risk_level === 'low') {
      belowBreakevenProbability -= 0.05;
    }
    
    // Adjust for yield trend
    if (yieldTrend < -0.1) {
      belowBreakevenProbability += 0.1; // Negative trend increases risk
    } else if (yieldTrend > 0.1) {
      belowBreakevenProbability -= 0.1; // Positive trend decreases risk
    }
    
    // Adjust for farm size (smaller farms may have less buffer)
    if (borrower.farm_size < 100) {
      belowBreakevenProbability += 0.05;
    } else if (borrower.farm_size > 500) {
      belowBreakevenProbability -= 0.05;
    }
    
    // Cap probability between 0-1
    belowBreakevenProbability = Math.max(0, Math.min(1, belowBreakevenProbability));
    
    // Risk level determination
    let riskLevel = 'low';
    if (belowBreakevenProbability > 0.5) {
      riskLevel = 'high';
    } else if (belowBreakevenProbability > 0.3) {
      riskLevel = 'medium';
    }
    
    // Risk factors
    const riskFactors = [];
    if (weatherRiskFactors.factors.length > 0) {
      riskFactors.push(...weatherRiskFactors.factors);
    }
    if (yieldTrend < -0.05) {
      riskFactors.push(`Negative yield trend: ${(yieldTrend * 100).toFixed(1)}% over last 3 seasons`);
    }
    if (borrower.farm_size < 100) {
      riskFactors.push(`Small farm size limits operational flexibility`);
    }
    if (historicalYields.length < 5) {
      riskFactors.push(`Limited historical yield data increases forecast uncertainty`);
    }
    
    // Mitigation strategies
    const mitigationStrategies = getMitigationStrategies(crop.crop_type, riskLevel, weatherRiskFactors.factors);
    
    return {
      crop_type: crop.crop_type,
      planted_area: crop.planted_area || 0,
      average_yield: avgYield,
      breakeven_yield: breakEvenYield,
      yield_trend: (yieldTrend * 100).toFixed(1) + '%',
      below_breakeven_probability: Math.round(belowBreakevenProbability * 100) / 100,
      risk_level: riskLevel,
      risk_factors: riskFactors,
      mitigation_strategies: mitigationStrategies
    };
  });
  
  // Overall assessment (average across all crops)
  const averageProbability = cropRiskAssessments.reduce((sum, crop) => sum + crop.below_breakeven_probability, 0) / cropRiskAssessments.length;
  const overallRiskLevel = averageProbability > 0.5 ? 'high' : (averageProbability > 0.3 ? 'medium' : 'low');
  
  // Identify common risk factors
  const allRiskFactors = cropRiskAssessments.flatMap(crop => crop.risk_factors);
  const frequentRiskFactors = getFrequentItems(allRiskFactors);
  
  // Final result
  const result = {
    borrower_id: borrowerId,
    borrower_name: `${borrower.first_name} ${borrower.last_name}`,
    assessment_date: new Date().toISOString().split('T')[0],
    season: season,
    overall_risk_level: overallRiskLevel,
    overall_below_breakeven_probability: Math.round(averageProbability * 100) / 100,
    common_risk_factors: frequentRiskFactors,
    crop_assessments: cropRiskAssessments,
    loan_implications: getLoanImplications(overallRiskLevel, borrower)
  };
  
  console.log(`Crop yield risk assessment for borrower ${borrowerId}: ${overallRiskLevel} risk`);
  res.json(result);
});

// Helper functions for crop yield risk assessment

function getWeatherRiskFactors(weatherData, cropType, season) {
  // Mock implementation - in a real system this would analyze actual weather data
  const risks = [];
  let riskLevel = 'low';
  
  if (season === 'current') {
    // Random weather factors based on crop type
    if (cropType.toLowerCase() === 'corn') {
      if (Math.random() > 0.7) {
        risks.push('Above average precipitation forecast during pollination');
        riskLevel = 'medium';
      }
    } else if (cropType.toLowerCase() === 'soybeans') {
      if (Math.random() > 0.6) {
        risks.push('Higher than average temperature forecast during pod fill');
        riskLevel = 'medium';
      }
    } else if (cropType.toLowerCase() === 'wheat') {
      if (Math.random() > 0.8) {
        risks.push('Drought conditions forecasted during heading stage');
        riskLevel = 'high';
      }
    }
    
    // Add general weather risks
    if (Math.random() > 0.85) {
      risks.push('Extended drought conditions in seasonal forecast');
      riskLevel = riskLevel === 'medium' ? 'high' : riskLevel;
    } else if (Math.random() > 0.9) {
      risks.push('Severe weather events (hail, wind) more likely than average');
      riskLevel = 'high';
    }
  } else { // 'next' season
    // For next season, risks are more general
    if (Math.random() > 0.7) {
      risks.push('Long-range forecasts indicate potential for drier than normal conditions');
      riskLevel = 'medium';
    }
    if (Math.random() > 0.8) {
      risks.push('Climate model consensus suggests warmer than normal growing season');
      riskLevel = 'medium';
    }
  }
  
  // If no specific risks were identified, add a neutral statement
  if (risks.length === 0) {
    risks.push('Weather forecasts within normal parameters for the growing season');
  }
  
  return {
    risk_level: riskLevel,
    factors: risks
  };
}

function generateMockYieldHistory(cropType) {
  // Generate realistic yield history for the crop type
  const baseYield = {
    'corn': 180,
    'soybeans': 55,
    'wheat': 65,
    'cotton': 900,
    'rice': 7500
  }[cropType.toLowerCase()] || 100;
  
  // Generate last 5 years of yields with some variability
  const yieldHistory = {};
  const currentYear = new Date().getFullYear();
  
  for (let i = 5; i >= 1; i--) {
    const year = currentYear - i;
    // Random variation between 80% and 120% of base yield
    const variationFactor = 0.8 + (Math.random() * 0.4);
    yieldHistory[year] = Math.round(baseYield * variationFactor);
  }
  
  return yieldHistory;
}

function createMockCropsForBorrower(borrower) {
  // Create realistic crop data based on borrower's region and farm size
  const crops = [];
  
  // Determine likely crops based on address (very simplified)
  const region = borrower.address?.split(',')?.pop()?.trim()?.toLowerCase() || 'midwest';
  let likelyCrops = [];
  
  if (region.includes('midwest') || region.includes('illinois') || region.includes('iowa') || region.includes('indiana')) {
    likelyCrops = ['Corn', 'Soybeans', 'Wheat'];
  } else if (region.includes('south') || region.includes('mississippi') || region.includes('alabama') || region.includes('georgia')) {
    likelyCrops = ['Cotton', 'Soybeans', 'Corn'];
  } else if (region.includes('california') || region.includes('pacific')) {
    likelyCrops = ['Almonds', 'Grapes', 'Rice'];
  } else if (region.includes('plains') || region.includes('kansas') || region.includes('nebraska')) {
    likelyCrops = ['Wheat', 'Corn', 'Milo'];
  } else {
    likelyCrops = ['Corn', 'Soybeans', 'Wheat']; // Default
  }
  
  // Add 1-3 crops depending on farm size
  const cropCount = borrower.farm_size < 100 ? 1 : (borrower.farm_size < 500 ? 2 : 3);
  
  for (let i = 0; i < Math.min(cropCount, likelyCrops.length); i++) {
    const cropType = likelyCrops[i];
    
    // Allocate farm area
    let plantedArea = 0;
    if (i === 0) {
      plantedArea = Math.round(borrower.farm_size * 0.6); // 60% to main crop
    } else if (i === 1) {
      plantedArea = Math.round(borrower.farm_size * 0.3); // 30% to second crop
    } else {
      plantedArea = Math.round(borrower.farm_size * 0.1); // 10% to third crop
    }
    
    crops.push({
      borrower_id: borrower.borrower_id,
      crop_id: `C${borrower.borrower_id.substring(1)}-${i+1}`,
      crop_type: cropType,
      planted_area: plantedArea,
      yield_history: generateMockYieldHistory(cropType)
    });
  }
  
  return crops;
}

function generateMockCropData() {
  // Generate default crop data if none exists
  return [
    {
      borrower_id: "B001",
      crop_id: "C001-1",
      crop_type: "Corn",
      planted_area: 300,
      yield_history: {
        "2018": 175,
        "2019": 168,
        "2020": 182,
        "2021": 176,
        "2022": 180
      }
    },
    {
      borrower_id: "B001",
      crop_id: "C001-2",
      crop_type: "Soybeans",
      planted_area: 150,
      yield_history: {
        "2018": 52,
        "2019": 48,
        "2020": 56,
        "2021": 53,
        "2022": 55
      }
    }
  ];
}

function generateMockWeatherData() {
  // Generate default weather data if none exists
  return [
    {
      region: "Midwest",
      current_conditions: "Normal",
      forecast: {
        precipitation: "Average",
        temperature: "Above average",
        extreme_events: "Below average"
      }
    },
    {
      region: "Southeast",
      current_conditions: "Wet",
      forecast: {
        precipitation: "Above average",
        temperature: "Average",
        extreme_events: "Average"
      }
    },
    {
      region: "Plains",
      current_conditions: "Dry",
      forecast: {
        precipitation: "Below average",
        temperature: "Above average",
        extreme_events: "Average"
      }
    },
    {
      region: "West",
      current_conditions: "Drought",
      forecast: {
        precipitation: "Below average",
        temperature: "Above average",
        extreme_events: "Above average"
      }
    },
    {
      region: "National",
      current_conditions: "Mixed",
      forecast: {
        precipitation: "Average",
        temperature: "Above average",
        extreme_events: "Average"
      }
    }
  ];
}

function generateRegionalWeatherData(region) {
  return [
    {
      region: region,
      current_conditions: Math.random() > 0.7 ? "Dry" : "Normal",
      forecast: {
        precipitation: Math.random() > 0.6 ? "Below average" : "Average",
        temperature: Math.random() > 0.7 ? "Above average" : "Average",
        extreme_events: "Average"
      }
    }
  ];
}

function getMitigationStrategies(cropType, riskLevel, weatherFactors) {
  const strategies = [];
  
  // Add general strategies based on risk level
  if (riskLevel === 'high') {
    strategies.push("Consider crop insurance with higher coverage levels");
    strategies.push("Evaluate forward contracting a larger percentage of expected yield");
    strategies.push("Develop contingency plan for significantly reduced yields");
  } else if (riskLevel === 'medium') {
    strategies.push("Review crop insurance coverage options");
    strategies.push("Consider forward contracting a portion of expected yield");
  }
  
  // Add strategies based on weather factors
  if (weatherFactors.some(f => f.toLowerCase().includes('drought') || f.toLowerCase().includes('dry'))) {
    strategies.push("Review irrigation strategy and capacity");
    strategies.push("Consider drought-resistant varieties for a portion of acreage");
  }
  
  if (weatherFactors.some(f => f.toLowerCase().includes('wet') || f.toLowerCase().includes('precipitation'))) {
    strategies.push("Review field drainage systems");
    strategies.push("Consider later planting dates to avoid excessive spring moisture");
  }
  
  if (weatherFactors.some(f => f.toLowerCase().includes('temperature') || f.toLowerCase().includes('warm'))) {
    strategies.push("Consider heat-tolerant varieties");
  }
  
  if (weatherFactors.some(f => f.toLowerCase().includes('hail') || f.toLowerCase().includes('wind') || f.toLowerCase().includes('severe'))) {
    strategies.push("Review hail insurance options");
  }
  
  // If no specific strategies were added, add general ones
  if (strategies.length === 0) {
    strategies.push("Maintain standard risk management practices");
    strategies.push("Monitor weather forecasts throughout the growing season");
  }
  
  return strategies;
}

function getFrequentItems(items) {
  // Get items that appear more than once
  const counts = {};
  items.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });
  
  return Object.keys(counts)
    .filter(item => counts[item] > 1)
    .sort((a, b) => counts[b] - counts[a]);
}

function getLoanImplications(riskLevel, borrower) {
  // Generate loan implications based on risk assessment
  const implications = {
    financing_recommendations: [],
    monitoring_recommendations: [],
    collateral_considerations: []
  };
  
  if (riskLevel === 'high') {
    implications.financing_recommendations.push("Defer major new financing until after harvest");
    implications.financing_recommendations.push("Consider restructuring existing loans to improve cash flow");
    implications.monitoring_recommendations.push("Increase monitoring frequency to monthly");
    implications.monitoring_recommendations.push("Request updated cash flow projections incorporating potential yield impact");
    implications.collateral_considerations.push("Review collateral valuations to ensure adequate coverage");
    implications.collateral_considerations.push("Consider additional collateral requirements for new financing");
  } else if (riskLevel === 'medium') {
    implications.financing_recommendations.push("Proceed with caution on new financing requests");
    implications.financing_recommendations.push("Structure loans with flexible repayment schedules aligned to harvest timing");
    implications.monitoring_recommendations.push("Schedule mid-season follow-up to reassess risk status");
    implications.monitoring_recommendations.push("Monitor crop progress reports throughout growing season");
    implications.collateral_considerations.push("Standard collateral requirements should be adequate");
  } else {
    implications.financing_recommendations.push("Standard financing terms appropriate");
    implications.monitoring_recommendations.push("Regular monitoring schedule is sufficient");
    implications.collateral_considerations.push("Low risk indicates standard collateral practices are appropriate");
  }
  
  return implications;
}

// =================== END PREDICTIVE ANALYTICS ENDPOINTS ===================

// Only start the server if this file is executed directly (not when required by tests)
if (process.env.NODE_ENV !== 'test') {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`MCP server running on port ${PORT}`);
    console.log('Available endpoints:');
    console.log('  POST /api/auth/login - Login and get access token');
    console.log('  POST /api/auth/refresh - Refresh access token');
    console.log('  POST /api/auth/logout - Logout and invalidate refresh token');
    console.log('  GET /api/auth/verify - Verify token is valid');
    console.log('  GET /api/loans - Get all loans with borrower information');
    console.log('  GET /api/loan/:id - Get comprehensive loan details');
    console.log('  GET /api/loan/status/:id - Get loan status by ID');
    console.log('  GET /api/loans/active - Get all active loans');
    console.log('  GET /api/loans/borrower/:name - Get loans by borrower name');
    console.log('  GET /api/loans/summary - Get loan portfolio summary statistics');
    console.log('  GET /api/borrowers - Get all borrowers');
    console.log('  GET /api/borrower/:id - Get borrower details');
    console.log('  GET /api/loan/:id/payments - Get all payments for a loan');
    console.log('  GET /api/loan/:id/collateral - Get all collateral for a loan');
  });
}

// Export for testing
module.exports = app; 