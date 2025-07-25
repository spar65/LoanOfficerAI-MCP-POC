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
  
  // Force database usage for tests - NO JSON FILES!
  process.env.USE_DATABASE = 'true';
  process.env.DB_SERVER = process.env.DB_SERVER || 'localhost';
  process.env.DB_NAME = process.env.DB_NAME || 'LoanOfficerAI_MCP_POC';
  process.env.DB_USER = process.env.DB_USER || 'sa';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'YourStrong@Passw0rd';
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Configure logging for tests
  LogService.info('Setting up test environment');
  LogService.info('Database configuration: Using SQL Server database LoanOfficerAI_MCP_POC');
  
  // Disable some logging for tests to reduce noise
  LogService.setLevel(process.env.TEST_LOG_LEVEL || 'warn');
  
  LogService.info('Test environment set up complete');
}; 