/**
 * Tenant isolation middleware
 * Ensures that each tenant can only access their data
 */
const LogService = require('../services/logService');

/**
 * Add the tenant context to the request
 * Based on the authenticated user's tenant ID
 */
const applyTenantContext = (req, res, next) => {
  // Skip tenant verification for public routes
  const publicPaths = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/logout',
    '/api/health'
  ];
  
  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  // Check if this is an internal system call
  if (req.get('X-Internal-Call') === 'true' || (req.user && req.user.isSystemCall)) {
    LogService.debug('Bypassing tenant isolation for system call');
    // System calls can access all data
    req.tenantContext = null; // No tenant filtering for system calls
    return next();
  }
  
  // Check if user exists from auth middleware
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

module.exports = { applyTenantContext }; 