export function getSupabaseEnv() {
  // Prefer Vite env at build/runtime
  const viteUrl = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) || undefined;
  const viteKey = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) || undefined;
  const vitePublishableKey = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || undefined;

  // Browser polyfill (window.process.env) fallback for static deployments
  const winEnv = (typeof window !== 'undefined' && (window as any)?.process?.env) || undefined;
  const winUrl = winEnv?.VITE_SUPABASE_URL || undefined;
  const winKey = winEnv?.VITE_SUPABASE_ANON_KEY || undefined;
  const winPublishableKey = winEnv?.VITE_SUPABASE_PUBLISHABLE_KEY || undefined;

  // Next.js-style env fallback (Node)
  const nextUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || undefined;
  const nextKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || undefined;
  const nextPublishableKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || undefined;

  const resolved = {
    VITE_SUPABASE_URL: viteUrl || winUrl || nextUrl || '',
    VITE_SUPABASE_ANON_KEY: viteKey || winKey || nextKey || '',
    VITE_SUPABASE_PUBLISHABLE_KEY: vitePublishableKey || winPublishableKey || nextPublishableKey || ''
  };

  // In production, required envs must be present; fail fast if missing
  const isProd = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.PROD) === true;
  if (isProd) {
    if (!resolved.VITE_SUPABASE_URL || (!resolved.VITE_SUPABASE_PUBLISHABLE_KEY && !resolved.VITE_SUPABASE_ANON_KEY)) {
      throw new Error('Supabase environment variables are not configured for production.');
    }
  }

  return resolved;
}

export function getKeyType(key: string): string {
  if (!key) return 'none';
  
  // Supabase publishable keys typically start with 'sb-' and contain 'publishable'
  if (key.includes('publishable') || key.startsWith('sb-')) {
    return 'publishable';
  }
  
  // Supabase anon keys are typically longer and start with 'eyJ'
  if (key.startsWith('eyJ')) {
    return 'anon';
  }
  
  return 'unknown';
}
