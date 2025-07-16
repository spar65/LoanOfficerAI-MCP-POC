const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');
const LogService = require('../services/logService');
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

          // Database service is REQUIRED - no fallback options
          const normalizedId = borrowerId.toUpperCase().trim();
          
          // Start MCP conversation tracking
          const conversation = userId
            ? await mcpDatabaseService.startConversation(
                userId,
                'risk_assessment',
                borrowerId
              )
            : { conversationId: null };

          const riskAssessment = await mcpDatabaseService.getBorrowerNonAccrualRisk(
            normalizedId
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
          
          // Database service is REQUIRED - no fallback options
          const normalizedLoanId = loanId.toUpperCase().trim();
          
          // Start MCP conversation tracking
          const conversation = userId
            ? await mcpDatabaseService.startConversation(
                userId,
                'collateral_analysis',
                loanId
              )
            : { conversationId: null };

          const collateralAnalysis = await mcpDatabaseService.evaluateCollateralSufficiency(
            normalizedLoanId,
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
          
          // Database service is REQUIRED - no fallback options
          const normalizedId = borrowerId.toUpperCase().trim();
          
          // Start MCP conversation tracking if userId provided
          const conversation = userId
            ? await mcpDatabaseService.startConversation(
                userId,
                'default_risk',
                borrowerId
              )
            : { conversationId: null };

          const defaultRisk = await mcpDatabaseService.getBorrowerDefaultRisk(
            normalizedId
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