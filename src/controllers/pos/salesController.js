const { getSupabase } = require('../../config/database');

// Create sale transaction
async function createSale(req, res) {
  try {
    const {
      store_id,
      items,
      payment_method,
      subtotal,
      discount_amount,
      discount_type,
      total_amount,
      customer_name,
      customer_phone,
      notes
    } = req.body;

    const companyId = req.user.company_id;
    const userId = req.user.id;
    const supabase = getSupabase();

    console.log('💳 Creating sale:', { 
      store_id, 
      items: items?.length, 
      total_amount,
      companyId,
      userId 
    });

    // Validate required fields
    if (!store_id || !items || items.length === 0 || !total_amount) {
      console.error('❌ Missing required fields:', { store_id, items: items?.length, total_amount });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate receipt number
    const receipt_number = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    console.log('📝 Creating sale record...');

    // Start transaction - Create sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        company_id: companyId,
        store_id,
        staff_id: null,
        total_amount,
        subtotal: subtotal || total_amount,
        discount_amount: discount_amount || 0,
        discount_type: discount_type || null,
        payment_method: payment_method || 'cash',
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
        receipt_number,
        items_count: items.reduce((sum, item) => sum + item.quantity, 0),
        notes: notes || null,
        created_by: userId
      })
      .select()
      .single();

    if (saleError) {
      console.error('❌ Sale creation error:', saleError);
      throw saleError;
    }

    console.log('✅ Sale created:', sale.id);
    console.log('📦 Inserting sale items...');

    // Insert sales items
    const salesItems = items.map(item => ({
      sales_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
      discount_amount: item.discount_amount || 0,
      discount_percent: item.discount_percent || 0,
      total_price: (item.price * item.quantity) - (item.discount_amount || 0),
      barcode: item.barcode || null
    }));

    const { error: itemsError } = await supabase
      .from('sales_items')
      .insert(salesItems);

    if (itemsError) {
      console.error('❌ Sales items error:', itemsError);
      throw itemsError;
    }

    console.log('✅ Sales items inserted');
    console.log('📊 Updating inventory...');

    // Update inventory for each item
    for (const item of items) {
      // Get current stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (productError) {
        console.error('❌ Product fetch error:', productError);
        throw productError;
      }

      const previous_stock = product.stock_quantity;
      const new_stock = previous_stock - item.quantity;

      console.log(`📦 Updating product ${item.product_id}: ${previous_stock} -> ${new_stock}`);

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: new_stock })
        .eq('id', item.product_id);

      if (updateError) {
        console.error('❌ Product update error:', updateError);
        throw updateError;
      }

      // Record inventory movement
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: item.product_id,
          store_id,
          movement_type: 'out',
          quantity: item.quantity,
          previous_stock,
          new_stock,
          reference_type: 'sale',
          reference_id: sale.id,
          notes: `Sale ${receipt_number}`,
          created_by: userId
        });

      if (movementError) {
        console.error('❌ Inventory movement error:', movementError);
        // Don't throw here, inventory movement is not critical
      }
    }

    console.log('✅ Sale completed:', receipt_number);

    res.status(201).json({
      sale,
      receipt_number,
      message: 'Sale completed successfully'
    });

  } catch (error) {
    console.error('💥 Create sale error:', error);
    res.status(500).json({ 
      error: 'Failed to create sale',
      details: error.message,
      code: error.code
    });
  }
}

// Get sale by receipt number
async function getSaleByReceipt(req, res) {
  try {
    const { receipt_number } = req.params;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    const { data: sale, error } = await supabase
      .from('sales')
      .select(`
        *,
        sales_items(
          *,
          products(name, sku, image_url)
        )
      `)
      .eq('company_id', companyId)
      .eq('receipt_number', receipt_number)
      .single();

    if (error || !sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
}

// Get today's sales
async function getTodaySales(req, res) {
  try {
    const { store_id } = req.query;
    const companyId = req.user.company_id;
    const supabase = getSupabase();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('company_id', companyId)
      .eq('store_id', store_id)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = sales?.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0) || 0;

    res.json({
      sales: sales || [],
      count: sales?.length || 0,
      total
    });
  } catch (error) {
    console.error('Get today sales error:', error);
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
}

module.exports = {
  createSale,
  getSaleByReceipt,
  getTodaySales
};