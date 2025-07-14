#!/usr/bin/env node

/**
 * Enhanced MCP Test Runner with Detailed Business Logic Results
 * 
 * This script runs comprehensive tests for the LoanOfficerAI MCP system
 * and provides detailed results for each business logic category.
 */

const { execSync } = require('child_process');
const path = require('path');

// Enhanced color scheme
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Enhanced test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  categories: {},
  detailedResults: {},
  businessMetrics: {}
};

function printHeader(title, char = '=') {
  const line = char.repeat(60);
  console.log(`\n${colors.cyan}${line}${colors.reset}`);
  console.log(`${colors.bright}${title}${colors.reset}`);
  console.log(`${colors.cyan}${line}${colors.reset}`);
}

function printSection(title) {
  console.log(`\n${colors.blue}🔍 ${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(title.length + 3)}${colors.reset}`);
}

function printResult(testName, status, details = '') {
  const icon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
  const color = status === 'PASSED' ? colors.green : status === 'FAILED' ? colors.red : colors.yellow;
  
  console.log(`${icon} ${color}${testName}: ${status}${colors.reset}`);
  
  if (details) {
    // Enhanced details formatting
    const detailLines = details.split('\n').filter(line => line.trim());
    detailLines.forEach(line => {
      if (line.includes('Version:') || line.includes('Loan Amount:') || line.includes('Risk score:')) {
        console.log(`   ${colors.cyan}${line}${colors.reset}`);
      } else if (line.includes('SUCCESS') || line.includes('PASSED')) {
        console.log(`   ${colors.green}${line}${colors.reset}`);
      } else if (line.includes('FAILED') || line.includes('ERROR')) {
        console.log(`   ${colors.red}${line}${colors.reset}`);
      } else {
        console.log(`   ${line}`);
      }
    });
  }
}

function runTest(command, testName, category) {
  testResults.total++;
  
  if (!testResults.categories[category]) {
    testResults.categories[category] = { passed: 0, failed: 0 };
  }
  
  try {
    const output = execSync(command, { 
      encoding: 'utf8', 
      timeout: 30000,
      stdio: 'pipe'
    });
    
    // Extract enhanced details from output
    const details = extractEnhancedDetails(output, testName);
    
    printResult(testName, 'PASSED', details);
    testResults.passed++;
    testResults.categories[category].passed++;
    
    // Store detailed results for summary
    testResults.detailedResults[testName] = {
      status: 'PASSED',
      details: details,
      category: category,
      output: output
    };
    
  } catch (error) {
    const details = extractErrorDetails(error);
    printResult(testName, 'FAILED', details);
    testResults.failed++;
    testResults.categories[category].failed++;
    
    testResults.detailedResults[testName] = {
      status: 'FAILED',
      details: details,
      category: category,
      error: error.message
    };
  }
}

function extractEnhancedDetails(output, testName) {
  const lines = output.split('\n');
  const details = [];
  
  // Enhanced detail extraction based on test type
  if (testName.includes('Basic Loan Operations')) {
    // Extract loan operation metrics
    const versionMatch = output.match(/Version:\s*([^\n,]+)/);
    const amountMatch = output.match(/Loan Amount:\s*\$?([0-9,]+)/);
    const statusMatch = output.match(/Status:\s*([^\n,]+)/);
    
    if (versionMatch) details.push(`Version: ${versionMatch[1]}`);
    if (amountMatch) details.push(`Loan Amount: $${amountMatch[1]}`);
    if (statusMatch) details.push(`Status: ${statusMatch[1]}`);
    
    // Extract additional loan metrics
    const loanCountMatch = output.match(/(\d+)\s+loans?\s+processed/i);
    if (loanCountMatch) details.push(`Loans Processed: ${loanCountMatch[1]}`);
    
  } else if (testName.includes('Risk Assessment')) {
    // Extract risk assessment metrics
    const versionMatch = output.match(/Version:\s*([^\n,]+)/);
    const riskScores = output.match(/Risk score:\s*(\d+)/g);
    
    if (versionMatch) details.push(`Version: ${versionMatch[1]}`);
    if (riskScores) {
      riskScores.forEach((score, index) => {
        const scoreValue = score.match(/(\d+)/)[1];
        details.push(`Risk Score ${index + 1}: ${scoreValue}`);
      });
    }
    
    // Extract risk levels
    const riskLevels = output.match(/Risk level:\s*([^\n,]+)/g);
    if (riskLevels) {
      riskLevels.forEach((level, index) => {
        const levelValue = level.match(/Risk level:\s*([^\n,]+)/)[1];
        details.push(`Risk Level ${index + 1}: ${levelValue}`);
      });
    }
    
  } else if (testName.includes('Borrower Risk Analysis')) {
    // Extract borrower-specific metrics
    const borrowerMatch = output.match(/borrower\s+([A-Z0-9]+)/i);
    const riskScoreMatch = output.match(/default.*risk.*score:\s*(\d+)/i);
    
    if (borrowerMatch) details.push(`Borrower ID: ${borrowerMatch[1]}`);
    if (riskScoreMatch) details.push(`Default Risk Score: ${riskScoreMatch[1]}`);
    
  } else if (testName.includes('Collateral Sufficiency')) {
    // Extract collateral metrics
    const ltvMatch = output.match(/LTV.*ratio:\s*([0-9.]+)/i);
    const collateralValue = output.match(/collateral.*value:\s*\$?([0-9,]+)/i);
    
    if (ltvMatch) details.push(`LTV Ratio: ${ltvMatch[1]}`);
    if (collateralValue) details.push(`Collateral Value: $${collateralValue[1]}`);
    
  } else if (testName.includes('High Risk Farmers')) {
    // Extract high-risk farmer metrics
    const farmersCount = output.match(/(\d+)\s+farmers?\s+identified/i);
    const riskThreshold = output.match(/risk.*threshold:\s*(\d+)/i);
    
    if (farmersCount) details.push(`High-Risk Farmers: ${farmersCount[1]}`);
    if (riskThreshold) details.push(`Risk Threshold: ${riskThreshold[1]}`);
    
  } else if (testName.includes('Default Risk Calculation')) {
    // Extract default risk calculation metrics
    const calculationTime = output.match(/calculation.*time:\s*([0-9.]+)ms/i);
    const riskScore = output.match(/risk.*score:\s*([0-9.]+)/i);
    
    if (calculationTime) details.push(`Calculation Time: ${calculationTime[1]}ms`);
    if (riskScore) details.push(`Risk Score: ${riskScore[1]}`);
    
  } else if (testName.includes('Predictive Analytics')) {
    // Extract predictive analytics metrics
    const functionsCount = output.match(/(\d+)\s+functions?\s+tested/i);
    const accuracyMatch = output.match(/accuracy:\s*([0-9.]+)%/i);
    
    if (functionsCount) details.push(`Functions Tested: ${functionsCount[1]}`);
    if (accuracyMatch) details.push(`Accuracy: ${accuracyMatch[1]}%`);
    
  } else if (testName.includes('Single Function Integration')) {
    // Extract integration test metrics
    const loanAmountMatch = output.match(/Loan Amount:\s*\$?([0-9,]+)/);
    const statusMatch = output.match(/Status:\s*([^\n,]+)/);
    const responseTime = output.match(/response.*time:\s*([0-9.]+)ms/i);
    
    if (loanAmountMatch) details.push(`- **Loan Amount:** $${loanAmountMatch[1]}`);
    if (statusMatch) details.push(`- **Status:** ${statusMatch[1]}`);
    if (responseTime) details.push(`- **Response Time:** ${responseTime[1]}ms`);
  }
  
  // Generic success indicators
  if (output.includes('SUCCESS') || output.includes('✅')) {
    details.push('All tests passed successfully');
  }
  
  return details.join('\n');
}

function extractErrorDetails(error) {
  const output = error.stdout || error.stderr || error.message || '';
  const lines = output.split('\n');
  const details = [];
  
  // Extract error-specific information
  lines.forEach(line => {
    if (line.includes('Error:') || line.includes('Failed:') || line.includes('❌')) {
      details.push(line.trim());
    }
  });
  
  if (details.length === 0) {
    details.push('Test execution failed');
  }
  
  return details.join('\n');
}

function printSummary() {
  printHeader('📋 COMPREHENSIVE TEST RESULTS SUMMARY');
  
  console.log(`\n${colors.bright}Overall Results:${colors.reset}`);
  console.log(`  Total Tests: ${testResults.total}`);
  console.log(`  ${colors.green}✅ Passed: ${testResults.passed}${colors.reset}`);
  console.log(`  ${colors.red}❌ Failed: ${testResults.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠️  Skipped: ${testResults.skipped}${colors.reset}`);
  
  const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
  const successColor = successRate >= 90 ? colors.green : successRate >= 70 ? colors.yellow : colors.red;
  console.log(`\n  ${successColor}Success Rate: ${successRate}%${colors.reset}`);
  
  console.log(`\n${colors.bright}Results by Category:${colors.reset}`);
  Object.keys(testResults.categories).forEach(category => {
    const cat = testResults.categories[category];
    const total = cat.passed + cat.failed;
    const rate = total > 0 ? Math.round((cat.passed / total) * 100) : 0;
    const rateColor = rate >= 90 ? colors.green : rate >= 70 ? colors.yellow : colors.red;
    console.log(`  ${category}: ${rateColor}${cat.passed}/${total} (${rate}%)${colors.reset}`);
  });
  
  // Enhanced POC readiness assessment
  console.log(`\n${colors.bright}🎯 POC READINESS ASSESSMENT:${colors.reset}`);
  if (testResults.failed === 0 && testResults.passed >= 10) {
    console.log(`${colors.green}✅ POC IS READY FOR DEMONSTRATION${colors.reset}`);
    console.log(`   Core business functionality verified and operational`);
    console.log(`   All ${testResults.passed} critical tests passing`);
  } else if (testResults.failed <= 2 && testResults.passed >= 8) {
    console.log(`${colors.yellow}⚠️  POC IS MOSTLY READY${colors.reset}`);
    console.log(`   Core functionality operational with minor issues`);
    console.log(`   ${testResults.passed} tests passing, ${testResults.failed} need attention`);
  } else {
    console.log(`${colors.red}❌ POC NEEDS ATTENTION${colors.reset}`);
    console.log(`   Some core functionality may need review`);
    console.log(`   ${testResults.failed} critical tests failing`);
  }
  
  // Business metrics summary
  if (Object.keys(testResults.businessMetrics).length > 0) {
    console.log(`\n${colors.bright}📊 BUSINESS METRICS SUMMARY:${colors.reset}`);
    Object.keys(testResults.businessMetrics).forEach(metric => {
      console.log(`  ${metric}: ${testResults.businessMetrics[metric]}`);
    });
  }
}

/**
 * Main test execution with enhanced business logic testing
 */
async function runAllTests() {
  printHeader('🚀 LoanOfficerAI MCP - Enhanced Test Suite', '=');
  
  console.log(`${colors.bright}Testing Environment:${colors.reset}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Working Directory: ${process.cwd()}`);
  console.log(`  Test Framework: Enhanced MCP Test Runner v2.0`);
  
  // 1. Enhanced Core Business Logic Tests
  printSection('CORE BUSINESS LOGIC TESTS');
  
  runTest(
    'node tests/mcp-core/test-basic-loan-info.js',
    'Basic Loan Operations',
    'Core Business Logic'
  );
  
  runTest(
    'node tests/mcp-core/test-risk-assessment-combined.js',
    'Risk Assessment Functions',
    'Core Business Logic'
  );
  
  runTest(
    'node tests/mcp-core/test-borrower-risk.js',
    'Borrower Risk Analysis',
    'Core Business Logic'
  );
  
  runTest(
    'node tests/mcp-core/test-collateral-sufficiency.js',
    'Collateral Sufficiency Evaluation',
    'Core Business Logic'
  );
  
  runTest(
    'node tests/mcp-core/test-high-risk-farmers.js',
    'High Risk Farmers Identification',
    'Core Business Logic'
  );
  
  // 2. Enhanced Database Integration Tests
  printSection('DATABASE INTEGRATION TESTS');
  
  runTest(
    'node tests/mcp-core/test-default-risk.js',
    'Default Risk Calculation',
    'Database Integration'
  );
  
  // 3. Enhanced Predictive Analytics Tests
  printSection('PREDICTIVE ANALYTICS TESTS');
  
  runTest(
    'node tests/mcp-core/manual-analytics-test.js',
    'Predictive Analytics Functions',
    'Predictive Analytics'
  );
  
  // 4. Enhanced Infrastructure Tests
  printSection('INFRASTRUCTURE TESTS');
  
  runTest(
    'node tests/mcp-infrastructure/test-logging.js',
    'Logging System',
    'Infrastructure'
  );
  
  runTest(
    'node tests/mcp-infrastructure/test-openai-auth.js',
    'OpenAI Authentication',
    'Infrastructure'
  );
  
  // 5. Enhanced Integration Tests
  printSection('INTEGRATION TESTS');
  
  runTest(
    'node tests/mcp-infrastructure/test-single-function.js',
    'Single Function Integration',
    'Integration'
  );
  
  // 6. Enhanced Jest Unit Tests
  printSection('UNIT TESTS (Jest)');
  
  try {
    // Always ensure Jest runs from the server directory
    let jestCwd = process.cwd();
    if (!jestCwd.endsWith('/server') && !jestCwd.endsWith('\\server')) {
      jestCwd = path.join(jestCwd, 'server');
    }
    
    const jestOutput = execSync('npm run test:unit', { 
      encoding: 'utf8',
      stdio: 'pipe', 
      timeout: 15000,
      cwd: jestCwd
    });
    
    // Extract Jest test details
    const jestDetails = extractJestDetails(jestOutput);
    printResult('Jest Unit Tests', 'PASSED', jestDetails);
    
    if (!testResults.categories['Unit Tests']) testResults.categories['Unit Tests'] = { passed: 0, failed: 0 };
    testResults.categories['Unit Tests'].passed++;
    testResults.passed++;
    testResults.total++;
    
  } catch (jestError) {
    const jestDetails = extractJestErrorDetails(jestError);
    printResult('Jest Unit Tests', 'FAILED', jestDetails);
    
    if (!testResults.categories['Unit Tests']) testResults.categories['Unit Tests'] = { passed: 0, failed: 0 };
    testResults.categories['Unit Tests'].failed++;
    testResults.failed++;
    testResults.total++;
  }
  
  // Print enhanced summary
  printSummary();
}

function extractJestDetails(jestOutput) {
  const details = [];
  
  // Extract test suites and test counts
  const testSuiteMatch = jestOutput.match(/Test Suites:\s*([^\\n]+)/);
  const testsMatch = jestOutput.match(/Tests:\s*([^\\n]+)/);
  const timeMatch = jestOutput.match(/Time:\s*([^\\n]+)/);
  
  if (testSuiteMatch) details.push(`Test Suites: ${testSuiteMatch[1]}`);
  if (testsMatch) details.push(`Tests: ${testsMatch[1]}`);
  if (timeMatch) details.push(`Execution Time: ${timeMatch[1]}`);
  
  // Extract individual test results
  const testResults = jestOutput.match(/✓[^\\n]+/g);
  if (testResults && testResults.length > 0) {
    details.push(`Individual Tests: ${testResults.length} passed`);
  }
  
  return details.join('\n');
}

function extractJestErrorDetails(jestError) {
  const output = jestError.stdout || jestError.stderr || jestError.message || '';
  const details = [];
  
  // Extract error information
  const errorLines = output.split('\n').filter(line => 
    line.includes('FAIL') || line.includes('Error:') || line.includes('●')
  );
  
  if (errorLines.length > 0) {
    details.push('Jest test failures detected:');
    errorLines.slice(0, 5).forEach(line => {
      details.push(`  ${line.trim()}`);
    });
  } else {
    details.push('Jest execution failed');
  }
  
  return details.join('\n');
}

// Run the enhanced test suite
if (require.main === module) {
  runAllTests().catch(error => {
    console.error(`${colors.red}Test execution failed:${colors.reset}`);
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
