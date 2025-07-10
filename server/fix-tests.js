#!/usr/bin/env node

/**
 * Fix Test Issues Script
 * 
 * This script fixes common test issues:
 * 1. Database parameter format (@param0 -> @paramName)
 * 2. Query method calls (db.query -> db.executeQuery)
 * 3. Missing dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing test issues...\n');

// Fix database parameter issues in mcpDatabaseService.js
function fixDatabaseService() {
  console.log('📝 Fixing database service parameters...');
  
  const filePath = path.join(__dirname, 'services', 'mcpDatabaseService.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix calculateDefaultRisk method
  content = content.replace(
    /const loanResult = await db\.query\(\s*'SELECT \* FROM Loans WHERE loan_id = @param0',\s*\[loanId\]\s*\);/g,
    'const loanResult = await db.executeQuery(\n        \'SELECT * FROM Loans WHERE loan_id = @loanId\',\n        { loanId }\n      );'
  );
  
  // Fix collateral query
  content = content.replace(
    /const collateralResult = await db\.query\(\s*'SELECT \* FROM Collateral WHERE loan_id = @param0',\s*\[loanId\]\s*\);/g,
    'const collateralResult = await db.executeQuery(\n        \'SELECT * FROM Collateral WHERE loan_id = @loanId\',\n        { loanId }\n      );'
  );
  
  // Fix borrower queries with @param0
  content = content.replace(
    /'SELECT \* FROM Borrowers WHERE borrower_id = @param0'/g,
    '\'SELECT * FROM Borrowers WHERE borrower_id = @borrowerId\''
  );
  
  // Fix loans by borrower queries
  content = content.replace(
    /'SELECT \* FROM Loans WHERE borrower_id = @param0'/g,
    '\'SELECT * FROM Loans WHERE borrower_id = @borrowerId\''
  );
  
  // Fix payment queries
  content = content.replace(
    /'SELECT \* FROM Payments WHERE loan_id = @param0'/g,
    '\'SELECT * FROM Payments WHERE loan_id = @loanId\''
  );
  
  // Fix array parameter style calls
  content = content.replace(
    /await db\.query\(\s*'([^']+)',\s*\[([^\]]+)\]\s*\)/g,
    (match, query, param) => {
      // Convert @param0 style to named parameters
      const paramName = param.trim();
      const namedQuery = query.replace('@param0', `@${paramName}`);
      return `await db.executeQuery(\n        '${namedQuery}',\n        { ${paramName} }\n      )`;
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ Fixed database service parameters');
}

// Fix test database integration file
function fixTestDatabaseIntegration() {
  console.log('📝 Fixing test database integration...');
  
  const filePath = path.join(__dirname, '..', 'tests', 'integration', 'db-integration-test.js');
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix parameter style
    content = content.replace(
      /'SELECT \* FROM Borrowers WHERE borrower_id = @param0'/g,
      '\'SELECT * FROM Borrowers WHERE borrower_id = @borrowerId\''
    );
    
    content = content.replace(
      /'SELECT \* FROM Loans WHERE loan_id = @param0'/g,
      '\'SELECT * FROM Loans WHERE loan_id = @loanId\''
    );
    
    // Fix query calls
    content = content.replace(
      /await db\.query\(\s*'([^']+)',\s*\[([^\]]+)\]\s*\)/g,
      (match, query, param) => {
        const paramName = param.trim().replace(/'/g, '');
        const namedQuery = query.replace('@param0', `@${paramName}`);
        return `await db.executeQuery('${namedQuery}', { ${paramName} })`;
      }
    );
    
    fs.writeFileSync(filePath, content);
    console.log('✅ Fixed test database integration');
  }
}

// Create a working test runner
function createTestRunner() {
  console.log('📝 Creating improved test runner...');
  
  const testRunnerContent = `#!/usr/bin/env node

/**
 * Comprehensive Test Runner
 * Runs all tests in the correct order with proper error handling
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\\x1b[0m',
  bright: '\\x1b[1m',
  red: '\\x1b[31m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
  cyan: '\\x1b[36m'
};

class TestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
  }

  log(message, color = 'reset') {
    console.log(\`\${colors[color]}\${message}\${colors.reset}\`);
  }

  async runJestTests() {
    this.log('\\n🧪 Running Jest Tests', 'cyan');
    this.log('=' .repeat(50), 'cyan');
    
    try {
      const output = execSync('npm run test:jest', { 
        encoding: 'utf8',
        timeout: 60000
      });
      
      this.log('✅ Jest tests completed successfully', 'green');
      this.results.passed++;
      return true;
    } catch (error) {
      this.log('❌ Jest tests failed', 'red');
      this.log(error.stdout || error.message, 'red');
      this.results.failed++;
      return false;
    }
  }

  async runMCPTests() {
    this.log('\\n🔧 Running MCP Core Tests', 'cyan');
    this.log('=' .repeat(50), 'cyan');
    
    try {
      const output = execSync('npm run test:mcp:core', { 
        encoding: 'utf8',
        timeout: 120000
      });
      
      this.log('✅ MCP tests completed successfully', 'green');
      this.results.passed++;
      return true;
    } catch (error) {
      this.log('❌ MCP tests failed', 'red');
      this.log(error.stdout || error.message, 'red');
      this.results.failed++;
      return false;
    }
  }

  async runCustomTests() {
    this.log('\\n🎯 Running Custom Tests', 'cyan');
    this.log('=' .repeat(50), 'cyan');
    
    const customTests = [
      { name: 'OpenAI Integration', command: 'npm run test:openai' },
      { name: 'Logging System', command: 'npm run test:logging' },
      { name: 'Performance', command: 'npm run test:performance' },
      { name: 'Security', command: 'npm run test:security' }
    ];

    for (const test of customTests) {
      try {
        this.log(\`\\n  Running \${test.name} tests...\`, 'yellow');
        execSync(test.command, { 
          encoding: 'utf8',
          timeout: 30000,
          stdio: 'pipe'
        });
        this.log(\`  ✅ \${test.name} tests passed\`, 'green');
        this.results.passed++;
      } catch (error) {
        this.log(\`  ❌ \${test.name} tests failed\`, 'red');
        this.results.failed++;
      }
      this.results.total++;
    }
  }

  async runDatabaseTests() {
    this.log('\\n💾 Running Database Tests', 'cyan');
    this.log('=' .repeat(50), 'cyan');
    
    try {
      const output = execSync('npm run test:db', { 
        encoding: 'utf8',
        timeout: 30000
      });
      
      this.log('✅ Database tests completed successfully', 'green');
      this.results.passed++;
      return true;
    } catch (error) {
      this.log('❌ Database tests failed', 'red');
      this.log(error.stdout || error.message, 'red');
      this.results.failed++;
      return false;
    }
  }

  printSummary() {
    this.log('\\n📊 Test Summary', 'bright');
    this.log('=' .repeat(50), 'bright');
    this.log(\`Total Test Suites: \${this.results.total}\`, 'bright');
    this.log(\`Passed: \${this.results.passed}\`, 'green');
    this.log(\`Failed: \${this.results.failed}\`, 'red');
    this.log(\`Success Rate: \${Math.round((this.results.passed / this.results.total) * 100)}%\`, 'cyan');
    
    if (this.results.failed === 0) {
      this.log('\\n🎉 All tests passed!', 'green');
    } else {
      this.log(\`\\n⚠️  \${this.results.failed} test suite(s) failed\`, 'yellow');
    }
  }

  async run() {
    this.log('🚀 Starting Comprehensive Test Suite', 'bright');
    this.log('=' .repeat(50), 'bright');
    
    // Run tests in order
    await this.runDatabaseTests();
    this.results.total++;
    
    await this.runJestTests();
    this.results.total++;
    
    await this.runMCPTests();
    this.results.total++;
    
    await this.runCustomTests();
    
    this.printSummary();
    
    // Exit with appropriate code
    process.exit(this.results.failed === 0 ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(console.error);
}

module.exports = TestRunner;
`;

  fs.writeFileSync(path.join(__dirname, 'test-runner.js'), testRunnerContent);
  console.log('✅ Created improved test runner');
}

// Main execution
async function main() {
  try {
    fixDatabaseService();
    fixTestDatabaseIntegration();
    createTestRunner();
    
    console.log('\n🎉 All fixes applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: node test-runner.js');
    console.log('2. Or run individual test suites:');
    console.log('   - npm run test:jest');
    console.log('   - npm run test:mcp');
    console.log('   - npm run test:custom');
    
  } catch (error) {
    console.error('❌ Error applying fixes:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 