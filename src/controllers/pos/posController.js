const { getSupabase } = require('../../config/database');

// Search products (with barcode support)
async function searchProducts(req, res) {
  try {
    const { query, store_id } = req.query;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(id, name, color, icon)
      `)
      .eq('store_id', store_id)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.eq.${query}`)
      .gt('stock_quantity', 0)
      .limit(20);

    if (error) throw error;

    res.json({ products: products || [] });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
}

// Get products by category
async function getProductsByCategory(req, res) {
  try {
    const { category_id, store_id } = req.query;
    const supabase = getSupabase();

    let query = supabase
      .from('products')
      .select(`
        *,
        categories(id, name, color, icon)
      `)
      .eq('store_id', store_id)
      .eq('is_active', true)
      .gt('stock_quantity', 0);

    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', category_id);
    }

    const { data: products, error } = await query.order('name');

    if (error) throw error;

    res.json({ products: products || [] });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

// Calculate pricing with discounts
async function calculatePrice(req, res) {
  try {
    const { items, discount_type, discount_value } = req.body;

    let subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount_amount = 0;

    if (discount_type === 'percentage') {
      discount_amount = (subtotal * discount_value) / 100;
    } else if (discount_type === 'fixed') {
      discount_amount = discount_value;
    }

    const total = subtotal - discount_amount;

    res.json({
      subtotal,
      discount_amount,
      total,
      items_count: items.reduce((sum, item) => sum + item.quantity, 0)
    });
  } catch (error) {
    console.error('Calculate price error:', error);
    res.status(500).json({ error: 'Failed to calculate price' });
  }
}

async function checkProductAvailability(req, res) {
  try {
    const { product_id, quantity } = req.query;
    const supabase = getSupabase();

    const { data: product } = await supabase
      .from('products')
      .select('id, name, is_composite, stock_quantity')
      .eq('id', product_id)
      .single();

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Simple product - check stock
    if (!product.is_composite) {
      const available = product.stock_quantity >= parseInt(quantity);
      return res.json({
        available,
        type: 'simple',
        stock: product.stock_quantity
      });
    }

    // Composite product - check ingredients
    const { data: recipe } = await supabase
      .from('product_recipes')
      .select(`
        *,
        ingredients(id, name, stock_quantity, unit)
      `)
      .eq('product_id', product_id);

    if (!recipe || recipe.length === 0) {
      return res.json({
        available: false,
        type: 'composite',
        message: 'No recipe defined'
      });
    }

    const qty = parseInt(quantity);
    const insufficient = [];

    for (const item of recipe) {
      const needed = item.quantity_needed * qty;
      const available = item.ingredients?.stock_quantity || 0;

      if (available < needed) {
        insufficient.push({
          name: item.ingredients?.name,
          needed,
          available,
          unit: item.unit
        });
      }
    }

    res.json({
      available: insufficient.length === 0,
      type: 'composite',
      insufficient_ingredients: insufficient
    });

  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
}

module.exports = {
  searchProducts,
  getProductsByCategory,
  calculatePrice,
  checkProductAvailability
};