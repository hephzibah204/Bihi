export function getSupabaseEnv() {
  const viteUrl = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_URL) || undefined;
  const viteKey = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY) || undefined;

  const nextUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || undefined;
  const nextKey = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || undefined;

  return {
    VITE_SUPABASE_URL: viteUrl || nextUrl || '',
    VITE_SUPABASE_ANON_KEY: viteKey || nextKey || ''
  };
}
