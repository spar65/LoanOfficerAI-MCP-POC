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
  const routes = [
    { path: '/api/loans', module: './loans', name: 'Loan' },
    { path: '/api/borrowers', module: './borrowers', name: 'Borrower' },
    { path: '/api/risk', module: './risk', name: 'Risk' },
    { path: '/api/analytics', module: './analytics', name: 'Analytics' },
    { path: '/api/openai', module: './openai', name: 'OpenAI' },
    { path: '/api/collateral', module: './collateral', name: 'Collateral' },
    { path: '/api/payments', module: './payments', name: 'Payment' },
    { path: '/api/mcp', module: './mcp', name: 'Enhanced MCP' }
  ];

  routes.forEach(route => {
    try {
      const routeModule = require(route.module);
      app.use(route.path, routeModule);
      LogService.info(`${route.name} routes registered at ${route.path}`);
    } catch (error) {
      LogService.warn(`Failed to register ${route.name} routes: ${error.message}`);
      LogService.debug(`${route.name} route error:`, error.stack);
      // Continue with other routes
    }
  });
}

module.exports = { registerRoutes }; 