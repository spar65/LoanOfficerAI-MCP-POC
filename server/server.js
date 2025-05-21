// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import logging service
const LogService = require('./services/logService');

// Import data service
const dataService = require('./services/dataService');

// Import middleware
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./auth/authMiddleware');
const tenantMiddleware = require('./middleware/tenantMiddleware');

// Import routes
const authRoutes = require('./auth/authRoutes');
const loansRoutes = require('./routes/loans');
const borrowersRoutes = require('./routes/borrowers');
const riskRoutes = require('./routes/risk');
const analyticsRoutes = require('./routes/analytics');
const openaiRoutes = require('./routes/openai');
const collateralRoutes = require('./routes/collateral');
const paymentsRoutes = require('./routes/payments');

// Initialize app
const app = express();

// Log server startup
LogService.info('Initializing server...');

// Verify and prepare data
LogService.info('Verifying data files...');
const borrowersVerification = dataService.verifyBorrowersData();
if (borrowersVerification.error) {
  LogService.warn('Borrowers data verification failed:', borrowersVerification);
  LogService.info('Ensuring borrower B001 exists in data...');
  dataService.ensureBorrowerB001();
} else {
  LogService.info('Borrowers data verified successfully', {
    borrowerCount: borrowersVerification.borrowers.length,
    b001Found: borrowersVerification.b001Found
  });
}

// Basic middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true // Allow cookies with CORS
}));

// Configure JSON parsing with error handling
app.use(express.json({
  limit: '1mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(cookieParser());

// Apply request logging middleware
app.use(requestLogger);

// Public endpoints (no authentication required)
app.get('/api/health', (req, res) => {
  LogService.info('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Log route registration
LogService.info('Registering API routes...');

// API Auth routes
app.use('/api/auth', authRoutes);
LogService.info('Auth routes registered at /api/auth');

// Protected routes middleware
// Apply authentication to all /api routes except those explicitly public
app.use('/api', (req, res, next) => {
  // Skip authentication for public routes
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/health'
  ];
  
  // Skip authentication for internal API calls
  if (req.get('X-Internal-Call') === 'true') {
    LogService.debug('Bypassing authentication for internal API call');
    // Add a user object for tenant middleware
    req.user = { 
      id: 'system',
      isSystemCall: true
    };
    return next();
  }
  
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  // Apply authentication middleware
  authMiddleware.verifyToken(req, res, next);
});

// Apply tenant context middleware to all authenticated API routes
app.use('/api', tenantMiddleware.applyTenantContext);

// API routes
LogService.info('Registering feature routes...');

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

// Handle other routes for legacy compatibility
app.get('/api/loan-summary', (req, res) => {
  LogService.info('Legacy route /api/loan-summary redirecting to /api/loans/summary');
  res.redirect('/api/loans/summary');
});

// Handle 404 errors
app.use((req, res) => {
  LogService.warn(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Resource not found' });
});

// Global error handler
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  LogService.info(`===== SERVER STARTED =====`);
  LogService.info(`Server running on port ${PORT}`);
  LogService.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  LogService.info(`======================================`);
  LogService.info(`MCP Integration ready for requests`);
  LogService.info(`======================================`);
});

module.exports = app; // For testing 