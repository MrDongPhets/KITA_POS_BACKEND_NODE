// src/routes/client/sales.js - Sales Management Routes
const express = require('express');
const router = express.Router();
const {
  getAllSales,
  getSaleDetails,
  getSalesSummary,
  voidSale,
  getRecentSales
} = require('../../controllers/client/salesController');

// GET /client/sales - Get all sales with filters and pagination
router.get('/', getAllSales);

// GET /client/sales/summary - Get sales statistics
router.get('/summary', getSalesSummary);

// GET /client/sales/recent - Get recent sales (last 24 hours)
router.get('/recent', getRecentSales);

// GET /client/sales/:id - Get sale details with items
router.get('/:id', getSaleDetails);

// POST /client/sales/:id/void - Void/cancel a sale
router.post('/:id/void', voidSale);

module.exports = router;