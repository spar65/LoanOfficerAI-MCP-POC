/**
 * Test script to verify the high risk farmers identification functionality
 */
require('dotenv').config();
const axios = require('axios');
const LogService = require('../../services/logService');
const dataService = require('../../services/dataService');

// Ensure we have sufficient borrower data
LogService.info('Verifying borrower data availability');
try {
  const borrowers = dataService.loadData(dataService.paths.borrowers);
  LogService.info(`Found ${borrowers.length} borrowers in the data`);
  
  // Log a sample of borrowers with their credit scores to verify data
  const sampleBorrowers = borrowers.slice(0, Math.min(5, borrowers.length));
  sampleBorrowers.forEach(borrower => {
    LogService.debug(`Borrower ${borrower.borrower_id}: ${borrower.first_name} ${borrower.last_name}, Credit Score: ${borrower.credit_score}`);
  });
} catch (error) {
  LogService.error('Error verifying borrower data:', {
    message: error.message,
    stack: error.stack
  });
}

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function testHighRiskFarmers() {
  LogService.info('Starting high risk farmers identification test...');
  
  try {
    // Step 1: Test that analytics endpoint for high risk farmers works
    LogService.info('Step 1: Testing analytics/high-risk-farmers endpoint');
    try {
      const analyticsRes = await axios.get(`${BASE_URL}/api/analytics/high-risk-farmers?time_horizon=3m&threshold=high`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      if (analyticsRes.data && Array.isArray(analyticsRes.data.farmers)) {
        LogService.info(`✓ Successfully retrieved ${analyticsRes.data.farmers.length} high risk farmers:`, analyticsRes.data);
      } else {
        LogService.warn('✗ Unexpected response from analytics endpoint:', analyticsRes.data);
      }
    } catch (analyticsErr) {
      LogService.error('✗ Failed to retrieve high risk farmers from analytics endpoint:', {
        message: analyticsErr.message,
        status: analyticsErr.response?.status,
        data: analyticsErr.response?.data
      });
    }
    
    // Step 2: Test via OpenAI endpoint with function calling
    LogService.info('Step 2: Testing OpenAI endpoint with function calling');
    try {
      const openaiRes = await axios.post(`${BASE_URL}/api/openai/chat`, {
        messages: [{ 
          role: 'user', 
          content: "Which farmers are at high risk of default?" 
        }],
        function_call: 'auto'
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      LogService.info('OpenAI response:', openaiRes.data);
      
      if (openaiRes.data && typeof openaiRes.data.content === 'string') {
        LogService.info('✓ Successfully received OpenAI response for high risk farmers');
      } else {
        LogService.warn('✗ Unexpected OpenAI response format:', openaiRes.data);
      }
    } catch (openaiErr) {
      LogService.error('✗ Failed to get OpenAI response:', {
        message: openaiErr.message,
        status: openaiErr.response?.status,
        data: openaiErr.response?.data
      });
    }
    
    // Step 3: Test specific parameter variations
    LogService.info('Step 3: Testing with different time horizons and thresholds');
    
    try {
      // Test medium risk threshold
      const mediumRiskRes = await axios.get(`${BASE_URL}/api/analytics/high-risk-farmers?time_horizon=3m&threshold=medium`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      if (mediumRiskRes.data && Array.isArray(mediumRiskRes.data.farmers)) {
        LogService.info(`✓ Successfully retrieved medium risk farmers (${mediumRiskRes.data.farmers.length})`);
      } else {
        LogService.warn('✗ Unexpected response for medium risk threshold:', mediumRiskRes.data);
      }
      
      // Test longer time horizon
      const longTermRes = await axios.get(`${BASE_URL}/api/analytics/high-risk-farmers?time_horizon=12m&threshold=high`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      if (longTermRes.data && Array.isArray(longTermRes.data.farmers)) {
        LogService.info(`✓ Successfully retrieved long-term high risk farmers (${longTermRes.data.farmers.length})`);
      } else {
        LogService.warn('✗ Unexpected response for long-term time horizon:', longTermRes.data);
      }
    } catch (paramErr) {
      LogService.error('✗ Error testing parameter variations:', {
        message: paramErr.message,
        status: paramErr.response?.status,
        data: paramErr.response?.data
      });
    }
    
    LogService.info('High risk farmers identification test completed');
  } catch (error) {
    LogService.error('Test failed with error:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Only run if server is already running
axios.get(`${BASE_URL}/api/health`)
  .then(() => {
    LogService.info(`Server is running at ${BASE_URL}`);
    testHighRiskFarmers();
  })
  .catch((error) => {
    LogService.error(`Server is not running at ${BASE_URL}. Start the server first.`, {
      message: error.message
    });
  }); 