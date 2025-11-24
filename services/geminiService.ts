// services/geminiService.ts
// Back-compat shim that re-exports tolerant AI functions
export { generateResponse, generateReport, generateAnnouncement, generateLessonPlan, normalizePrompt } from './geminiAIService';
import { isValidGeminiApiKey, GEMINI_KEY_ERRORS } from '../utils/geminiKeyResolver';

import { supabase, initSupabase } from './supabaseClient';
import { getTenantId } from './api';
import { getAIResponseCache } from './aiResponseCache';
import { getGeminiAIService, formatAIResponse } from './geminiAIService';
import { logger } from '../utils/logger';
import { generateEnhancedFallbackResponse } from './enhancedFallbackAI';

// Prefer Supabase Edge Function if configured; otherwise use local proxy
import { getSupabaseConfig } from '../utils/env';
const supabaseConfig = getSupabaseConfig();
const AI_ENDPOINT = supabaseConfig.aiChatUrl || '/api/ai/generate';

/**
 * Generates text content by sending a prompt to a secure, server-side proxy
 * which then calls the Gemini API. This is the primary online generation function.
 * @param prompt The text prompt to send to the model or options object
 * @param context Additional context (deprecated, use prompt only)
 * @returns The generated text response.
 */
export const callGeminiApi = async (
  prompt: string | { prompt: string },
  contextOrOptions?: string | {
    context?: any;
    conversationId?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    userProfile?: any;
    tenantId?: string;
    responseMimeType?: string;
    expectedSchema?: any;
  }
): Promise<string> => {
  // Handle both old object format and new string format
  const actualPrompt = typeof prompt === 'string' ? prompt : prompt.prompt;
  const opts = typeof contextOrOptions === 'string' ? { context: contextOrOptions } : (contextOrOptions || {});
  
  // Try to get cached response first
  const cache = getAIResponseCache();
  const cached = cache.getCachedResponse(actualPrompt, opts.context as (string | undefined));
  
  if (cached && cached.source === 'gemini') {
    logger.info('Returning cached Gemini response (cache hit)');
    return cached.response;
  }
  
  try {
    // Ensure Supabase is initialized before use (handles lazy init race in dev)
    try { if (!supabase) { await initSupabase(); } } catch { /* ignore */ }
    // Allow demo mode to proceed even if Supabase client failed to initialize
    const isDemo = (typeof window !== 'undefined' && sessionStorage.getItem('isDemoMode') === 'true');
    if (!supabase && !isDemo) {
        throw new Error("Authentication service is not available.");
    }

    const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } } as any;

    if (!session && !isDemo) {
        throw new Error("User not authenticated.");
    }
    
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    } as any;
    
    // Prioritize demo mode check to prevent lingering sessions from interfering.
    if (isDemo) {
        (headers as any)['X-Demo-Mode'] = 'true';
    } else if (session) {
        (headers as any)['Authorization'] = `Bearer ${session.access_token}`;
    }

    // If calling a Supabase Edge Function and no user token present, attach anon key for public access
    try {
      const isSupabaseFunction = typeof AI_ENDPOINT === 'string' && AI_ENDPOINT.includes('.supabase.co/functions/v1');
      const anonKey = (typeof window !== 'undefined' ? (window as any).process?.env?.VITE_SUPABASE_ANON_KEY : undefined) || (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;
      if (isSupabaseFunction && !(headers as any)['Authorization'] && anonKey) {
        (headers as any)['Authorization'] = `Bearer ${anonKey}`;
      }
    } catch { /* noop */ }

    // Get tenant context for API key resolution
    const tenantId = opts.tenantId || getTenantId();
    
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        prompt: actualPrompt,
        tenantId,
        conversationId: opts.conversationId,
        context: opts.context,
        conversationHistory: opts.conversationHistory,
        userProfile: opts.userProfile,
        responseMimeType: opts.responseMimeType,
        expectedSchema: opts.expectedSchema,
        stream: false
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server responded with status: ${response.status}`;

        if (errorText) {
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.error || errorText;
            } catch (e) {
                errorMessage = errorText;
            }
        }
        
        // If proxy endpoint is missing or not usable, attempt direct Gemini fallback
        const shouldDirectFallback = [401, 403, 404, 405, 500].includes(response.status)
          || /not\s*found|method\s*not\s*allowed|unauthorized|forbidden|api[_\s-]?key/i.test(errorMessage);
        if (shouldDirectFallback) {
            try {
                const text = await directGeminiGenerate(actualPrompt);
                if (text) {
cache.cacheResponse(actualPrompt, text, 'gemini', opts.context);
                    logger.info('Cached Gemini response via direct fallback');
                }
                return text;
            } catch (e: any) {
                throw new Error(e.message || errorMessage);
            }
        }
        throw new Error(errorMessage);
    }

    // The backend returns Server-Sent Events (text/event-stream). Parse and concatenate.
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonString = line.substring(6);
                    if (jsonString.trim() === '[DONE]') continue;
                    try {
                        const chunk = JSON.parse(jsonString);
                        const textChunk = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (textChunk) fullText += textChunk;
                    } catch (e) {
                        // If parsing fails, ignore this chunk and continue
                        logger.captureError(e as any, 'SSE chunk parse error');
                    }
                }
            }
        }
        
        // Cache the successful Gemini response
        if (fullText) {
cache.cacheResponse(actualPrompt, fullText, 'gemini', opts.context);
            logger.info('Cached Gemini response for future use');
        }
        
        return fullText;
    }

    // Fallback: try to parse as JSON if not streaming
    try {
        const data = await response.json();
        // Support both {text} and raw Gemini JSON structures
        const text = data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        // Cache the successful Gemini response
        if (text) {
cache.cacheResponse(actualPrompt, text, 'gemini', opts.context);
            logger.info('Cached Gemini response for future use');
        }
        
        return text;
    } catch (e) {
        const text = await response.text();
        
        // Cache even raw text responses
        if (text) {
cache.cacheResponse(actualPrompt, text, 'gemini', opts.context);
        }
        
        return text; // As a last resort, return raw text
    }
    
  } catch (error) {
    const msg = String((error as any)?.message || '').toLowerCase();
    if (msg.includes('invalid gemini api key format') || msg.includes('gemini api key not configured')) {
      try {
        const text = generateEnhancedFallbackResponse(actualPrompt, opts.context);
        try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'AI Fallback Activated', message: 'Transcript generated using offline templates (no valid API key).' } })); } catch { /* noop */ }
        return text;
      } catch { /* noop */ }
    }
    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('quota') || msg.includes('429')) {
      try {
        const text = generateEnhancedFallbackResponse(actualPrompt, opts.context);
        try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'AI Fallback Activated', message: 'Gemini is overloaded. Generated using offline templates.' } })); } catch { /* noop */ }
        return text;
      } catch { /* noop */ }
    }
    if (msg.includes('failed to fetch')) {
      let fallbackErr: any = null;
      try {
        const text = await directGeminiGenerate(actualPrompt);
        if (text) {
cache.cacheResponse(actualPrompt, text, 'gemini', opts.context);
          return text;
        }
      } catch (e: any) {
        fallbackErr = e;
      }
      throw new Error(fallbackErr?.message || 'Network connection failed. Could not reach AI service.');
    }
    throw new Error(`The AI service is currently unavailable. ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Generates text content in a stream by sending a prompt to a secure, server-side proxy.
 * @param prompt The text prompt to send to the model or options object.
 * @param onChunk A callback function that receives chunks of text as they are generated.
 * @returns A promise that resolves when the stream is complete.
 */
export const callGeminiApiStream = async (
  prompt: string | { prompt: string },
  onChunk: (chunk: string) => void,
  options?: {
    context?: any;
    conversationId?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    userProfile?: any;
    tenantId?: string;
    responseMimeType?: string;
    expectedSchema?: any;
  }
): Promise<void> => {
  // Handle both old object format and new string format
  const actualPrompt = typeof prompt === 'string' ? prompt : prompt.prompt;
  const opts = options || {};
  try {
    // Ensure Supabase is initialized before use (handles lazy init race in dev)
    try { if (!supabase) { await initSupabase(); } } catch { /* ignore */ }
    const isDemo = (typeof window !== 'undefined' && sessionStorage.getItem('isDemoMode') === 'true');
    if (!supabase && !isDemo) {
        throw new Error("Authentication service is not available.");
    }

    const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } } as any;

    if (!session && !isDemo) {
        throw new Error("User not authenticated.");
    }
    
    const headers: HeadersInit = { 'Content-Type': 'application/json', 'Accept': 'text/event-stream', 'Cache-Control': 'no-store' } as any;
    
    if (isDemo) {
        (headers as any)['X-Demo-Mode'] = 'true';
    } else if (session) {
        (headers as any)['Authorization'] = `Bearer ${session.access_token}`;
    }

    // If calling a Supabase Edge Function and no user token present, attach anon key for public access (stream)
    try {
      const isSupabaseFunction = typeof AI_ENDPOINT === 'string' && AI_ENDPOINT.includes('.supabase.co/functions/v1');
      const anonKey = (typeof window !== 'undefined' ? (window as any).process?.env?.VITE_SUPABASE_ANON_KEY : undefined) || (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;
      if (isSupabaseFunction && !(headers as any)['Authorization'] && anonKey) {
        (headers as any)['Authorization'] = `Bearer ${anonKey}`;
      }
    } catch { /* noop */ }

    // Get tenant context for API key resolution
    const tenantId = opts.tenantId || getTenantId();
    
    const controller = new AbortController();
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        prompt: actualPrompt,
        tenantId,
        conversationId: opts.conversationId,
        context: opts.context,
        conversationHistory: opts.conversationHistory,
        userProfile: opts.userProfile,
        responseMimeType: opts.responseMimeType,
        expectedSchema: opts.expectedSchema,
        stream: true
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server responded with status: ${response.status}`;
        try { const errorJson = JSON.parse(errorText); errorMessage = errorJson.error || errorText; } catch (e) { errorMessage = errorText; }
        const shouldDirectFallback = [401, 403, 404, 405, 500].includes(response.status)
          || /not\s*found|method\s*not\s*allowed|unauthorized|forbidden|api[_\s-]?key/i.test(errorMessage);
        if (shouldDirectFallback) {
            // Try direct streaming from Gemini
            await directGeminiStream(actualPrompt, onChunk);
            return;
        }
        throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("Streaming response not supported by the browser.");
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let gotFirstChunk = false;

    // Fallback to direct streaming if no chunk in first 1.8s (proxy buffering)
    const firstChunkTimer = setTimeout(async () => {
      if (!gotFirstChunk) {
        try { await reader.cancel(); } catch { /* ignore */ }
        controller.abort();
        try { await directGeminiStream(actualPrompt, onChunk); } catch (e) { logger.captureError(e as any, 'Direct stream fallback failed'); }
      }
    }, 1800);

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonString = line.substring(6);
                if (jsonString.trim() === '[DONE]') continue;
                try {
                    const data = JSON.parse(jsonString);
                    const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textChunk) {
                        gotFirstChunk = true;
                        onChunk(textChunk);
                    }
                } catch (e) {
                    logger.captureError(e as any, 'Error parsing streaming JSON chunk');
                }
            }
        }
    }

    clearTimeout(firstChunkTimer);

  } catch (error) {
    if ((error as any).message?.includes('Failed to fetch')) {
      // Try direct stream as a fallback if server endpoint is unreachable
      let fallbackErr: any = null;
      try {
        await directGeminiStream(actualPrompt, onChunk);
        return;
      } catch (e: any) {
        fallbackErr = e;
      }
      throw new Error(fallbackErr?.message || 'Network connection failed. Could not reach AI service.');
    }
    throw new Error(`The AI service is currently unavailable. ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
* @deprecated This function is now a wrapper for `callGeminiApi`.
 * New components should use the `useAI` hook for robust error handling and fallback capabilities.
 */
export const generateText = async (prompt: string): Promise<string> => {
    try {
        const service = getGeminiAIService();
        const response = await service.generate({ prompt });
        const formatted = formatAIResponse(response);
        try {
            if (formatted.notification) {
                const n = formatted.notification;
                const isWarning = n.type === 'warning' || n.showFallbackInfo;
                const evt = isWarning ? 'show-global-error' : 'show-global-success';
                window.dispatchEvent(new CustomEvent(evt, { detail: { title: isWarning ? 'AI Fallback Active' : 'AI Response Ready', message: n.message } }));
            }
        } catch { /* noop */ }
        return formatted.content;
    } catch (e: any) {
        try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'AI Service Error', message: e?.message || 'AI service unavailable' } })); } catch { /* noop */ }
        try {
            const { generateFallbackResponseAsync } = await import('./fallbackAiService');
            return await generateFallbackResponseAsync(prompt);
        } catch {
            const { generateEnhancedFallbackResponse } = await import('./enhancedFallbackAI');
            return generateEnhancedFallbackResponse(prompt);
        }
    }
};

// --- Direct Gemini fallback (client-side) ---
const getGeminiEnv = () => {
    const apiKey = typeof window !== 'undefined'
        ? (window.process?.env?.GEMINI_API_KEY || window.process?.env?.VITE_GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY)
        : (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY);
    const model = typeof window !== 'undefined'
        ? (window.process?.env?.VITE_GEMINI_MODEL || import.meta.env?.VITE_GEMINI_MODEL || 'gemini-1.5-flash')
        : (process.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash');
    if (!apiKey) throw new Error('Gemini API key not configured');
    if (!isValidGeminiApiKey(apiKey)) {
        throw new Error(GEMINI_KEY_ERRORS.INVALID_FORMAT);
    }
    return { apiKey, model };
};

async function listAvailableModels(apiKey: string): Promise<any[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json().catch(() => ({ models: [] }));
    return Array.isArray(data.models) ? data.models : [];
}

function supportsGenerateContent(model: any): boolean {
    const methods: string[] = model?.supportedGenerationMethods || [];
    return methods.includes('generateContent') || methods.includes('generateText');
}

async function pickUsableModel(apiKey: string, preferred: string): Promise<string> {
    try {
        const models = await listAvailableModels(apiKey);
        const preferredExists = models.find((m: any) => m.name?.includes(preferred) && supportsGenerateContent(m));
        if (preferredExists) return preferred;
        const candidates = ['gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro'];
        for (const name of candidates) {
            const m = models.find((mm: any) => mm.name?.includes(name) && supportsGenerateContent(mm));
            if (m) return name;
        }
    } catch { /* ignore */ }
    return preferred; // fallback to preferred
}

async function directGeminiGenerate(prompt: string): Promise<string> {
    const { apiKey, model } = getGeminiEnv();
    let chosen = model;
    let attempts = 0;

    async function tryGenerate(modelName: string): Promise<string> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
        const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!resp.ok) {
            const txt = await resp.text();
            const msg = `Gemini API error: ${resp.status} ${txt}`;
            if ((resp.status === 429 || resp.status === 503) && attempts < 3) {
                attempts++;
                await new Promise(r => setTimeout(r, 500 * attempts));
                return tryGenerate(modelName);
            }
            throw new Error(msg);
        }
        const data = await resp.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.text || '';
    }

    try {
        return await tryGenerate(chosen);
    } catch (e: any) {
        const emsg = String(e?.message || '').toLowerCase();
        if (emsg.includes('404') || emsg.includes('not_found') || emsg.includes('unsupported')) {
            chosen = await pickUsableModel(apiKey, chosen);
            return await tryGenerate(chosen);
        }
        if (emsg.includes('503') || emsg.includes('overloaded') || emsg.includes('quota') || emsg.includes('429')) {
            try {
                const fallback = generateEnhancedFallbackResponse(prompt);
                try { window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'AI Fallback Activated', message: 'Gemini is overloaded. Generated using offline templates.' } })); } catch { /* noop */ }
                return fallback;
            } catch {
                throw e;
            }
        }
        throw e;
    }
}

async function directGeminiStream(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    const { apiKey, model } = getGeminiEnv();
    const chosen = await pickUsableModel(apiKey, model);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${chosen}:streamGenerateContent?key=${apiKey}`;
    const body = { contents: [{ role: 'user', parts: [{ text: prompt }] }] };
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!resp.ok) {
        // Fall back to non-stream if streaming not allowed or model unsupported
        const text = await directGeminiGenerate(prompt);
        const CHUNK_SIZE = 256;
        for (let i = 0; i < text.length; i += CHUNK_SIZE) {
            onChunk(text.slice(i, i + CHUNK_SIZE));
        }
        return;
    }
    const contentType = resp.headers.get('Content-Type') || '';
    if (!contentType.includes('text/event-stream') || !resp.body) {
        const text = await directGeminiGenerate(prompt);
        const CHUNK_SIZE = 256;
        for (let i = 0; i < text.length; i += CHUNK_SIZE) {
            onChunk(text.slice(i, i + CHUNK_SIZE));
        }
        return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonString = line.substring(6);
                if (jsonString.trim() === '[DONE]') continue;
                try {
                    const chunk = JSON.parse(jsonString);
                    const textChunk = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (textChunk) onChunk(textChunk);
                } catch { /* ignore */ }
            }
        }
    }
}
