const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/authMiddleware');
const LogService = require('../services/logService');
const openaiService = require('../services/openaiService');
const McpService = require('../services/mcpService');
const axios = require('axios');

// Helper function to call API endpoints internally
async function callInternalApi(endpoint, method = 'GET', data = null) {
  const baseUrl = `http://localhost:${process.env.PORT || 3001}`;
  const url = `${baseUrl}${endpoint}`;
  
  try {
    LogService.info(`Internal API call to ${url}`);
    
    // Configure request with appropriate settings based on method
    const config = {
      method,
      url,
      headers: {
        'Accept': 'application/json',
        'X-Internal-Call': 'true', // Marker for internal API calls
        'Authorization': 'Bearer SYSTEM_INTERNAL_CALL' // Special token for internal calls
      }
    };
    
    // Only add Content-Type and data for non-GET requests
    if (method !== 'GET' && data) {
      config.headers['Content-Type'] = 'application/json';
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (!response || !response.data) {
      LogService.warn(`Empty response from internal API call to ${url}`);
      return { error: 'Empty response from API' };
    }
    
    return response.data;
  } catch (error) {
    LogService.error(`Internal API call failed: ${error.message}`);
    if (error.response) {
      LogService.error(`Response status: ${error.response.status}`, error.response.data);
      return { 
        error: 'Internal API call failed', 
        details: error.response.data,
        status: error.response.status
      };
    }
    
    return { 
      error: 'Internal API call failed', 
      details: error.message 
    };
  }
}

// MCP Functions for LoanOfficerAI
const mcpFunctions = [
  {
    name: "getBorrowerDefaultRisk",
    description: "Get default risk assessment for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        },
        timeHorizon: {
          type: "string",
          enum: ["short_term", "medium_term", "long_term"],
          description: "The time horizon for risk assessment"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "getHighRiskFarmers",
    description: "Identify farmers with high risk of default across the portfolio",
    parameters: {
      type: "object",
      properties: {
        timeHorizon: {
          type: "string",
          enum: ["3m", "6m", "12m", "1y"],
          description: "The time horizon for risk assessment (e.g., 3m, 6m, 12m)"
        },
        threshold: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "The risk threshold to filter farmers (high, medium, low)"
        }
      }
    }
  },
  {
    name: "getBorrowerNonAccrualRisk",
    description: "Get non-accrual risk assessment for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "getBorrowerDetails",
    description: "Get detailed information about a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "getActiveLoans",
    description: "Get a list of all active loans in the system",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "predictDefaultRisk",
    description: "Predict the default risk for a specific borrower over a given time horizon",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        },
        timeHorizon: {
          type: "string",
          enum: ["3m", "6m", "1y"],
          description: "The time horizon for prediction (3 months, 6 months, or 1 year)"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "predictNonAccrualRisk",
    description: "Predict the likelihood of a borrower's loans becoming non-accrual",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "analyzePaymentPatterns",
    description: "Analyze payment patterns for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        },
        period: {
          type: "string",
          enum: ["6m", "1y", "2y", "3y"],
          description: "The time period to analyze (6 months, 1 year, 2 years, or 3 years)"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "getRefinancingOptions",
    description: "Get refinancing options for a specific loan",
    parameters: {
      type: "object",
      properties: {
        loanId: {
          type: "string",
          description: "The ID of the loan (e.g., L001)"
        }
      },
      required: ["loanId"]
    }
  },
  {
    name: "getLoanStatus",
    description: "Get the status of a specific loan",
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
  {
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
  {
    name: "getLoansByBorrower",
    description: "Get a list of loans for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrower: {
          type: "string",
          description: "The ID of the borrower"
        }
      },
      required: ["borrower"]
    }
  },
  {
    name: "getLoanSummary",
    description: "Get a summary of loans in the system",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "findFarmersAtRisk",
    description: "Find farmers at risk",
    parameters: {
      type: "object",
      properties: {
        crop_type: {
          type: "string",
          description: "The type of crop"
        },
        season: {
          type: "string",
          description: "The season"
        },
        risk_level: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "The risk level"
        }
      },
      required: ["crop_type", "season", "risk_level"]
    }
  },
  {
    name: "forecastEquipmentMaintenance",
    description: "Forecast equipment maintenance for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        },
        timeHorizon: {
          type: "string",
          enum: ["1y"],
          description: "The time horizon for forecast (1 year)"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "assessCropYieldRisk",
    description: "Assess crop yield risk for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        },
        cropType: {
          type: "string",
          description: "The type of crop"
        },
        season: {
          type: "string",
          enum: ["current"],
          description: "The season"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "analyzeMarketPriceImpact",
    description: "Analyze market price impact for a specific borrower",
    parameters: {
      type: "object",
      properties: {
        borrowerId: {
          type: "string",
          description: "The ID of the borrower (e.g., B001)"
        },
        commodityTypes: {
          type: "array",
          items: {
            type: "string"
          },
          description: "The types of commodities"
        }
      },
      required: ["borrowerId"]
    }
  },
  {
    name: "recommendLoanRestructuring",
    description: "Recommend loan restructuring for a specific loan",
    parameters: {
      type: "object",
      properties: {
        loanId: {
          type: "string",
          description: "The ID of the loan (e.g., L001)"
        },
        optimizationGoal: {
          type: "string",
          enum: ["lower_payments"],
          description: "The optimization goal"
        }
      },
      required: ["loanId"]
    }
  },
  {
    name: "evaluateCollateralSufficiency",
    description: "Evaluate collateral sufficiency for a specific loan",
    parameters: {
      type: "object",
      properties: {
        loanId: {
          type: "string",
          description: "The ID of the loan (e.g., L001)"
        },
        marketConditions: {
          type: "string",
          enum: ["stable"],
          description: "The market conditions"
        }
      },
      required: ["loanId"]
    }
  }
];

// OpenAI proxy endpoint
router.post('/chat', authMiddleware.verifyToken, async (req, res) => {
  try {
    // Validate request body
    const { messages, functions, function_call } = req.body;
    if (!messages || !Array.isArray(messages)) {
      LogService.error('Invalid OpenAI request format: Messages array is missing or invalid');
      return res.status(400).json({ error: 'Invalid request format. Messages array is required.' });
    }
    
    // Log request details for visibility
    LogService.mcp('MCP PROTOCOL: OpenAI Chat Completion', {
      messageCount: messages.length,
      functionCount: functions ? functions.length : 0,
      functionCall: function_call || 'auto',
      user: req.user ? req.user.id : 'unknown'
    });
    
    // Merge MCP functions with any provided functions
    const allFunctions = [...mcpFunctions, ...(functions || [])];
    
    // Use our enhanced OpenAI service
    const response = await openaiService.createChatCompletion({
      model: "gpt-4o",
      messages,
      functions: allFunctions,
      function_call: function_call || 'auto',
    });
    
    // Check if we got a function call
    const message = response.choices[0].message;
    if (message.function_call) {
      const functionName = message.function_call.name;
      
      try {
        const functionArgs = JSON.parse(message.function_call.arguments);
        LogService.mcp(`MCP FUNCTION CALL: ${functionName}`, functionArgs);
        
        // Handle different function calls
        let functionResult = null;
        
        try {
          if (functionName === 'getBorrowerDefaultRisk') {
            const { borrowerId, timeHorizon = 'medium_term' } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/risk/default/${borrowerId}?time_horizon=${timeHorizon}`),
              'getBorrowerDefaultRisk',
              borrowerId, 
              timeHorizon
            );
          } 
          else if (functionName === 'getBorrowerNonAccrualRisk') {
            const { borrowerId } = functionArgs;
            LogService.mcp(`Processing non-accrual risk for borrower: ${borrowerId}`, {
              endpoint: `/api/risk/non-accrual/${borrowerId}`,
              functionName: 'getBorrowerNonAccrualRisk'
            });
            
            try {
              // First, verify borrower exists by calling the borrowers endpoint
              const borrowerCheck = await callInternalApi(`/api/borrowers/${borrowerId}`);
              
              if (borrowerCheck.error) {
                LogService.warn(`Borrower check failed for ${borrowerId}: ${borrowerCheck.error}`);
                functionResult = {
                  error: 'Borrower not found',
                  borrower_id: borrowerId,
                  details: `Unable to verify borrower with ID ${borrowerId}`
                };
              } else {
                // Borrower exists, proceed with non-accrual risk assessment
                LogService.debug(`Borrower ${borrowerId} verified, proceeding with non-accrual risk assessment`);
                
                const riskResult = await callInternalApi(`/api/risk/non-accrual/${borrowerId}`);
                functionResult = await McpService.call(
                  () => Promise.resolve(riskResult), // Use the already fetched result
                  'getBorrowerNonAccrualRisk',
                  borrowerId
                );
                
                // If the response indicates borrower not found but we know it exists
                if (functionResult.error === 'Borrower not found') {
                  LogService.warn(`Risk endpoint reports borrower ${borrowerId} not found, but borrower endpoint verified it exists`);
                  
                  // Try the analytics endpoint as a fallback
                  const analyticsFallback = await callInternalApi(`/api/analytics/predict/non-accrual-risk/${borrowerId}`);
                  if (!analyticsFallback.error) {
                    LogService.info(`Successfully retrieved non-accrual risk from analytics endpoint for borrower ${borrowerId}`);
                    functionResult = analyticsFallback;
                  }
                }
              }
            } catch (error) {
              LogService.error(`Error in getBorrowerNonAccrualRisk for ${borrowerId}:`, {
                message: error.message,
                stack: error.stack
              });
              
              functionResult = {
                error: 'Failed to assess non-accrual risk',
                borrower_id: borrowerId,
                details: error.message
              };
            }
          }
          else if (functionName === 'getBorrowerDetails') {
            const { borrowerId } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/borrowers/${borrowerId}`),
              'getBorrowerDetails',
              borrowerId
            );
          }
          else if (functionName === 'getActiveLoans') {
            functionResult = await McpService.call(
              () => callInternalApi('/api/loans/active'),
              'getActiveLoans'
            );
          }
          else if (functionName === 'predictDefaultRisk') {
            const { borrowerId, timeHorizon = '3m' } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/analytics/predict/default-risk/${borrowerId}?time_horizon=${timeHorizon}`),
              'predictDefaultRisk',
              borrowerId,
              timeHorizon
            );
          }
          else if (functionName === 'predictNonAccrualRisk') {
            const { borrowerId } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/analytics/predict/non-accrual-risk/${borrowerId}`),
              'predictNonAccrualRisk',
              borrowerId
            );
          }
          else if (functionName === 'analyzePaymentPatterns') {
            const { borrowerId, period = '1y' } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/analytics/payment-patterns/${borrowerId}?period=${period}`),
              'analyzePaymentPatterns',
              borrowerId,
              period
            );
          }
          else if (functionName === 'getRefinancingOptions') {
            const { loanId } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/analytics/recommendations/refinance/${loanId}`),
              'getRefinancingOptions',
              loanId
            );
          }
          else if (functionName === 'getLoanStatus') {
            const { loan_id } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/loans/status/${loan_id}`),
              'getLoanStatus',
              loan_id
            );
          }
          else if (functionName === 'getLoanDetails') {
            const { loan_id } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/loans/details/${loan_id}`),
              'getLoanDetails',
              loan_id
            );
          }
          else if (functionName === 'getLoansByBorrower') {
            const { borrower } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/loans/borrower/${borrower}`),
              'getLoansByBorrower',
              borrower
            );
          }
          else if (functionName === 'getLoanSummary') {
            functionResult = await McpService.call(
              () => callInternalApi('/api/loans/summary'),
              'getLoanSummary'
            );
          }
          else if (functionName === 'getHighRiskFarmers') {
            const { timeHorizon = '3m', threshold = 'high' } = functionArgs;
            
            LogService.mcp(`Identifying high risk farmers`, {
              timeHorizon,
              threshold,
              endpoint: `/api/analytics/high-risk-farmers?time_horizon=${timeHorizon}&threshold=${threshold}`,
              functionName: 'getHighRiskFarmers'
            });
            
            try {
              functionResult = await McpService.call(
                () => callInternalApi(`/api/analytics/high-risk-farmers?time_horizon=${timeHorizon}&threshold=${threshold}`),
                'getHighRiskFarmers',
                timeHorizon,
                threshold
              );
              
              LogService.debug(`Retrieved ${functionResult.farmers?.length || 0} high risk farmers`);
              
              // If no farmers found but no error, provide a clearer message
              if (functionResult && !functionResult.error && (!functionResult.farmers || functionResult.farmers.length === 0)) {
                LogService.info(`No farmers found meeting the ${threshold} risk threshold over ${timeHorizon} time horizon`);
              }
            } catch (error) {
              LogService.error(`Error in getHighRiskFarmers:`, {
                message: error.message,
                stack: error.stack,
                timeHorizon,
                threshold
              });
              
              functionResult = {
                error: 'Failed to identify high risk farmers',
                details: error.message,
                time_horizon: timeHorizon,
                threshold: threshold
              };
            }
          }
          else if (functionName === 'findFarmersAtRisk') {
            const { crop_type, season, risk_level = 'high' } = functionArgs;
            let queryParams = '';
            if (crop_type) queryParams += `crop_type=${crop_type}&`;
            if (season) queryParams += `season=${season}&`;
            if (risk_level) queryParams += `risk_level=${risk_level}`;
            
            functionResult = await McpService.call(
              () => callInternalApi(`/api/risk/farmers-at-risk?${queryParams}`),
              'findFarmersAtRisk',
              crop_type,
              season,
              risk_level
            );
          }
          else if (functionName === 'forecastEquipmentMaintenance') {
            const { borrowerId, timeHorizon = '1y' } = functionArgs;
            functionResult = await McpService.call(
              () => callInternalApi(`/api/analytics/equipment/forecast/${borrowerId}?time_horizon=${timeHorizon}`),
              'forecastEquipmentMaintenance',
              borrowerId,
              timeHorizon
            );
          }
          else if (functionName === 'assessCropYieldRisk') {
            const { borrowerId, cropType, season = 'current' } = functionArgs;
            let queryParams = `season=${season}`;
            if (cropType) queryParams += `&crop_type=${cropType}`;
            
            functionResult = await McpService.call(
              () => callInternalApi(`/api/analytics/crop-yield/${borrowerId}?${queryParams}`),
              'assessCropYieldRisk',
              borrowerId,
              cropType,
              season
            );
          }
          else if (functionName === 'analyzeMarketPriceImpact') {
            const { borrowerId, commodityTypes = [] } = functionArgs;
            let queryParams = '';
            if (commodityTypes.length > 0) {
              queryParams = `commodities=${commodityTypes.join(',')}`;
            }
            
            functionResult = await McpService.call(
              () => callInternalApi(`/api/analytics/market-impact/${borrowerId}${queryParams ? '?' + queryParams : ''}`),
              'analyzeMarketPriceImpact',
              borrowerId,
              commodityTypes
            );
          }
          else if (functionName === 'recommendLoanRestructuring') {
            const { loanId, optimizationGoal = 'lower_payments' } = functionArgs;
            
            functionResult = await McpService.call(
              () => callInternalApi(`/api/analytics/restructure/${loanId}?goal=${optimizationGoal}`),
              'recommendLoanRestructuring',
              loanId,
              optimizationGoal
            );
          }
          else if (functionName === 'evaluateCollateralSufficiency') {
            const { loanId, marketConditions = 'stable' } = functionArgs;
            
            LogService.mcp(`Evaluating collateral sufficiency for loan: ${loanId}`, {
              endpoint: `/api/risk/collateral/${loanId}?market_conditions=${marketConditions}`,
              marketConditions,
              functionName: 'evaluateCollateralSufficiency'
            });
            
            try {
              // Check if loan exists first
              const loanCheck = await callInternalApi(`/api/loans/details/${loanId}`);
              
              if (loanCheck.error) {
                LogService.warn(`Loan check failed for ${loanId}: ${loanCheck.error}`);
                functionResult = {
                  error: 'Loan not found',
                  loan_id: loanId,
                  details: `Unable to verify loan with ID ${loanId}`
                };
              } else {
                // Loan exists, proceed with collateral evaluation
                LogService.debug(`Loan ${loanId} verified, proceeding with collateral evaluation`);
                
                const riskResult = await callInternalApi(`/api/risk/collateral/${loanId}?market_conditions=${marketConditions}`);
                
                if (riskResult.error) {
                  LogService.error(`Error evaluating collateral for loan ${loanId}:`, {
                    error: riskResult.error,
                    details: riskResult.details || 'No additional details'
                  });
                  
                  functionResult = {
                    error: 'Failed to evaluate collateral',
                    loan_id: loanId,
                    details: riskResult.error
                  };
                } else {
                  LogService.info(`Successfully evaluated collateral for loan ${loanId}: LTV ${riskResult.loan_to_value_ratio}, Sufficient: ${riskResult.is_sufficient}`);
                  
                  // Add a more understandable summary
                  riskResult.summary = `This loan has a ${riskResult.loan_to_value_ratio * 100}% loan-to-value ratio` + 
                    ` (industry standard threshold is ${riskResult.industry_standard_threshold * 100}%).` +
                    ` The collateral ${riskResult.is_sufficient ? 'meets' : 'does not meet'} industry standards.`;
                  
                  functionResult = riskResult;
                }
              }
            } catch (error) {
              LogService.error(`Error in evaluateCollateralSufficiency for ${loanId}:`, {
                message: error.message,
                stack: error.stack
              });
              
              functionResult = {
                error: 'Failed to evaluate collateral sufficiency',
                loan_id: loanId,
                details: error.message
              };
            }
          }
          else {
            LogService.warn(`Unknown MCP function: ${functionName}`);
            functionResult = { error: `Unknown function: ${functionName}` };
          }
          
          // Handle the case where functionResult is undefined or null
          if (!functionResult) {
            LogService.warn(`Empty result from function: ${functionName}`);
            functionResult = { note: "No data available for this function" };
          }
          
          // Create a new message with the function result
          const newMessage = {
            role: "function",
            name: functionName,
            content: JSON.stringify(functionResult)
          };
          
          LogService.mcp(`Function result for ${functionName}`, {
            result: functionResult,
            resultSize: JSON.stringify(functionResult).length
          });
          
          // Call OpenAI again with the function result
          const secondResponse = await openaiService.createChatCompletion({
            model: "gpt-4o",
            messages: [...messages, message, newMessage],
          });
          
          // Send the final response
          return res.json(secondResponse.choices[0].message);
        } catch (fnError) {
          LogService.error(`Error in MCP function call execution: ${functionName}`, {
            error: fnError.message,
            stack: fnError.stack,
            functionName,
            functionArgs
          });
          
          // Handle function execution error gracefully
          return res.status(500).json({
            error: 'Error executing function',
            details: fnError.message,
            function: functionName
          });
        }
      } catch (parseError) {
        LogService.error(`Error parsing function arguments for ${functionName}`, {
          error: parseError.message,
          arguments: message.function_call.arguments
        });
        
        return res.status(400).json({
          error: 'Invalid function arguments',
          details: parseError.message,
          function: functionName
        });
      }
    } else {
      // Send the response directly if no function was called
      res.json(message);
    }
  } catch (error) {
    LogService.error('Error processing OpenAI request', {
      message: error.message,
      stack: error.stack
    });
    
    // Send a more detailed error response
    res.status(500).json({ 
      error: 'Failed to process OpenAI request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 