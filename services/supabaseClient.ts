// Fix: Augment the Window interface to declare the 'supabase' property.
declare global {
  interface Window {
    supabase: any;
  }
}

// Defensively initialize the client to prevent a crash if the Supabase CDN script hasn't loaded yet.
// This is a common race condition when using deferred scripts.
function initializeSupabaseClient() {
    // Check if the global supabase object and the createClient function are available.
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.warn("Supabase client is not available on `window`. Supabase features will be disabled.");
        return null;
    }

    const { createClient } = window.supabase;

    const supabaseUrl = process.env.SUPABASE_URL || 'https://plgpxrwyczjokxqwxwpp.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsZ3B4cnd5Y3pqb2t4cXd4d3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc0Njc3NTksImV4cCI6MjAwMzA0Mzc1OX0.i2o_pt8Sjs3u-eSn8tSC0e-Kj5V-K3sV3-Uou8-d_oQ';

    if (!supabaseUrl || !supabaseAnonKey) {
        // Log an error but don't throw, to prevent crashing the entire application.
        console.error("Supabase URL and Anon Key must be provided in environment variables.");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = initializeSupabaseClient();