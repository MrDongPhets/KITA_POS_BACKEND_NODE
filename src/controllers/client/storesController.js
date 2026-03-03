// src/controllers/client/storesController.js
const { getSupabase } = require('../../config/database');

async function requestStore(req, res) {
  try {
    const companyId = req.user.company_id;
    const userId = req.user.id;
    const supabase = getSupabase();

    const { name, address, phone, description } = req.body;

    console.log('🏪 Store request from company:', companyId);

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        error: 'Store name and address are required',
        code: 'VALIDATION_ERROR'
      });
    }

    // NO LIMIT CHECK HERE - Allow unlimited pending store requests
    // The limit will be enforced when admin approves the store

    // Generate unique store ID
    const storeId = `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create store request
    const { data: store, error } = await supabase
      .from('stores')
      .insert({
        id: storeId,
        name: name.trim(),
        address: address.trim(),
        phone: phone?.trim() || null,
        company_id: companyId,
        created_by: userId,
        status: 'pending',
        is_active: false,
        settings: {
          description: description?.trim() || null,
          requested_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ Store request created:', store.id);

    res.status(201).json({
      message: 'Store request submitted successfully',
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

async function getStores(req, res) {
  try {
    const companyId = req.user.company_id;
    const supabase = getSupabase();

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

module.exports = {
  requestStore,
  getStores
};