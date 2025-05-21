/**
 * Global error handler middleware
 * Logs errors and sends appropriate response to client
 */
const LogService = require('../services/logService');

const errorHandler = (err, req, res, next) => {
  // Get error details
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const stack = err.stack;
  
  // Log the error with our enhanced logger
  LogService.error(`Error in ${req.method} ${req.path}: ${message}`, {
    statusCode,
    stack,
    method: req.method,
    url: req.originalUrl || req.url,
    requestBody: req.method !== 'GET' ? req.body : undefined,
    requestQuery: req.query,
    requestParams: req.params
  });
  
  // Send response to client
  res.status(statusCode).json({
    error: message,
    details: process.env.NODE_ENV === 'development' ? stack : undefined
  });
};

module.exports = errorHandler; 