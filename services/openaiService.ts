import { logger } from '../utils/logger';
import { resolveApiKey } from './aiConfig';
import { postJson, safeJson } from './http';
import { getOpenAIConfig } from '../utils/env';

const endpoint = 'https://api.openai.com/v1/chat/completions';

function getKey(): string | undefined { 
  try { 
    const config = getOpenAIConfig();
    return config.apiKey || undefined; 
  } catch { 
    return undefined; 
  } 
}

function getModel(): string { 
  try { 
    return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_MODEL : process.env.VITE_OPENAI_MODEL) || 'gpt-4o-mini'; 
  } catch { 
    return 'gpt-4o-mini'; 
  } 
}

export async function callOpenAI(prompt: string): Promise<string> {
  const key = (await resolveApiKey('openai')) || getKey();
  if (!key) throw new Error('OpenAI API key not configured');
  
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
    logger.captureError(error, 'openai parse');
    return '';
  }
}
