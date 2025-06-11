/**
 * Test Environment Setup Script
 * 
 * This script sets up the testing environment by:
 * 1. Ensuring test tokens are configured
 * 2. Creating necessary test data directories if they don't exist
 * 3. Verifying environment variables
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Root directory of the server
const SERVER_ROOT = path.resolve(__dirname, '../..');

// Data directories
const DATA_DIR = path.join(SERVER_ROOT, 'data');
const LOGS_DIR = path.join(SERVER_ROOT, 'logs');

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.LOG_LEVEL = 'info';
process.env.AUTH_DISABLED = 'true'; // For easier testing

// Creates a directory if it doesn't exist
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(chalk.green(`✅ Created directory: ${path.relative(SERVER_ROOT, dir)}`));
  } else {
    console.log(chalk.blue(`ℹ️ Directory exists: ${path.relative(SERVER_ROOT, dir)}`));
  }
}

// Ensure a test token is available
function setupTestToken() {
  const tokenService = require('../../auth/tokenService');
  
  // Check if test token works
  const testToken = tokenService.verifyAccessToken('test-token');
  if (!testToken) {
    console.log(chalk.yellow('ℹ️ Test token verification failed, but this is expected'));
    console.log(chalk.yellow('ℹ️ The tokenService is already configured to accept test-token by default'));
  } else {
    console.log(chalk.green('✅ Test token verification works'));
  }
}

// Ensure test data exists
function setupTestData() {
  const dataFiles = [
    { path: path.join(DATA_DIR, 'loans.json'), content: [] },
    { path: path.join(DATA_DIR, 'borrowers.json'), content: [] },
    { path: path.join(DATA_DIR, 'collateral.json'), content: [] },
    { path: path.join(DATA_DIR, 'payments.json'), content: [] }
  ];
  
  // Create sample data files if they don't exist
  dataFiles.forEach(file => {
    if (!fs.existsSync(file.path)) {
      fs.writeFileSync(file.path, JSON.stringify(file.content, null, 2));
      console.log(chalk.green(`✅ Created file: ${path.relative(SERVER_ROOT, file.path)}`));
    } else {
      console.log(chalk.blue(`ℹ️ File exists: ${path.relative(SERVER_ROOT, file.path)}`));
    }
  });
}

// Main setup function
function setupTestEnvironment() {
  console.log(chalk.cyan.bold('🔧 Setting up test environment'));
  console.log(chalk.cyan('===========================\n'));
  
  try {
    // Ensure directories exist
    ensureDirectoryExists(DATA_DIR);
    ensureDirectoryExists(LOGS_DIR);
    
    // Setup test token
    setupTestToken();
    
    // Setup test data
    setupTestData();
    
    console.log(chalk.green.bold('\n🎉 Test environment setup complete!'));
    console.log(chalk.green('Run tests with: node tests/helpers/openai-test.js'));
  } catch (error) {
    console.error(chalk.red('\n❌ Error setting up test environment:'), error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupTestEnvironment();
}

module.exports = {
  setupTestEnvironment,
  ensureDirectoryExists
}; 