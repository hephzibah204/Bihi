// Fix: Removed Vite-specific type reference that was causing a "Cannot find type definition file" error.
// /// <reference types="vite/client" />

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

    // --- SECURE KEY LOGIC ---
    // These keys are now loaded from environment variables set in the execution environment.
    // For Vite, client-side environment variables must be prefixed with VITE_.
    // Fix: Switched from `import.meta.env` to `process.env` to resolve TypeScript errors and align with more standard environment variable access patterns in React projects.
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        // Log an error but don't throw, to prevent crashing the entire application.
        console.error("Supabase URL and Anon Key must be provided in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = initializeSupabaseClient();