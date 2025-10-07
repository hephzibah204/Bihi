// services/supabaseClient.ts

// Fix: Replaced the non-functional Vite client type reference with an explicit
// interface declaration for ImportMetaEnv. This resolves TypeScript errors
// by informing the compiler about the shape of `import.meta.env`, which is
// populated by Vite during the build process.
interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// Declare global types to inform TypeScript about CDN-loaded scripts.
declare global {
  // Declare the 'supabase' property on the global Window interface for the CDN script.
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

    // --- SECURE KEY LOGIC for VITE (Frontend) ---
    // These keys are loaded from environment variables using Vite's specific syntax.
    // In your Cloudflare Pages settings, these must be named VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        // Log an error but don't throw, to prevent crashing the entire application.
        // This error will be visible in the browser console.
        console.error("Supabase URL and Anon Key must be provided in environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = initializeSupabaseClient();