const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const LogService = require('../services/logService');
const McpService = require('../services/mcpService');

// Get all loans with borrower information
router.get('/', (req, res) => {
  const startTime = Date.now();
  LogService.mcp('MCP CALL: getActiveLoans', {
    status: req.query.status,
    tenant: req.tenantContext
  });
  
  // Apply tenant filtering if tenant context exists
  let loans = dataService.loadData(dataService.paths.loans);
  let borrowers = dataService.loadData(dataService.paths.borrowers);
  
  LogService.debug(`Loaded ${loans.length} loans and ${borrowers.length} borrowers`);
  
  if (req.tenantContext) {
    LogService.info(`Applying tenant filter: ${req.tenantContext}`);
    loans = dataService.getTenantFilteredData(loans, req.tenantContext);
    borrowers = dataService.getTenantFilteredData(borrowers, req.tenantContext);
    LogService.debug(`After tenant filtering: ${loans.length} loans and ${borrowers.length} borrowers`);
  }
  
  // Filter loans by status if status parameter is provided
  let filteredLoans = loans;
  if (req.query.status) {
    const status = req.query.status;
    LogService.info(`Filtering loans by status: ${status}`);
    filteredLoans = loans.filter(loan => loan.status === status);
    LogService.debug(`After status filtering: ${filteredLoans.length} loans`);
  }
  
  // Enhance loans with borrower information
  const loansWithBorrowers = filteredLoans.map(loan => {
    const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
    return {
      ...loan,
      borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
      borrower_details: borrower || null
    };
  });
  
  const duration = Date.now() - startTime;
  LogService.mcp(`MCP RESULT: getActiveLoans - ${filteredLoans.length} loans found (${duration}ms)`, {
    count: filteredLoans.length,
    duration: `${duration}ms`,
    statusFilter: req.query.status || 'all',
    responseSize: JSON.stringify(loansWithBorrowers).length
  });
  
  res.json(loansWithBorrowers);
});

// Get loan by ID with all related information
router.get('/:id', (req, res, next) => {
  const loanId = req.params.id;
  
  // If the path is actually one of the more specific routes, pass to next handler
  const reserved = ['summary', 'active', 'borrower'];
  if (reserved.includes(loanId.toLowerCase())) {
    return next();
  }

  LogService.info(`Fetching loan details for loan ID: ${loanId}`);
  
  try {
    // Apply tenant filtering
    let loans = dataService.loadData(dataService.paths.loans);
    const loan = loans.find(l => l.loan_id === loanId);
    
    if (loan) {
      LogService.info(`Loan found: ${loan.loan_id}`);
      res.json(loan);
    } else {
      LogService.warn(`Loan not found with ID: ${loanId}`);
      res.status(404).json({ error: 'Loan not found' });
    }
  } catch (error) {
    LogService.error(`Error fetching loan details for ID: ${loanId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loan details', details: error.message });
  }
});

// Get loan by ID with comprehensive details
router.get('/details/:id', (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching comprehensive loan details for loan ID: ${loanId}`);
  
  try {
    // Apply tenant filtering
    let loans = dataService.loadData(dataService.paths.loans);
    let borrowers = dataService.loadData(dataService.paths.borrowers);
    let payments = dataService.loadData(dataService.paths.payments);
    let collaterals = dataService.loadData(dataService.paths.collateral);
    
    if (req.tenantContext) {
      loans = dataService.getTenantFilteredData(loans, req.tenantContext);
      borrowers = dataService.getTenantFilteredData(borrowers, req.tenantContext);
      payments = dataService.getTenantFilteredData(payments, req.tenantContext);
      collaterals = dataService.getTenantFilteredData(collaterals, req.tenantContext);
    }
    
    const loan = loans.find(l => l.loan_id === loanId);
    
    if (loan) {
      const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
      const loanPayments = dataService.getRelatedData(loanId, payments, 'loan_id');
      const loanCollateral = dataService.getRelatedData(loanId, collaterals, 'loan_id');
      
      const loanDetails = {
        ...loan,
        borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
        borrower_details: borrower || null,
        payments: loanPayments,
        collateral: loanCollateral
      };
      
      LogService.info(`Detailed loan information retrieved for loan ID: ${loanId}`);
      res.json(loanDetails);
    } else {
      LogService.warn(`Loan not found with ID: ${loanId}`);
      res.status(404).json({ error: 'Loan not found' });
    }
  } catch (error) {
    LogService.error(`Error fetching comprehensive loan details for ID: ${loanId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loan details', details: error.message });
  }
});

// Get loan status by ID
router.get('/status/:id', (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching loan status for loan ID: ${loanId}`);
  
  try {
    const loans = dataService.loadData(dataService.paths.loans);
    const loan = loans.find(l => l.loan_id === loanId);
    
    if (loan) {
      LogService.info(`Loan status for ID ${loanId}: ${loan.status}`);
      res.json({ status: loan.status });
    } else {
      LogService.warn(`Loan not found with ID: ${loanId}`);
      res.status(404).json({ error: 'Loan not found' });
    }
  } catch (error) {
    LogService.error(`Error fetching loan status for ID: ${loanId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loan status', details: error.message });
  }
});

// Get active loans
router.get('/active', (req, res) => {
  LogService.info('Fetching active loans');
  
  try {
    // Check for internal API call marker
    const isInternalCall = req.get('X-Internal-Call') === 'true';
    if (isInternalCall) {
      LogService.debug('Processing internal API call for active loans');
    }
    
    const loans = dataService.loadData(dataService.paths.loans);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    
    if (!loans || !loans.length) {
      LogService.warn('No loans data found');
      return res.json({ error: 'No loans data available', loans: [] });
    }
    
    const activeLoans = loans.filter(l => l.status === 'Active');
    
    const activeLoansWithBorrowers = activeLoans.map(loan => {
      const borrower = borrowers.find(b => b.borrower_id === loan.borrower_id);
      return {
        ...loan,
        borrower: borrower ? `${borrower.first_name} ${borrower.last_name}` : 'Unknown',
        borrower_details: borrower || null
      };
    });
    
    LogService.info(`Found ${activeLoans.length} active loans`);
    return res.json(activeLoansWithBorrowers);
  } catch (error) {
    LogService.error('Error fetching active loans', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Failed to retrieve active loans', 
      details: error.message 
    });
  }
});

// Get loans by borrower name
router.get('/borrower/:name', (req, res) => {
  const borrowerName = req.params.name;
  LogService.info(`Fetching loans for borrower name: ${borrowerName}`);
  
  try {
    const loans = dataService.loadData(dataService.paths.loans);
    const borrowers = dataService.loadData(dataService.paths.borrowers);
    
    // Handle full names by splitting into first and last name
    let matchingBorrowers = [];
    if (borrowerName.includes(' ')) {
      // If full name is provided (e.g., "John Doe")
      const [firstName, lastName] = borrowerName.split(' ');
      LogService.debug(`Searching for borrower with first name "${firstName}" and last name "${lastName}"`);
      
      matchingBorrowers = borrowers.filter(b => 
        b.first_name.toLowerCase() === firstName.toLowerCase() && 
        b.last_name.toLowerCase() === lastName.toLowerCase()
      );
    } else {
      // If only a partial name is provided, search in both first and last name
      LogService.debug(`Searching for borrower with name containing "${borrowerName}"`);
      matchingBorrowers = borrowers.filter(b => 
        b.first_name.toLowerCase().includes(borrowerName.toLowerCase()) ||
        b.last_name.toLowerCase().includes(borrowerName.toLowerCase())
      );
    }
    
    if (matchingBorrowers.length === 0) {
      LogService.info(`No borrowers found matching name: ${borrowerName}`);
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
    
    LogService.info(`Found ${borrowerLoans.length} loans for borrower name: ${borrowerName}`);
    res.json(loansWithBorrowers);
  } catch (error) {
    LogService.error(`Error fetching loans for borrower name: ${borrowerName}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loans by borrower name', details: error.message });
  }
});

// Get loan summary statistics
router.get('/summary', (req, res) => {
  LogService.info('Fetching loan portfolio summary statistics');
  
  try {
    const loans = dataService.loadData(dataService.paths.loans);
    const payments = dataService.loadData(dataService.paths.payments);
    
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
    
    LogService.info('Loan summary statistics calculated successfully');
    res.json(summary);
  } catch (error) {
    LogService.error('Error calculating loan summary statistics', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate loan summary', details: error.message });
  }
});

// Get all payments for a loan
router.get('/:id/payments', (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching payments for loan ID: ${loanId}`);
  
  try {
    const payments = dataService.loadData(dataService.paths.payments);
    const loanPayments = payments.filter(p => p.loan_id === loanId);
    
    LogService.info(`Found ${loanPayments.length} payments for loan ID: ${loanId}`);
    res.json(loanPayments);
  } catch (error) {
    LogService.error(`Error fetching payments for loan ID: ${loanId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loan payments', details: error.message });
  }
});

// Get all collateral for a loan
router.get('/:id/collateral', (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching collateral for loan ID: ${loanId}`);
  
  try {
    const collaterals = dataService.loadData(dataService.paths.collateral);
    const loanCollateral = collaterals.filter(c => c.loan_id === loanId);
    
    LogService.info(`Found ${loanCollateral.length} collateral items for loan ID: ${loanId}`);
    res.json(loanCollateral);
  } catch (error) {
    LogService.error(`Error fetching collateral for loan ID: ${loanId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loan collateral', details: error.message });
  }
});

module.exports = router; 