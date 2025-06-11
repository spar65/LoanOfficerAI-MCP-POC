/**
 * Authentication middleware
 * Protects API routes and handles token verification
 */
const tokenService = require('./tokenService');
const userService = require('./userService');

// Test token for unit/integration tests
const TEST_TOKEN = 'test-token';
const TEST_USER = {
  id: 'test-user',
  username: 'test-user',
  role: 'admin',
  tenantId: 'test-tenant',
  isTestUser: true
};

/**
 * Middleware to verify JWT access token
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.verifyToken = (req, res, next) => {
  // Check for internal system call
  if (req.get('X-Internal-Call') === 'true' && 
      req.headers.authorization === 'Bearer SYSTEM_INTERNAL_CALL') {
    // Allow internal system calls to bypass normal authentication
    req.user = {
      id: 'system',
      role: 'system',
      isSystemCall: true
    };
    return next();
  }
  
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }
  
  // Allow test token in test environment
  if (token === TEST_TOKEN && (process.env.NODE_ENV === 'test' || process.env.ALLOW_TEST_AUTH === 'true')) {
    req.user = TEST_USER;
    return next();
  }
  
  // Verify the token
  const decoded = tokenService.verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
  
  // Set user object on request
  req.user = decoded;
  
  next();
};

/**
 * Middleware for optional authentication
 * Will verify token if present but still allow request if not
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.optionalAuth = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"
  
  if (token) {
    // Allow test token in test environment
    if (token === TEST_TOKEN && (process.env.NODE_ENV === 'test' || process.env.ALLOW_TEST_AUTH === 'true')) {
      req.user = TEST_USER;
      return next();
    }
    
    // Verify the token if present
    const decoded = tokenService.verifyAccessToken(token);
    if (decoded) {
      // Set user object on request
      req.user = decoded;
    }
  }
  
  // Continue regardless of token
  next();
};

/**
 * Middleware to require specific role(s)
 * @param {string|Array} roles - Required role(s) for access
 * @returns {Function} Middleware function
 */
exports.requireRole = (roles) => {
  // Convert string to array if single role provided
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // Check if user exists (verifyToken middleware should be used before this)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }
    
    // Test users bypass role restrictions in test environment
    if (req.user.isTestUser && (process.env.NODE_ENV === 'test' || process.env.ALLOW_TEST_AUTH === 'true')) {
      return next();
    }
    
    // Check if user has required role
    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    
    next();
  };
};

/**
 * Middleware to verify tenant access
 * Ensures users only access data from their tenant
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.verifyTenant = (req, res, next) => {
  // Check if user exists
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication required' 
    });
  }
  
  // Set tenant context for subsequent operations
  req.tenantContext = req.user.tenantId;
  
  // Admin users can access any tenant
  if (req.user.role === 'admin') {
    // If a specific tenant is requested in query params, use that instead
    if (req.query.tenantId) {
      req.tenantContext = req.query.tenantId;
    }
    
    return next();
  }
  
  // Test users bypass tenant restrictions in test environment
  if (req.user.isTestUser && (process.env.NODE_ENV === 'test' || process.env.ALLOW_TEST_AUTH === 'true')) {
    return next();
  }
  
  // Regular users can only access their own tenant
  // Override any tenant ID in the request with the user's tenant
  if (req.query.tenantId && req.query.tenantId !== req.user.tenantId) {
    return res.status(403).json({ 
      success: false, 
      message: 'Cannot access data from another tenant' 
    });
  }
  
  next();
};

// Export constants for testing
exports.TEST_TOKEN = TEST_TOKEN;
exports.TEST_USER = TEST_USER; 