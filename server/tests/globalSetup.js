/**
 * Global setup for Jest tests
 * 
 * This file runs once before all tests start.
 * It sets up the environment for testing.
 */

const path = require('path');
const fs = require('fs');
const LogService = require('../services/logService');

module.exports = async () => {
  // Set environment to test
  process.env.NODE_ENV = 'test';
  process.env.TEST_PORT = process.env.TEST_PORT || '3002';
  process.env.ALLOW_TEST_AUTH = 'true';
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Configure logging for tests
  LogService.info('Setting up test environment');
  
  // Disable some logging for tests to reduce noise
  LogService.setLevel(process.env.TEST_LOG_LEVEL || 'warn');
  
  LogService.info('Test environment set up complete');
}; 