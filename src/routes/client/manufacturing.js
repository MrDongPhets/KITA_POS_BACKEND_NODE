// src/routes/client/manufacturing.js
const express = require('express');
const router = express.Router();
const {
  checkManufacturingAvailability,
  manufactureProduct,
  getManufacturingHistory
} = require('../../controllers/client/manufacturingController');

// Manufacturing routes
router.get('/history', getManufacturingHistory);
router.get('/:product_id/check', checkManufacturingAvailability);
router.post('/:product_id/manufacture', manufactureProduct);

module.exports = router;