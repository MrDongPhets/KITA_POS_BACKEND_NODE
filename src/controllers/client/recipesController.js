// src/controllers/client/recipesController.js
const { getSupabase } = require('../../config/database');

// Get recipe for a product
async function getProductRecipe(req, res) {
  try {
    const { product_id } = req.params;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📝 Getting recipe for product:', product_id);

    // Verify product belongs to company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(s => s.id) || [];

    const { data: product } = await supabase
      .from('products')
      .select('id, store_id, is_composite')
      .eq('id', product_id)
      .in('store_id', storeIds)
      .single();

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Get recipe
    const { data: recipe, error } = await supabase
      .from('product_recipes')
      .select(`
        *,
        ingredients(id, name, unit, unit_cost, stock_quantity, sku)
      `)
      .eq('product_id', product_id)
      .order('created_at');

    if (error) throw error;

    // Calculate total recipe cost
    const totalCost = recipe?.reduce((sum, item) => {
      const ingredientCost = (item.ingredients?.unit_cost || 0) * item.quantity_needed;
      return sum + ingredientCost;
    }, 0) || 0;

    console.log('✅ Recipe found with', recipe?.length || 0, 'ingredients');

    res.json({
      recipe: recipe || [],
      total_cost: parseFloat(totalCost.toFixed(4)),
      is_composite: product.is_composite || false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({
      error: 'Failed to fetch recipe',
      code: 'RECIPE_ERROR'
    });
  }
}

// Create or update product recipe
async function saveProductRecipe(req, res) {
  try {
    const { product_id } = req.params;
    const { ingredients } = req.body;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('📝 Saving recipe for product:', product_id);

    // Verify product belongs to company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(s => s.id) || [];

    const { data: product } = await supabase
      .from('products')
      .select('id, store_id')
      .eq('id', product_id)
      .in('store_id', storeIds)
      .single();

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Validate ingredients array
    if (ingredients && !Array.isArray(ingredients)) {
      return res.status(400).json({
        error: 'Ingredients must be an array',
        code: 'INVALID_INPUT'
      });
    }

    // Delete existing recipe items
    await supabase
      .from('product_recipes')
      .delete()
      .eq('product_id', product_id);

    let recipeCost = 0;

    // Insert new recipe items if provided
    if (ingredients && ingredients.length > 0) {
      // Validate all ingredients
      for (const item of ingredients) {
        if (!item.ingredient_id || !item.quantity_needed || !item.unit) {
          return res.status(400).json({
            error: 'Each ingredient must have ingredient_id, quantity_needed, and unit',
            code: 'INVALID_INGREDIENT'
          });
        }
      }

      const recipeItems = ingredients.map(item => ({
        product_id,
        ingredient_id: item.ingredient_id,
        quantity_needed: parseFloat(item.quantity_needed),
        unit: item.unit,
        notes: item.notes || null
      }));

      const { error: insertError } = await supabase
        .from('product_recipes')
        .insert(recipeItems);

      if (insertError) throw insertError;

      // Calculate recipe cost
      const { data: fullRecipe } = await supabase
        .from('product_recipes')
        .select(`
          quantity_needed,
          ingredients(unit_cost)
        `)
        .eq('product_id', product_id);

      recipeCost = fullRecipe?.reduce((sum, item) => {
        return sum + (item.quantity_needed * (item.ingredients?.unit_cost || 0));
      }, 0) || 0;

      // Update product as composite
      await supabase
        .from('products')
        .update({
          is_composite: true,
          recipe_cost: parseFloat(recipeCost.toFixed(4)),
          updated_at: new Date().toISOString()
        })
        .eq('id', product_id);

      console.log('✅ Recipe saved with', ingredients.length, 'ingredients');
    } else {
      // No ingredients, mark as non-composite
      await supabase
        .from('products')
        .update({
          is_composite: false,
          recipe_cost: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', product_id);

      console.log('✅ Recipe cleared, product marked as non-composite');
    }

    res.json({
      message: 'Recipe saved successfully',
      recipe_cost: parseFloat(recipeCost.toFixed(4)),
      ingredient_count: ingredients?.length || 0
    });

  } catch (error) {
    console.error('Save recipe error:', error);
    res.status(500).json({
      error: 'Failed to save recipe',
      code: 'SAVE_ERROR'
    });
  }
}

// Check if product can be made (sufficient ingredients)
async function checkRecipeAvailability(req, res) {
  try {
    const { product_id } = req.params;
    const { quantity } = req.query;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    console.log('🔍 Checking recipe availability for product:', product_id);

    // Verify product belongs to company
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    const storeIds = stores?.map(s => s.id) || [];

    const { data: product } = await supabase
      .from('products')
      .select('id, store_id, name, is_composite')
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
      return res.json({
        can_make: true,
        availability: [],
        message: 'Product is not a composite product'
      });
    }

    // Get recipe with ingredient stock
    const { data: recipe } = await supabase
      .from('product_recipes')
      .select(`
        *,
        ingredients(id, name, stock_quantity, unit)
      `)
      .eq('product_id', product_id);

    if (!recipe || recipe.length === 0) {
      return res.json({
        can_make: false,
        availability: [],
        message: 'No recipe defined for this product'
      });
    }

    const qty = parseFloat(quantity || 1);

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

    const canMake = availability.every(item => item.sufficient);
    const maxCanMake = Math.min(
      ...availability.map(item => 
        Math.floor(item.available / (item.needed / qty))
      )
    );

    console.log('✅ Availability checked:', canMake ? 'Can make' : 'Cannot make');

    res.json({
      can_make: canMake,
      max_quantity: maxCanMake,
      requested_quantity: qty,
      availability,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({
      error: 'Failed to check availability',
      code: 'AVAILABILITY_ERROR'
    });
  }
}

module.exports = {
  getProductRecipe,
  saveProductRecipe,
  checkRecipeAvailability
};