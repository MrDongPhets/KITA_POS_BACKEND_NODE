import express from 'express';
import { authenticateToken, requireClient } from '../../middleware/auth';

import dashboardRoutes from './dashboard';
import productsRoutes from './products';
import categoriesRoutes from './categories';
import inventoryRoutes from './inventory';
import salesRoutes from './sales';
import uploadRoutes from './upload';
import storesRoutes from './stores';
import inventoryTransferRoutes from './inventorytransfer';
import ingredientsRoutes from './ingredients';
import recipesRoutes from './recipes';
import manufacturingRoutes from './manufacturing';

const router = express.Router();

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

export default router;
