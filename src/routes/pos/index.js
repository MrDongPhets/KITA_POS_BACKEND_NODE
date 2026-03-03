const express = require('express');
const router = express.Router();
const { authenticateToken, requireClient } = require('../../middleware/auth');

const productsRoutes = require('./products');
const salesRoutes = require('./sales');

// Apply authentication to all POS routes
router.use(authenticateToken);
router.use(requireClient);

// Mount POS routes
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);

module.exports = router;