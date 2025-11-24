import { logger } from '../utils/logger';
import { resolveApiKey } from './aiConfig';
import { postJson, safeJson } from './http';

const endpoint = 'https://openrouter.ai/api/v1/chat/completions';

function getKey(): string | undefined { 
  try { 
    return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENROUTER_API_KEY : process.env.VITE_OPENROUTER_API_KEY) || undefined; 
  } catch { 
    return undefined; 
  } 
}

function getModel(): string { 
  try { 
    return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENROUTER_MODEL : process.env.VITE_OPENROUTER_MODEL) || 'meta-llama/llama-3.1-8b-instruct'; 
  } catch { 
    return 'meta-llama/llama-3.1-8b-instruct'; 
  } 
}

export async function callOpenRouter(prompt: string): Promise<string> {
  const key = (await resolveApiKey('openrouter')) || getKey();
  if (!key) throw new Error('OpenRouter API key not configured');
  
  const model = getModel();
  const body = { 
    model, 
    messages: [{ role: 'user', content: prompt }], 
    temperature: 0.2 
  };
  
  try {
    const data = await postJson(
      endpoint,
      body,
      { 'Authorization': `Bearer ${key}` }
    );
    
    const content = data?.choices?.[0]?.message?.content || '';
    return String(content || '');
  } catch (error) {
    logger.captureError(error, 'openrouter parse');
    return '';
  }
}
