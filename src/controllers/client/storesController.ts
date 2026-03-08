// src/controllers/client/storesController.ts
import { Request, Response } from 'express';
import { getDb } from '../../config/database';

async function requestStore(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.company_id;
    const userId = req.user!.id;
    const supabase = getDb();

    const { name, address, phone, description } = req.body;

    console.log('🏪 Store request from company:', companyId);

    // Validate required fields
    if (!name || !address) {
      res.status(400).json({
        error: 'Store name and address are required',
        code: 'VALIDATION_ERROR'
      });
      return;
    }

    // Generate unique store ID
    const storeId = `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create store directly as active — no admin approval needed
    const { data: store, error } = await supabase
      .from('stores')
      .insert({
        id: storeId,
        name: name.trim(),
        address: address.trim(),
        phone: phone?.trim() || null,
        company_id: companyId,
        created_by: userId,
        status: 'active',
        is_active: true,
        settings: {
          description: description?.trim() || null,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Store created:', store.id);

    res.status(201).json({
      message: 'Store created successfully',
      store: {
        id: store.id,
        name: store.name,
        status: store.status,
        created_at: store.created_at
      }
    });

  } catch (error) {
    console.error('Store request error:', error);
    res.status(500).json({
      error: 'Failed to submit store request',
      code: 'STORE_REQUEST_ERROR'
    });
  }
}

async function getStores(req: Request, res: Response): Promise<void> {
  try {
    const companyId = req.user!.company_id;
    const supabase = getDb();

    console.log('🏪 Getting stores for company:', companyId);

    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log('✅ Stores found:', stores?.length || 0);

    res.json({
      stores: stores || [],
      count: stores?.length || 0
    });

  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      error: 'Failed to fetch stores',
      code: 'STORES_ERROR'
    });
  }
}

export {
  requestStore,
  getStores
};
