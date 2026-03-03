// src/controllers/reports/financialReportsController.js
const { getSupabase } = require('../../config/database');

// Get financial summary
async function getFinancialReports(req, res) {
  try {
    const companyId = req.user.company_id;
    const { store_id, start_date, end_date } = req.query;
    const supabase = getSupabase();

    console.log('📊 Getting financial reports for company:', companyId);

    // Get stores
    let storesQuery = supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    if (store_id) {
      storesQuery = storesQuery.eq('id', store_id);
    }

    const { data: stores } = await storesQuery;
    const storeIds = stores?.map(s => s.id) || [];

    if (storeIds.length === 0) {
      return res.json({ summary: {}, timestamp: new Date().toISOString() });
    }

    // Get sales with filters
    let salesQuery = supabase
      .from('sales')
      .select('id, total_amount, subtotal, discount_amount, tax_amount, created_at')
      .eq('company_id', companyId);

    if (store_id) {
      salesQuery = salesQuery.eq('store_id', store_id);
    } else {
      salesQuery = salesQuery.in('store_id', storeIds);
    }

    if (start_date) {
      salesQuery = salesQuery.gte('created_at', start_date);
    }

    if (end_date) {
      salesQuery = salesQuery.lte('created_at', end_date);
    }

    const { data: sales, error: salesError } = await salesQuery;

    if (salesError) throw salesError;

    const salesIds = sales.map(s => s.id);

    // Get sales items to calculate COGS (use default_price * 0.7 as estimated cost)
    let cogs = 0;
    if (salesIds.length > 0) {
      const { data: salesItems, error: itemsError } = await supabase
        .from('sales_items')
        .select('quantity, unit_price')
        .in('sales_id', salesIds);

      if (itemsError) throw itemsError;

      // Estimate COGS as 70% of sales price (you can adjust this multiplier)
      cogs = salesItems.reduce((sum, item) => {
        return sum + (item.unit_price * 0.7 * item.quantity);
      }, 0);
    }

    // Calculate financial metrics
    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
    const totalDiscount = sales.reduce((sum, s) => sum + parseFloat(s.discount_amount || 0), 0);
    const totalTax = sales.reduce((sum, s) => sum + parseFloat(s.tax_amount || 0), 0);
    const grossProfit = totalRevenue - cogs;
    const netProfit = grossProfit - totalDiscount;

    const summary = {
      total_revenue: parseFloat(totalRevenue.toFixed(2)),
      total_cogs: parseFloat(cogs.toFixed(2)),
      gross_profit: parseFloat(grossProfit.toFixed(2)),
      gross_margin: totalRevenue > 0 ? parseFloat(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0,
      total_discount: parseFloat(totalDiscount.toFixed(2)),
      total_tax: parseFloat(totalTax.toFixed(2)),
      net_profit: parseFloat(netProfit.toFixed(2)),
      net_margin: totalRevenue > 0 ? parseFloat(((netProfit / totalRevenue) * 100).toFixed(2)) : 0,
      total_transactions: sales.length
    };

    console.log('✅ Financial summary calculated');

    res.json({
      summary,
      filters: { store_id, start_date, end_date },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Financial reports error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch financial reports',
      code: 'FINANCIAL_REPORTS_ERROR'
    });
  }
}

// Get profit margins by product/category
async function getProfitMargins(req, res) {
  try {
    const companyId = req.user.company_id;
    const { store_id, start_date, end_date, group_by = 'product' } = req.query;
    const supabase = getSupabase();

    console.log('📊 Getting profit margins grouped by:', group_by);

    // Get stores
    let storesQuery = supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    if (store_id) {
      storesQuery = storesQuery.eq('id', store_id);
    }

    const { data: stores } = await storesQuery;
    const storeIds = stores?.map(s => s.id) || [];

    if (storeIds.length === 0) {
      return res.json({ items: [], timestamp: new Date().toISOString() });
    }

    // Get sales
    let salesQuery = supabase
      .from('sales')
      .select('id, created_at')
      .eq('company_id', companyId);

    if (store_id) {
      salesQuery = salesQuery.eq('store_id', store_id);
    } else {
      salesQuery = salesQuery.in('store_id', storeIds);
    }

    if (start_date) {
      salesQuery = salesQuery.gte('created_at', start_date);
    }

    if (end_date) {
      salesQuery = salesQuery.lte('created_at', end_date);
    }

    const { data: sales, error: salesError } = await salesQuery;

    if (salesError) throw salesError;

    const salesIds = sales.map(s => s.id);

    if (salesIds.length === 0) {
      return res.json({ items: [], timestamp: new Date().toISOString() });
    }

    // Get sales items with product details
    const { data: salesItems, error: itemsError } = await supabase
      .from('sales_items')
      .select(`
        quantity,
        unit_price,
        total_price,
        discount_amount,
        product_id,
        products!sales_items_product_id_fkey(
          id, 
          name, 
          sku, 
          default_price,
          category_id,
          categories!fk_products_category(id, name, color)
        )
      `)
      .in('sales_id', salesIds);

    if (itemsError) throw itemsError;

    // Group data
    const grouped = {};

    salesItems.forEach(item => {
      let key, name, groupId;

      if (group_by === 'category') {
        groupId = item.products?.category_id || 'uncategorized';
        name = item.products?.categories?.name || 'Uncategorized';
        key = groupId;
      } else {
        groupId = item.product_id;
        name = item.products?.name || 'Unknown Product';
        key = groupId;
      }

      if (!grouped[key]) {
        grouped[key] = {
          id: groupId,
          name: name,
          total_revenue: 0,
          total_cogs: 0,
          total_quantity: 0,
          total_discount: 0
        };

        if (group_by === 'category') {
          grouped[key].color = item.products?.categories?.color;
        } else {
          grouped[key].sku = item.products?.sku;
        }
      }

      // Estimate cost as 70% of unit price
      const estimatedCost = item.unit_price * 0.7;
      const quantity = parseInt(item.quantity);
      const revenue = parseFloat(item.total_price);
      const cogs = estimatedCost * quantity;

      grouped[key].total_revenue += revenue;
      grouped[key].total_cogs += cogs;
      grouped[key].total_quantity += quantity;
      grouped[key].total_discount += parseFloat(item.discount_amount || 0);
    });

    // Calculate margins
    const items = Object.values(grouped).map(item => {
      const grossProfit = item.total_revenue - item.total_cogs;
      const grossMargin = item.total_revenue > 0 
        ? (grossProfit / item.total_revenue) * 100 
        : 0;
      
      const netProfit = grossProfit - item.total_discount;
      const netMargin = item.total_revenue > 0 
        ? (netProfit / item.total_revenue) * 100 
        : 0;

      return {
        ...item,
        gross_profit: parseFloat(grossProfit.toFixed(2)),
        gross_margin: parseFloat(grossMargin.toFixed(2)),
        net_profit: parseFloat(netProfit.toFixed(2)),
        net_margin: parseFloat(netMargin.toFixed(2)),
        average_selling_price: item.total_quantity > 0 
          ? parseFloat((item.total_revenue / item.total_quantity).toFixed(2))
          : 0
      };
    }).sort((a, b) => b.gross_profit - a.gross_profit);

    console.log('✅ Profit margins calculated');

    res.json({
      items,
      group_by,
      filters: { store_id, start_date, end_date },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Profit margins error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate profit margins',
      code: 'PROFIT_MARGINS_ERROR'
    });
  }
}

// Get expense tracking (from inventory movements - purchases)
async function getExpenseTracking(req, res) {
  try {
    const companyId = req.user.company_id;
    const { store_id, start_date, end_date } = req.query;
    const supabase = getSupabase();

    console.log('📊 Getting expense tracking');

    // Get stores
    let storesQuery = supabase
      .from('stores')
      .select('id')
      .eq('company_id', companyId);

    if (store_id) {
      storesQuery = storesQuery.eq('id', store_id);
    }

    const { data: stores } = await storesQuery;
    const storeIds = stores?.map(s => s.id) || [];

    if (storeIds.length === 0) {
      return res.json({ expenses: [], summary: {}, timestamp: new Date().toISOString() });
    }

    // Get inventory movements (purchases = 'in' type)
    let query = supabase
      .from('inventory_movements')
      .select(`
        id,
        movement_type,
        quantity,
        unit_cost,
        total_cost,
        reference_type,
        notes,
        created_at,
        products!fk_inventory_product(id, name, sku, category_id)
      `)
      .in('store_id', storeIds)
      .eq('movement_type', 'in');

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: movements, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate summary
    const summary = {
      total_expenses: movements.reduce((sum, m) => sum + parseFloat(m.total_cost || 0), 0),
      total_transactions: movements.length,
      total_items: movements.reduce((sum, m) => sum + parseInt(m.quantity || 0), 0),
      average_cost_per_transaction: movements.length > 0 
        ? movements.reduce((sum, m) => sum + parseFloat(m.total_cost || 0), 0) / movements.length 
        : 0
    };

    // Group by category for breakdown
    const byCategory = {};
    movements.forEach(movement => {
      const categoryId = movement.products?.category_id || 'uncategorized';
      
      if (!byCategory[categoryId]) {
        byCategory[categoryId] = {
          total_cost: 0,
          count: 0
        };
      }
      
      byCategory[categoryId].total_cost += parseFloat(movement.total_cost || 0);
      byCategory[categoryId].count += 1;
    });

    console.log('✅ Expense tracking calculated');

    res.json({
      expenses: movements.map(m => ({
        ...m,
        product_name: m.products?.name,
        product_sku: m.products?.sku
      })),
      summary,
      by_category: byCategory,
      filters: { store_id, start_date, end_date },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Expense tracking error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch expense tracking',
      code: 'EXPENSE_TRACKING_ERROR'
    });
  }
}

// Get tax reports
async function getTaxReports(req, res) {
  try {
    const companyId = req.user.company_id;
    const { store_id, start_date, end_date, group_by = 'daily' } = req.query;
    const supabase = getSupabase();

    console.log('📊 Getting tax reports');

    // Build sales query
    let query = supabase
      .from('sales')
      .select('created_at, total_amount, subtotal, tax_amount, payment_method')
      .eq('company_id', companyId);

    if (store_id) {
      query = query.eq('store_id', store_id);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: sales, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    // Group by period
    const grouped = {};

    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      let key;

      switch (group_by) {
        case 'daily':
          key = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          total_sales: 0,
          total_tax: 0,
          transaction_count: 0
        };
      }

      grouped[key].total_sales += parseFloat(sale.total_amount || 0);
      grouped[key].total_tax += parseFloat(sale.tax_amount || 0);
      grouped[key].transaction_count += 1;
    });

    const taxData = Object.values(grouped);

    // Calculate summary
    const summary = {
      total_sales: sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0),
      total_tax_collected: sales.reduce((sum, s) => sum + parseFloat(s.tax_amount || 0), 0),
      total_transactions: sales.length,
      average_tax_per_transaction: sales.length > 0 
        ? sales.reduce((sum, s) => sum + parseFloat(s.tax_amount || 0), 0) / sales.length 
        : 0,
      effective_tax_rate: (() => {
        const totalSales = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
        const totalTax = sales.reduce((sum, s) => sum + parseFloat(s.tax_amount || 0), 0);
        return totalSales > 0 ? (totalTax / totalSales) * 100 : 0;
      })()
    };

    console.log('✅ Tax reports calculated');

    res.json({
      summary,
      data: taxData,
      group_by,
      filters: { store_id, start_date, end_date },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Tax reports error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tax reports',
      code: 'TAX_REPORTS_ERROR'
    });
  }
}

// Get revenue by store
async function getRevenueByStore(req, res) {
  try {
    const companyId = req.user.company_id;
    const { start_date, end_date } = req.query;
    const supabase = getSupabase();

    console.log('📊 Getting revenue by store');

    // Get all company stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, address')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (storesError) throw storesError;

    // Get sales for each store
    let query = supabase
      .from('sales')
      .select('store_id, total_amount, subtotal, discount_amount, tax_amount, items_count')
      .eq('company_id', companyId);

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    const { data: sales, error: salesError } = await query;

    if (salesError) throw salesError;

    // Group by store
    const storeRevenue = stores.map(store => {
      const storeSales = sales.filter(s => s.store_id === store.id);
      
      const totalRevenue = storeSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
      const totalDiscount = storeSales.reduce((sum, s) => sum + parseFloat(s.discount_amount || 0), 0);
      const totalTax = storeSales.reduce((sum, s) => sum + parseFloat(s.tax_amount || 0), 0);
      const transactionCount = storeSales.length;

      return {
        store_id: store.id,
        store_name: store.name,
        store_address: store.address,
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_discount: parseFloat(totalDiscount.toFixed(2)),
        total_tax: parseFloat(totalTax.toFixed(2)),
        transaction_count: transactionCount,
        average_transaction: transactionCount > 0 
          ? parseFloat((totalRevenue / transactionCount).toFixed(2))
          : 0,
        total_items_sold: storeSales.reduce((sum, s) => sum + parseInt(s.items_count || 0), 0)
      };
    }).sort((a, b) => b.total_revenue - a.total_revenue);

    // Calculate company totals
    const companyTotals = {
      total_revenue: storeRevenue.reduce((sum, s) => sum + s.total_revenue, 0),
      total_stores: stores.length,
      total_transactions: storeRevenue.reduce((sum, s) => sum + s.transaction_count, 0),
      average_revenue_per_store: stores.length > 0 
        ? storeRevenue.reduce((sum, s) => sum + s.total_revenue, 0) / stores.length 
        : 0
    };

    console.log('✅ Revenue by store calculated');

    res.json({
      stores: storeRevenue,
      company_totals: companyTotals,
      filters: { start_date, end_date },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Revenue by store error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch revenue by store',
      code: 'REVENUE_BY_STORE_ERROR'
    });
  }
}

module.exports = {
  getFinancialReports,
  getProfitMargins,
  getExpenseTracking,
  getTaxReports,
  getRevenueByStore
};