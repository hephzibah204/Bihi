import { handleCors } from '../../_lib/cors.js';
import { requireSuperAdmin } from '../../_lib/auth.js';

export const onRequestGet = async ({ request, env }) => {
  const { response: corsResponse, corsHeaders } = handleCors(request, env, 'GET, OPTIONS');
  if (corsResponse) return corsResponse;
  const { ok, res } = await requireSuperAdmin(request, env);
  if (!ok) { Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v)); return res; }
  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
    const r = await fetch(`${SUPABASE_URL}/rest/v1/oer_items?select=title,author,year,subject,url,source,tags,id,published&published=eq.false`, {
      headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY }
    });
    const items = r.ok ? await r.json() : [];
    const response = new Response(JSON.stringify({ ok: true, items }), { headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  } catch (e) {
    const response = new Response(JSON.stringify({ ok: false, error: 'failed', message: e?.message || 'Failed' }), { status: 500, headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }
};

