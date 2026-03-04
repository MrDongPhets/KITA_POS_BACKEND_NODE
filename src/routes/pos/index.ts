import express from 'express';
import { authenticateToken, requireClient } from '../../middleware/auth';

import productsRoutes from './products';
import salesRoutes from './sales';

const router = express.Router();

// Apply authentication to all POS routes
router.use(authenticateToken);
router.use(requireClient);

// Mount POS routes
router.use('/products', productsRoutes);
router.use('/sales', salesRoutes);

export default router;
