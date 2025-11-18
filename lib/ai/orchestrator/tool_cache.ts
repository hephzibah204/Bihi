import { getSupabase } from '../../../services/supabaseClient';
const mem = new Map<string, { ts: number; json: any }>();
const TTL_MS = 5 * 60 * 1000;
function key(tenantId: string, name: string, args: any): string {
  const a = JSON.stringify(args || {});
  return `${tenantId}::${name}::${a}`;
}
export async function getToolCache(tenantId: string, name: string, args: any): Promise<any | null> {
  const k = key(tenantId, name, args);
  const hit = mem.get(k);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.json;
  try {
    const sb = getSupabase();
    if (sb?._offline) return null;
    const { data, error } = await sb.rpc('get_tool_cache', { p_tenant_id: tenantId, p_name: name, p_args: JSON.stringify(args || {}) });
    if (!error && data?.result_json) return JSON.parse(data.result_json);
  } catch {}
  return null;
}
export async function setToolCache(tenantId: string, name: string, args: any, json: any): Promise<void> {
  const k = key(tenantId, name, args);
  mem.set(k, { ts: Date.now(), json });
  try {
    const sb = getSupabase();
    if (sb?._offline) return;
    await sb.rpc('upsert_tool_cache', { p_tenant_id: tenantId, p_name: name, p_args: JSON.stringify(args || {}), p_result_json: JSON.stringify(json) });
  } catch {}
}
