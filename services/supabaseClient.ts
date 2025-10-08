// services/supabaseClient.ts

// This reference helps TypeScript understand Vite's `import.meta.env`
// Fix: The `vite/client` type definitions are not available in this environment, causing an error.
// The reference is commented out and replaced with a manual type declaration below.
// /// <reference types="vite/client" />

// Declare the global 'process' object to prevent TypeScript errors in environments
// where it might not be defined by default (like a strict browser context).
declare var process: {
  env: {
    [key: string]: string | undefined;
  }
};

// Declare the 'supabase' property on the global Window interface for the CDN script.
declare global {
  interface Window {
    supabase: any;
  }

  // Fix: Manually define the ImportMeta and ImportMetaEnv interfaces to include
  // Vite's `env` property. This resolves errors when the `vite/client` type
  // definitions are not available in the project's configuration.
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    // Fix: Add optional properties for non-prefixed env vars to satisfy the type checker.
    readonly SUPABASE_URL?: string;
    readonly SUPABASE_ANON_KEY?: string;
    // Add other environment variables here if needed
    [key: string]: any;
  }
}

function initializeSupabaseClient() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
        console.warn("Supabase client is not available on `window`. Supabase features will be disabled.");
        return null;
    }

    const { createClient } = window.supabase;

    // --- UNIVERSAL KEY LOGIC ---
    // This logic is now more robust, checking for multiple common naming conventions for env vars.
    // Fix: Fallback to `undefined` instead of `{}` to avoid type errors when accessing properties
    // on what could be an empty object. Optional chaining now works as expected.
    const envSource1 = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
    const envSource2 = typeof process !== 'undefined' ? process.env : undefined;

    const supabaseUrl = envSource1?.VITE_SUPABASE_URL || envSource2?.VITE_SUPABASE_URL || envSource1?.SUPABASE_URL || envSource2?.SUPABASE_URL;
    const supabaseAnonKey = envSource1?.VITE_SUPABASE_ANON_KEY || envSource2?.VITE_SUPABASE_ANON_KEY || envSource1?.SUPABASE_ANON_KEY || envSource2?.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("Supabase URL and Anon Key must be provided in environment variables.");
        return null;
    }

    return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = initializeSupabaseClient();