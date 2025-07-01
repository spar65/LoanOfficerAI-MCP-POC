/**
 * Test script to verify the default risk prediction functionality for borrower B003
 */
require('dotenv').config();
const axios = require('axios');
const LogService = require('../../services/logService');
const dataService = require('../../services/dataService');

// Ensure borrower B003 exists in the data
LogService.info('Verifying that borrower B003 exists in the data');
try {
  const borrowers = dataService.loadData(dataService.paths.borrowers);
  const b003 = borrowers.find(b => b.borrower_id === 'B003');
  if (b003) {
    LogService.info('Borrower B003 found in the data:', {
      name: `${b003.first_name} ${b003.last_name}`,
      credit_score: b003.credit_score,
      farm_size: b003.farm_size,
      income: b003.income
    });
  } else {
    LogService.error('Borrower B003 not found in the data');
  }
} catch (error) {
  LogService.error('Error verifying borrower B003:', {
    message: error.message,
    stack: error.stack
  });
}

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function testDefaultRisk() {
  LogService.info('Starting default risk prediction test...');
  
  try {
    // Step 1: Test that borrower B003 can be retrieved
    LogService.info('Step 1: Testing borrower retrieval');
    const borrowerRes = await axios.get(`${BASE_URL}/api/borrowers/B003`, {
      headers: {
        'Accept': 'application/json',
        'X-Internal-Call': 'true',
        'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
      }
    });
    
    if (borrowerRes.data && borrowerRes.data.borrower_id === 'B003') {
      LogService.info('✓ Successfully retrieved borrower B003:', borrowerRes.data);
    } else {
      LogService.error('✗ Failed to retrieve borrower B003:', borrowerRes.data);
      return;
    }
    
    // Step 2: Test default risk assessment via risk endpoint
    LogService.info('Step 2: Testing risk/default endpoint');
    try {
      const riskRes = await axios.get(`${BASE_URL}/api/risk/default/B003?time_horizon=short_term`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      if (riskRes.data && riskRes.data.borrower_id === 'B003') {
        LogService.info('✓ Successfully retrieved default risk from risk endpoint:', riskRes.data);
      } else {
        LogService.warn('✗ Unexpected response from risk endpoint:', riskRes.data);
      }
    } catch (riskErr) {
      LogService.error('✗ Failed to retrieve default risk from risk endpoint:', {
        message: riskErr.message,
        status: riskErr.response?.status,
        data: riskErr.response?.data
      });
    }
    
    // Step 3: Test default risk prediction via analytics endpoint for 3 month time horizon
    LogService.info('Step 3: Testing analytics/predict/default-risk endpoint (3m)');
    try {
      const analyticsRes = await axios.get(`${BASE_URL}/api/analytics/predict/default-risk/B003?time_horizon=3m`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      if (analyticsRes.data && analyticsRes.data.borrower_id === 'B003') {
        LogService.info('✓ Successfully retrieved default risk prediction from analytics endpoint:', analyticsRes.data);
      } else {
        LogService.warn('✗ Unexpected response from analytics endpoint:', analyticsRes.data);
      }
    } catch (analyticsErr) {
      LogService.error('✗ Failed to retrieve default risk prediction from analytics endpoint:', {
        message: analyticsErr.message,
        status: analyticsErr.response?.status,
        data: analyticsErr.response?.data
      });
    }
    
    // Step 4: Test via OpenAI endpoint with function calling
    LogService.info('Step 4: Testing OpenAI endpoint with function calling');
    try {
      const openaiRes = await axios.post(`${BASE_URL}/api/openai/chat`, {
        messages: [{ 
          role: 'user', 
          content: "What's the default risk for borrower B003 in the next 3 months?" 
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
        LogService.info('✓ Successfully received OpenAI response about B003 default risk');
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
    
    LogService.info('Default risk prediction test completed');
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
    testDefaultRisk();
  })
  .catch((error) => {
    LogService.error(`Server is not running at ${BASE_URL}. Start the server first.`, {
      message: error.message
    });
  }); 