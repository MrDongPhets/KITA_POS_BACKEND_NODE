const bcrypt = require('bcryptjs');
const { getSupabase } = require('../../config/database');
const { BCRYPT_ROUNDS } = require('../../config/constants');

async function registerCompany(req, res) {
  try {
    const { company, user, subscription } = req.body;

    console.log(`🏢 Company registration: ${company?.name}`);

    if (!company?.name || !company?.email || !user?.name || !user?.email || !user?.password) {
      return res.status(400).json({ 
        error: 'Company name, email, user name, email and password are required',
        code: 'MISSING_FIELDS'
      });
    }

    const supabase = getSupabase();

    // Check existing company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('contact_email', company.email.toLowerCase())
      .single();

    if (existingCompany) {
      return res.status(409).json({
        error: 'Company with this email already exists',
        code: 'COMPANY_EXISTS'
      });
    }

    // Check existing user
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
    }

    const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

    // Create company
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert([{
        name: company.name.trim(),
        description: company.description || `Business using POS system`,
        contact_email: company.email.toLowerCase().trim(),
        contact_phone: company.phone || null,
        address: company.address || null,
        website: company.website || null,
        is_active: true,
        settings: {}
      }])
      .select()
      .single();

    if (companyError) {
      console.error('Failed to create company:', companyError.message);
      return res.status(400).json({
        error: 'Failed to create company: ' + companyError.message,
        code: 'COMPANY_CREATE_ERROR'
      });
    }

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        email: user.email.toLowerCase().trim(),
        password: hashedPassword,
        name: user.name.trim(),
        role: 'manager',
        phone: user.phone || null,
        company_id: newCompany.id,
        is_active: true
      }])
      .select('id, email, name, role, phone, company_id, is_active, created_at')
      .single();

    if (userError) {
      console.error('Failed to create user:', userError.message);
      return res.status(400).json({
        error: 'Failed to create user account: ' + userError.message,
        code: 'USER_CREATE_ERROR'
      });
    }

    console.log(`✅ Company registered: ${newCompany.name} with user: ${newUser.email}`);

    res.status(201).json({
      success: true,
      message: 'Company registered successfully',
      company: newCompany,
      user: newUser
    });

  } catch (error) {
    console.error('❌ Company registration error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error during registration',
      code: 'INTERNAL_ERROR'
    });
  }
}

module.exports = { registerCompany };