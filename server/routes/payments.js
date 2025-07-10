const express = require('express');
const router = express.Router();
const mcpDatabaseService = require('../services/mcpDatabaseService');
const LogService = require('../services/logService');

// Get all payments
router.get('/', async (req, res) => {
  LogService.info('Fetching all payments');
  
  try {
    const paymentsResult = await mcpDatabaseService.executeQuery('SELECT * FROM Payments', {});
    const payments = paymentsResult.recordset || paymentsResult;
    
    LogService.info(`Found ${payments.length} payments`);
    res.json(payments);
  } catch (error) {
    LogService.error('Error fetching payments', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
  }
});

// Get payment by ID
router.get('/:id', async (req, res) => {
  const paymentId = req.params.id;
  LogService.info(`Fetching payment details for ID: ${paymentId}`);
  
  try {
    const paymentResult = await mcpDatabaseService.executeQuery(
      'SELECT * FROM Payments WHERE payment_id = @paymentId', 
      { paymentId }
    );
    const payment = paymentResult.recordset?.[0] || paymentResult[0];
    
    if (payment) {
      LogService.info(`Payment found: ${payment.payment_id}`);
      res.json(payment);
    } else {
      LogService.warn(`Payment not found with ID: ${paymentId}`);
      res.status(404).json({ error: 'Payment not found' });
    }
  } catch (error) {
    LogService.error(`Error fetching payment ${paymentId}`, { error: error.message });
    res.status(500).json({ error: 'Failed to fetch payment details', details: error.message });
  }
});

module.exports = router; 