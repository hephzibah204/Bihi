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

    // --- HYBRID KEY LOGIC ---
    // WARNING: THE FOLLOWING KEYS ARE HARDCODED FOR DEVELOPMENT/STAGING.
    // DO NOT COMMIT THIS TO A PUBLIC REPOSITORY.
    // IN PRODUCTION, THESE SHOULD BE SET AS ENVIRONMENT VARIABLES.
    const HARDCODED_URL = 'https://shzwolantavauszuxwlp.supabase.co';
    const HARDCODED_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoendvbGFudGF2YXVzenV4d2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTUxMTIsImV4cCI6MjA3MzE5MTExMn0.hu1qFjgKUvBKUDzYj1pjkCQX7Can9BQcyiNeYowzBPw';

    const supabaseUrl = process.env.SUPABASE_URL || HARDCODED_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || HARDCODED_ANON_KEY;

    if (supabaseUrl === HARDCODED_URL) {
        console.warn("--- SECURITY WARNING --- Using hardcoded Supabase URL. This is not recommended for production.");
    }
    if (supabaseAnonKey === HARDCODED_ANON_KEY) {
        console.warn("--- SECURITY WARNING --- Using hardcoded Supabase Anon Key. This is not recommended for production.");
    }

    if (!supabaseUrl || !supabaseAnonKey) {
        // Log an error but don't throw, to prevent crashing the entire application.
        console.error("Supabase URL and Anon Key must be provided in environment variables or hardcoded for fallback.");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = initializeSupabaseClient();
