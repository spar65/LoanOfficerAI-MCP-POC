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
const DatabaseManager = require('../utils/database');

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
app.get('/api/health', async (req, res) => {
  // Check database connection
  let dbStatus = 'disconnected';
  try {
    const isConnected = await DatabaseManager.testConnection();
    dbStatus = isConnected ? 'connected' : 'disconnected';
  } catch (error) {
    LogService.error('Database connection check failed', {
      error: error.message
    });
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'loan-officer-ai',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus
  });
});

// Add system status endpoint for backward compatibility
app.get('/api/system/status', async (req, res) => {
  // Check database connection
  let dbStatus = 'disconnected';
  try {
    const isConnected = await DatabaseManager.testConnection();
    dbStatus = isConnected ? 'connected' : 'disconnected';
  } catch (error) {
    LogService.error('Database connection check failed', {
      error: error.message
    });
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'loan-officer-ai',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`
    }
  });
});

// Server initialization function (extracted for testing)
async function init() {
  LogService.info('Initializing server...');
  
  // Initialize database connection if enabled
  if (process.env.USE_DATABASE === 'true') {
    LogService.info('Database mode enabled - connection MUST succeed');
    try {
      LogService.info('Initializing database connection...');
      const isConnected = await DatabaseManager.testConnection();
      if (!isConnected) {
        const error = new Error('Database connection failed - server cannot start with USE_DATABASE=true');
        LogService.error('CRITICAL: Database connection failed', error);
        throw error;
      } else {
        LogService.info('Database connection established successfully');
      }
    } catch (error) {
      LogService.error('CRITICAL: Failed to connect to database', {
        error: error.message,
        stack: error.stack
      });
      // FAIL FAST - don't start server if database is required but not working
      throw new Error(`Server cannot start: Database is required (USE_DATABASE=true) but connection failed: ${error.message}`);
    }
  } else {
    LogService.info('Database usage disabled by configuration, using JSON files');
    // Verify required data files are available
    verifyDataFiles();
  }
  
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
    // Check for borrower data using database service
    LogService.debug('Attempting to verify borrower data via database...');
    
    // Import database service
    const mcpDatabaseService = require('./services/mcpDatabaseService');
    
    // Test database connection and data availability
    mcpDatabaseService.executeQuery('SELECT TOP 1 * FROM Borrowers WHERE borrower_id = ?', ['B001'])
      .then(result => {
        const borrowers = result.recordset || result;
        if (borrowers && borrowers.length > 0) {
          LogService.debug('Borrower B001 found in database', borrowers[0]);
          LogService.info('Borrower data verified successfully via database', {
            borrowerCount: borrowers.length,
            b001Found: true
          });
        } else {
          LogService.warn('Borrower B001 not found in database');
        }
      })
      .catch(error => {
        LogService.error('Failed to verify borrower data via database', {
          error: error.message,
          stack: error.stack
        });
        // Continue without throwing error - system can still function
      });
    
  } catch (error) {
    LogService.error('Failed to verify data files', {
      error: error.message,
      stack: error.stack
    });
    // Don't throw error - system should continue to function
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
  await init();
  
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
    
    // Close database connection
    if (process.env.USE_DATABASE === 'true') {
      try {
        await DatabaseManager.disconnect();
        LogService.info('Database connection closed');
      } catch (error) {
        LogService.error('Error closing database connection', {
          error: error.message
        });
      }
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
        LogService.info(`Database: ${process.env.USE_DATABASE === 'true' ? 'Enabled' : 'Disabled'}`);
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
  // Check database connection requirement
  if (process.env.USE_DATABASE !== 'true') {
    LogService.error('⚠️  CRITICAL: Database connection is REQUIRED. Set USE_DATABASE=true in your .env file and ensure SQL Server is running.');
    console.error('⚠️  ERROR: This system requires a SQL Server database connection.');
    console.error('Please ensure:');
    console.error('1. SQL Server is running and accessible');
    console.error('2. USE_DATABASE=true is set in your .env file');
    console.error('3. Database connection string is properly configured');
    process.exit(1);
  }
  
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