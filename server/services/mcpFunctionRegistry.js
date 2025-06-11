/**
 * MCP Function Registry
 * 
 * Centralized registry of MCP functions with standardized
 * logging, error handling, and input/output validation.
 */
const MCPServiceWithLogging = require('./mcpServiceWithLogging');
const LogService = require('./logService');
const mcpResponseFormatter = require('../utils/mcpResponseFormatter');
const { validateMcpArgs } = require('../utils/validation');
const dataService = require('./dataService');

// Helper for internal API calls
async function callInternalApi(endpoint, method = 'GET', data = null) {
  try {
    // Simulate API call by directly accessing data
    const segments = endpoint.split('/').filter(s => s);
    
    if (segments[0] === 'api') {
      segments.shift(); // Remove 'api'
    }
    
    // Route the request based on the endpoint
    switch (segments[0]) {
      case 'loans': {
        // Handle loan-related endpoints
        if (segments[1] === 'details' && segments[2]) {
          const loanId = segments[2].toUpperCase();
          const loans = dataService.loadData(dataService.paths.loans);
          const loan = loans.find(l => l.loan_id === loanId);
          
          if (!loan) {
            return { error: 'Loan not found', loan_id: loanId };
          }
          
          return loan;
        }
        
        if (segments[1] === 'active') {
          const loans = dataService.loadData(dataService.paths.loans);
          return loans.filter(l => l.status === 'Active');
        }
        
        if (segments[1] === 'borrower' && segments[2]) {
          const borrowerId = segments[2].toUpperCase();
          const loans = dataService.loadData(dataService.paths.loans);
          const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
          
          if (borrowerLoans.length === 0) {
            return { note: 'No loans found for this borrower', borrower_id: borrowerId };
          }
          
          return borrowerLoans;
        }
        
        break;
      }
      
      case 'borrowers': {
        // Handle borrower-related endpoints
        if (segments.length > 1) {
          const borrowerId = segments[1].toUpperCase();
          const borrowers = dataService.loadData(dataService.paths.borrowers);
          const borrower = borrowers.find(b => b.borrower_id === borrowerId);
          
          if (!borrower) {
            return { error: 'Borrower not found', borrower_id: borrowerId };
          }
          
          return borrower;
        }
        
        break;
      }
      
      case 'risk': {
        // Handle risk-related endpoints
        if (segments[1] === 'collateral' && segments[2]) {
          const loanId = segments[2].toUpperCase();
          const loans = dataService.loadData(dataService.paths.loans);
          const collaterals = dataService.loadData(dataService.paths.collateral);
          
          const loan = loans.find(l => l.loan_id === loanId);
          if (!loan) {
            return { error: 'Loan not found', loan_id: loanId };
          }
          
          const loanCollateral = collaterals.filter(c => c.loan_id === loanId);
          const collateralValue = loanCollateral.reduce((sum, c) => sum + c.value, 0);
          const loanToValueRatio = loan.loan_amount / collateralValue;
          
          return {
            loan_id: loanId,
            collateral_value: collateralValue,
            loan_amount: loan.loan_amount,
            loan_to_value_ratio: loanToValueRatio,
            is_sufficient: loanToValueRatio < 0.8,
            industry_standard_threshold: 0.8,
            assessment: loanToValueRatio < 0.8 
              ? 'Collateral is sufficient' 
              : 'Collateral is insufficient'
          };
        }
        
        break;
      }
    }
    
    // Default response if no matching endpoint
    return { error: 'Endpoint not implemented', endpoint };
  } catch (error) {
    LogService.error(`Error in internal API call to ${endpoint}:`, error);
    return { 
      error: 'Internal API call failed',
      details: error.message
    };
  }
}

// Registry of MCP functions
const registry = {
  // LOAN FUNCTIONS
  
  /**
   * Get details for a specific loan
   */
  getLoanDetails: MCPServiceWithLogging.createFunction('getLoanDetails', async (args) => {
    const { loan_id } = args;
    
    if (!loan_id) {
      throw new Error('Loan ID is required');
    }
    
    const result = await callInternalApi(`/api/loans/details/${loan_id}`);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  }),
  
  /**
   * Get all active loans
   */
  getActiveLoans: MCPServiceWithLogging.createFunction('getActiveLoans', async () => {
    const result = await callInternalApi('/api/loans/active');
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  }),
  
  /**
   * Get loans for a specific borrower
   */
  getLoansByBorrower: MCPServiceWithLogging.createFunction('getLoansByBorrower', async (args) => {
    const { borrower_id, borrowerId } = args;
    const id = borrower_id || borrowerId;
    
    if (!id) {
      throw new Error('Borrower ID is required');
    }
    
    const result = await callInternalApi(`/api/loans/borrower/${id}`);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  }),
  
  // BORROWER FUNCTIONS
  
  /**
   * Get details for a specific borrower
   */
  getBorrowerDetails: MCPServiceWithLogging.createFunction('getBorrowerDetails', async (args) => {
    const { borrower_id, borrowerId } = args;
    const id = borrower_id || borrowerId;
    
    if (!id) {
      throw new Error('Borrower ID is required');
    }
    
    const result = await callInternalApi(`/api/borrowers/${id}`);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
  }),
  
  // RISK ASSESSMENT FUNCTIONS
  
  /**
   * Evaluate collateral sufficiency for a loan
   */
  evaluateCollateralSufficiency: MCPServiceWithLogging.createFunction(
    'evaluateCollateralSufficiency', 
    async (args) => {
      const { loan_id, loanId, marketConditions = 'stable' } = args;
      const id = loan_id || loanId;
      
      if (!id) {
        throw new Error('Loan ID is required');
      }
      
      const result = await callInternalApi(
        `/api/risk/collateral/${id}?market_conditions=${marketConditions}`
      );
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    }
  )
};

// Function schemas for OpenAI function calling
const functionSchemas = {
  getLoanDetails: {
    name: "getLoanDetails",
    description: "Get detailed information about a specific loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan"
        }
      },
      required: ["loan_id"]
    }
  },
  getBorrowerDetails: {
    name: "getBorrowerDetails",
    description: "Get detailed information about a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower"
        }
      },
      required: ["borrower_id"]
    }
  },
  getActiveLoans: {
    name: "getActiveLoans",
    description: "Get a list of all active loans in the system",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  getLoansByBorrower: {
    name: "getLoansByBorrower",
    description: "Get a list of loans for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower"
        }
      },
      required: ["borrower_id"]
    }
  },
  evaluateCollateralSufficiency: {
    name: "evaluateCollateralSufficiency",
    description: "Evaluate collateral sufficiency for a specific loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan"
        },
        marketConditions: {
          type: "string",
          enum: ["stable", "volatile", "declining"],
          description: "Market conditions to consider in evaluation"
        }
      },
      required: ["loan_id"]
    }
  },
  getBorrowerDefaultRisk: {
    name: "getBorrowerDefaultRisk",
    description: "Get default risk assessment for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string", 
          description: "The ID of the borrower (e.g., B001)"
        },
        timeHorizon: {
          type: "string",
          enum: ["3m", "6m", "12m", "1y"],
          description: "The time horizon for risk assessment"
        }
      },
      required: ["borrower_id"]
    }
  },
  getBorrowerNonAccrualRisk: {
    name: "getBorrowerNonAccrualRisk",
    description: "Get non-accrual risk assessment for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrower_id: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        }
      },
      required: ["borrower_id"]
    }
  }
};

/**
 * Execute an MCP function by name with arguments
 * @param {string} functionName - Name of the MCP function
 * @param {Object} args - Arguments for the function
 * @returns {Promise<Object>} - Function result
 */
async function executeFunction(functionName, args) {
  // Check if function exists
  if (!registry[functionName]) {
    LogService.error(`Unknown MCP function: ${functionName}`);
    return mcpResponseFormatter.formatError(
      `Unknown function: ${functionName}`,
      'executeFunction'
    );
  }
  
  try {
    // Validate arguments
    const validation = validateMcpArgs(functionName, args);
    
    if (!validation.valid) {
      return mcpResponseFormatter.formatValidationError(
        validation.errors,
        functionName
      );
    }
    
    // Execute the function from the registry
    const result = await registry[functionName](args);
    
    // Format the success response
    return mcpResponseFormatter.formatSuccess(result, functionName);
  } catch (error) {
    // Format the error response
    if (error.message.includes('not found')) {
      const entityType = functionName.includes('Loan') ? 'loan' : 'borrower';
      const entityId = args.loan_id || args.loanId || args.borrower_id || args.borrowerId || 'unknown';
      
      return mcpResponseFormatter.formatNotFound(
        entityType,
        entityId,
        functionName
      );
    }
    
    return mcpResponseFormatter.formatError(
      error,
      functionName,
      args
    );
  }
}

/**
 * Get all registered function schemas for OpenAI function calling
 * @returns {Array<object>} - Array of function schemas in OpenAI format
 */
function getRegisteredFunctionsSchema() {
  return Object.values(functionSchemas);
}

module.exports = {
  registry,
  executeFunction,
  callInternalApi,
  getRegisteredFunctionsSchema
}; 