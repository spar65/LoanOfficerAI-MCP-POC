/**
 * Test Setup for Jest
 * 
 * Configures the testing environment, including mocks for external services.
 */

// Jest setup file for server tests
const path = require('path');
const fs = require('fs');
const { TEST_TOKEN } = require('../auth/authMiddleware');

// Setup environment for testing
process.env.NODE_ENV = 'test';
process.env.TEST_PORT = process.env.TEST_PORT || '3002';
process.env.ALLOW_TEST_AUTH = 'true';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise during tests

// Import test utilities
const testUtils = require('./helpers/test-utils');
global.testUtils = testUtils;

// Mock data helper
global.getMockData = (filename) => {
  try {
    const filePath = path.join(__dirname, 'mock-data', `${filename}.json`);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      if (data && data.trim()) {
        return JSON.parse(data);
      } else {
        console.warn(`Mock data file is empty: ${filePath}`);
        return [];
      }
    } else {
      // console.warn(`Mock data file not found: ${filePath}`); // Keep this commented for cleaner test output unless debugging this function
      return [];
    }
  } catch (error) {
    console.error(`Error loading mock data from ${filename}: ${error.message}`);
    return [];
  }
};

// Create test logger to avoid console output during tests
global.testLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
};

// Ensure fs.existsSync is properly defined (polyfill if necessary, though Jest mock should override)
fs.existsSync = fs.existsSync || ((pathToCheck) => { 
  try { 
    fs.accessSync(pathToCheck); 
    return true; 
  } catch (e) { 
    return false; 
  } 
});

// Set up Jest globals if not already available
if (typeof jest === 'undefined') {
  global.jest = {
    fn: () => jest.fn() // Basic mock for jest.fn if not in Jest env (e.g. utility files)
  };
}

// Global test configurations
global.beforeAll = global.beforeAll || jest.fn();
global.afterAll = global.afterAll || jest.fn();
global.beforeEach = global.beforeEach || jest.fn();
global.afterEach = global.afterEach || jest.fn();

// Make the test token available globally
global.TEST_TOKEN = TEST_TOKEN;

// Mock OpenAI
jest.mock('openai', () => {
  // Create a mock OpenAI client
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn().mockImplementation(async (options) => {
          // Check if function calling is expected
          if (options.functions && options.functions.length > 0 && options.function_call) {
            // Test for specific function calls based on messages
            const userMessage = options.messages.find(m => m.role === 'user')?.content || '';
            
            if (userMessage.toLowerCase().includes('loan l001')) {
              // Mock a getLoanDetails function call
              return {
                choices: [{
                  message: {
                    role: 'assistant',
                    function_call: {
                      name: 'getLoanDetails',
                      arguments: JSON.stringify({ loan_id: 'L001' })
                    }
                  }
                }],
                usage: { total_tokens: 100 }
              };
            } 
            
            if (userMessage.toLowerCase().includes('borrower b001')) {
              // Mock a getBorrowerDetails function call
              return {
                choices: [{
                  message: {
                    role: 'assistant',
                    function_call: {
                      name: 'getBorrowerDetails',
                      arguments: JSON.stringify({ borrower_id: 'B001' })
                    }
                  }
                }],
                usage: { total_tokens: 100 }
              };
            }
            
            if (userMessage.toLowerCase().includes('active loans')) {
              // Mock a getActiveLoans function call
              return {
                choices: [{
                  message: {
                    role: 'assistant',
                    function_call: {
                      name: 'getActiveLoans',
                      arguments: JSON.stringify({})
                    }
                  }
                }],
                usage: { total_tokens: 100 }
              };
            }
            
            if (userMessage.toLowerCase().includes('what loans does')) {
              // Mock a getLoansByBorrower function call
              // Extract borrower ID from the message
              const borrowerId = userMessage.match(/[bB]\d{3}/)?.[0] || 'B001';
              return {
                choices: [{
                  message: {
                    role: 'assistant',
                    function_call: {
                      name: 'getLoansByBorrower',
                      arguments: JSON.stringify({ borrower_id: borrowerId })
                    }
                  }
                }],
                usage: { total_tokens: 100 }
              };
            }
            
            if (userMessage.toLowerCase().includes('collateral sufficient')) {
              // Mock an evaluateCollateralSufficiency function call
              // Extract loan ID from the message
              const loanId = userMessage.match(/[lL]\d{3}/)?.[0] || 'L001';
              return {
                choices: [{
                  message: {
                    role: 'assistant',
                    function_call: {
                      name: 'evaluateCollateralSufficiency',
                      arguments: JSON.stringify({ loan_id: loanId })
                    }
                  }
                }],
                usage: { total_tokens: 100 }
              };
            }
          }
          
          // Check if we're in the second step (after function execution)
          const functionMessage = options.messages.find(m => m.role === 'function');
          if (functionMessage) {
            // This is the second call to create a natural language response from the function result
            const functionName = functionMessage.name;
            const functionContent = JSON.parse(functionMessage.content);
            
            // Generate mock natural language response based on function result
            let content = 'Here is the information you requested:';
            
            // Add function-specific natural language response
            if (functionName === 'getLoanDetails') {
              if (functionContent.error) {
                content = `I'm sorry, but I couldn't find loan ${functionContent.loan_id || 'you mentioned'}. ${functionContent.details || ''}`;
              } else {
                content = `Here are the details for loan ${functionContent.loan_id}:\n\n` +
                  `- Loan Amount: $${functionContent.loan_amount}\n` +
                  `- Interest Rate: ${functionContent.interest_rate}%\n` +
                  `- Term: ${functionContent.term_months} months\n` +
                  `- Status: ${functionContent.status}\n` +
                  `- Type: ${functionContent.loan_type}`;
              }
            } else if (functionName === 'getBorrowerDetails') {
              if (functionContent.error) {
                content = `I couldn't find borrower ${functionContent.borrower_id || 'you mentioned'}. ${functionContent.details || ''}`;
              } else {
                content = `Here are the details for borrower ${functionContent.borrower_id}:\n\n` +
                  `- Name: ${functionContent.first_name} ${functionContent.last_name}\n` +
                  `- Credit Score: ${functionContent.credit_score}\n` +
                  `- Farm Type: ${functionContent.farm_type}\n` +
                  `- Farm Size: ${functionContent.farm_size} acres`;
              }
            } else if (functionName === 'getActiveLoans') {
              if (functionContent.error) {
                content = `I'm sorry, but I couldn't retrieve the active loans. ${functionContent.details || ''}`;
              } else if (Array.isArray(functionContent)) {
                content = `Here are the active loans:\n\n${
                  functionContent.map(loan => 
                    `- Loan ${loan.loan_id}: $${loan.loan_amount} (${loan.loan_type})`
                  ).join('\n')
                }`;
              }
            } else if (functionName === 'evaluateCollateralSufficiency') {
              if (functionContent.error) {
                content = `I couldn't evaluate the collateral for loan ${functionContent.loan_id || 'you mentioned'}. ${functionContent.details || ''}`;
              } else {
                content = `For loan ${functionContent.loan_id}, the collateral is ${functionContent.is_sufficient ? 'sufficient' : 'insufficient'}.\n\n` +
                  `- Loan amount: $${functionContent.loan_amount}\n` +
                  `- Collateral value: $${functionContent.collateral_value}\n` +
                  `- Loan-to-value ratio: ${functionContent.loan_to_value_ratio}\n\n` +
                  `${functionContent.assessment}`;
              }
            } else {
              // Generic response for other functions
              content = `Here is the result of my analysis: ${JSON.stringify(functionContent)}`;
            }
            
            return {
              choices: [{
                message: {
                  role: 'assistant',
                  content: content
                }
              }],
              usage: { total_tokens: 150 }
            };
          }
          
          // Default case: just return a simple message
          return {
            choices: [{
              message: {
                role: 'assistant',
                content: "I'm here to help with information about loans and borrowers. What would you like to know?"
              }
            }],
            usage: { total_tokens: 50 }
          };
        })
      }
    }
  };
  
  return {
    OpenAI: jest.fn(() => mockOpenAI)
  };
});

// Mock file system operations
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    readFileSync: jest.fn((path, options) => {
      // If it's reading one of our data files, return mock data
      if (path.includes('loans.json')) {
        return JSON.stringify([
          { loan_id: 'L001', borrower_id: 'B001', loan_amount: 50000, interest_rate: 3.5, term_months: 60, status: 'Active', loan_type: 'Equipment' },
          { loan_id: 'L002', borrower_id: 'B002', loan_amount: 75000, interest_rate: 4.0, term_months: 120, status: 'Active', loan_type: 'Real Estate' },
          { loan_id: 'L003', borrower_id: 'B001', loan_amount: 25000, interest_rate: 5.0, term_months: 36, status: 'Closed', loan_type: 'Operating' }
        ]);
      } else if (path.includes('borrowers.json')) {
        return JSON.stringify([
          { borrower_id: 'B001', first_name: 'John', last_name: 'Farmer', credit_score: 720, income: 150000, farm_type: 'Crop', farm_size: 500 },
          { borrower_id: 'B002', first_name: 'Jane', last_name: 'Rancher', credit_score: 680, income: 200000, farm_type: 'Livestock', farm_size: 1000 }
        ]);
      } else if (path.includes('collateral.json')) {
        return JSON.stringify([
          { collateral_id: 'C001', loan_id: 'L001', description: 'Farm Equipment', value: 60000 },
          { collateral_id: 'C002', loan_id: 'L002', description: 'Farm Land', value: 100000 }
        ]);
      } else if (path.includes('payments.json')) {
        return JSON.stringify([]);
      }
      
      // Fall back to actual implementation for other files
      return actualFs.readFileSync(path, options);
    })
  };
}); 