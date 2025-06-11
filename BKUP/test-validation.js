// Simple test script for POC validation improvements
const axios = require('axios');

const baseURL = 'http://localhost:3001/api';

async function testValidation() {
  console.log('🧪 Testing POC validation improvements...\n');
  
  try {
    // Test 1: Valid non-accrual risk request
    console.log('✅ Test 1: Valid borrower ID (B001)');
    const validTest = await axios.post(`${baseURL}/openai/chat`, {
      messages: [
        { role: "user", content: "What is the non-accrual risk for borrower B001?" }
      ],
      functions: [{
        name: "getBorrowerNonAccrualRisk",
        description: "Assess non-accrual risk for a specific borrower",
        parameters: {
          type: "object",
          properties: {
            borrowerId: {
              type: "string",
              description: "The ID of the borrower"
            }
          },
          required: ["borrowerId"]
        }
      }],
      function_call: "auto"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
      }
    });
    
    console.log('   Result: SUCCESS - Valid request processed\n');
    
  } catch (error) {
    console.log(`   Result: ${error.response?.status || 'ERROR'} - ${error.message}\n`);
  }

  try {
    // Test 2: Invalid borrower ID format
    console.log('❌ Test 2: Invalid borrower ID format (INVALID123)');
    const invalidTest = await axios.post(`${baseURL}/openai/chat`, {
      messages: [
        { role: "user", content: "What is the non-accrual risk for borrower INVALID123?" }
      ],
      functions: [{
        name: "getBorrowerNonAccrualRisk", 
        description: "Assess non-accrual risk for a specific borrower",
        parameters: {
          type: "object",
          properties: {
            borrowerId: {
              type: "string",
              description: "The ID of the borrower"
            }
          },
          required: ["borrowerId"]
        }
      }],
      function_call: "auto"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
      }
    });
    
    console.log('   Result: UNEXPECTED SUCCESS (should have failed validation)\n');
    
  } catch (error) {
    console.log(`   Result: EXPECTED FAILURE - ${error.response?.status || 'ERROR'}\n`);
  }

  try {
    // Test 3: Server health check
    console.log('🏥 Test 3: Server health check');
    const healthCheck = await axios.get(`${baseURL}/health`);
    console.log(`   Result: SUCCESS - Server is running (${healthCheck.status})\n`);
    
  } catch (error) {
    console.log(`   Result: ERROR - Server health check failed: ${error.message}\n`);
  }

  console.log('✨ POC validation testing complete!');
}

// Run the test with proper error handling
testValidation().catch(error => {
  console.error('❌ Test script failed:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.log('💡 Make sure the server is running with: npm run dev:server');
  }
  process.exit(1);
}); 