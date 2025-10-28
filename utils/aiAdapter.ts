/*
  AI Adapter: Gemini → HuggingFace → Offline fallback
  - Normalizes provider output to a simple string
  - Prevents `.match` on non-strings via safe guards
  - Designed to be called server-side or via an API route
*/


export type Provider = 'gemini' | 'huggingface' | 'offline';

export interface AnalysisOptions {
  model?: string; // Gemini model name
  huggingFaceModel?: string; // HF model id (e.g., "meta-llama/Meta-Llama-3-8B-Instruct")
  temperature?: number;
  maxTokens?: number;
}

export interface AnalysisResult {
  ok: boolean;
  provider: Provider;
  text?: string;
  error?: string;
}

// Direct define substitution (Vite) for Hugging Face key
// This ensures the key is available even when using dynamic env access.
// In Vite, occurrences of `process.env.HUGGINGFACE_API_KEY` are replaced at build time.
const HF_DEFINE_KEY: string | undefined = process.env.HUGGINGFACE_API_KEY as any;

function getEnv(key: string): string | undefined {
  // Works in Node and Vite environments
  const fromProcess = typeof process !== 'undefined' ? process.env?.[key] : undefined;
  const fromImportMeta = typeof import.meta !== 'undefined' ? (import.meta as any)?.env?.[key] : undefined;
  return fromProcess ?? fromImportMeta;
}

function getAnyEnv(keys: string[]): string | undefined {
  for (const k of keys) {
    const v = getEnv(k);
    if (v) return v;
  }
  return undefined;
}
function isForceOffline(): boolean {
  const v = getAnyEnv(['AI_FORCE_OFFLINE', 'VITE_AI_FORCE_OFFLINE', 'NEXT_PUBLIC_AI_FORCE_OFFLINE']);
  const fromRuntime = (globalThis as any)?.__AI_FORCE_OFFLINE__;
  const val = typeof fromRuntime !== 'undefined' ? fromRuntime : v;
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const s = String(val).toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes';
}

export function ensureString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (Array.isArray(value)) return value.map(v => ensureString(v)).join(' ');
  try { return String(value); } catch { return ''; }
}

export function safeMatch(value: unknown, regex: RegExp): RegExpMatchArray | null {
  return ensureString(value).match(regex);
}

export function extractAIText(response: unknown): string {
  // Gemini response shape: result.response.text()
  try {
    const resp: any = response as any;
    const maybeTextFn = resp?.response?.text ?? resp?.text;
    if (typeof maybeTextFn === 'function') {
      const t = maybeTextFn.call(resp.response ?? resp);
      if (typeof t === 'string') return t;
    }
  } catch { /* noop */ }

  // HuggingFace text-generation: [{ generated_text: '...' }]
  try {
    const arr = response as any;
    if (Array.isArray(arr) && arr.length > 0) {
      const first = arr[0];
      if (typeof first?.generated_text === 'string') return first.generated_text;
    }
    // Some HF tasks return objects
    const obj = response as any;
    if (typeof obj?.generated_text === 'string') return obj.generated_text;
  } catch { /* noop */ }

  // Fallback: stringify response
  return ensureString(response);
}

async function tryGemini(prompt: string, options?: AnalysisOptions): Promise<string> {
  const apiKey = getAnyEnv(['GOOGLE_API_KEY', 'VITE_GOOGLE_API_KEY']);
  if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');

  const modelName = options?.model || 'gemini-1.5-flash';

  let mod: any = null;
  try { mod = await import('@google/genai'); } catch { /* noop */ }
  const Ctor = mod?.GoogleGenerativeAI || mod?.GoogleAI || mod?.default?.GoogleGenerativeAI || mod?.default?.GoogleAI;
  if (!Ctor) throw new Error('Gemini SDK unavailable');

  const genAI = new Ctor(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent(prompt);
  const text = extractAIText(result);
  if (!text || !text.trim()) throw new Error('Empty Gemini response');
  return text;
}

async function tryHuggingFace(prompt: string, options?: AnalysisOptions): Promise<string> {
  // Resolve HF API key from multiple sources to avoid "not working" due to env differences
  const apiKey = HF_DEFINE_KEY
    || getAnyEnv(['VITE_HUGGINGFACE_API_KEY', 'HUGGINGFACE_API_KEY'])
    || (typeof window !== 'undefined' ? localStorage.getItem('huggingface_api_key') || undefined : undefined);
  if (!apiKey) throw new Error('Missing HUGGINGFACE_API_KEY');

  const model = options?.huggingFaceModel || 'tiiuae/falcon-7b-instruct';
  const body = {
    inputs: prompt,
    parameters: {
      max_new_tokens: options?.maxTokens ?? 256,
      temperature: options?.temperature ?? 0.7,
      return_full_text: false,
    },
  };

  const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`HF request failed: ${res.status} ${errText}`);
  }
  const json = await res.json();
  const text = extractAIText(json);
  if (!text || !text.trim()) throw new Error('Empty HuggingFace response');
  return text;
}

import { generateEnhancedFallbackResponse } from '../services/enhancedFallbackAI';
async function offline(prompt: string): Promise<string> {
  const res = generateEnhancedFallbackResponse(prompt);
  return ensureString(res);
}

export async function analyzeWithFallback(prompt: string, options?: AnalysisOptions): Promise<AnalysisResult> {
  if (isForceOffline()) {
    const text = await offline(prompt);
    return { ok: true, provider: 'offline', text };
  }
  // 1) Gemini
  try {
    const text = await tryGemini(prompt, options);
    return { ok: true, provider: 'gemini', text };
  } catch (e: any) {
    // continue to next provider
  }

  // 2) HuggingFace
  try {
    const text = await tryHuggingFace(prompt, options);
    return { ok: true, provider: 'huggingface', text };
  } catch (e: any) {
    // continue to offline
  }

  // 3) Offline fallback (Enhanced Fallback)
  const text = await offline(prompt);
  return { ok: true, provider: 'offline', text };
}

// Convenience validator: prefer RegExp.test over .match
export function regexTestOn(value: unknown, regex: RegExp): boolean {
  return regex.test(ensureString(value));
}