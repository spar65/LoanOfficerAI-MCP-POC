const express = require('express');
const router = express.Router();
const mcpDatabaseService = require('../services/mcpDatabaseService');
const LogService = require('../services/logService');

// Get all collateral
router.get('/', async (req, res) => {
  LogService.info('Fetching all collateral');
  
  try {
    const collateralsResult = await mcpDatabaseService.executeQuery('SELECT * FROM Collateral', {});
    const collaterals = collateralsResult.recordset || collateralsResult;
    
    LogService.info(`Found ${collaterals.length} collateral items`);
    res.json(collaterals);
  } catch (error) {
    LogService.error('Error fetching collateral', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch collateral', details: error.message });
  }
});

// Get collateral by ID
router.get('/:id', async (req, res) => {
  const collateralId = req.params.id;
  LogService.info(`Fetching collateral details for ID: ${collateralId}`);
  
  try {
    const collateralResult = await mcpDatabaseService.executeQuery(
      'SELECT * FROM Collateral WHERE collateral_id = @collateralId', 
      { collateralId }
    );
    const collateral = collateralResult.recordset?.[0] || collateralResult[0];
    
    if (collateral) {
      LogService.info(`Collateral found: ${collateral.collateral_id}`);
      res.json(collateral);
    } else {
      LogService.warn(`Collateral not found with ID: ${collateralId}`);
      res.status(404).json({ error: 'Collateral not found' });
    }
  } catch (error) {
    LogService.error(`Error fetching collateral ${collateralId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to fetch collateral details', details: error.message });
  }
});

module.exports = router; 