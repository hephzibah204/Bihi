import { getSupabase } from './supabaseClient';
import { getTenantId } from './api';
export async function listToolCache(limit: number = 50) {
  const sb = getSupabase();
  const tenantId = getTenantId() || 'demo';
  const { data, error } = await sb.rpc('list_tool_cache', { p_tenant_id: tenantId, p_limit: limit });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
export async function clearToolCache(name?: string) {
  const sb = getSupabase();
  const tenantId = getTenantId() || 'demo';
  const { error } = await sb.rpc('clear_tool_cache', { p_tenant_id: tenantId, p_name: name || null });
  if (error) throw error;
  return true;
}