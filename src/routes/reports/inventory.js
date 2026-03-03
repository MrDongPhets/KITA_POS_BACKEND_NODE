// src/routes/reports/inventory.js
const express = require('express');
const router = express.Router();

// Import controllers
const {
  getInventoryReports,
  getStockValue,
  getTurnoverRates,
  getLowStockProducts,
  getInventoryMovementSummary
} = require('../../controllers/reports/inventoryReportsController');

// GET /reports/inventory - Get inventory summary
router.get('/', getInventoryReports);

// GET /reports/inventory/stock-value - Get total stock value
router.get('/stock-value', getStockValue);

// GET /reports/inventory/turnover - Get inventory turnover rates
router.get('/turnover', getTurnoverRates);

// GET /reports/inventory/low-stock - Get low stock products
router.get('/low-stock', getLowStockProducts);

// GET /reports/inventory/movements - Get inventory movement summary
router.get('/movements', getInventoryMovementSummary);

module.exports = router;