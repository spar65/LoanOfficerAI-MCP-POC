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

  // Log the request
  LogService.logRequest(req);

  // Record start time
  const startTime = Date.now();

  // Create a function to log response after it's sent
  const logResponse = () => {
    LogService.logResponse(req, res, startTime);
  };

  // Capture response finish event
  res.on('finish', logResponse);

  next();
};

module.exports = requestLogger; 