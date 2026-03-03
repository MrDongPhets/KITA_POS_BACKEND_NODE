const express = require('express');
const router = express.Router();
const {
  getDashboardOverview,
  getRecentSales,
  getLowStockProducts,
  getTopProducts,
  getStores
} = require('../../controllers/client/dashboardController');

router.get('/overview', getDashboardOverview);
router.get('/recent-sales', getRecentSales);
router.get('/low-stock', getLowStockProducts);
router.get('/top-products', getTopProducts);
router.get('/stores', getStores);

module.exports = router;