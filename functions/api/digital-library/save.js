import { handleCors } from '../../_lib/cors.js';
import { requirePlatformRoles } from '../../_lib/auth.js';

export const onRequestPost = async ({ request, env }) => {
  const { response: corsResponse, corsHeaders } = handleCors(request, env, 'POST, OPTIONS');
  if (corsResponse) return corsResponse;
  const { ok, res, user } = await requirePlatformRoles(request, env, ['Admin', 'Teacher', 'Student', 'Parent']);
  if (!ok) {
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  try {
    const body = await request.json();
    const item = normalizeItem(body);
    const ownerId = user?.id || null;
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      const response = new Response(JSON.stringify({ ok: false, error: 'server_not_configured' }), { status: 500, headers: { 'content-type': 'application/json' } });
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
      return response;
    }
    const headers = {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    };
    const payload = { ...item, owner_id: ownerId, published: false };
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/digital_library_items`, { method: 'POST', headers, body: JSON.stringify(payload) });
    if (!upsert.ok) {
      const text = await upsert.text();
      const response = new Response(JSON.stringify({ ok: false, error: 'save_failed', details: text }), { status: 500, headers: { 'content-type': 'application/json' } });
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

const normalizeItem = (x) => ({
  title: x?.title || '',
  author: x?.author || '',
  year: x?.year || null,
  subject: x?.subject || '',
  url: x?.url || '',
  source: x?.source || 'Custom',
  tags: Array.isArray(x?.tags) ? x.tags : [],
});

