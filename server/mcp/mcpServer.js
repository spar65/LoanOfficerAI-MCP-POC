/**
 * MCP Server Configuration
 * 
 * This module handles the setup and configuration of the MCP server
 */

const LoanOfficerMCPServer = require('./server');
const LogService = require('../services/logService');
const DatabaseManager = require('../../utils/database');

let mcpServer = null;

/**
 * Configure MCP Server and attach it to Express app
 * @param {Object} app - Express application instance
 */
async function configureMCP(app) {
  try {
    // Initialize database if enabled
    if (process.env.USE_DATABASE === 'true') {
      LogService.info('Initializing database connection for MCP server...');
      const isConnected = await DatabaseManager.testConnection();
      if (!isConnected) {
        throw new Error('Database connection failed during MCP server initialization');
      }
    }
    
    // Initialize MCP server
    mcpServer = new LoanOfficerMCPServer();
    
    // Add MCP routes
    app.post('/mcp', async (req, res) => {
      const isInitializeRequest = req.body && req.body.method === 'initialize';
      await mcpServer.handleMCPRequest(req, res, isInitializeRequest);
    });
    
    app.get('/mcp', async (req, res) => {
      await mcpServer.handleSessionRequest(req, res);
    });
    
    app.delete('/mcp', async (req, res) => {
      await mcpServer.handleSessionRequest(req, res);
    });
    
    // Add health check endpoint for MCP
    app.get('/mcp/health', async (req, res) => {
      try {
        const dbHealth = process.env.USE_DATABASE === 'true' ? 
          await DatabaseManager.testConnection() : 'disabled';
        
        res.json({
          status: 'healthy',
          database: dbHealth ? 'connected' : 'disconnected',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    LogService.info('MCP server configured at /mcp endpoint');
    
    // Handle graceful shutdown
    process.on('SIGTERM', stopMCPServer);
    process.on('SIGINT', stopMCPServer);
    
    return mcpServer;
  } catch (error) {
    LogService.error(`Failed to configure MCP server: ${error.message}`, {
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Stop the MCP server gracefully
 */
async function stopMCPServer() {
  if (mcpServer) {
    LogService.info('Stopping MCP server...');
    await mcpServer.stop();
    mcpServer = null;
  }
}

module.exports = {
  configureMCP,
  stopMCPServer
}; 