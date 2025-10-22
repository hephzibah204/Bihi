// Test script to check Supabase connection
import { initSupabase, isSupabaseOnline } from './services/supabaseClient.ts';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Initialize Supabase
    const supabase = await initSupabase();
    
    console.log('📊 Supabase initialization status:', supabase._offline ? '❌ OFFLINE' : '✅ ONLINE');
    
    // Test connection
    const isOnline = await isSupabaseOnline();
    console.log('🌐 Supabase online status:', isOnline ? '✅ CONNECTED' : '❌ DISCONNECTED');
    
    if (!isOnline) {
      console.log('\n🔧 Configuration needed:');
      console.log('1. Create a Supabase project at https://supabase.com');
      console.log('2. Get your project URL and API keys');
      console.log('3. Add these to your .env.local file:');
      console.log('   VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here');
      console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key_here');
      console.log('4. Restart the development server');
    }
    
    return isOnline;
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error.message);
    return false;
  }
}

// Run the test
testSupabaseConnection().then(isConnected => {
  console.log('\n' + '='.repeat(50));
  console.log(isConnected ? '🎉 Supabase connection successful!' : '⚠️  Supabase connection failed');
  console.log('='.repeat(50));
});