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
const mcpDatabaseService = require('./mcpDatabaseService');

// Helper for internal API calls
async function callInternalApi(endpoint, method = 'GET', data = null) {
  try {
    // Simulate API call by directly accessing data
    const segments = endpoint.split('/').filter(s => s);
    LogService.debug(`callInternalApi: Processing endpoint ${endpoint}, segments: ${JSON.stringify(segments)}`);
    
    if (segments[0] === 'api') {
      segments.shift(); // Remove 'api'
      LogService.debug(`callInternalApi: Removed 'api' prefix, segments now: ${JSON.stringify(segments)}`);
    }
    
    // Route the request based on the endpoint
    LogService.debug(`callInternalApi: Routing based on resource type: ${segments[0]}`);
    switch (segments[0]) {
      case 'loans': {
        // Handle loan-related endpoints
        if (segments[1] === 'details' && segments[2]) {
          const loanId = segments[2].toUpperCase();
          // Use database service instead of JSON files
          return await mcpDatabaseService.getLoanDetails(loanId);
        }
        
        if (segments[1] === 'active') {
          // Use database service instead of JSON files
          return await mcpDatabaseService.getActiveLoans();
        }
        
        if (segments[1] === 'status' && segments[2]) {
          const loanId = segments[2].toUpperCase();
          
          if (!loanId || typeof loanId !== 'string') {
            return { error: 'Invalid loan ID provided', loan_id: loanId };
          }
          
          LogService.info(`Processing loan status request`, {
            loanId,
            endpoint: `/api/loans/status/${loanId}`,
            timestamp: new Date().toISOString(),
            requestSource: 'MCP_FUNCTION'
          });
          
          // Use database service instead of JSON files
          return await mcpDatabaseService.getLoanStatus(loanId);
        }
        
        if (segments[1] === 'summary') {
          LogService.info(`Processing loan portfolio summary request`, {
            endpoint: `/api/loans/summary`,
            timestamp: new Date().toISOString(),
            requestSource: 'MCP_FUNCTION'
          });
          
          // Use database service instead of JSON files
          return await mcpDatabaseService.getLoanSummary();
        }
        
        if (segments[1] === 'borrower' && segments[2]) {
          const borrowerName = segments[2];
          
          // Use database service instead of JSON files
          return await mcpDatabaseService.getLoansByBorrower(borrowerName);
        }
        
        break;
      }
      
      case 'borrowers': {
        // Handle borrower-related endpoints
        if (segments.length > 1) {
          const borrowerId = segments[1].toUpperCase();
          
          // Use database service instead of JSON files
          return await mcpDatabaseService.getBorrowerDetails(borrowerId);
        }
        
        break;
      }
      
      case 'risk': {
        // Handle risk-related endpoints
        if (segments[1] === 'collateral' && segments[2]) {
          const loanId = segments[2].toUpperCase();
          
          // Use database service instead of JSON files
          return await mcpDatabaseService.evaluateCollateralSufficiency(loanId);
        }
        
        // Add default risk endpoint handling
        if (segments[1] === 'default' && segments[2]) {
          const borrowerId = segments[2].toUpperCase();
          
          // Use database service instead of JSON files
          return await mcpDatabaseService.getBorrowerDefaultRisk(borrowerId);
        }
        
        // Add non-accrual risk endpoint handling
        if (segments[1] === 'non-accrual' && segments[2]) {
          const borrowerId = segments[2].toUpperCase();
          
          // Use database service instead of JSON files
          return await mcpDatabaseService.getBorrowerNonAccrualRisk(borrowerId);
        }
        
        // Add collateral-sufficiency endpoint handling
        if (segments[1] === 'collateral-sufficiency' && segments[2]) {
          const loanId = segments[2].toUpperCase();
          
          // Use database service instead of JSON files
          return await mcpDatabaseService.evaluateCollateralSufficiency(loanId);
        }
        
        break;
      }

      case 'analytics': {
        // Check which analytics endpoint is being requested
        LogService.debug(`callInternalApi: Processing analytics endpoint, segments[1]: ${segments[1]}, segments[2]: ${segments[2]}`);
        
        if (segments[1] === 'loan-restructuring' && segments[2]) {
          // Extract the loan ID without any query parameters
          const loanIdWithParams = segments[2];
          const loanId = loanIdWithParams.split('?')[0].toUpperCase();
          LogService.debug(`callInternalApi: Processing loan-restructuring for loan ID: ${loanId}`);
          
          // Parse query parameters
          const params = new URLSearchParams(endpoint.split('?')[1] || '');
          const restructuringGoal = params.get('goal') || null;
          LogService.debug(`callInternalApi: Restructuring goal: ${restructuringGoal}`);
          
          // TODO: Implement database service method for loan restructuring
          // For now, fall back to the existing implementation
          const loans = dataService.loadData(dataService.paths.loans);
          const borrowers = dataService.loadData(dataService.paths.borrowers);
          const payments = dataService.loadData(dataService.paths.payments);
          
          // Find loan - ensure case-insensitive comparison
          const loan = loans.find((l) => l.loan_id.toUpperCase() === loanId);
          LogService.debug(`callInternalApi: Loan found: ${loan ? 'Yes' : 'No'}`);
          if (!loan) {
            return { error: "Loan not found", loan_id: loanId };
          }
          
          // Find borrower - ensure case-insensitive comparison
          const borrower = borrowers.find(
            (b) => b.borrower_id.toUpperCase() === loan.borrower_id.toUpperCase()
          );
          if (!borrower) {
            return {
              error: "Borrower not found for this loan",
              loan_id: loanId,
              borrower_id: loan.borrower_id,
            };
          }
          
          // Get payment history for this loan
          const loanPayments = payments.filter((p) => p.loan_id === loanId);
          
          // Calculate current loan structure
          const principal = loan.loan_amount;
          const originalTerm = 120; // 10 years in months
          const elapsedTime = loanPayments.length;
          const termRemaining = originalTerm - elapsedTime;
          const currentRate = parseFloat(loan.interest_rate);
          
          // Calculate monthly payment
          const monthlyRate = currentRate / 100 / 12;
          const monthlyPayment = Math.round(
            (principal * monthlyRate * Math.pow(1 + monthlyRate, originalTerm)) /
            (Math.pow(1 + monthlyRate, originalTerm) - 1)
          );
          
          // Generate a simplified response with restructuring options
          return {
            loan_id: loanId,
            borrower_name: `${borrower.first_name} ${borrower.last_name}`,
            current_structure: {
              principal: principal,
              rate: `${currentRate}%`,
              term_remaining: termRemaining,
              monthly_payment: monthlyPayment,
              original_term: originalTerm
            },
            restructuring_options: [
              {
                option_name: "Term extension",
                new_term: termRemaining + 36,
                new_payment: Math.round(
                  (principal * monthlyRate * Math.pow(1 + monthlyRate, termRemaining + 36)) /
                  (Math.pow(1 + monthlyRate, termRemaining + 36) - 1)
                ),
                payment_reduction: "20%",
                pros: ["Immediate payment relief", "No change in interest rate"],
                cons: ["Longer payoff period", "More interest paid overall"]
              },
              {
                option_name: "Rate reduction",
                new_rate: `${Math.max(currentRate - 1.0, 3.0)}%`,
                new_payment: Math.round(
                  (principal * (Math.max(currentRate - 1.0, 3.0) / 100 / 12) * 
                   Math.pow(1 + (Math.max(currentRate - 1.0, 3.0) / 100 / 12), termRemaining)) /
                  (Math.pow(1 + (Math.max(currentRate - 1.0, 3.0) / 100 / 12), termRemaining) - 1)
                ),
                payment_reduction: "11.4%",
                pros: ["Lower total interest", "Moderate payment relief"],
                cons: ["May require additional collateral", "Subject to approval"]
              }
            ],
            recommendation: 
              restructuringGoal === "reduce_payments" 
                ? "Term extension option provides the most significant payment relief."
                : "Rate reduction option provides the best long-term financial benefit."
          };
        }
        
        // The following endpoints will continue using the existing implementation until database methods are implemented
        if (segments[1] === 'crop-yield-risk' || segments[1] === 'market-price-impact') {
          // Use the existing implementations for now
          // TODO: Implement database service methods for these analytics
          
          return { 
            message: "This analytics endpoint is not yet implemented in the database service",
            path: endpoint,
            status: "fallback_to_json"
          };
        }
        
        // If no matching analytics endpoint, return error
        return { error: 'Analytics endpoint not implemented', path: endpoint };
      }

      // Default case
      default:
        return { error: 'Unknown resource type', resource: segments[0] };
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
    
    try {
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getLoanDetails(loan_id);
    } catch (error) {
      LogService.error(`Error in getLoanDetails: ${error.message}`, { loan_id });
      throw error;
    }
  }),
  
  /**
   * Get status for a specific loan
   */
  getLoanStatus: MCPServiceWithLogging.createFunction('getLoanStatus', async (args) => {
    const { loan_id } = args;
    
    if (!loan_id) {
      throw new Error('Loan ID is required');
    }
    
    try {
      LogService.info(`Fetching loan status for loan ID: ${loan_id}`);
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getLoanStatus(loan_id);
    } catch (error) {
      LogService.error(`Error fetching loan status: ${error.message}`);
      return {
        error: true,
        message: `Could not retrieve loan status: ${error.message}`,
        loan_id
      };
    }
  }),
  
  /**
   * Get loan portfolio summary
   */
  getLoanSummary: MCPServiceWithLogging.createFunction('getLoanSummary', async () => {
    try {
      LogService.info('Fetching loan portfolio summary');
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getLoanSummary();
    } catch (error) {
      LogService.error(`Error fetching loan summary: ${error.message}`);
      return {
        error: true,
        message: `Could not retrieve loan summary: ${error.message}`
      };
    }
  }),

  /**
   * Get all active loans
   */
  getActiveLoans: MCPServiceWithLogging.createFunction('getActiveLoans', async () => {
    try {
      LogService.info('Fetching all active loans');
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getActiveLoans();
    } catch (error) {
      LogService.error(`Error fetching active loans: ${error.message}`);
      return {
        error: true,
        message: `Could not retrieve active loans: ${error.message}`
      };
    }
  }),
  
  /**
   * Get loans for a specific borrower
   */
  getLoansByBorrower: MCPServiceWithLogging.createFunction('getLoansByBorrower', async (args) => {
    const { borrower } = args;
    
    if (!borrower) {
      throw new Error('Borrower name is required');
    }
    
    try {
      LogService.info(`Fetching loans for borrower: ${borrower}`);
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getLoansByBorrower(borrower);
    } catch (error) {
      LogService.error(`Error fetching loans for borrower: ${error.message}`);
      return {
        error: true,
        message: `Could not retrieve loans for borrower: ${error.message}`,
        borrower
      };
    }
  }),
  
  /**
   * Get loan payments by loan ID
   */
  getLoanPayments: MCPServiceWithLogging.createFunction('getLoanPayments', async (args) => {
    const { loan_id } = args;
    
    if (!loan_id) {
      throw new Error('Loan ID is required');
    }
    
    try {
      LogService.info(`Fetching payments for loan ID: ${loan_id}`);
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getLoanPayments(loan_id);
    } catch (error) {
      LogService.error(`Error fetching loan payments: ${error.message}`);
      return {
        error: true,
        message: `Could not retrieve loan payments: ${error.message}`,
        loan_id
      };
    }
  }),
  
  /**
   * Get loan collateral by loan ID
   */
  getLoanCollateral: MCPServiceWithLogging.createFunction('getLoanCollateral', async (args) => {
    const { loan_id } = args;
    
    if (!loan_id) {
      throw new Error('Loan ID is required');
    }
    
    try {
      LogService.info(`Fetching collateral for loan ID: ${loan_id}`);
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getLoanCollateral(loan_id);
    } catch (error) {
      LogService.error(`Error fetching loan collateral: ${error.message}`);
      return {
        error: true,
        message: `Could not retrieve loan collateral: ${error.message}`,
        loan_id
      };
    }
  }),
  
  // BORROWER FUNCTIONS
  
  /**
   * Get details for a specific borrower
   */
  getBorrowerDetails: MCPServiceWithLogging.createFunction('getBorrowerDetails', async (args) => {
    const { borrower_id } = args;
    
    if (!borrower_id) {
      throw new Error('Borrower ID is required');
    }
    
    try {
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getBorrowerDetails(borrower_id);
    } catch (error) {
      LogService.error(`Error in getBorrowerDetails: ${error.message}`, { borrower_id });
      throw error;
    }
  }),
  
  /**
   * Get default risk for a specific borrower
   */
  getBorrowerDefaultRisk: MCPServiceWithLogging.createFunction('getBorrowerDefaultRisk', async (args) => {
    const { borrower_id } = args;
    
    if (!borrower_id) {
      throw new Error('Borrower ID is required');
    }
    
    try {
      LogService.info(`Assessing default risk for borrower ID: ${borrower_id}`);
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getBorrowerDefaultRisk(borrower_id);
    } catch (error) {
      LogService.error(`Error assessing default risk: ${error.message}`);
      return {
        error: true,
        message: `Could not assess default risk: ${error.message}`,
        borrower_id
      };
    }
  }),
  
  /**
   * Get non-accrual risk for a specific borrower
   */
  getBorrowerNonAccrualRisk: MCPServiceWithLogging.createFunction('getBorrowerNonAccrualRisk', async (args) => {
    const { borrower_id } = args;
    
    if (!borrower_id) {
      throw new Error('Borrower ID is required');
    }
    
    try {
      LogService.info(`Assessing non-accrual risk for borrower ID: ${borrower_id}`);
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.getBorrowerNonAccrualRisk(borrower_id);
    } catch (error) {
      LogService.error(`Error assessing non-accrual risk: ${error.message}`);
      return {
        error: true,
        message: `Could not assess non-accrual risk: ${error.message}`,
        borrower_id
      };
    }
  }),
  
  /**
   * Evaluate collateral sufficiency for a loan
   */
  evaluateCollateralSufficiency: MCPServiceWithLogging.createFunction('evaluateCollateralSufficiency', async (args) => {
    const { loan_id } = args;
    
    if (!loan_id) {
      throw new Error('Loan ID is required');
    }
    
    try {
      LogService.info(`Evaluating collateral sufficiency for loan ID: ${loan_id}`);
      // Use database service directly instead of callInternalApi
      return await mcpDatabaseService.evaluateCollateralSufficiency(loan_id);
    } catch (error) {
      LogService.error(`Error evaluating collateral sufficiency: ${error.message}`);
      return {
        error: true,
        message: `Could not evaluate collateral sufficiency: ${error.message}`,
        loan_id
      };
    }
  }),
  
  // Functions below will be replaced with database implementations
  // For now, they will call dataService directly
  
  forecastEquipmentMaintenance: MCPServiceWithLogging.createFunction('forecastEquipmentMaintenance', async (args) => {
    return dataService.forecastEquipmentMaintenance(args.borrower_id);
  }),
  
  assessCropYieldRisk: MCPServiceWithLogging.createFunction('assessCropYieldRisk', async (args) => {
    return dataService.assessCropYieldRisk(args.borrower_id, args.crop_type, args.season);
  }),
  
  analyzeMarketPriceImpact: MCPServiceWithLogging.createFunction('analyzeMarketPriceImpact', async (args) => {
    return dataService.analyzeMarketPriceImpact(args.commodity, args.price_change_percent);
  }),
  
  getRefinancingOptions: MCPServiceWithLogging.createFunction('getRefinancingOptions', async (args) => {
    return dataService.getRefinancingOptions(args.loan_id);
  }),
  
  analyzePaymentPatterns: MCPServiceWithLogging.createFunction('analyzePaymentPatterns', async (args) => {
    return dataService.analyzePaymentPatterns(args.borrower_id);
  }),
  
  recommendLoanRestructuring: MCPServiceWithLogging.createFunction('recommendLoanRestructuring', async (args) => {
    return dataService.recommendLoanRestructuring(args.loan_id, args.restructuring_goal);
  }),
  
  getHighRiskFarmers: MCPServiceWithLogging.createFunction('getHighRiskFarmers', async () => {
    return dataService.getHighRiskFarmers();
  })
};

// Schema definitions for MCP functions
const functionSchemas = {
  // LOAN FUNCTIONS
  getLoanDetails: {
    name: 'getLoanDetails',
    description: 'Get detailed information about a specific loan',
    parameters: {
      type: 'object',
      properties: {
        loan_id: {
          type: 'string',
          description: 'ID of the loan to retrieve details for'
        }
      },
      required: ['loan_id']
    }
  },
  
  getLoanStatus: {
    name: 'getLoanStatus',
    description: 'Get the current status of a specific loan',
    parameters: {
      type: 'object',
      properties: {
        loan_id: {
          type: 'string',
          description: 'ID of the loan to retrieve status for'
        }
      },
      required: ['loan_id']
    }
  },
  
  getLoanSummary: {
    name: 'getLoanSummary',
    description: 'Get a summary of the entire loan portfolio',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  
  getActiveLoans: {
    name: 'getActiveLoans',
    description: 'Get a list of all active loans in the system',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  
  getLoansByBorrower: {
    name: 'getLoansByBorrower',
    description: 'Get a list of loans for a specific borrower',
    parameters: {
      type: 'object',
      properties: {
        borrower_id: {
          type: 'string',
          description: 'ID of the borrower to retrieve loans for'
        }
      },
      required: ['borrower_id']
    }
  },
  
  // BORROWER FUNCTIONS
  getBorrowerDetails: {
    name: "getBorrowerDetails",
    description: "Get details for a specific borrower",
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
  
  getBorrowerDefaultRisk: {
    name: 'getBorrowerDefaultRisk',
    description: 'Get the default risk assessment for a specific borrower',
    parameters: {
      type: 'object',
      properties: {
        borrower_id: {
          type: 'string',
          description: 'ID of the borrower to assess'
        }
      },
      required: ['borrower_id']
    }
  },
  
  getBorrowerNonAccrualRisk: {
    name: 'getBorrowerNonAccrualRisk',
    description: 'Get the non-accrual risk assessment for a specific borrower',
    parameters: {
      type: 'object',
      properties: {
        borrower_id: {
          type: 'string',
          description: 'ID of the borrower to assess'
        }
      },
      required: ['borrower_id']
    }
  },
  
  getHighRiskFarmers: {
    name: 'getHighRiskFarmers',
    description: 'Get a list of farmers at high risk of default',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  
  // RISK ASSESSMENT FUNCTIONS
  evaluateCollateralSufficiency: {
    name: "evaluateCollateralSufficiency",
    description: "Evaluate if collateral is sufficient for a loan",
    parameters: {
      type: "object",
      properties: {
        loan_id: {
          type: "string",
          description: "The ID of the loan to evaluate"
        }
      },
      required: ["loan_id"]
    }
  },
  
  // PREDICTIVE ANALYTICS FUNCTIONS
  forecastEquipmentMaintenance: {
    name: 'forecastEquipmentMaintenance',
    description: 'Forecast equipment maintenance costs for a borrower',
    parameters: {
      type: 'object',
      properties: {
        borrower_id: {
          type: 'string',
          description: 'ID of the borrower to forecast for'
        }
      },
      required: ['borrower_id']
    }
  },
  
  assessCropYieldRisk: {
    name: 'assessCropYieldRisk',
    description: 'Assess crop yield risk for a borrower',
    parameters: {
      type: 'object',
      properties: {
        borrower_id: {
          type: 'string',
          description: 'ID of the borrower to assess'
        },
        crop_type: {
          type: 'string',
          description: 'Type of crop'
        },
        season: {
          type: 'string',
          description: 'Season of the crop'
        }
      },
      required: ['borrower_id', 'crop_type', 'season']
    }
  },
  
  analyzeMarketPriceImpact: {
    name: 'analyzeMarketPriceImpact',
    description: 'Analyze the impact of market prices on a borrower',
    parameters: {
      type: 'object',
      properties: {
        commodity: {
          type: 'string',
          description: 'Name of the commodity'
        },
        price_change_percent: {
          type: 'string',
          description: 'Percentage change in commodity prices'
        }
      },
      required: ['commodity', 'price_change_percent']
    }
  },
  
  getRefinancingOptions: {
    name: 'getRefinancingOptions',
    description: 'Get refinancing options for a loan',
    parameters: {
      type: 'object',
      properties: {
        loan_id: {
          type: 'string',
          description: 'ID of the loan to get options for'
        }
      },
      required: ['loan_id']
    }
  },
  
  analyzePaymentPatterns: {
    name: 'analyzePaymentPatterns',
    description: 'Analyze payment patterns for a borrower',
    parameters: {
      type: 'object',
      properties: {
        borrower_id: {
          type: 'string',
          description: 'ID of the borrower to analyze'
        }
      },
      required: ['borrower_id']
    }
  },

  recommendLoanRestructuring: {
    name: 'recommendLoanRestructuring',
    description: 'Generate loan restructuring recommendations',
    parameters: {
      type: 'object',
      properties: {
        loan_id: {
          type: 'string',
          description: 'ID of the loan to generate recommendations for'
        },
        restructuring_goal: {
          type: 'string',
          description: 'Optional restructuring goal'
        }
      },
      required: ['loan_id']
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