// src/controllers/client/manufacturingController.js
const { getSupabase } = require('../../config/database');

// Check if product can be manufactured
async function checkManufacturingAvailability(req, res) {
  try {
    const { product_id } = req.params;
    const { quantity } = req.query;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('🔍 Checking manufacturing availability for product:', product_id);

    // Verify product belongs to company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(s => s.id) || [];

    const { data: product } = await supabase
      .from('products')
      .select('id, name, store_id, is_composite')
      .eq('id', product_id)
      .in('store_id', storeIds)
      .single();

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    if (!product.is_composite) {
      return res.status(400).json({
        error: 'This product does not have a recipe and cannot be manufactured',
        code: 'NOT_COMPOSITE'
      });
    }

    // Get recipe with ingredient stock
    const { data: recipe } = await supabase
      .from('product_recipes')
      .select(`
        *,
        ingredients(id, name, stock_quantity, unit, store_id)
      `)
      .eq('product_id', product_id);

    if (!recipe || recipe.length === 0) {
      return res.status(400).json({
        error: 'No recipe defined for this product',
        code: 'NO_RECIPE'
      });
    }

    const qty = parseInt(quantity || 1);

    // Check availability for each ingredient
    const availability = recipe.map(item => {
      const neededQty = item.quantity_needed * qty;
      const availableQty = item.ingredients?.stock_quantity || 0;
      const sufficient = availableQty >= neededQty;

      return {
        ingredient_id: item.ingredient_id,
        ingredient_name: item.ingredients?.name || 'Unknown',
        needed: neededQty,
        available: availableQty,
        sufficient: sufficient,
        unit: item.unit,
        shortage: sufficient ? 0 : neededQty - availableQty
      };
    });

    const canManufacture = availability.every(item => item.sufficient);
    const maxCanMake = Math.min(
      ...availability.map(item => 
        Math.floor(item.available / (item.needed / qty))
      )
    );

    console.log('✅ Availability checked:', canManufacture ? 'Can manufacture' : 'Cannot manufacture');

    res.json({
      can_manufacture: canManufacture,
      max_quantity: maxCanMake,
      requested_quantity: qty,
      availability,
      product_name: product.name,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Check manufacturing availability error:', error);
    res.status(500).json({
      error: 'Failed to check availability',
      code: 'AVAILABILITY_ERROR'
    });
  }
}

// Manufacture/Produce product from ingredients
async function manufactureProduct(req, res) {
  try {
    const { product_id } = req.params;
    const { quantity, batch_number, expiry_date, notes } = req.body;
    const companyId = req.user.company_id;
    const userId = req.user.id;
    const supabase = getSupabase();

    console.log('🏭 Manufacturing product:', product_id, 'Quantity:', quantity);

    // Validate
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        error: 'Quantity must be greater than 0',
        code: 'INVALID_QUANTITY'
      });
    }

    // Verify product belongs to company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(s => s.id) || [];

    const { data: product } = await supabase
      .from('products')
      .select('id, name, store_id, is_composite, stock_quantity')
      .eq('id', product_id)
      .in('store_id', storeIds)
      .single();

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    if (!product.is_composite) {
      return res.status(400).json({
        error: 'This product does not have a recipe',
        code: 'NOT_COMPOSITE'
      });
    }

    // Get recipe
    const { data: recipe } = await supabase
      .from('product_recipes')
      .select(`
        *,
        ingredients(id, name, stock_quantity, unit, unit_cost, store_id)
      `)
      .eq('product_id', product_id);

    if (!recipe || recipe.length === 0) {
      return res.status(400).json({
        error: 'No recipe defined for this product',
        code: 'NO_RECIPE'
      });
    }

    // Check if sufficient ingredients
    const qty = parseInt(quantity);
    const insufficientIngredients = [];

    for (const item of recipe) {
      const neededQty = item.quantity_needed * qty;
      const availableQty = item.ingredients?.stock_quantity || 0;

      if (availableQty < neededQty) {
        insufficientIngredients.push({
          name: item.ingredients?.name,
          needed: neededQty,
          available: availableQty,
          shortage: neededQty - availableQty
        });
      }
    }

    if (insufficientIngredients.length > 0) {
      return res.status(400).json({
        error: 'Insufficient ingredients',
        code: 'INSUFFICIENT_INGREDIENTS',
        details: insufficientIngredients
      });
    }

    // Start transaction - Deduct ingredients and add product stock
    const previousProductStock = product.stock_quantity || 0;
    const newProductStock = previousProductStock + qty;

    // Update product stock
    const { error: productError } = await supabase
      .from('products')
      .update({
        stock_quantity: newProductStock,
        updated_at: new Date().toISOString()
      })
      .eq('id', product_id);

    if (productError) throw productError;

    // Log product inventory movement
    await supabase
      .from('inventory_movements')
      .insert({
        product_id: product_id,
        store_id: product.store_id,
        movement_type: 'in',
        quantity: qty,
        previous_stock: previousProductStock,
        new_stock: newProductStock,
        reference_type: 'manufacturing',
        notes: `Manufactured ${qty} units${batch_number ? ` (Batch: ${batch_number})` : ''}`,
        created_by: userId
      });

    // Deduct each ingredient
    for (const item of recipe) {
      const totalNeeded = item.quantity_needed * qty;
      const previousStock = item.ingredients.stock_quantity;
      const newStock = previousStock - totalNeeded;

      // Update ingredient stock
      await supabase
        .from('ingredients')
        .update({
          stock_quantity: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.ingredient_id);

      // Log ingredient movement
      await supabase
        .from('ingredient_movements')
        .insert({
          ingredient_id: item.ingredient_id,
          store_id: item.ingredients.store_id,
          movement_type: 'usage',
          quantity: totalNeeded,
          previous_stock: previousStock,
          new_stock: newStock,
          reference_type: 'manufacturing',
          notes: `Used in manufacturing ${qty} units of ${product.name}${batch_number ? ` (Batch: ${batch_number})` : ''}`,
          created_by: userId
        });
    }

    // Record manufacturing
    const { data: manufacturing, error: mfgError } = await supabase
      .from('product_manufacturing')
      .insert({
        product_id: product_id,
        store_id: product.store_id,
        quantity_produced: qty,
        batch_number: batch_number || null,
        expiry_date: expiry_date || null,
        notes: notes || null,
        status: 'completed',
        created_by: userId
      })
      .select()
      .single();

    if (mfgError) throw mfgError;

    console.log('✅ Product manufactured successfully');

    res.json({
      message: `Successfully manufactured ${qty} units of ${product.name}`,
      manufacturing,
      product: {
        id: product.id,
        name: product.name,
        previous_stock: previousProductStock,
        new_stock: newProductStock,
        quantity_produced: qty
      },
      ingredients_used: recipe.map(item => ({
        name: item.ingredients.name,
        quantity: item.quantity_needed * qty,
        unit: item.unit
      }))
    });

  } catch (error) {
    console.error('Manufacture product error:', error);
    res.status(500).json({
      error: 'Failed to manufacture product',
      code: 'MANUFACTURING_ERROR'
    });
  }
}

// Get manufacturing history
async function getManufacturingHistory(req, res) {
  try {
    const companyId = req.user.company_id;
    const { product_id, store_id, limit = 50 } = req.query;
    const supabase = getSupabase();

    console.log('📊 Getting manufacturing history');

    // Get store IDs
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(s => s.id) || [];

    if (storeIds.length === 0) {
      return res.json({ history: [], count: 0 });
    }

    // Build query
    let query = supabase
      .from('product_manufacturing')
      .select(`
        *,
        products(id, name, sku, image_url)
      `, { count: 'exact' })
      .in('store_id', storeIds);

    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    const { data: history, error, count } = await query
      .order('production_date', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    console.log('✅ Manufacturing history found:', history?.length || 0);

    res.json({
      history: history || [],
      count: count || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get manufacturing history error:', error);
    res.status(500).json({
      error: 'Failed to fetch manufacturing history',
      code: 'HISTORY_ERROR'
    });
  }
}

module.exports = {
  checkManufacturingAvailability,
  manufactureProduct,
  getManufacturingHistory
};