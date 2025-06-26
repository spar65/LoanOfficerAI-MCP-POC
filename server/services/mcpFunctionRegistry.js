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
          
          const loans = dataService.loadData(dataService.paths.loans);
          const loan = loans.find(l => l.loan_id === loanId);

          if (!loan) {
            return { error: 'Loan not found', loan_id: loanId };
          }

          return {
            loan_id: loanId,
            status: loan.status,
            last_updated: loan.last_updated || new Date().toISOString(),
            status_history: loan.status_history || []
          };
        }
        
        if (segments[1] === 'summary') {
          LogService.info(`Processing loan portfolio summary request`, {
            endpoint: `/api/loans/summary`,
            timestamp: new Date().toISOString(),
            requestSource: 'MCP_FUNCTION'
          });
          
          const loans = dataService.loadData(dataService.paths.loans);

          if (!loans || loans.length === 0) {
            return {
              total_loans: 0,
              active_loans: 0,
              pending_loans: 0,
              closed_loans: 0,
              total_loan_amount: 0,
              average_interest_rate: 0,
              message: "No loan data available"
            };
          }

          const totalLoans = loans.length;
          const activeLoans = loans.filter(l => l.status === 'Active').length;
          const pendingLoans = loans.filter(l => l.status === 'Pending').length;
          const closedLoans = loans.filter(l => l.status === 'Closed').length;
          const defaultedLoans = loans.filter(l => l.status === 'Default').length;
          
          const totalAmount = loans.reduce((sum, loan) => sum + (loan.loan_amount || 0), 0);
          const avgInterestRate = loans.length > 0
            ? loans.reduce((sum, loan) => sum + (loan.interest_rate || 0), 0) / loans.length
            : 0;

          const avgLoanAmount = totalLoans > 0 ? totalAmount / totalLoans : 0;
          const activeAmount = loans
            .filter(l => l.status === 'Active')
            .reduce((sum, loan) => sum + (loan.loan_amount || 0), 0);

          const dataFreshness = {
            last_data_refresh: loans.length > 0 ? 
              Math.max(...loans.map(l => new Date(l.last_updated || l.start_date || Date.now()).getTime())) : 
              null,
            data_age_minutes: loans.length > 0 ?
              Math.round((Date.now() - Math.max(...loans.map(l => new Date(l.last_updated || l.start_date || Date.now()).getTime()))) / (1000 * 60)) :
              null
          };

          return {
            total_loans: totalLoans,
            active_loans: activeLoans,
            pending_loans: pendingLoans,
            closed_loans: closedLoans,
            defaulted_loans: defaultedLoans,
            total_loan_amount: totalAmount,
            active_loan_amount: activeAmount,
            average_loan_amount: avgLoanAmount,
            average_interest_rate: Math.round(avgInterestRate * 100) / 100,
            summary_generated_at: new Date().toISOString(),
            data_freshness: dataFreshness,
            portfolio_health: {
              default_rate: totalLoans > 0 ? Math.round((defaultedLoans / totalLoans) * 100 * 100) / 100 : 0,
              active_rate: totalLoans > 0 ? Math.round((activeLoans / totalLoans) * 100 * 100) / 100 : 0
            }
          };
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
        
        // Add default risk endpoint handling
        if (segments[1] === 'default' && segments[2]) {
          const borrowerId = segments[2].toUpperCase();
          
          // Using the implementation from risk.js
          const borrowers = dataService.loadData(dataService.paths.borrowers);
          const loans = dataService.loadData(dataService.paths.loans);
          const payments = dataService.loadData(dataService.paths.payments);
          
          // Find the borrower
          const borrower = borrowers.find(b => b.borrower_id === borrowerId);
          if (!borrower) {
            return { error: 'Borrower not found', borrower_id: borrowerId };
          }
          
          // Get borrower's loans
          const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
          if (borrowerLoans.length === 0) {
            return {
              borrower_id: borrowerId,
              risk_score: 0,
              risk_factors: ["No loans found for this borrower"],
              recommendations: ["N/A"]
            };
          }
          
          // Get payment history
          const allPayments = [];
          borrowerLoans.forEach(loan => {
            const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
            allPayments.push(...loanPayments);
          });
          
          // Calculate risk score (simplified algorithm)
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
          
          // Cap risk score between 0-100
          riskScore = Math.max(0, Math.min(100, riskScore));
          
          // Risk level
          let riskLevel = 'low';
          if (riskScore > 70) riskLevel = 'high';
          else if (riskScore > 40) riskLevel = 'medium';
          
          return {
            borrower_id: borrowerId,
            borrower_name: `${borrower.first_name} ${borrower.last_name}`,
            risk_score: riskScore,
            risk_level: riskLevel,
            risk_factors: latePayments.length > 0 ? 
              [`${latePayments.length} late payment(s) in history`] : 
              ["No significant risk factors identified"]
          };
        }
        
        // Add non-accrual risk endpoint handling
        if (segments[1] === 'non-accrual' && segments[2]) {
          const borrowerId = segments[2].toUpperCase();
          
          // Using simplified implementation for non-accrual risk
          const borrowers = dataService.loadData(dataService.paths.borrowers);
          const loans = dataService.loadData(dataService.paths.loans);
          const payments = dataService.loadData(dataService.paths.payments);
          
          // Find the borrower
          const borrower = borrowers.find(b => b.borrower_id === borrowerId);
          if (!borrower) {
            return { error: 'Borrower not found', borrower_id: borrowerId };
          }
          
          // Get borrower's loans
          const borrowerLoans = loans.filter(l => l.borrower_id === borrowerId);
          if (borrowerLoans.length === 0) {
            return {
              borrower_id: borrowerId,
              borrower_name: `${borrower.first_name} ${borrower.last_name}`,
              non_accrual_risk: "low",
              risk_score: 0,
              risk_factors: ["No loans found for this borrower"],
              recommendations: ["No action required"]
            };
          }
          
          // Get payment history
          const allPayments = [];
          borrowerLoans.forEach(loan => {
            const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
            allPayments.push(...loanPayments);
          });
          
          // Calculate non-accrual risk score (simplified algorithm)
          let riskScore = 30; // Base score
          
          // Late payments are a strong indicator
          const latePayments = allPayments.filter(p => p.status === 'Late');
          const lateProportion = allPayments.length > 0 ? latePayments.length / allPayments.length : 0;
          
          if (lateProportion > 0.5) riskScore += 50;
          else if (lateProportion > 0.3) riskScore += 30;
          else if (lateProportion > 0.1) riskScore += 15;
          
          // Cap risk score
          riskScore = Math.max(0, Math.min(100, riskScore));
          
          // Determine risk level
          let riskLevel = "low";
          if (riskScore > 70) riskLevel = "high";
          else if (riskScore > 40) riskLevel = "medium";
          
          return {
            borrower_id: borrowerId,
            borrower_name: `${borrower.first_name} ${borrower.last_name}`,
            non_accrual_risk: riskLevel,
            risk_score: riskScore,
            risk_factors: latePayments.length > 0 ? 
              [`${latePayments.length} late payment(s) out of ${allPayments.length} total payments`] : 
              ["No significant risk factors identified"]
          };
        }
        
        // Add collateral-sufficiency endpoint handling
        if (segments[1] === 'collateral-sufficiency' && segments[2]) {
          const loanId = segments[2].toUpperCase();
          
          const loans = dataService.loadData(dataService.paths.loans);
          const collaterals = dataService.loadData(dataService.paths.collateral);
          
          // Find the loan
          const loan = loans.find(l => l.loan_id === loanId);
          if (!loan) {
            return { error: 'Loan not found', loan_id: loanId };
          }
          
          // Get collateral for this loan
          const loanCollateral = collaterals.filter(c => c.loan_id === loanId);
          
          if (loanCollateral.length === 0) {
            return {
              loan_id: loanId,
              is_sufficient: false,
              loan_amount: loan.loan_amount,
              collateral_value: 0,
              sufficiency_ratio: 0,
              assessment: "No collateral found for this loan."
            };
          }
          
          // Calculate total collateral value
          const collateralValue = loanCollateral.reduce((sum, c) => sum + c.value, 0);
          
          // Calculate sufficiency ratio (collateral value / loan amount)
          const sufficiencyRatio = collateralValue / loan.loan_amount;
          
          // Determine if collateral is sufficient
          const isSufficient = sufficiencyRatio >= 1.0;
          
          return {
            loan_id: loanId,
            is_sufficient: isSufficient,
            loan_amount: loan.loan_amount,
            collateral_value: collateralValue,
            sufficiency_ratio: Number(sufficiencyRatio.toFixed(2)),
            assessment: sufficiencyRatio >= 1.2 ? 
              "Collateral is adequate with reasonable equity margin." : 
              "Collateral may not be sufficient. Consider requesting additional security."
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
   * Get status for a specific loan
   */
  getLoanStatus: MCPServiceWithLogging.createFunction('getLoanStatus', async (args) => {
    const { loan_id } = args;
    
    if (!loan_id) {
      throw new Error('Loan ID is required');
    }
    
    try {
      LogService.info(`Fetching loan status for loan ID: ${loan_id}`);
      const result = await callInternalApi(`/api/loans/status/${loan_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
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
      const result = await callInternalApi(`/api/loans/summary`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
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
      const result = await callInternalApi(`/api/loans/active`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
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
    const { borrower_id } = args;
    
    if (!borrower_id) {
      throw new Error('Borrower ID is required');
    }
    
    try {
      LogService.info(`Fetching loans for borrower ID: ${borrower_id}`);
      const result = await callInternalApi(`/api/loans/borrower/${borrower_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      LogService.error(`Error fetching loans for borrower: ${error.message}`);
      return {
        error: true,
        message: `Could not retrieve loans for borrower: ${error.message}`,
        borrower_id
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
    
    const result = await callInternalApi(`/api/borrowers/${borrower_id}`);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    return result;
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
      const result = await callInternalApi(`/api/risk/default/${borrower_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
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
      const result = await callInternalApi(`/api/risk/non-accrual/${borrower_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
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
   * Get high-risk farmers
   */
  getHighRiskFarmers: MCPServiceWithLogging.createFunction('getHighRiskFarmers', async () => {
    try {
      LogService.info('Fetching high-risk farmers');
      const result = await callInternalApi(`/api/risk/high-risk-farmers`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      LogService.error(`Error fetching high-risk farmers: ${error.message}`);
      return {
        error: true,
        message: `Could not retrieve high-risk farmers: ${error.message}`
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
      const result = await callInternalApi(`/api/risk/collateral-sufficiency/${loan_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      LogService.error(`Error evaluating collateral sufficiency: ${error.message}`);
      return {
        error: true,
        message: `Could not evaluate collateral sufficiency: ${error.message}`,
        loan_id
      };
    }
  }),
  
  /**
   * Forecast equipment maintenance costs
   */
  forecastEquipmentMaintenance: MCPServiceWithLogging.createFunction('forecastEquipmentMaintenance', async (args) => {
    const { borrower_id } = args;
    
    if (!borrower_id) {
      throw new Error('Borrower ID is required');
    }
    
    try {
      LogService.info(`Forecasting equipment maintenance for borrower ID: ${borrower_id}`);
      const result = await callInternalApi(`/api/analytics/equipment-forecast/${borrower_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      LogService.error(`Error forecasting equipment maintenance: ${error.message}`);
      return {
        error: true,
        message: `Could not forecast equipment maintenance: ${error.message}`,
        borrower_id
      };
    }
  }),
  
  /**
   * Assess crop yield risk
   */
  assessCropYieldRisk: MCPServiceWithLogging.createFunction('assessCropYieldRisk', async (args) => {
    const { borrower_id } = args;
    
    if (!borrower_id) {
      throw new Error('Borrower ID is required');
    }
    
    try {
      LogService.info(`Assessing crop yield risk for borrower ID: ${borrower_id}`);
      const result = await callInternalApi(`/api/analytics/crop-yield-risk/${borrower_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      LogService.error(`Error assessing crop yield risk: ${error.message}`);
      return {
        error: true,
        message: `Could not assess crop yield risk: ${error.message}`,
        borrower_id
      };
    }
  }),
  
  /**
   * Analyze market price impact
   */
  analyzeMarketPriceImpact: MCPServiceWithLogging.createFunction('analyzeMarketPriceImpact', async (args) => {
    const { borrower_id } = args;
    
    if (!borrower_id) {
      throw new Error('Borrower ID is required');
    }
    
    try {
      LogService.info(`Analyzing market price impact for borrower ID: ${borrower_id}`);
      const result = await callInternalApi(`/api/analytics/market-impact/${borrower_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      LogService.error(`Error analyzing market price impact: ${error.message}`);
      return {
        error: true,
        message: `Could not analyze market price impact: ${error.message}`,
        borrower_id
      };
    }
  }),
  
  /**
   * Get refinancing options
   */
  getRefinancingOptions: MCPServiceWithLogging.createFunction('getRefinancingOptions', async (args) => {
    const { loan_id } = args;
    
    if (!loan_id) {
      throw new Error('Loan ID is required');
    }
    
    try {
      LogService.info(`Getting refinancing options for loan ID: ${loan_id}`);
      const result = await callInternalApi(`/api/analytics/refinancing-options/${loan_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      LogService.error(`Error getting refinancing options: ${error.message}`);
      return {
        error: true,
        message: `Could not get refinancing options: ${error.message}`,
        loan_id
      };
    }
  }),
  
  /**
   * Analyze payment patterns
   */
  analyzePaymentPatterns: MCPServiceWithLogging.createFunction('analyzePaymentPatterns', async (args) => {
    const { borrower_id } = args;
    
    if (!borrower_id) {
      throw new Error('Borrower ID is required');
    }
    
    try {
      LogService.info(`Analyzing payment patterns for borrower ID: ${borrower_id}`);
      const result = await callInternalApi(`/api/analytics/payment-patterns/${borrower_id}`);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
    } catch (error) {
      LogService.error(`Error analyzing payment patterns: ${error.message}`);
      return {
        error: true,
        message: `Could not analyze payment patterns: ${error.message}`,
        borrower_id
      };
    }
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
        }
      },
      required: ['borrower_id']
    }
  },
  
  analyzeMarketPriceImpact: {
    name: 'analyzeMarketPriceImpact',
    description: 'Analyze the impact of market prices on a borrower',
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