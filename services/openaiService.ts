import { logger } from '../utils/logger';
import { resolveApiKey } from './aiConfig';
const endpoint = 'https://api.openai.com/v1/chat/completions';
function getKey(): string | undefined { try { return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_API_KEY : process.env.VITE_OPENAI_API_KEY) || undefined; } catch { return undefined; } }
function getModel(): string { try { return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_OPENAI_MODEL : process.env.VITE_OPENAI_MODEL) || 'gpt-4o-mini'; } catch { return 'gpt-4o-mini'; } }
export async function callOpenAI(prompt: string): Promise<string> {
  const key = (await resolveApiKey('openai')) || getKey();
  if (!key) throw new Error('OpenAI API key not configured');
  const model = getModel();
  const body = { model, messages: [{ role: 'user', content: prompt }], temperature: 0.2 };
  const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` }, body: JSON.stringify(body) });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`OpenAI error ${r.status} ${t}`); }
  const j = await r.json().catch(() => ({}));
  try { const c = j?.choices?.[0]?.message?.content || ''; return String(c || ''); } catch (e) { logger.captureError(e as any, 'openai parse'); return String(j?.choices?.[0]?.text || ''); }
}
