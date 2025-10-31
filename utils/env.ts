export function getSupabaseEnv() {
  const viteUrl = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) || undefined;
  const viteKey = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) || undefined;
  const vitePublishableKey = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_PUBLISHABLE_KEY) || undefined;

  const nextUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || undefined;
  const nextKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || undefined;
  const nextPublishableKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) || undefined;

  return {
    VITE_SUPABASE_URL: viteUrl || nextUrl || '',
    VITE_SUPABASE_ANON_KEY: viteKey || nextKey || '',
    VITE_SUPABASE_PUBLISHABLE_KEY: vitePublishableKey || nextPublishableKey || ''
  };
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
