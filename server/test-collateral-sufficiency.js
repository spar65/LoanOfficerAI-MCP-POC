/**
 * Test script to verify the collateral sufficiency functionality
 */
require('dotenv').config();
const axios = require('axios');
const LogService = require('./services/logService');
const dataService = require('./services/dataService');

// Verify data files
LogService.info('Verifying loan and collateral data');
try {
  // Check loans data
  const loans = dataService.loadData(dataService.paths.loans);
  LogService.info(`Found ${loans.length} loans`);
  
  // Look for L002 specifically
  const l002 = loans.find(l => l.loan_id === 'L002');
  if (l002) {
    LogService.info('Loan L002 found:', l002);
  } else {
    LogService.error('Loan L002 not found in loans data');
  }
  
  // Check collateral data
  const collateral = dataService.loadData(dataService.paths.collateral);
  LogService.info(`Found ${collateral.length} collateral items`);
  
  // Look for collateral for L002
  const l002Collateral = collateral.filter(c => c.loan_id === 'L002');
  if (l002Collateral.length > 0) {
    LogService.info(`Found ${l002Collateral.length} collateral items for loan L002:`, l002Collateral);
  } else {
    LogService.warn('No collateral found for loan L002');
  }
} catch (error) {
  LogService.error('Error verifying data:', {
    message: error.message,
    stack: error.stack
  });
}

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

async function testCollateralSufficiency() {
  LogService.info('Starting collateral sufficiency test...');
  
  try {
    // Step 1: Test direct endpoint for L002
    LogService.info('Step 1: Testing risk/collateral/L002 endpoint');
    try {
      const collateralRes = await axios.get(`${BASE_URL}/api/risk/collateral/L002?market_conditions=stable`, {
        headers: {
          'Accept': 'application/json',
          'X-Internal-Call': 'true',
          'Authorization': 'Bearer SYSTEM_INTERNAL_CALL'
        }
      });
      
      LogService.info('Collateral endpoint response for L002:', collateralRes.data);
    } catch (collateralErr) {
      LogService.error('Failed to retrieve collateral data for L002:', {
        message: collateralErr.message,
        status: collateralErr.response?.status,
        data: collateralErr.response?.data
      });
    }
    
    // Step 2: Test via OpenAI endpoint with function calling
    LogService.info('Step 2: Testing OpenAI endpoint with function calling');
    try {
      const openaiRes = await axios.post(`${BASE_URL}/api/openai/chat`, {
        messages: [{ 
          role: 'user', 
          content: "Is the collateral for loan L002 sufficient given current market conditions?" 
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
    } catch (openaiErr) {
      LogService.error('Failed to get OpenAI response:', {
        message: openaiErr.message,
        status: openaiErr.response?.status,
        data: openaiErr.response?.data
      });
    }
    
    // Step 3: Test collateral data service loading directly
    LogService.info('Step 3: Testing direct access to collateral data');
    try {
      const collateralData = dataService.loadData(dataService.paths.collateral);
      LogService.info(`Direct data service loaded ${collateralData.length} collateral items`);
      
      const l002CollateralItems = collateralData.filter(c => c.loan_id === 'L002');
      LogService.info(`Found ${l002CollateralItems.length} collateral items for L002 in direct data load`);
    } catch (dataErr) {
      LogService.error('Error accessing collateral data directly:', {
        message: dataErr.message,
        stack: dataErr.stack
      });
    }
    
    LogService.info('Collateral sufficiency test completed');
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
    testCollateralSufficiency();
  })
  .catch((error) => {
    LogService.error(`Server is not running at ${BASE_URL}. Start the server first.`, {
      message: error.message
    });
  }); 