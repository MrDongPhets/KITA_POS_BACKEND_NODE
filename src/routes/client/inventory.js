// src/routes/client/inventory.js
const express = require('express');
const router = express.Router();
const { 
  getMovements, 
  createStockAdjustment, 
  getLowStockAlerts 
} = require('../../controllers/client/inventoryController');

// GET /client/inventory/movements
router.get('/movements', getMovements);

// POST /client/inventory/adjust-stock
router.post('/adjust-stock', createStockAdjustment);

// GET /client/inventory/alerts
router.get('/alerts', getLowStockAlerts);

module.exports = router;