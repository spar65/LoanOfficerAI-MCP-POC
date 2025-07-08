const express = require('express');
const router = express.Router();
const mcpDatabaseService = require('../../services/mcpDatabaseService');
const LogService = require('../services/logService');

// Get all loans with borrower information
router.get('/', async (req, res) => {
  const startTime = Date.now();
  LogService.mcp('MCP CALL: getLoans', {
    status: req.query.status,
    tenant: req.tenantContext
  });
  
  try {
    // Get loans from database
    let loans = await mcpDatabaseService.getLoans();
    
    LogService.debug(`Loaded ${loans.length} loans from database`);
    
    // Filter loans by status if status parameter is provided
    if (req.query.status) {
      const status = req.query.status.toLowerCase();
      LogService.info(`Filtering loans by status: ${status}`);
      loans = loans.filter(loan => loan.status && loan.status.toLowerCase() === status);
      LogService.debug(`After status filtering: ${loans.length} loans`);
    }
    
    const duration = Date.now() - startTime;
    LogService.mcp(`MCP RESULT: getLoans - ${loans.length} loans found (${duration}ms)`, {
      count: loans.length,
      duration: `${duration}ms`,
      statusFilter: req.query.status || 'all',
      responseSize: JSON.stringify(loans).length
    });
    
    res.json(loans);
  } catch (error) {
    LogService.error('Error fetching loans from database', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loans', details: error.message });
  }
});

// Get loan by ID with all related information
router.get('/:id', async (req, res, next) => {
  const loanId = req.params.id;
  
  // If the path is actually one of the more specific routes, pass to next handler
  const reserved = ['summary', 'active', 'borrower'];
  if (reserved.includes(loanId.toLowerCase())) {
    return next();
  }

  LogService.info(`Fetching loan details for loan ID: ${loanId}`);
  
  try {
    const loan = await mcpDatabaseService.getLoanById(loanId);
    
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
router.get('/details/:id', async (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching comprehensive loan details for loan ID: ${loanId}`);
  
  try {
    const loan = await mcpDatabaseService.getLoanDetails(loanId);
    
    if (loan) {
      // Get related data
      const collateral = await mcpDatabaseService.getLoanCollateral(loanId);
      const payments = await mcpDatabaseService.getLoanPayments(loanId);
      
      const loanDetails = {
        ...loan,
        collateral,
        payments
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
router.get('/status/:id', async (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching loan status for loan ID: ${loanId}`);
  
  try {
    const loanStatus = await mcpDatabaseService.getLoanStatus(loanId);
    
    if (loanStatus) {
      LogService.info(`Loan status for ID ${loanId}: ${loanStatus.status}`);
      res.json(loanStatus);
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
router.get('/active', async (req, res) => {
  LogService.info('Fetching active loans');
  
  try {
    // Check for internal API call marker
    const isInternalCall = req.get('X-Internal-Call') === 'true';
    if (isInternalCall) {
      LogService.debug('Processing internal API call for active loans');
    }
    
    const activeLoans = await mcpDatabaseService.getActiveLoans();
    
    LogService.info(`Found ${activeLoans.length} active loans`);
    return res.json(activeLoans);
  } catch (error) {
    LogService.error('Error fetching active loans', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Failed to retrieve active loans', 
      details: error.message 
    });
  }
});

// Get loans by borrower name
router.get('/borrower/:name', async (req, res) => {
  const borrowerName = req.params.name;
  LogService.info(`Fetching loans for borrower name: ${borrowerName}`);
  
  try {
    const borrowerLoans = await mcpDatabaseService.getLoansByBorrower(borrowerName);
    
    LogService.info(`Found ${borrowerLoans.length} loans for borrower name: ${borrowerName}`);
    res.json(borrowerLoans);
  } catch (error) {
    LogService.error(`Error fetching loans for borrower name: ${borrowerName}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loans by borrower name', details: error.message });
  }
});

// Get loan summary statistics
router.get('/summary', async (req, res) => {
  LogService.info('Fetching loan portfolio summary statistics');
  
  try {
    const summary = await mcpDatabaseService.getLoanSummary();
    
    LogService.info('Loan summary statistics calculated successfully');
    res.json(summary);
  } catch (error) {
    LogService.error('Error calculating loan summary statistics', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate loan summary', details: error.message });
  }
});

// Get all payments for a loan
router.get('/:id/payments', async (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching payments for loan ID: ${loanId}`);
  
  try {
    const loanPayments = await mcpDatabaseService.getLoanPayments(loanId);
    
    LogService.info(`Found ${loanPayments.length} payments for loan ID: ${loanId}`);
    res.json(loanPayments);
  } catch (error) {
    LogService.error(`Error fetching payments for loan ID: ${loanId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loan payments', details: error.message });
  }
});

// Get all collateral for a loan
router.get('/:id/collateral', async (req, res) => {
  const loanId = req.params.id;
  LogService.info(`Fetching collateral for loan ID: ${loanId}`);
  
  try {
    const loanCollateral = await mcpDatabaseService.getLoanCollateral(loanId);
    
    LogService.info(`Found ${loanCollateral.length} collateral items for loan ID: ${loanId}`);
    res.json(loanCollateral);
  } catch (error) {
    LogService.error(`Error fetching collateral for loan ID: ${loanId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve loan collateral', details: error.message });
  }
});

module.exports = router; 