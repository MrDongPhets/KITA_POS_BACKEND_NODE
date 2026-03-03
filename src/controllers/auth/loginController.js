const bcrypt = require('bcryptjs');
const { getSupabase } = require('../../config/database');
const { generateToken } = require('../../services/tokenService');

async function clientLogin(req, res) {
  try {
    const { email, password } = req.body;

    console.log(`🔐 Login attempt for: ${email}`);

    if (!email || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const supabase = getSupabase();

    // Find user
    console.log('🔍 Step 1: Finding user...');
    const { data: userCheck, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, password, is_active, company_id, name, role')
      .eq('email', email.toLowerCase())
      .single();

    if (userCheckError || !userCheck) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    console.log('✅ User found:', userCheck.email);

    if (!userCheck.is_active) {
      console.log('❌ User account is inactive');
      return res.status(401).json({ 
        error: 'Account is inactive',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    console.log('🔍 Step 2: Verifying password...');
    const isValidPassword = await bcrypt.compare(password, userCheck.password);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return res.status(401).json({ 
        error: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Get user with company info
    console.log('🔍 Step 3: Getting user with company...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        companies!inner(*)
      `)
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (userError) {
      console.log('❌ Error getting user with company:', userError.message);
      // If company join fails, still allow login but without company data
      const basicUser = { ...userCheck, companies: null };
      const token = generateToken(basicUser, 'client');
      const { password: _, ...userWithoutPassword } = basicUser;
      
      return res.json({
        message: 'Login successful (no company data)',
        user: userWithoutPassword,
        company: null,
        subscription: null,
        token,
        userType: 'client'
      });
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', user.company_id)
      .single();

    const token = generateToken(user, 'client');
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('✅ Login successful for:', user.email);

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      company: user.companies,
      subscription: subscription,
      token,
      userType: 'client'
    });

  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

async function superAdminLogin(req, res) {
  try {
    const { email, password } = req.body;

    console.log(`👑 Super admin login attempt: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    const supabase = getSupabase();

    const { data: admin, error } = await supabase
      .from('super_admins')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !admin) {
      console.log(`❌ Super admin not found: ${email}`);
      return res.status(401).json({ 
        error: 'Invalid admin credentials',
        code: 'INVALID_ADMIN_CREDENTIALS'
      });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      console.log(`❌ Invalid password for super admin ${email}`);
      return res.status(401).json({ 
        error: 'Invalid admin credentials',
        code: 'INVALID_ADMIN_CREDENTIALS'
      });
    }

    await supabase
      .from('super_admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    const token = generateToken(admin, 'super_admin');
    const { password: _, ...adminWithoutPassword } = admin;
    
    console.log(`✅ Super admin logged in: ${admin.email}`);

    res.json({
      message: 'Super admin login successful',
      user: adminWithoutPassword,
      token,
      userType: 'super_admin'
    });

  } catch (error) {
    console.error('Super admin login error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

function logout(req, res) {
  console.log('✅ Logout request processed');
  res.json({ 
    message: 'Logout successful',
    code: 'LOGOUT_SUCCESS'
  });
}

module.exports = {
  clientLogin,
  superAdminLogin,
  logout
};