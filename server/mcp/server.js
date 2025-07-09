const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const LogService = require('../services/logService');
const dataService = require('../services/dataService');
const mcpDatabaseService = require('../services/mcpDatabaseService');
const DatabaseManager = require('../../utils/database');

class LoanOfficerMCPServer {
  constructor() {
    this.server = new McpServer({
      name: 'LoanOfficerAI-MCP',
      version: '2.0.0',
      description: 'MCP server for agricultural lending system with SQL database integration'
    });
    
    this.setupTools();
    this.transports = new Map(); // Store transports by session ID
    
    // Enable graceful shutdown
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }
  
  setupTools() {
    // Tool: Get Non-Accrual Risk
    this.server.tool(
      'getBorrowerNonAccrualRisk',
      {
        borrowerId: z.string().describe('The ID of the borrower (e.g., B001)'),
        includeRecommendations: z.boolean().optional().default(true),
        userId: z.string().optional().describe('User ID for audit logging')
      },
      async ({ borrowerId, includeRecommendations = true, userId }) => {
        try {
          LogService.mcp(`Evaluating non-accrual risk for borrower ${borrowerId}`);

          // Use database service if enabled
          if (process.env.USE_DATABASE === 'true') {
            try {
              // Start MCP conversation tracking
              const conversation = userId
                ? await mcpDatabaseService.startConversation(
                    userId,
                    'risk_assessment',
                    borrowerId
                  )
                : { conversationId: null };

              const riskAssessment = await mcpDatabaseService.getBorrowerNonAccrualRisk(
                borrowerId.toUpperCase().trim()
              );

              // Log the AI recommendation
              if (conversation.conversationId) {
                await mcpDatabaseService.logAIRecommendation(
                  conversation.conversationId,
                  'borrower',
                  borrowerId,
                  'risk_assessment',
                  `Risk level: ${riskAssessment.risk_level}`,
                  0.85, // Confidence score
                  riskAssessment
                );
              }

              const response = {
                borrower_id: riskAssessment.borrower_id,
                borrower_name: riskAssessment.borrower_name,
                non_accrual_risk: riskAssessment.risk_level,
                risk_score: riskAssessment.risk_score,
                risk_factors: riskAssessment.risk_factors,
                calculated_at: new Date().toISOString(),
              };

              if (includeRecommendations) {
                response.recommendations = this._generateRiskRecommendations(
                  riskAssessment.risk_level,
                  riskAssessment.risk_score
                );
              }

              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify(response)
                }]
              };
            } catch (dbError) {
              LogService.error(`Database service error in getBorrowerNonAccrualRisk: ${dbError.message}`, {
                borrowerId,
                error: dbError.message,
                stack: dbError.stack
              });
              // Fall back to JSON files
              LogService.warn('Falling back to JSON data for non-accrual risk assessment');
            }
          }
          
          // Fallback to JSON implementation
          const normalizedId = borrowerId.toUpperCase().trim();
          
          // Load data
          const borrowers = dataService.loadData(dataService.paths.borrowers);
          const loans = dataService.loadData(dataService.paths.loans);
          const payments = dataService.loadData(dataService.paths.payments);
          
          // Find borrower
          const borrower = borrowers.find(b => b.borrower_id === normalizedId);
          if (!borrower) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  error: 'Borrower not found',
                  borrower_id: normalizedId
                })
              }]
            };
          }
          
          // Get borrower's loans
          const borrowerLoans = loans.filter(l => l.borrower_id === normalizedId);
          
          if (borrowerLoans.length === 0) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  borrower_id: normalizedId,
                  borrower_name: `${borrower.first_name} ${borrower.last_name}`,
                  non_accrual_risk: 'low',
                  risk_score: 0,
                  risk_factors: ['No loans found for this borrower'],
                  recommendations: ['No action required']
                })
              }]
            };
          }
          
          // Get payment history
          const allPayments = [];
          borrowerLoans.forEach(loan => {
            const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
            allPayments.push(...loanPayments);
          });
          
          // Calculate risk score
          let riskScore = 30;
          
          const latePayments = allPayments.filter(p => p.status === 'Late');
          const lateProportion = allPayments.length > 0 ? latePayments.length / allPayments.length : 0;
          
          if (lateProportion > 0.5) riskScore += 50;
          else if (lateProportion > 0.3) riskScore += 30;
          else if (lateProportion > 0.1) riskScore += 15;
          
          if (borrower.credit_score < 600) riskScore += 20;
          else if (borrower.credit_score < 650) riskScore += 10;
          
          riskScore = Math.max(0, Math.min(100, riskScore));
          
          let riskLevel = 'low';
          if (riskScore > 70) riskLevel = 'high';
          else if (riskScore > 40) riskLevel = 'medium';
          
          const riskFactors = [];
          if (latePayments.length > 0) {
            riskFactors.push(`${latePayments.length} late payment(s) out of ${allPayments.length} total payments`);
          }
          if (borrower.credit_score < 650) {
            riskFactors.push(`Below average credit score: ${borrower.credit_score}`);
          }
          
          const recommendations = includeRecommendations ? 
            this._generateRiskRecommendations(riskLevel, riskScore) : [];
          
          const result = {
            borrower_id: normalizedId,
            borrower_name: `${borrower.first_name} ${borrower.last_name}`,
            non_accrual_risk: riskLevel,
            risk_score: riskScore,
            risk_factors: riskFactors,
            recommendations: recommendations
          };
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        } catch (error) {
          LogService.error(`Error in getBorrowerNonAccrualRisk: ${error.message}`);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'Failed to assess non-accrual risk',
                details: error.message
              })
            }]
          };
        }
      }
    );
    
    // Tool: Evaluate Collateral Sufficiency
    this.server.tool(
      'evaluateCollateralSufficiency',
      {
        loanId: z.string().describe('The ID of the loan (e.g., L001)'),
        marketConditions: z.enum(['stable', 'declining', 'improving']).optional().default('stable'),
        userId: z.string().optional().describe('User ID for audit logging')
      },
      async ({ loanId, marketConditions = 'stable', userId }) => {
        try {
          LogService.mcp(`Evaluating collateral for loan ${loanId} with market conditions: ${marketConditions}`);
          
          // Use database service if enabled
          if (process.env.USE_DATABASE === 'true') {
            try {
              // Start MCP conversation tracking
              const conversation = userId
                ? await mcpDatabaseService.startConversation(
                    userId,
                    'collateral_analysis',
                    loanId
                  )
                : { conversationId: null };

              const collateralAnalysis = await mcpDatabaseService.evaluateCollateralSufficiency(
                loanId.toUpperCase().trim(),
                marketConditions
              );

              // Log the AI recommendation
              if (conversation.conversationId) {
                await mcpDatabaseService.logAIRecommendation(
                  conversation.conversationId,
                  'loan',
                  loanId,
                  'collateral_assessment',
                  collateralAnalysis.assessment,
                  0.9, // High confidence for collateral calculations
                  collateralAnalysis
                );
              }

              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify(collateralAnalysis)
                }]
              };
            } catch (dbError) {
              LogService.error(`Database service error in evaluateCollateralSufficiency: ${dbError.message}`, {
                loanId,
                error: dbError.message,
                stack: dbError.stack
              });
              // Fall back to JSON files
              LogService.warn('Falling back to JSON data for collateral evaluation');
            }
          }
          
          const normalizedLoanId = loanId.toUpperCase().trim();
          
          // Load data
          const loans = dataService.loadData(dataService.paths.loans);
          const collaterals = dataService.loadData(dataService.paths.collateral);
          
          // Find loan
          const loan = loans.find(l => l.loan_id === normalizedLoanId);
          if (!loan) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  error: 'Loan not found',
                  loan_id: normalizedLoanId
                })
              }]
            };
          }
          
          // Get collateral
          const loanCollateral = collaterals.filter(c => c.loan_id === normalizedLoanId);
          
          if (loanCollateral.length === 0) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  loan_id: normalizedLoanId,
                  is_sufficient: false,
                  current_loan_balance: loan.loan_amount,
                  collateral_value: 0,
                  loan_to_value_ratio: Infinity,
                  assessment: 'No collateral found for this loan.'
                })
              }]
            };
          }
          
          // Calculate collateral value
          let collateralValue = loanCollateral.reduce((sum, c) => sum + c.value, 0);
          
          // Adjust for market conditions
          let marketAdjustment = 1.0;
          if (marketConditions === 'declining') {
            marketAdjustment = 0.8;
          } else if (marketConditions === 'improving') {
            marketAdjustment = 1.1;
          }
          
          const adjustedCollateralValue = collateralValue * marketAdjustment;
          const currentLoanBalance = loan.loan_amount;
          const loanToValueRatio = currentLoanBalance / adjustedCollateralValue;
          
          const sufficiencyThreshold = 0.8;
          const isSufficient = loanToValueRatio < sufficiencyThreshold;
          
          let assessment = '';
          if (loanToValueRatio < 0.5) {
            assessment = 'Collateral is highly sufficient with significant equity buffer.';
          } else if (loanToValueRatio < 0.7) {
            assessment = 'Collateral is adequate with reasonable equity margin.';
          } else if (loanToValueRatio < 0.8) {
            assessment = 'Collateral is minimally sufficient. Consider monitoring valuations.';
          } else if (loanToValueRatio < 1.0) {
            assessment = 'Collateral is below recommended levels but still covers the loan. Consider requesting additional security.';
          } else {
            assessment = 'Insufficient collateral. Loan is under-secured based on current valuations.';
          }
          
          const result = {
            loan_id: normalizedLoanId,
            loan_type: loan.loan_type,
            is_sufficient: isSufficient,
            industry_standard_threshold: sufficiencyThreshold,
            current_loan_balance: currentLoanBalance,
            collateral_value: adjustedCollateralValue,
            loan_to_value_ratio: Number(loanToValueRatio.toFixed(2)),
            market_conditions: marketConditions,
            market_adjustment_factor: marketAdjustment,
            collateral_items: loanCollateral.length,
            collateral_details: loanCollateral.map(c => ({
              id: c.collateral_id,
              description: c.description,
              value: c.value
            })),
            assessment: assessment
          };
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        } catch (error) {
          LogService.error(`Error in evaluateCollateralSufficiency: ${error.message}`);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'Failed to evaluate collateral sufficiency',
                details: error.message
              })
            }]
          };
        }
      }
    );
    
    // Tool: Get Borrower Default Risk
    this.server.tool(
      'getBorrowerDefaultRisk',
      {
        borrowerId: z.string().describe('The ID of the borrower (e.g., B001)'),
        timeHorizon: z.enum(['short_term', 'medium_term', 'long_term']).optional().default('medium_term'),
        userId: z.string().optional().describe('User ID for audit logging')
      },
      async ({ borrowerId, timeHorizon = 'medium_term', userId }) => {
        try {
          LogService.mcp(`Assessing default risk for borrower ${borrowerId} with time horizon: ${timeHorizon}`);
          
          // Use database service if enabled
          if (process.env.USE_DATABASE === 'true') {
            try {
              // Start MCP conversation tracking if userId provided
              const conversation = userId
                ? await mcpDatabaseService.startConversation(
                    userId,
                    'default_risk',
                    borrowerId
                  )
                : { conversationId: null };

              const defaultRisk = await mcpDatabaseService.getBorrowerDefaultRisk(
                borrowerId.toUpperCase().trim()
              );

              // Add time horizon considerations
              defaultRisk.time_horizon = timeHorizon;
              defaultRisk.recommendations = this._generateDefaultRiskRecommendations(
                defaultRisk.risk_level || defaultRisk.risk_category,
                timeHorizon
              );

              // Log the AI recommendation if we have a conversation ID
              if (conversation.conversationId) {
                await mcpDatabaseService.logAIRecommendation(
                  conversation.conversationId,
                  'borrower',
                  borrowerId,
                  'default_risk',
                  `Default risk level: ${defaultRisk.risk_level || defaultRisk.risk_category}`,
                  0.8, // Confidence score
                  defaultRisk
                );
              }

              return {
                content: [{
                  type: 'text',
                  text: JSON.stringify(defaultRisk)
                }]
              };
            } catch (dbError) {
              LogService.error(`Database service error in getBorrowerDefaultRisk: ${dbError.message}`, {
                borrowerId,
                error: dbError.message,
                stack: dbError.stack
              });
              // Fall back to JSON files
              LogService.warn('Falling back to JSON data for default risk assessment');
            }
          }
          
          const normalizedId = borrowerId.toUpperCase().trim();
          
          // Load data
          const borrowers = dataService.loadData(dataService.paths.borrowers);
          const loans = dataService.loadData(dataService.paths.loans);
          const payments = dataService.loadData(dataService.paths.payments);
          
          const borrower = borrowers.find(b => b.borrower_id === normalizedId);
          if (!borrower) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  error: 'Borrower not found',
                  borrower_id: normalizedId
                })
              }]
            };
          }
          
          // Similar risk calculation logic as non-accrual
          const borrowerLoans = loans.filter(l => l.borrower_id === normalizedId);
          
          if (borrowerLoans.length === 0) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  borrower_id: normalizedId,
                  risk_score: 0,
                  risk_factors: ['No loans found for this borrower'],
                  recommendations: ['N/A']
                })
              }]
            };
          }
          
          // Calculate risk score
          let riskScore = 50;
          
          if (borrower.credit_score >= 750) riskScore -= 15;
          else if (borrower.credit_score >= 700) riskScore -= 10;
          else if (borrower.credit_score >= 650) riskScore -= 5;
          else if (borrower.credit_score < 600) riskScore += 20;
          
          const allPayments = [];
          borrowerLoans.forEach(loan => {
            const loanPayments = payments.filter(p => p.loan_id === loan.loan_id);
            allPayments.push(...loanPayments);
          });
          
          const latePayments = allPayments.filter(p => p.status === 'Late');
          if (latePayments.length > 3) riskScore += 25;
          else if (latePayments.length > 0) riskScore += latePayments.length * 5;
          
          const totalLoanAmount = borrowerLoans.reduce((sum, loan) => sum + loan.loan_amount, 0);
          const loanToIncomeRatio = totalLoanAmount / borrower.income;
          if (loanToIncomeRatio > 5) riskScore += 25;
          else if (loanToIncomeRatio > 3) riskScore += 15;
          else if (loanToIncomeRatio > 2) riskScore += 5;
          
          if (borrower.farm_size < 50) riskScore += 10;
          
          riskScore = Math.max(0, Math.min(100, riskScore));
          const riskLevel = riskScore > 70 ? 'high' : (riskScore > 40 ? 'medium' : 'low');
          
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
          
          const recommendations = this._generateDefaultRiskRecommendations(riskLevel, timeHorizon);
          
          const result = {
            borrower_id: normalizedId,
            borrower_name: `${borrower.first_name} ${borrower.last_name}`,
            risk_score: riskScore,
            risk_level: riskLevel,
            time_horizon: timeHorizon,
            risk_factors: riskFactors,
            recommendations: recommendations
          };
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }]
          };
        } catch (error) {
          LogService.error(`Error in getBorrowerDefaultRisk: ${error.message}`);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: 'Failed to assess default risk',
                details: error.message
              })
            }]
          };
        }
      }
    );
    
    // Add more tools as needed...
    
    LogService.info('MCP server tools configured');
  }
  
  // Handle MCP requests via Express middleware
  async handleMCPRequest(req, res, isInitializeRequest = false) {
    const sessionId = req.headers['mcp-session-id'];
    const startTime = Date.now();
    
    try {
      let transport;
      
      if (sessionId && this.transports.has(sessionId)) {
        // Reuse existing transport
        transport = this.transports.get(sessionId);
      } else if (!sessionId && isInitializeRequest) {
        // New initialization request
        const crypto = require('crypto');
        const newSessionId = crypto.randomUUID();
        
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID
            this.transports.set(sessionId, transport);
            LogService.info(`MCP session initialized: ${sessionId}`);
          }
        });
        
        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            this.transports.delete(transport.sessionId);
            LogService.info(`MCP session closed: ${transport.sessionId}`);
          }
        };
        
        // Connect to the MCP server
        await this.server.connect(transport);
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }
      
      // Handle the request
      await transport.handleRequest(req, res, req.body);
      
      // Log performance metrics
      const duration = Date.now() - startTime;
      LogService.mcp(`MCP request completed in ${duration}ms`, {
        sessionId: transport.sessionId,
        method: req.body?.method,
        duration,
      });
    } catch (error) {
      LogService.error(`MCP request failed: ${error.message}`, {
        sessionId,
        method: req.body?.method,
        stack: error.stack
      });
      
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal error' },
        id: req.body?.id || null,
      });
    }
  }
  
  // Handle GET and DELETE requests for sessions
  async handleSessionRequest(req, res) {
    const sessionId = req.headers['mcp-session-id'];
    if (!sessionId || !this.transports.has(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }
    
    const transport = this.transports.get(sessionId);
    await transport.handleRequest(req, res);
  }
  
  // Helper method for generating risk recommendations
  _generateRiskRecommendations(riskLevel, riskScore) {
    const recommendations = [];

    if (riskLevel === "high") {
      recommendations.push("Implement enhanced monitoring procedures");
      recommendations.push("Consider requiring additional collateral");
      recommendations.push("Schedule immediate borrower meeting");
      if (riskScore > 80) {
        recommendations.push("Consider loan restructuring options");
        recommendations.push("Evaluate early intervention strategies");
      }
    } else if (riskLevel === "medium") {
      recommendations.push("Schedule quarterly review meetings");
      recommendations.push("Monitor seasonal payment patterns");
      recommendations.push("Discuss risk mitigation strategies with borrower");
    } else {
      recommendations.push("Continue standard monitoring procedures");
      recommendations.push("Annual risk assessment sufficient");
    }

    return recommendations;
  }

  // Helper method for generating default risk recommendations
  _generateDefaultRiskRecommendations(riskLevel, timeHorizon) {
    const recommendations = [];

    const timeMultiplier =
      timeHorizon === "short_term"
        ? 0.8
        : timeHorizon === "long_term"
        ? 1.2
        : 1.0;

    if (riskLevel === "high") {
      recommendations.push(
        `Increase monitoring frequency for ${timeHorizon} assessment`
      );
      recommendations.push("Consider portfolio diversification strategies");
      if (timeHorizon === "long_term") {
        recommendations.push(
          "Evaluate long-term sustainability of farm operations"
        );
      }
    } else if (riskLevel === "medium") {
      recommendations.push(`Standard ${timeHorizon} monitoring protocols`);
      recommendations.push("Track market condition impacts");
    } else {
      recommendations.push(
        `Low-risk classification for ${timeHorizon} horizon`
      );
      recommendations.push("Standard review procedures adequate");
    }

    return recommendations;
  }
  
  async stop() {
    try {
      LogService.info('Stopping MCP server transports...');
      
      // Close all transports gracefully
      const closePromises = Array.from(this.transports.values()).map(
        (transport) =>
          new Promise((resolve) => {
            transport.onclose = resolve;
            transport.close();
          })
      );

      await Promise.all(closePromises);
      this.transports.clear();
      
      LogService.info('MCP server stopped');
    } catch (error) {
      LogService.error(`Error stopping MCP server: ${error.message}`);
    }
  }
}

module.exports = LoanOfficerMCPServer; 