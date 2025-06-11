const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get all collateral
router.get('/', (req, res) => {
  console.log('GET /api/collateral - Fetching all collateral');
  const collaterals = dataService.loadData(dataService.paths.collateral);
  console.log(`Found ${collaterals.length} collateral items`);
  res.json(collaterals);
});

// Get collateral by ID
router.get('/:id', (req, res) => {
  const collateralId = req.params.id;
  console.log(`GET /api/collateral/${collateralId} - Fetching collateral details`);
  
  const collaterals = dataService.loadData(dataService.paths.collateral);
  const collateral = collaterals.find(c => c.collateral_id === collateralId);
  
  if (collateral) {
    console.log(`Collateral found: ${collateral.collateral_id}`);
    res.json(collateral);
  } else {
    console.log(`Collateral not found with ID: ${collateralId}`);
    res.status(404).json({ error: 'Collateral not found' });
  }
});

module.exports = router; 