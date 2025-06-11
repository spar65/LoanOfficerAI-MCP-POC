/**
 * Enhanced MCP API Routes
 * With standardized logging, error handling, and request tracking
 */
const express = require('express');
const router = express.Router();
const MCPServiceWithLogging = require('../services/mcpServiceWithLogging');
const mcpResponseFormatter = require('../utils/mcpResponseFormatter');
const LogService = require('../services/logService');
const { getContextForMCPCall } = require('../middleware/requestContext');
const { validateMcpArgs } = require('../utils/validation');

/**
 * Validate and prepare arguments for MCP function calls
 * @param {string} functionName - Name of the MCP function
 * @param {Object} args - Arguments for the function
 * @returns {Object} - Validation result with normalized arguments
 */
function validateAndPrepareArgs(functionName, args) {
  LogService.debug(`Validating args for ${functionName}`, {
    args: MCPServiceWithLogging.redactPII(args)
  });
  
  const validation = validateMcpArgs(functionName, args);
  if (!validation.valid) {
    return {
      valid: false,
      errors: validation.errors
    };
  }
  
  // Use normalized ID if available
  if (validation.normalized) {
    const normalizedArgs = { ...args };
    
    // Handle different ID field names
    if ('loan_id' in args || 'loanId' in args) {
      normalizedArgs.loan_id = validation.normalized;
      normalizedArgs.loanId = validation.normalized;
    } else if ('borrower_id' in args || 'borrowerId' in args) {
      normalizedArgs.borrower_id = validation.normalized;
      normalizedArgs.borrowerId = validation.normalized;
    }
    
    return { valid: true, args: normalizedArgs };
  }
  
  return { valid: true, args };
}

/**
 * General error handler for MCP routes
 */
router.use((err, req, res, next) => {
  LogService.error('MCP route error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.context?.requestId
  });
  
  res.status(500).json(mcpResponseFormatter.formatError(
    err, 
    'mcp_route', 
    { path: req.path, method: req.method }
  ));
});

/**
 * GET /api/mcp/loan/:id - Get loan details
 */
router.get('/loan/:id', async (req, res) => {
  const loanId = req.params.id;
  const functionName = 'getLoanDetails';
  
  try {
    // Validate args
    const validation = validateAndPrepareArgs(functionName, { loan_id: loanId });
    if (!validation.valid) {
      return res.status(400).json(
        mcpResponseFormatter.formatValidationError(validation.errors, functionName)
      );
    }
    
    // Get context for logging
    const context = getContextForMCPCall(functionName, validation.args);
    
    // Create the implementation function
    const getLoanDetails = async (args) => {
      // Simulate implementation that would call the data service
      const { loan_id } = args;
      const dataService = require('../services/dataService');
      const loans = dataService.loadData(dataService.paths.loans);
      const loan = loans.find(l => l.loan_id === loan_id);
      
      if (!loan) {
        throw new Error(`Loan with ID '${loan_id}' not found`);
      }
      
      return loan;
    };
    
    // Execute the function with logging
    const result = await MCPServiceWithLogging.executeFunction(
      getLoanDetails,
      functionName,
      validation.args
    );
    
    // Format the response
    const formattedResponse = mcpResponseFormatter.formatSuccess(result, functionName);
    
    // Return response
    res.json(formattedResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json(
        mcpResponseFormatter.formatNotFound('loan', loanId, functionName)
      );
    }
    
    LogService.error(`Error in ${functionName}:`, {
      error: error.message,
      loanId,
      stack: error.stack
    });
    
    res.status(500).json(
      mcpResponseFormatter.formatError(error, functionName, { loanId })
    );
  }
});

/**
 * GET /api/mcp/borrower/:id - Get borrower details
 */
router.get('/borrower/:id', async (req, res) => {
  const borrowerId = req.params.id;
  const functionName = 'getBorrowerDetails';
  
  try {
    // Validate args
    const validation = validateAndPrepareArgs(functionName, { borrower_id: borrowerId });
    if (!validation.valid) {
      return res.status(400).json(
        mcpResponseFormatter.formatValidationError(validation.errors, functionName)
      );
    }
    
    // Get context for logging
    const context = getContextForMCPCall(functionName, validation.args);
    
    // Create the implementation function
    const getBorrowerDetails = async (args) => {
      // Simulate implementation that would call the data service
      const { borrower_id } = args;
      const dataService = require('../services/dataService');
      const borrowers = dataService.loadData(dataService.paths.borrowers);
      const borrower = borrowers.find(b => b.borrower_id === borrower_id);
      
      if (!borrower) {
        throw new Error(`Borrower with ID '${borrower_id}' not found`);
      }
      
      return borrower;
    };
    
    // Execute the function with logging
    const result = await MCPServiceWithLogging.executeFunction(
      getBorrowerDetails,
      functionName,
      validation.args
    );
    
    // Format the response
    const formattedResponse = mcpResponseFormatter.formatSuccess(result, functionName);
    
    // Return response
    res.json(formattedResponse);
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json(
        mcpResponseFormatter.formatNotFound('borrower', borrowerId, functionName)
      );
    }
    
    LogService.error(`Error in ${functionName}:`, {
      error: error.message,
      borrowerId,
      stack: error.stack
    });
    
    res.status(500).json(
      mcpResponseFormatter.formatError(error, functionName, { borrowerId })
    );
  }
});

module.exports = router; 