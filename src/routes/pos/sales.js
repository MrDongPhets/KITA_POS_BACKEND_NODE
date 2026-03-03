const express = require('express');
const router = express.Router();
const { createSale, getSaleByReceipt, getTodaySales } = require('../../controllers/pos/salesController');

// POST /pos/sales
router.post('/', createSale);

// GET /pos/sales/receipt/:receipt_number
router.get('/receipt/:receipt_number', getSaleByReceipt);

// GET /pos/sales/today
router.get('/today', getTodaySales);

module.exports = router;