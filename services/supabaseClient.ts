// Fix: Removed Vite-specific triple-slash directive to resolve "Cannot find type definition" error.
// This project setup does not appear to include Vite client types.

// Declare the 'supabase' property on the global Window interface
// to inform TypeScript about the Supabase client loaded from the CDN script.
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
    // These keys are loaded from environment variables set in the Cloudflare Pages environment.
    // For Vite, client-side environment variables MUST be prefixed with VITE_.
    // Fix: Replaced `import.meta.env` with `process.env`, which is the standard way bundlers
    // like Vite or Create React App expose environment variables to client-side code. This
    // resolves the error that 'env' does not exist on 'ImportMeta'.
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    // Fix: Replaced `import.meta.env` with `process.env` to correctly access environment variables.
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        // Log an error but don't throw, to prevent crashing the entire application.
        // This error will be visible in the browser console.
        console.error("Supabase URL and Anon Key must be provided in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = initializeSupabaseClient();