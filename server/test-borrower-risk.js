/**
 * Test script to verify the non-accrual risk functionality for borrower B001
 */
require('dotenv').config();
const axios = require('axios');
const LogService = require('./services/logService');
const dataService = require('./services/dataService');

// Ensure B001 exists
LogService.info('Verifying that borrower B001 exists in the data');
dataService.ensureBorrowerB001();

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function testBorrowerRisk() {
  LogService.info('Starting borrower risk test...');
  
  try {
    // Step 1: Test that borrower B001 can be retrieved
    LogService.info('Step 1: Testing borrower retrieval');
    const borrowerRes = await axios.get(`${BASE_URL}/api/borrowers/B001`, {
      headers: {
        'Accept': 'application/json',
        'X-Internal-Call': 'true',
        'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
      }
    });
    
    if (borrowerRes.data && borrowerRes.data.borrower_id === 'B001') {
      LogService.info('✓ Successfully retrieved borrower B001:', borrowerRes.data);
    } else {
      LogService.error('✗ Failed to retrieve borrower B001:', borrowerRes.data);
      return;
    }
    
    // Step 2: Test non-accrual risk assessment via risk endpoint
    LogService.info('Step 2: Testing risk/non-accrual endpoint');
    try {
      const riskRes = await axios.get(`${BASE_URL}/api/risk/non-accrual/B001`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      if (riskRes.data && riskRes.data.borrower_id === 'B001') {
        LogService.info('✓ Successfully retrieved non-accrual risk from risk endpoint:', riskRes.data);
      } else {
        LogService.warn('✗ Unexpected response from risk endpoint:', riskRes.data);
      }
    } catch (riskErr) {
      LogService.error('✗ Failed to retrieve non-accrual risk from risk endpoint:', {
        message: riskErr.message,
        status: riskErr.response?.status,
        data: riskErr.response?.data
      });
    }
    
    // Step 3: Test non-accrual risk assessment via analytics endpoint
    LogService.info('Step 3: Testing analytics/predict/non-accrual-risk endpoint');
    try {
      const analyticsRes = await axios.get(`${BASE_URL}/api/analytics/predict/non-accrual-risk/B001`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      if (analyticsRes.data && analyticsRes.data.borrower_id === 'B001') {
        LogService.info('✓ Successfully retrieved non-accrual risk from analytics endpoint:', analyticsRes.data);
      } else {
        LogService.warn('✗ Unexpected response from analytics endpoint:', analyticsRes.data);
      }
    } catch (analyticsErr) {
      LogService.error('✗ Failed to retrieve non-accrual risk from analytics endpoint:', {
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
          content: 'Is there a risk that borrower B001 will become non-accrual?' 
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
        LogService.info('✓ Successfully received OpenAI response about B001 non-accrual risk');
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
    
    LogService.info('Borrower risk test completed');
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
    testBorrowerRisk();
  })
  .catch((error) => {
    LogService.error(`Server is not running at ${BASE_URL}. Start the server first.`, {
      message: error.message
    });
  }); 