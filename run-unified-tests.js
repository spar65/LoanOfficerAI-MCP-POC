#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test levels configuration
const TEST_LEVELS = {
  unit: {
    name: '🔧 Unit Tests',
    description: 'Testing individual functions and business logic',
    tests: [
      { file: 'test-validation.js', name: 'Validation Rules' },
      { file: 'test-borrower-default-risk.js', name: 'Default Risk Calculations' },
      { file: 'test-risk-functions.js', name: 'Risk Functions' }
    ]
  },
  integration: {
    name: '🔌 Integration Tests',
    description: 'Testing API endpoints and MCP protocol',
    tests: [
      { file: 'test-mcp-functions.js', name: 'MCP Function Calling' },
      { file: 'test-both-risk-functions.js', name: 'Combined Risk Tests' }
    ]
  },
  e2e: {
    name: '🎭 End-to-End Tests',
    description: 'Testing all chatbot queries comprehensively',
    tests: [
      { file: 'test-chatbot-queries-comprehensive.js', name: 'All 14 Chatbot Queries' }
    ]
  }
};

// Command line arguments
const args = process.argv.slice(2);
const runMode = args[0] || 'all';
const verbose = args.includes('--verbose');

function printColored(color, text) {
  console.log(`${color}${text}${colors.reset}`);
}

function printHeader() {
  console.clear();
  printColored(colors.bright + colors.magenta, '\n╔════════════════════════════════════════════════════════════╗');
  printColored(colors.bright + colors.magenta, '║       UNIFIED TESTING STRATEGY - LoanOfficerAI MCP POC     ║');
  printColored(colors.bright + colors.magenta, '╚════════════════════════════════════════════════════════════╝\n');
  
  printColored(colors.cyan, 'This demonstrates how unit, integration, and E2E tests work together.\n');
}

function printTestPyramid() {
  printColored(colors.dim, '                    Testing Pyramid');
  printColored(colors.dim, '    ┌─────────────────────────────────────┐');
  printColored(colors.blue, '    │         E2E Tests (Top)             │');
  printColored(colors.dim, '    │    Validates user experience        │');
  printColored(colors.dim, '    ├─────────────────────────────────────┤');
  printColored(colors.yellow, '    │     Integration Tests (Middle)      │');
  printColored(colors.dim, '    │    Validates API contracts          │');
  printColored(colors.dim, '    ├─────────────────────────────────────┤');
  printColored(colors.green, '    │       Unit Tests (Bottom)           │');
  printColored(colors.dim, '    │    Validates business logic         │');
  printColored(colors.dim, '    └─────────────────────────────────────┘\n');
}

async function runTest(testFile, testName) {
  return new Promise((resolve) => {
    console.log(`\n  📝 Running: ${testName}`);
    console.log(`     File: ${testFile}`);
    
    const startTime = Date.now();
    const testProcess = spawn('node', [testFile], {
      stdio: verbose ? 'inherit' : 'pipe'
    });
    
    let output = '';
    let errorOutput = '';
    
    if (!verbose) {
      testProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
    }
    
    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      
      if (code === 0) {
        printColored(colors.green, `  ✅ PASSED (${duration}ms)`);
      } else {
        printColored(colors.red, `  ❌ FAILED (${duration}ms)`);
        if (!verbose && errorOutput) {
          console.log(`     Error: ${errorOutput.split('\n')[0]}`);
        }
      }
      
      resolve({ passed: code === 0, duration, output, errorOutput });
    });
  });
}

async function runTestLevel(level, levelConfig) {
  printColored(colors.bright, `\n${'='.repeat(60)}`);
  printColored(colors.bright + colors.cyan, levelConfig.name);
  printColored(colors.dim, levelConfig.description);
  printColored(colors.bright, `${'='.repeat(60)}`);
  
  const results = {
    total: levelConfig.tests.length,
    passed: 0,
    failed: 0,
    duration: 0
  };
  
  for (const test of levelConfig.tests) {
    const result = await runTest(test.file, test.name);
    if (result.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    results.duration += result.duration;
  }
  
  return results;
}

async function runAllTests() {
  printHeader();
  printTestPyramid();
  
  const overallResults = {
    levels: {},
    totalTests: 0,
    totalPassed: 0,
    totalFailed: 0,
    totalDuration: 0
  };
  
  // Determine which levels to run
  let levelsToRun = [];
  switch (runMode) {
    case 'unit':
      levelsToRun = ['unit'];
      break;
    case 'integration':
      levelsToRun = ['integration'];
      break;
    case 'e2e':
      levelsToRun = ['e2e'];
      break;
    case 'quick':
      levelsToRun = ['e2e'];
      break;
    case 'all':
    default:
      levelsToRun = ['unit', 'integration', 'e2e'];
  }
  
  // Run selected test levels
  for (const level of levelsToRun) {
    const levelConfig = TEST_LEVELS[level];
    const results = await runTestLevel(level, levelConfig);
    
    overallResults.levels[level] = results;
    overallResults.totalTests += results.total;
    overallResults.totalPassed += results.passed;
    overallResults.totalFailed += results.failed;
    overallResults.totalDuration += results.duration;
  }
  
  // Print summary
  printColored(colors.bright, `\n${'='.repeat(60)}`);
  printColored(colors.bright + colors.magenta, 'TEST SUMMARY');
  printColored(colors.bright, `${'='.repeat(60)}\n`);
  
  for (const [level, results] of Object.entries(overallResults.levels)) {
    const levelConfig = TEST_LEVELS[level];
    const passRate = ((results.passed / results.total) * 100).toFixed(1);
    const statusColor = results.passed === results.total ? colors.green : colors.red;
    
    console.log(`${levelConfig.name}:`);
    printColored(statusColor, `  ✓ Passed: ${results.passed}/${results.total} (${passRate}%)`);
    console.log(`  ⏱  Duration: ${results.duration}ms\n`);
  }
  
  const overallPassRate = ((overallResults.totalPassed / overallResults.totalTests) * 100).toFixed(1);
  const overallColor = overallResults.totalPassed === overallResults.totalTests ? colors.green : colors.red;
  
  printColored(colors.bright, `${'─'.repeat(60)}`);
  printColored(overallColor + colors.bright, `OVERALL: ${overallResults.totalPassed}/${overallResults.totalTests} tests passed (${overallPassRate}%)`);
  printColored(colors.dim, `Total duration: ${overallResults.totalDuration}ms`);
  printColored(colors.bright, `${'─'.repeat(60)}\n`);
  
  // Provide guidance based on results
  if (overallResults.totalFailed > 0) {
    printColored(colors.yellow, '\n💡 Debugging Guide:');
    console.log('1. Run failed tests individually for detailed output');
    console.log('2. Use --verbose flag for full test output');
    console.log('3. Check server logs for API-level errors');
    console.log('4. Verify test data exists (B001, B002, B003, L001, L002)\n');
  } else {
    printColored(colors.green + colors.bright, '\n🎉 All tests passed! System is ready for demo.\n');
  }
}

// Usage instructions
function printUsage() {
  console.log('\nUsage: node run-unified-tests.js [mode] [options]');
  console.log('\nModes:');
  console.log('  all         Run all test levels (default)');
  console.log('  unit        Run only unit tests');
  console.log('  integration Run only integration tests');
  console.log('  e2e         Run only end-to-end tests');
  console.log('  quick       Run only E2E tests for quick validation');
  console.log('\nOptions:');
  console.log('  --verbose   Show full test output');
  console.log('  --help      Show this help message\n');
}

// Main execution
if (args.includes('--help')) {
  printUsage();
} else {
  console.log(`\n🚀 Running tests in ${runMode} mode...`);
  runAllTests().catch(error => {
    printColored(colors.red, `\n💥 Test runner error: ${error.message}\n`);
    process.exit(1);
  });
} 