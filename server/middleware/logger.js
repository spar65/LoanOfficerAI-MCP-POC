/**
 * Request logger middleware
 * Logs all incoming requests with timestamp and method/path
 */
const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};

module.exports = logger; 