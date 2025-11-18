import { handleCors } from '../../_lib/cors.js';
import { requireSuperAdmin } from '../../_lib/auth.js';

export const onRequestPost = async ({ request, env }) => {
  const { response: corsResponse, corsHeaders } = handleCors(request, env, 'POST, OPTIONS');
  if (corsResponse) return corsResponse;
  const { ok, res } = await requireSuperAdmin(request, env);
  if (!ok) { Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v)); return res; }
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) {
      const response = new Response(JSON.stringify({ ok: false, error: 'no_ids' }), { status: 400, headers: { 'content-type': 'application/json' } });
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
    const headers = { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' };
    const updates = ids.map(id => ({ id, published: true }));
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/oer_items`, { method: 'PATCH', headers, body: JSON.stringify(updates) });
    if (!upsert.ok) {
      const text = await upsert.text();
      const response = new Response(JSON.stringify({ ok: false, error: 'publish_failed', details: text }), { status: 500, headers: { 'content-type': 'application/json' } });
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }
    const response = new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  } catch (e) {
    const response = new Response(JSON.stringify({ ok: false, error: 'invalid_request', message: e?.message || 'Failed' }), { status: 400, headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }
};

