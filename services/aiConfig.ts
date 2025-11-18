import { getSupabase } from './supabaseClient';
import { getTenantId } from './api';

type Provider = 'gemini' | 'huggingface' | 'anthropic' | 'openrouter' | 'openai';

function readEnv(keys: string[]): string | undefined {
  for (const k of keys) {
    const v = (typeof import.meta !== 'undefined' ? (import.meta as any)?.env?.[k] : undefined) || (typeof process !== 'undefined' ? process.env?.[k] : undefined);
    if (v) return String(v);
  }
  return undefined;
}

function readSitewide(provider: Provider): string | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    const raw = localStorage.getItem('sitewide_ai_settings');
    if (!raw) return undefined;
    const s = JSON.parse(raw || '{}');
    const key = {
      gemini: s.gemini_api_key,
      huggingface: s.huggingface_api_key,
      anthropic: s.anthropic_api_key,
      openrouter: s.openrouter_api_key,
      openai: s.openai_api_key,
    }[provider];
    return key ? String(key) : undefined;
  } catch { return undefined; }
}

async function readSchool(provider: Provider, tenantId?: string): Promise<string | undefined> {
  try {
    const sb = getSupabase();
    if (!sb || (sb as any)._offline) return undefined;
    const tid = tenantId || getTenantId() || 'demo';
    const { data } = await sb.from('school_settings').select('integrations').eq('tenant_id', tid).limit(1);
    const integ = Array.isArray(data) && data[0]?.integrations ? data[0].integrations as any : {};
    const key = {
      gemini: integ.gemini_api_key,
      huggingface: integ.huggingface_api_key,
      anthropic: integ.anthropic_api_key,
      openrouter: integ.openrouter_api_key,
      openai: integ.openai_api_key,
    }[provider];
    return key ? String(key) : undefined;
  } catch { return undefined; }
}

export async function resolveApiKey(provider: Provider, tenantId?: string): Promise<string | undefined> {
  // 1) Environment variables
  const envKey = readEnv(
    provider === 'gemini' ? ['VITE_GEMINI_API_KEY','GEMINI_API_KEY','NEXT_PUBLIC_GEMINI_API_KEY'] :
    provider === 'huggingface' ? ['VITE_HUGGINGFACE_API_KEY','HUGGINGFACE_API_KEY','NEXT_PUBLIC_HUGGINGFACE_API_KEY'] :
    provider === 'anthropic' ? ['VITE_ANTHROPIC_API_KEY'] :
    provider === 'openrouter' ? ['VITE_OPENROUTER_API_KEY'] :
    ['VITE_OPENAI_API_KEY']
  );
  if (envKey) return envKey;

  // 2) Sitewide (Super Admin) settings
  const siteKey = readSitewide(provider);
  if (siteKey) return siteKey;

  // 3) School Admin settings per tenant
  const schoolKey = await readSchool(provider, tenantId);
  if (schoolKey) return schoolKey;

  return undefined;
}
