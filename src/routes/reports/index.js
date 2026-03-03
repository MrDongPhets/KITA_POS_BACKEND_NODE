// src/routes/reports/index.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

// Import sub-routes
const salesRoutes = require('./sales');
const inventoryRoutes = require('./inventory');
const financialRoutes = require('./financial');

// Apply authentication to all routes
router.use(authenticateToken);

// Mount sub-routes
router.use('/sales', salesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/financial', financialRoutes);

module.exports = router;