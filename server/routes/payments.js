const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

// Get all payments
router.get('/', (req, res) => {
  console.log('GET /api/payments - Fetching all payments');
  
  const payments = dataService.loadData(dataService.paths.payments);
  console.log(`Found ${payments.length} payments`);
  res.json(payments);
});

// Get payment by ID
router.get('/:id', (req, res) => {
  const paymentId = req.params.id;
  console.log(`GET /api/payments/${paymentId} - Fetching payment details`);
  
  const payments = dataService.loadData(dataService.paths.payments);
  const payment = payments.find(p => p.payment_id === paymentId);
  
  if (payment) {
    console.log(`Payment found: ${payment.payment_id}`);
    res.json(payment);
  } else {
    console.log(`Payment not found with ID: ${paymentId}`);
    res.status(404).json({ error: 'Payment not found' });
  }
});

module.exports = router; 