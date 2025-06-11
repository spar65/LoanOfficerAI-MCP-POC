/**
 * API Routes Index
 * 
 * This file centralizes registration of all API routes
 */

const LogService = require('../services/logService');

/**
 * Register all API routes with the Express app
 * @param {Object} app - Express application instance
 */
function registerRoutes(app) {
  // Feature-specific routes
  try {
    // Load all route modules
    const loansRoutes = require('./loans');
    const borrowersRoutes = require('./borrowers');
    const riskRoutes = require('./risk');
    const analyticsRoutes = require('./analytics');
    const openaiRoutes = require('./openai');
    const collateralRoutes = require('./collateral');
    const paymentsRoutes = require('./payments');
    const mcpRoutes = require('./mcp');
    
    // Register routes with app
    app.use('/api/loans', loansRoutes);
    LogService.info('Loan routes registered at /api/loans');
    
    app.use('/api/borrowers', borrowersRoutes);
    LogService.info('Borrower routes registered at /api/borrowers');
    
    app.use('/api/risk', riskRoutes);
    LogService.info('Risk routes registered at /api/risk');
    
    app.use('/api/analytics', analyticsRoutes);
    LogService.info('Analytics routes registered at /api/analytics');
    
    app.use('/api/openai', openaiRoutes);
    LogService.info('OpenAI routes registered at /api/openai');
    
    app.use('/api/collateral', collateralRoutes);
    LogService.info('Collateral routes registered at /api/collateral');
    
    app.use('/api/payments', paymentsRoutes);
    LogService.info('Payment routes registered at /api/payments');
    
    app.use('/api/mcp', mcpRoutes);
    LogService.info('Enhanced MCP routes registered at /api/mcp');
  } catch (error) {
    LogService.warn(`Failed to register all routes: ${error.message}`);
    LogService.debug('Stack trace:', error.stack);
    // Continue with partial route registration
  }
}

module.exports = { registerRoutes }; 