import { getSupabase } from './supabaseClient';
import { getTenantId } from './api';
import { getGeminiConfig, getHuggingFaceConfig, getOpenAIConfig, getOpenRouterConfig } from '../utils/env';

type Provider = 'gemini' | 'huggingface' | 'anthropic' | 'openrouter' | 'openai';

function readEnv(keys: string[]): string | undefined {
  for (const k of keys) {
    const v = (typeof import.meta !== 'undefined' ? (import.meta as any)?.env?.[k] : undefined) || (typeof process !== 'undefined' ? process.env?.[k] : undefined);
    if (v) return String(v);
  }
  return undefined;
}

function readSitewide(provider: Provider): string | undefined {
  return undefined;
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
  // 1) Environment variables (use centralized helpers)
  let envKey: string | undefined;
  switch (provider) {
    case 'gemini':
      envKey = getGeminiConfig().apiKey;
      break;
    case 'huggingface':
      envKey = getHuggingFaceConfig().apiKey;
      break;
    case 'openai':
      envKey = getOpenAIConfig().apiKey;
      break;
    case 'openrouter':
      envKey = getOpenRouterConfig().apiKey;
      break;
    case 'anthropic':
      // Anthropic not in main env helper yet, use direct readEnv for now
      envKey = readEnv(['VITE_ANTHROPIC_API_KEY']);
      break;
  }
  if (envKey) return envKey;

  const siteKey = readSitewide(provider);
  if (siteKey) return siteKey;

  // 3) School Admin settings per tenant
  const schoolKey = await readSchool(provider, tenantId);
  if (schoolKey) return schoolKey;

  return undefined;
}
