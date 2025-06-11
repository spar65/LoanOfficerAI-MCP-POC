/**
 * Authentication Middleware
 * Verifies JWT tokens for API access
 */
const jwt = require('jsonwebtoken');
const LogService = require('../services/logService');

// JWT secret key - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * Middleware to verify the JWT token
 * For test purposes, also accepts 'test-token' as a valid token
 */
exports.verifyToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  // Special case for testing - bypass auth with a test token
  if (token === 'test-token') {
    // Set a default user for test token
    req.user = { 
      id: 'test-user',
      role: 'tester',
      tenantId: 'test-tenant'
    };
    
    LogService.info('Using test token for authentication', {
      userId: req.user.id,
      role: req.user.role,
      category: 'authentication'
    });
    
    return next();
  }
  
  // No token provided
  if (!token) {
    LogService.warn('Authentication failed: No token provided', {
      ip: req.ip,
      path: req.path,
      category: 'authentication'
    });
    
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Set user data from token
    req.user = decoded;
    
    LogService.info('Authentication successful', {
      userId: req.user.id,
      role: req.user.role || 'user',
      category: 'authentication'
    });
    
    next();
  } catch (error) {
    LogService.warn('Authentication failed: Invalid token', {
      error: error.message,
      ip: req.ip,
      path: req.path,
      category: 'authentication'
    });
    
    return res.status(401).json({ 
      success: false,
      message: 'Invalid or expired token'
    });
  }
}; 