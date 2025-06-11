/**
 * Global teardown for Jest tests
 * 
 * This script runs after all tests have completed.
 * It handles cleanup of any resources used during testing.
 */

const LogService = require('../services/logService');
const TokenService = require('../auth/tokenService');
// Remove dependency on test-utils
// const { stopTestServer } = require('./helpers/test-utils');

module.exports = async () => {
  console.log('Running global teardown...');
  
  // Restore log level
  if (LogService.setLevel) {
    LogService.setLevel('info');
  }
  
  // Stop token cleanup interval
  TokenService.stopCleanupInterval();
  
  // We don't call stopTestServer() here to avoid circular dependencies
  // Instead we'll rely on the Jest forceExit flag
  
  // Add a delay to ensure all connections are properly closed
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Force clean up any remaining resources
  const cleanup = () => {
    // Clear any timers
    const globalObj = global;
    if (globalObj._timers) {
      globalObj._timers.forEach(timer => clearTimeout(timer));
      globalObj._timers = [];
    }
    
    // Close any remaining connections
    if (global.connections) {
      global.connections.forEach(conn => {
        try {
          conn.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
      });
      global.connections = [];
    }
  };
  
  try {
    cleanup();
    console.log('Global teardown completed');
  } catch (error) {
    console.error('Error during global teardown:', error);
  }
}; 