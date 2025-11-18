import { logger } from '../utils/logger';
const endpoint = 'https://api.anthropic.com/v1/messages';
function getKey(): string | undefined {
  try { return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_ANTHROPIC_API_KEY : process.env.VITE_ANTHROPIC_API_KEY) || undefined; } catch { return undefined; }
}
function getModel(): string { try { return (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_ANTHROPIC_MODEL : process.env.VITE_ANTHROPIC_MODEL) || 'claude-3-haiku-20240307'; } catch { return 'claude-3-haiku-20240307'; } }
export async function callAnthropicApi(prompt: string): Promise<string> {
  const key = getKey();
  if (!key) throw new Error('Anthropic API key not configured');
  const model = getModel();
  const body = { model, max_tokens: 2048, messages: [{ role: 'user', content: prompt }] } as any;
  const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' }, body: JSON.stringify(body) });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`Anthropic error ${r.status} ${t}`); }
  const j = await r.json().catch(() => ({}));
  try { const blocks = j?.content || []; const text = Array.isArray(blocks) ? blocks.map((b: any) => b.text || '').join('') : ''; return String(text || j?.output || ''); } catch (e) { logger.captureError(e as any, 'anthropic parse'); return String(j?.output || ''); }
}
