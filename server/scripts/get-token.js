/**
 * Get Supabase Auth Token
 *
 * Run this script to get a JWT token for testing:
 * node scripts/get-token.js
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials - remove /rest/v1/ from URL
const SUPABASE_URL = 'https://wrariwcldbquapbwvrgg.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYXJpd2NsZGJxdWFwYnd2cmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDA4NTMsImV4cCI6MjA4MTQxNjg1M30.Cy94Xf8R6w34_qvJF2v_dR2YN0w_T3aALWs-TFkUHIQ';

// Test user credentials
const TEST_EMAIL = 'mf.farhanahzan@gmail.com';
const TEST_PASSWORD = 'mf.farhanahzan@gmail.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getToken() {
  console.log('🔐 Signing in to Supabase...\n');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.error('❌ Error:', error.message);
    console.log('\nIf the user does not exist, create one in Supabase Dashboard:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Authentication > Users');
    console.log('4. Click "Add User" and create the user');
    return;
  }

  console.log('✅ Successfully signed in!\n');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  console.log('\n' + '='.repeat(80));
  console.log('AUTH TOKEN (copy this to Postman):');
  console.log('='.repeat(80) + '\n');
  console.log(data.session.access_token);
  console.log('\n' + '='.repeat(80));
  console.log('\nToken expires at:', new Date(data.session.expires_at * 1000).toISOString());
}

getToken();
