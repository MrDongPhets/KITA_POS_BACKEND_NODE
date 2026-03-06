import express, { Request, Response } from 'express';
import { authenticateToken, requireClient } from '../../middleware/auth';
import { getDb } from '../../config/database';

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

// GET /client/company — returns company info including company_code
router.get('/company', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const { data: companies, error } = await db
      .from('companies')
      .select('id, name, company_code, contact_email, contact_phone, address, website, logo_url')
      .eq('id', req.user!.company_id)
      .limit(1);

    if (error || !companies || companies.length === 0) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json({ company: companies[0] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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
