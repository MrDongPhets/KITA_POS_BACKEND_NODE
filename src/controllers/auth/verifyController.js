const { getSupabase } = require('../../config/database');

async function verifyToken(req, res) {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;
    const supabase = getSupabase();

    if (userType === 'super_admin') {
      // Verify super admin still exists and is active
      const { data: admin, error } = await supabase
        .from('super_admins')
        .select('id, email, is_active')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !admin) {
        return res.status(401).json({
          error: 'Admin account not found or inactive',
          code: 'ADMIN_INACTIVE'
        });
      }
    } else {
      // Verify client user still exists and is active
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, is_active, company_id')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({
          error: 'User account not found or inactive',
          code: 'USER_INACTIVE'
        });
      }

      // Also verify company is still active
      if (user.company_id) {
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('id, is_active')
          .eq('id', user.company_id)
          .eq('is_active', true)
          .single();

        if (companyError || !company) {
          return res.status(401).json({
            error: 'Company account is inactive',
            code: 'COMPANY_INACTIVE'
          });
        }
      }
    }

    res.json({
      valid: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        userType: req.user.userType,
        role: req.user.role
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Token verification failed',
      code: 'VERIFICATION_ERROR'
    });
  }
}

function cleanup(req, res) {
  res.json({ 
    message: 'Session cleanup successful',
    code: 'CLEANUP_SUCCESS'
  });
}

module.exports = { verifyToken, cleanup };