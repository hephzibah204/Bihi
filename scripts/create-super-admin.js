// scripts/create-super-admin.js
// Run this script once to create a Super Admin user for development

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createSuperAdmin() {
  console.log('\n🔐 Super Admin Setup\n');
  
  // Get Supabase credentials
  const supabaseUrl = await question('Enter your Supabase URL: ');
  const supabaseServiceKey = await question('Enter your Supabase SERVICE ROLE key (not anon key): ');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    rl.close();
    return;
  }
  
  // Initialize Supabase client with service role key (can create users)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Get admin credentials
  const email = await question('\nEnter Super Admin email: ');
  const password = await question('Enter Super Admin password: ');
  
  if (!email || !password) {
    console.error('❌ Missing email or password');
    rl.close();
    return;
  }
  
  try {
    console.log('\n⏳ Creating Super Admin user...');
    
    // Create the user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'Super Admin',
        is_super_admin: true
      }
    });
    
    if (error) {
      console.error('❌ Error creating user:', error.message);
      rl.close();
      return;
    }
    
    console.log('\n✅ Super Admin user created successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🌐 Login at: /controlhub');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
  
  rl.close();
}

createSuperAdmin().catch(console.error);
