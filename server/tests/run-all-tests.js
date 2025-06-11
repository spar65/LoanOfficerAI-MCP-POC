/**
 * Test Runner Script
 * 
 * This script orchestrates running all test suites:
 * 1. Jest Tests (Unit/Integration)
 * 2. OpenAI Integration Tests
 * 3. Logging Tests
 * 4. Performance Tests
 * 5. Security Tests
 */

const chalk = require('chalk');
const { execSync, spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

// Paths to test scripts
const TEST_SCRIPTS = {
  jest: 'jest --config jest.config.js',
  openai: path.join(__dirname, 'helpers', 'openai-test.js'),
  logging: path.join(__dirname, 'helpers', 'logging-test.js'),
  performance: path.join(__dirname, 'helpers', 'performance-test.js'),
  security: path.join(__dirname, 'helpers', 'security-test.js')
};

// Print banner
function printBanner() {
  console.log(chalk.bold.blue('===================================================='));
  console.log(chalk.bold.blue('           LoanOfficerAI Test Runner                '));
  console.log(chalk.bold.blue('===================================================='));
  console.log('');
}

// Check if server is running
function checkServer() {
  try {
    const curlCmd = 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health';
    const status = execSync(curlCmd).toString().trim();
    
    if (status === '200') {
      console.log(chalk.green('✅ Server is running on port 3001'));
      return true;
    } else {
      console.log(chalk.yellow(`⚠️ Server responded with unexpected status: ${status}`));
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ Server is not running'));
    console.log(chalk.yellow('Please start the server before running tests'));
    return false;
  }
}

// Run a specific test suite
function runTestSuite(name, script) {
  return new Promise((resolve) => {
    console.log(chalk.cyan.bold(`\n🧪 Running ${name} Tests`));
    console.log(chalk.cyan('------------------------------------------'));
    
    let command, args;
    
    if (name === 'Jest') {
      // For Jest tests, use the script directly
      command = 'npx';
      args = script.split(' ');
    } else {
      // For our custom test scripts, run with Node
      command = 'node';
      args = [script];
    }
    
    const testProcess = spawn(command, args, { 
      stdio: ['inherit', 'inherit', 'inherit'],
      shell: true
    });
    
    testProcess.on('exit', (code) => {
      if (code === 0) {
        console.log(chalk.green(`\n✅ ${name} Tests completed successfully`));
        resolve(true);
      } else {
        console.log(chalk.red(`\n❌ ${name} Tests failed with code ${code}`));
        resolve(false);
      }
    });
  });
}

// Ask user which tests to run
function promptForTests() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log(chalk.cyan('Select which tests to run:'));
    console.log(chalk.cyan('1. Everything - All Test Suites'));
    console.log(chalk.cyan('2. Jest Tests (Unit & Integration)'));
    console.log(chalk.cyan('3. OpenAI Integration Tests'));
    console.log(chalk.cyan('4. Logging Tests'));
    console.log(chalk.cyan('5. Performance Tests'));
    console.log(chalk.cyan('6. Security Tests'));
    console.log(chalk.cyan('7. All Custom Tests (OpenAI, Logging, Performance, Security)'));
    
    rl.question(chalk.yellow('\nEnter your choice (1-7): '), (answer) => {
      rl.close();
      
      switch (answer.trim()) {
        case '1':
          resolve(['jest', 'openai', 'logging', 'performance', 'security']);
          break;
        case '2':
          resolve(['jest']);
          break;
        case '3':
          resolve(['openai']);
          break;
        case '4':
          resolve(['logging']);
          break;
        case '5':
          resolve(['performance']);
          break;
        case '6':
          resolve(['security']);
          break;
        case '7':
          resolve(['openai', 'logging', 'performance', 'security']);
          break;
        default:
          console.log(chalk.red('Invalid choice. Running all tests.'));
          resolve(['jest', 'openai', 'logging', 'performance', 'security']);
      }
    });
  });
}

// Main function
async function main() {
  printBanner();
  
  // Check if any command line arguments were provided
  const args = process.argv.slice(2);
  let testsToRun = [];
  
  if (args.includes('--all')) {
    // Run all tests
    testsToRun = ['jest', 'openai', 'logging', 'performance', 'security'];
    console.log(chalk.yellow('Running all test suites'));
  } else if (args.includes('--custom')) {
    // Run only custom tests
    testsToRun = ['openai', 'logging', 'performance', 'security'];
    console.log(chalk.yellow('Running all custom test suites'));
  } else if (args.includes('--jest')) {
    // Run only Jest tests
    testsToRun = ['jest'];
    console.log(chalk.yellow('Running Jest tests'));
  } else {
    // Check if server is running (required for custom tests)
    if (!checkServer()) {
      // If server is not running, we can still run Jest tests
      console.log(chalk.yellow('Server is not running. Only Jest tests will be available.'));
      const runJestOnly = await askYesNo('Would you like to run Jest tests? (y/n): ');
      if (runJestOnly) {
        testsToRun = ['jest'];
      } else {
        console.log(chalk.yellow('Exiting test runner.'));
        return;
      }
    } else {
      // Ask which tests to run via interactive menu
      testsToRun = await promptForTests();
    }
  }
  
  console.log(chalk.yellow(`\nRunning the following test suites: ${testsToRun.join(', ')}`));
  
  // Track results
  const results = {};
  
  // Run selected test suites
  for (const test of testsToRun) {
    const testName = test === 'jest' ? 'Jest' : test.charAt(0).toUpperCase() + test.slice(1);
    results[test] = await runTestSuite(testName, TEST_SCRIPTS[test]);
  }
  
  // Print summary
  console.log(chalk.bold.blue('\n===================================================='));
  console.log(chalk.bold.blue('                 Test Summary                       '));
  console.log(chalk.bold.blue('===================================================='));
  
  let allPassed = true;
  
  for (const [test, passed] of Object.entries(results)) {
    const testName = test === 'jest' ? 'Jest' : test.charAt(0).toUpperCase() + test.slice(1);
    
    if (passed) {
      console.log(chalk.green(`✅ ${testName} Tests: PASSED`));
    } else {
      console.log(chalk.red(`❌ ${testName} Tests: FAILED`));
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log(chalk.green.bold('\n🎉 All test suites passed!'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️ Some test suites failed. See details above.'));
  }
}

// Helper function to ask yes/no questions
function askYesNo(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(question), (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

// Run the main function
main().catch(error => {
  console.error(chalk.red('Error running tests:'), error);
}); 