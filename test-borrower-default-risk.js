const axios = require('axios');

// Direct test for getBorrowerDefaultRisk function through OpenAI route
async function testBorrowerDefaultRisk() {
  console.log('Testing getBorrowerDefaultRisk function...');
  
  try {
    // Test data
    const testData = {
      messages: [
        { role: 'user', content: "What's the default risk for borrower B003?" }
      ],
      functions: [
        {
          name: "getBorrowerDefaultRisk",
          description: "Get default risk assessment for a specific borrower",
          parameters: {
            type: "object",
            properties: {
              borrowerId: {
                type: "string",
                description: "The ID of the borrower (e.g., B001)"
              },
              timeHorizon: {
                type: "string",
                enum: ["short_term", "medium_term", "long_term"],
                description: "The time horizon for risk assessment"
              }
            },
            required: ["borrowerId"]
          }
        }
      ],
      function_call: { name: "getBorrowerDefaultRisk" }  // Force function call
    };

    console.log('Sending request with forced function call...');
    
    // Make the request to the OpenAI endpoint
    const response = await axios.post(
      'http://localhost:3001/api/openai/chat',
      testData,
      {
        headers: {
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL',
          'X-Internal-Call': 'true',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n✅ SUCCESS! Response received:');
    console.log('Status:', response.status);
    console.log('Content type:', typeof response.data);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('\n❌ ERROR occurred:');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    return { success: false, error };
  }
}

// Execute the test
(async () => {
  try {
    const result = await testBorrowerDefaultRisk();
    
    if (result.success) {
      console.log('\n🎉 Test completed successfully!');
    } else {
      console.log('\n⚠️ Test failed!');
    }
  } catch (error) {
    console.error('Unexpected error during test execution:', error);
  }
})(); 