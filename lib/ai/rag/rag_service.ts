import { getSemanticSearchEngine } from '../../../services/semanticSearch';
import { getSupabase } from '../../../services/supabaseClient';
import { embedText } from './embedder';
export async function getRagContext(tenantId: string, query: string, topK: number = 5): Promise<string[]> {
  try {
    const sb = getSupabase();
    if (!sb?._offline) {
      try {
        const qemb = await embedText(query);
        const { data, error } = await sb.rpc('match_embeddings', { p_tenant_id: tenantId, p_query_embedding: qemb, p_top_k: topK });
        if (!error && Array.isArray(data) && data.length) return data.map((d: any) => String(d.content || ''));
      } catch {}
      const { data, error } = await sb.rpc('match_documents', { p_tenant_id: tenantId, p_query: query, p_top_k: topK });
      if (!error && Array.isArray(data) && data.length) return data.map((d: any) => String(d.content || ''));
    }
  } catch {}
  const engine = getSemanticSearchEngine();
  const matches = engine.search(query, topK, 0.2);
  return matches.map(m => m.response);
}
