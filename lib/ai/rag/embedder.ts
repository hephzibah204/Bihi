import { getSupabase } from '../../../services/supabaseClient';
export async function embedText(text: string): Promise<number[]> {
  try {
    const r0 = await Promise.race([
      fetch('/api/ai/embeddings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
    ]);
    if (r0 && r0.ok) { const j0 = await r0.json(); if (Array.isArray(j0.embedding)) return j0.embedding.map((x: any) => Number(x)); }
    const r = await Promise.race([
      fetch('http://localhost:11434/api/embeddings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }) }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
    ]);
    if (r && r.ok) { const j = await r.json(); if (Array.isArray(j.embedding)) return j.embedding.map((x: any) => Number(x)); }
  } catch {}
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const dim = 1024;
  const vec = new Array<number>(dim).fill(0);
  for (const t of tokens) {
    let h = 0;
    for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
    vec[h % dim] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  for (let i = 0; i < dim; i++) vec[i] = vec[i] / norm;
  return vec;
}
export async function upsertEmbedding(tenantId: string, docId: string, content: string): Promise<void> {
  try {
    const sb = getSupabase();
    if (sb?._offline) return;
    const embedding = await embedText(content);
    try { await sb.rpc('upsert_ai_embedding_1k', { p_tenant_id: tenantId, p_doc_id: docId, p_content: content, p_embedding: embedding }); return; } catch {}
    await sb.rpc('upsert_ai_embedding', { p_tenant_id: tenantId, p_doc_id: docId, p_content: content, p_embedding: embedding });
  } catch {}
}
