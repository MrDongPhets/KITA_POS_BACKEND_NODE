// src/routes/reports/financial.js
const express = require('express');
const router = express.Router();

// Import controllers
const {
  getFinancialReports,
  getProfitMargins,
  getExpenseTracking,
  getTaxReports,
  getRevenueByStore
} = require('../../controllers/reports/financialReportsController');

// GET /reports/financial - Get financial summary
router.get('/', getFinancialReports);

// GET /reports/financial/profit-margins - Get profit margins
router.get('/profit-margins', getProfitMargins);

// GET /reports/financial/expenses - Get expense tracking
router.get('/expenses', getExpenseTracking);

// GET /reports/financial/tax - Get tax reports
router.get('/tax', getTaxReports);

// GET /reports/financial/revenue-by-store - Get revenue by store
router.get('/revenue-by-store', getRevenueByStore);

module.exports = router;