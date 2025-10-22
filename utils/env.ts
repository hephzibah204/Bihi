// utils/env.ts
// Environment variable validation and access

interface SupabaseEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
}

/**
 * Validates and returns Supabase environment variables
 * Throws error if required variables are missing
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = 
    (typeof window !== 'undefined' && window.process?.env?.VITE_SUPABASE_URL) ||
    import.meta.env?.VITE_SUPABASE_URL;

  if (!url) {
    throw new Error(
      '[Supabase] VITE_SUPABASE_URL is not configured. Please set it in your .env.local file.'
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    throw new Error(
      `[Supabase] VITE_SUPABASE_URL is not a valid URL: ${url}`
    );
  }

  const publishableKey =
    (typeof window !== 'undefined' && window.process?.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

  const anonKey =
    (typeof window !== 'undefined' && window.process?.env?.VITE_SUPABASE_ANON_KEY) ||
    import.meta.env?.VITE_SUPABASE_ANON_KEY;

  const key = publishableKey || anonKey;

  if (!key) {
    throw new Error(
      '[Supabase] Neither VITE_SUPABASE_PUBLISHABLE_KEY nor VITE_SUPABASE_ANON_KEY is configured. ' +
      'Please set one of them in your .env.local file.'
    );
  }

  return {
    VITE_SUPABASE_URL: url,
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    VITE_SUPABASE_ANON_KEY: anonKey,
  };
}

/**
 * Detects which key type is being used
 */
export function getKeyType(key: string): 'publishable' | 'anon' | 'unknown' {
  if (key.includes('publishable_')) return 'publishable';
  if (key.includes('anon')) return 'anon';
  return 'unknown';
}
