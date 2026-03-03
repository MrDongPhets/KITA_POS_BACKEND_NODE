const express = require('express');
const router = express.Router();
const { authenticateToken, requireClient } = require('../../middleware/auth');

const dashboardRoutes = require('./dashboard');
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const inventoryRoutes = require('./inventory');
const salesRoutes = require('./sales');
const uploadRoutes = require('./upload');
const storesRoutes = require('./stores');
const inventoryTransferRoutes = require('./inventorytransfer');
const ingredientsRoutes = require('./ingredients');
const recipesRoutes = require('./recipes');
const manufacturingRoutes = require('./manufacturing');

// Apply authentication to all client routes
router.use(authenticateToken);
router.use(requireClient);

// Mount client routes
router.use('/dashboard', dashboardRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/sales', salesRoutes);
router.use('/upload', uploadRoutes);
router.use('/stores', storesRoutes);
router.use('/inventory-transfer', inventoryTransferRoutes);
router.use('/ingredients', ingredientsRoutes);
router.use('/recipes', recipesRoutes);
router.use('/manufacturing', manufacturingRoutes);


module.exports = router;