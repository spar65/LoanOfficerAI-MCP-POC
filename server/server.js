/**
 * Main server file for the Loan Officer AI API
 */

// Load environment variables from .env file if present
if (process.env.NODE_ENV !== 'production') {
require('dotenv').config();
}

// Enable test authentication for development
process.env.ALLOW_TEST_AUTH = 'true';

// Import dependencies
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const { createServer } = require('http');

// Import services
const LogService = require('./services/logService');
const OpenAIService = require('./services/openaiService');
const TokenService = require('./auth/tokenService');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Import route modules
const apiRoutes = require('./routes');
const mcpRoutes = require('./mcp/mcpServer');

// Create Express app
const app = express();

// Track server instance for testing
let serverInstance = null;

// Setup middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add logging middleware for requests
app.use((req, res, next) => {
  const start = Date.now();
  
  // When response finishes, log the request
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'debug';
    
    LogService[logLevel](`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip
    });
  });
  
  next();
});

// Add health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'loan-officer-ai',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Server initialization function (extracted for testing)
function init() {
  LogService.info('Initializing server...');
  
  // Verify required data files are available
  verifyDataFiles();
  
  // Register API routes
  registerRoutes();
  
  // Add error handling middleware last
  app.use(errorHandler);
  
  return app;
}

// Data file verification
function verifyDataFiles() {
  LogService.info('Verifying data files...');
  
  try {
    // Check for borrower data
    LogService.debug('Attempting to directly read borrowers.json...');
    const borrowers = require('./data/borrowers.json');
    
    // Verify first borrower
    const firstBorrower = borrowers.find(b => b.borrower_id === 'B001');
    if (firstBorrower) {
      LogService.debug('Borrower B001 found in borrowers.json', firstBorrower);
    } else {
      LogService.warn('Borrower B001 not found in borrowers.json');
    }
    
    LogService.info('Borrowers data verified successfully', {
      borrowerCount: borrowers.length,
      b001Found: !!firstBorrower
    });
  } catch (error) {
    LogService.error('Failed to verify data files', {
      error: error.message,
      stack: error.stack
    });
    throw new Error('Data files missing or corrupted: ' + error.message);
  }
}

// Register all routes
function registerRoutes() {
  LogService.info('Registering API routes...');
  
  // Auth routes
  app.use('/api/auth', require('./routes/auth'));
  LogService.info('Auth routes registered at /api/auth');
  
  // Feature-specific routes
  LogService.info('Registering feature routes...');
  apiRoutes.registerRoutes(app);
  
  // Register MCP routes
  mcpRoutes.configureMCP(app);
  LogService.info('MCP server tools configured');
}

/**
 * Start the server on the specified port
 * @param {number} port - Port to listen on
 * @returns {Promise<Object>} Server instance
 */
async function startServer(port = process.env.PORT || 3001) {
  // Initialize if not already done
  init();
  
  // Create HTTP server
  const server = createServer(app);
  
  // Handle graceful shutdown
  const gracefulShutdown = async () => {
    if (serverInstance) {
      LogService.info('Shutting down server gracefully...');
      await new Promise((resolve) => {
        // Set a timeout to force server shutdown after 5 seconds
        const shutdownTimeout = setTimeout(() => {
          LogService.warn('Force closing server after timeout');
          resolve();
        }, 5000);
        
        // Attempt graceful shutdown
        serverInstance.close(() => {
          clearTimeout(shutdownTimeout);
          LogService.info('Server stopped gracefully');
          resolve();
        });
      });
    }
    
    // Exit process
    process.exit(0);
  };
  
  // Register signal handlers for graceful shutdown
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
  
  // Start listening on the port
  return new Promise((resolve, reject) => {
    try {
      // Check if in test mode with no port
      if (port === null && process.env.NODE_ENV === 'test') {
        // Just return server without starting it
        LogService.info('Test mode: Server initialized but not started');
        serverInstance = server;
        resolve(server);
        return;
      }
      
      // Start server
      serverInstance = server.listen(port, () => {
        LogService.info('===== SERVER STARTED =====');
        LogService.info(`Server running on port ${port}`);
        LogService.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        LogService.info('======================================');
        LogService.info(`API URL: http://localhost:${port}/api`);
        LogService.info(`Health check: http://localhost:${port}/api/health`);
        LogService.info(`Login endpoint: http://localhost:${port}/api/auth/login`);
        LogService.info('======================================');
        LogService.info('REST API ready for requests');
        LogService.info('MCP Server ready at /mcp endpoint');
        LogService.info('======================================');
        resolve(server);
      });
      
      // Handle server error
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          LogService.error(`Port ${port} is already in use. Please choose a different port.`);
          reject(new Error(`Port ${port} already in use`));
        } else {
          LogService.error('Server error', {
            error: error.message,
            code: error.code
          });
          reject(error);
        }
      });
      
      // Store server instance for testing
      serverInstance = server;
    } catch (error) {
      LogService.error('Failed to start server', {
        error: error.message,
        stack: error.stack
      });
      reject(error);
    }
  });
}

// Only start the server if this file is run directly
if (require.main === module) {
  // Load refresh tokens
  const refreshTokens = TokenService.loadRefreshTokens();
  console.log(`Loaded ${refreshTokens.length} refresh tokens`);
  
  // Start the server
  startServer().catch(error => {
    LogService.error('Server failed to start', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

// Export app and functions for testing
module.exports = {
  app,
  init,
  startServer,
  serverInstance: () => serverInstance
}; 