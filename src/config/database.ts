import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function validateEnvVars(): boolean {
  console.log('🔍 Checking environment variables...');
  console.log('   Environment:', process.env.NODE_ENV || 'development');

  const required: Record<string, string | undefined> = {
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'JWT_SECRET': process.env.JWT_SECRET
  };

  const missing: string[] = [];

  Object.entries(required).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
      console.log(`   ❌ Missing: ${key}`);
    } else {
      console.log(`   ✅ ${key}: ${value.substring(0, 10)}...`);
    }
  });

  if (missing.length > 0) {
    console.error('   ❌ Missing required environment variables:', missing);
    return false;
  }

  console.log('   ✅ All environment variables validated');
  return true;
}

async function initializeDatabase(): Promise<boolean> {
  try {
    console.log('🔌 Initializing Supabase client...');

    if (!validateEnvVars()) {
      throw new Error('Environment validation failed - missing required variables');
    }

    const supabaseUrl = process.env.SUPABASE_URL as string;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

    console.log('📡 Supabase URL:', supabaseUrl);
    console.log('🔑 Service Key exists:', !!supabaseServiceKey);

    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Supabase client created');

    // Test connection
    const testResult = await testDatabaseConnection();

    if (testResult.success) {
      console.log('✅ Database connection verified');
      return true;
    } else {
      console.log('❌ Database connection failed:', testResult.error);
      throw new Error(`Database connection failed: ${testResult.error}`);
    }

  } catch (error) {
    const err = error as Error;
    console.error('❌ Failed to initialize Supabase:', err.message);
    console.error('Stack trace:', err.stack);
    return false;
  }
}

async function testDatabaseConnection(): Promise<{ success: boolean; error?: string; count?: number | null }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    console.log('🧪 Testing database connection...');

    const { data, error, count } = await supabase
      .from('companies')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      console.error('Database test failed:', error.message);
      return { success: false, error: error.message };
    }

    console.log(`✅ Database test successful - Found ${count || 0} companies`);
    return { success: true, count };

  } catch (error) {
    const err = error as Error;
    console.error('Database test exception:', err.message);
    return { success: false, error: err.message };
  }
}

function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Database not initialized');
  }
  return supabase;
}

export {
  initializeDatabase,
  getSupabase,
  testDatabaseConnection
};
