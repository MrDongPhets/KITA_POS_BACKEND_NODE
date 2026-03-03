const { getSupabase } = require('../../config/database');

async function getCompanies(req, res) {
  try {
    console.log('🏢 Fetching companies data...');
    
    const supabase = getSupabase();

    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('Failed to fetch companies:', companiesError.message);
      return res.status(500).json({
        error: 'Failed to fetch companies',
        code: 'DB_ERROR',
        details: companiesError.message
      });
    }

    console.log(`✅ Found ${companies?.length || 0} companies`);

    res.json({
      companies: companies || [],
      count: companies?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get companies error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error.message
    });
  }
}

module.exports = { getCompanies };