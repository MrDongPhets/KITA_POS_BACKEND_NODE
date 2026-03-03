const bcrypt = require('bcryptjs');
const { getSupabase } = require('../config/database');
const { DEMO_CREDENTIALS, BCRYPT_ROUNDS } = require('../config/constants');

async function ensureDemoData() {
  try {
    console.log('📄 Ensuring demo data exists...');

    await ensureSuperAdmin();
    await ensureDemoCompanyAndUser();

    console.log('🎉 Demo data verification completed');

  } catch (error) {
    console.error('Demo data error:', error.message);
  }
}

async function ensureSuperAdmin() {
  const supabase = getSupabase();
  
  const { data: existingSuperAdmin } = await supabase
    .from('super_admins')
    .select('id, email')
    .eq('email', DEMO_CREDENTIALS.SUPER_ADMIN.email)
    .single();

  if (!existingSuperAdmin) {
    console.log('👑 Creating demo super admin...');
    
    const hashedPassword = await bcrypt.hash(DEMO_CREDENTIALS.SUPER_ADMIN.password, BCRYPT_ROUNDS);
    
    const { error: superAdminError } = await supabase
      .from('super_admins')
      .insert([{
        email: DEMO_CREDENTIALS.SUPER_ADMIN.email,
        password: hashedPassword,
        name: 'System Administrator',
        phone: '+1-555-000-0001',
        is_active: true,
        permissions: {
          view_analytics: true,
          system_settings: true,
          manage_companies: true,
          manage_subscriptions: true
        }
      }]);

    if (superAdminError) {
      console.error('Failed to create super admin:', superAdminError.message);
    } else {
      console.log('✅ Demo super admin created');
    }
  } else {
    console.log('ℹ️ Super admin already exists');
  }
}

async function ensureDemoCompanyAndUser() {
  const supabase = getSupabase();
  
  // First ensure company exists
  let { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('name', 'Demo Bakery')
    .single();

  if (!company) {
    console.log('🏢 Creating demo company...');
    
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert([{
        name: 'Demo Bakery',
        description: 'A demo bakery for testing the POS system',
        contact_email: 'contact@demobakery.com',
        contact_phone: '+1-555-BAKERY',
        address: '123 Bakery Street, Sweet City, SC 12345',
        website: 'https://demobakery.com',
        is_active: true,
        settings: {}
      }])
      .select()
      .single();

    if (companyError) {
      console.error('Failed to create company:', companyError.message);
      return;
    } else {
      company = newCompany;
      console.log('✅ Demo company created');
    }
  } else {
    console.log('ℹ️ Demo company already exists');
  }

  // Now ensure demo user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, email, company_id, is_active')
    .eq('email', DEMO_CREDENTIALS.BUSINESS_USER.email)
    .single();

  if (!existingUser) {
    console.log('👤 Creating demo user...');

    const hashedPassword = await bcrypt.hash(DEMO_CREDENTIALS.BUSINESS_USER.password, BCRYPT_ROUNDS);
    
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        email: DEMO_CREDENTIALS.BUSINESS_USER.email,
        password: hashedPassword,
        name: 'Demo Manager',
        role: 'manager',
        phone: '+1-555-0101',
        company_id: company.id,
        is_active: true
      }])
      .select()
      .single();

    if (userError) {
      console.error('Failed to create user:', userError.message);
    } else {
      console.log('✅ Demo user created');
      console.log(`   📧 Email: ${DEMO_CREDENTIALS.BUSINESS_USER.email}`);
      console.log(`   🔑 Password: ${DEMO_CREDENTIALS.BUSINESS_USER.password}`);
    }
  } else {
    console.log('ℹ️ Demo user already exists');
    
    // Verify the password works
    const { data: userData } = await supabase
      .from('users')
      .select('password')
      .eq('id', existingUser.id)
      .single();

    if (userData?.password) {
      const passwordWorks = await bcrypt.compare(DEMO_CREDENTIALS.BUSINESS_USER.password, userData.password);
      if (!passwordWorks) {
        console.log('🔧 Fixing demo user password...');
        
        const hashedPassword = await bcrypt.hash(DEMO_CREDENTIALS.BUSINESS_USER.password, BCRYPT_ROUNDS);
        await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', existingUser.id);
        
        console.log('✅ Demo user password fixed');
      }
    }
    
    console.log(`   📧 Email: ${DEMO_CREDENTIALS.BUSINESS_USER.email}`);
    console.log(`   🔑 Password: ${DEMO_CREDENTIALS.BUSINESS_USER.password}`);
  }

  // Create subscription if needed
  if (company.id) {
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('company_id', company.id)
      .single();

    if (!existingSubscription) {
      console.log('💳 Creating demo subscription...');
      
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 14);

      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert([{
          company_id: company.id,
          plan_name: 'trial',
          plan_type: 'monthly',
          status: 'active',
          price_amount: 0,
          currency: 'USD',
          max_users: 5,
          max_stores: 1,
          max_products: 100,
          features: {
            pos: true,
            reports: false,
            inventory: true,
            multi_store: false
          },
          trial_ends_at: trialEndDate.toISOString(),
          current_period_end: trialEndDate.toISOString()
        }]);

      if (subscriptionError) {
        console.log('Warning: Failed to create subscription:', subscriptionError.message);
      } else {
        console.log('✅ Demo subscription created');
      }
    }
  }
}

module.exports = { ensureDemoData };