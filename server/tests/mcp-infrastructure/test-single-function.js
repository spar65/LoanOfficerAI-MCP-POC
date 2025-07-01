/**
 * Test script to verify natural language responses for MCP functions
 * 
 * This script tests the OpenAI chat endpoint to verify it returns
 * natural language responses for loan data queries.
 */

const axios = require('axios');
const LogService = require('../../services/logService');

// API base URL
const API_BASE_URL = 'http://localhost:3001';

async function testOpenAiChat() {
  console.log("=== TESTING OPENAI NATURAL LANGUAGE RESPONSES ===");
  
  try {
    // Test with a loan query
    console.log("Testing natural language response for loan L001...");
    
    const response = await axios.post(`${API_BASE_URL}/api/openai/chat`, {
      messages: [{ role: 'user', content: 'Show me loan L001 details' }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    // Check the response structure
    if (response.status === 200) {
      console.log("✅ API call successful");
      
      const data = response.data;
      console.log("Response structure:", JSON.stringify(Object.keys(data), null, 2));
      
      // Check if we got a natural language response
      if (data.content && typeof data.content === 'string') {
        console.log("✅ Natural language response received");
        
        // Check that it's not raw JSON
        if (!data.content.startsWith('{') && !data.content.startsWith('[')) {
          console.log("✅ Response is not raw JSON");
        } else {
          console.log("❌ Response appears to be raw JSON");
        }
        
        // Check for expected terms in response
        const expectedTerms = ['loan', 'L001', 'details', 'borrower'];
        const missingTerms = expectedTerms.filter(term => 
          !data.content.toLowerCase().includes(term.toLowerCase())
        );
        
        if (missingTerms.length === 0) {
          console.log("✅ Response contains expected terms");
        } else {
          console.log("❌ Missing expected terms:", missingTerms);
        }
        
        // Print the first 200 characters of the response
        console.log("\nResponse excerpt:");
        console.log(data.content.substring(0, 200) + '...');
      } else {
        console.log("❌ No natural language content in response");
        console.log("Response data:", JSON.stringify(data, null, 2));
      }
    } else {
      console.log("❌ API call failed with status:", response.status);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
  
  // Also test with lowercase loan_id to verify case-insensitive handling
  try {
    console.log("\nTesting case-insensitive handling with lowercase 'l001'...");
    
    const response = await axios.post(`${API_BASE_URL}/api/openai/chat`, {
      messages: [{ role: 'user', content: 'Show me loan l001 details' }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    });
    
    if (response.status === 200 && response.data.content) {
      // Check if the response still mentions L001
      if (response.data.content.includes('L001')) {
        console.log("✅ Case-insensitive handling works correctly");
      } else {
        console.log("❌ Response doesn't mention L001");
      }
    } else {
      console.log("❌ API call failed or no content in response");
    }
  } catch (error) {
    console.error("❌ Case-insensitive test failed:", error.message);
  }
  
  console.log("\n=== TEST COMPLETED ===");
}

// Run the test
testOpenAiChat().catch(error => {
  console.error("Unhandled error in test:", error);
}); 