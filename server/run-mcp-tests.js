/**
 * MCP Tests Runner
 * 
 * This script runs all the MCP-related tests in sequence and reports the results.
 * It focuses on the core MCP functionality and infrastructure tests.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_TIMEOUT = 10000; // 10 seconds per test
const TESTS_ROOT = path.join(__dirname, 'tests');
const MCP_CORE_DIR = path.join(TESTS_ROOT, 'mcp-core');
const MCP_INFRA_DIR = path.join(TESTS_ROOT, 'mcp-infrastructure');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Run a test file and return the result
 * @param {string} testFile - Path to the test file
 * @returns {Object} - Test result object
 */
function runTest(testFile) {
  console.log(`\n${colors.bright}${colors.blue}Running test: ${path.basename(testFile)}${colors.reset}`);
  console.log(`${colors.dim}${'-'.repeat(50)}${colors.reset}`);
  
  const startTime = Date.now();
  let success = false;
  let output = '';
  
  try {
    output = execSync(`node "${testFile}"`, { 
      timeout: TEST_TIMEOUT,
      encoding: 'utf8'
    });
    success = true;
  } catch (error) {
    output = error.stdout || error.message;
    success = false;
  }
  
  const duration = Date.now() - startTime;
  
  return {
    file: path.basename(testFile),
    success,
    duration,
    output: output.trim()
  };
}

/**
 * Get all test files in a directory (standalone tests only, not Jest tests)
 * @param {string} dir - Directory to search
 * @returns {Array<string>} - Array of test file paths
 */
function getTestFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  return fs.readdirSync(dir)
    .filter(file => {
      // Include .js files but exclude Jest test files (*.test.js)
      return file.endsWith('.js') && !file.endsWith('.test.js');
    })
    .map(file => path.join(dir, file));
}

/**
 * Run all tests and print results
 */
async function runAllTests() {
  // Get all test files
  const coreTests = getTestFiles(MCP_CORE_DIR);
  const infraTests = getTestFiles(MCP_INFRA_DIR);
  
  const allTests = [...coreTests, ...infraTests];
  
  if (allTests.length === 0) {
    console.log(`${colors.yellow}No test files found!${colors.reset}`);
    return;
  }
  
  console.log(`${colors.bright}${colors.magenta}Running MCP Tests (${allTests.length} files)${colors.reset}`);
  console.log(`${colors.cyan}Core Tests: ${coreTests.length} | Infrastructure Tests: ${infraTests.length}${colors.reset}`);
  console.log(`${colors.dim}${'='.repeat(50)}${colors.reset}\n`);
  
  // Run all tests
  const results = [];
  for (const testFile of allTests) {
    results.push(runTest(testFile));
  }
  
  // Print summary
  console.log(`\n${colors.bright}${colors.magenta}Test Results Summary${colors.reset}`);
  console.log(`${colors.dim}${'='.repeat(50)}${colors.reset}\n`);
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  
  console.log(`${colors.bright}Total Tests: ${results.length}${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}\n`);
  
  // Print detailed results
  console.log(`${colors.bright}Detailed Results:${colors.reset}`);
  results.forEach(result => {
    const status = result.success 
      ? `${colors.green}✓ PASS${colors.reset}` 
      : `${colors.red}✗ FAIL${colors.reset}`;
    console.log(`${status} ${result.file} (${result.duration}ms)`);
    
    if (!result.success) {
      // Print truncated error output for failed tests
      const lines = result.output.split('\n');
      const errorOutput = lines.length > 10 
        ? lines.slice(0, 5).concat(['...'], lines.slice(-5)).join('\n')
        : result.output;
      console.log(`${colors.dim}${errorOutput}${colors.reset}\n`);
    }
  });
}

// Run the tests
runAllTests().catch(error => {
  console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  process.exit(1);
}); 