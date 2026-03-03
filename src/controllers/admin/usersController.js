const { getSupabase } = require('../../config/database');

async function getUsers(req, res) {
  try {
    const supabase = getSupabase();

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch users:', error.message);
      return res.status(500).json({
        error: 'Failed to fetch users',
        code: 'DB_ERROR'
      });
    }

    res.json({
      users: users || [],
      count: users?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

module.exports = { getUsers };