/**
 * Request Context Middleware
 * 
 * Adds a unique request ID and context to each request
 * for traceability and correlation between HTTP requests and MCP calls.
 */
const { v4: uuidv4 } = require('uuid');
const LogService = require('../services/logService');

// Async local storage for request context
const { AsyncLocalStorage } = require('async_hooks');
const requestContext = new AsyncLocalStorage();

/**
 * Get the current request context
 * @returns {Object|null} The current request context or null if not in request
 */
function getCurrentContext() {
  return requestContext.getStore() || null;
}

/**
 * Request context middleware
 * Adds a unique request ID and context to each request
 */
function requestContextMiddleware(req, res, next) {
  // Generate a unique request ID
  const requestId = uuidv4();
  
  // Create context with request details
  const context = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || 'anonymous',
    startTime: Date.now()
  };
  
  // Add the request ID to response headers for traceability
  res.set('X-Request-ID', requestId);
  
  // Add context to the request object
  req.context = context;
  
  // Store the context in AsyncLocalStorage
  requestContext.run(context, () => {
    // Add request timing
    res.on('finish', () => {
      const duration = Date.now() - context.startTime;
      
      // Only log API requests, not static assets
      if (!req.path.startsWith('/static/') && !req.path.includes('favicon.ico')) {
        LogService.debug(`Request ${req.method} ${req.path} completed`, {
          requestId,
          status: res.statusCode,
          duration: `${duration}ms`
        });
      }
    });
    
    next();
  });
}

/**
 * Add request context to logs for MCP functions
 * @param {string} functionName - The MCP function name
 * @param {Object} args - The function arguments
 * @returns {Object} - Context with request information
 */
function getContextForMCPCall(functionName, args) {
  const context = getCurrentContext();
  
  if (!context) {
    return {
      functionName,
      source: 'direct-call'
    };
  }
  
  return {
    requestId: context.requestId,
    functionName,
    userId: context.userId,
    source: 'http-request',
    path: context.path
  };
}

module.exports = {
  requestContextMiddleware,
  getCurrentContext,
  getContextForMCPCall
}; 