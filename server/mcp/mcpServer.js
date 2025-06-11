/**
 * MCP Server Configuration
 * 
 * This module handles the setup and configuration of the MCP server
 */

const LoanOfficerMCPServer = require('./server');
const LogService = require('../services/logService');

let mcpServer = null;

/**
 * Configure MCP Server and attach it to Express app
 * @param {Object} app - Express application instance
 */
function configureMCP(app) {
  try {
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
function stopMCPServer() {
  if (mcpServer) {
    LogService.info('Stopping MCP server...');
    mcpServer.stop();
    mcpServer = null;
  }
}

module.exports = {
  configureMCP,
  stopMCPServer
}; 