/**
 * Enhanced request logger middleware
 * Logs detailed request/response information with timing
 */
const LogService = require('../services/logService');

/**
 * Request logging middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const requestLogger = (req, res, next) => {
  // Skip logging for static assets
  if (req.url.startsWith('/static/') || req.url.includes('favicon.ico')) {
    return next();
  }

  // Record start time
  const startTime = Date.now();

  // Log the request
  LogService.apiRequest(req.method, req.url, {
    query: Object.keys(req.query || {}).length > 0 ? req.query : undefined,
    params: Object.keys(req.params || {}).length > 0 ? req.params : undefined,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Create a function to log response after it's sent
  const logResponse = () => {
    const duration = Date.now() - startTime;
    LogService.apiResponse(req.method, req.url, res.statusCode, duration, {
      contentType: res.get('Content-Type'),
      contentLength: res.get('Content-Length')
    });
  };

  // Capture response finish event
  res.on('finish', logResponse);

  next();
};

module.exports = requestLogger; 