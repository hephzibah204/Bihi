import { logger } from '../utils/logger';
import { resolveApiKey } from './aiConfig';
import { postJson, safeJson } from './http';

const endpoint = 'https://api.anthropic.com/v1/messages';

function getKey(): string | undefined {
  try { 
    return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_ANTHROPIC_API_KEY : process.env.VITE_ANTHROPIC_API_KEY) || undefined; 
  } catch { 
    return undefined; 
  }
}

function getModel(): string { 
  try { 
    return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_ANTHROPIC_MODEL : process.env.VITE_ANTHROPIC_MODEL) || 'claude-3-haiku-20240307'; 
  } catch { 
    return 'claude-3-haiku-20240307'; 
  } 
}

export async function callAnthropicApi(prompt: string): Promise<string> {
  const key = (await resolveApiKey('anthropic')) || getKey();
  if (!key) throw new Error('Anthropic API key not configured');
  
  const model = getModel();
  const body = { 
    model, 
    max_tokens: 2048, 
    messages: [{ role: 'user', content: prompt }] 
  };
  
  try {
    const data = await postJson(
      endpoint,
      body,
      { 
        'x-api-key': key, 
        'anthropic-version': '2023-06-01' 
      }
    );
    
    const blocks = data?.content || [];
    const text = Array.isArray(blocks) ? blocks.map((b: any) => b.text || '').join('') : '';
    return String(text || data?.output || '');
  } catch (error) {
    logger.captureError(error, 'anthropic parse');
    return '';
  }
}
