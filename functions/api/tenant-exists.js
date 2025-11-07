// functions/api/tenant-exists.js
import { handleCors } from '../_lib/cors';

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403 });

  const url = new URL(request.url);
  const tenant = url.searchParams.get('subdomain') || url.searchParams.get('tenant') || url.searchParams.get('id') || '';
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const res = new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  if (!tenant) {
    const res = new Response(JSON.stringify({ error: 'Missing tenant parameter' }), { status: 400 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const headers = {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Accept: 'application/json'
  };

  try {
    const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${tenant}&select=id`, { headers });
    let exists = false;
    if (verifyRes.ok) {
      try {
        const rows = await verifyRes.json();
        exists = Array.isArray(rows) && rows.length > 0;
      } catch {}
    }

    if (request.method === 'HEAD') {
      const res = new Response(null, { status: exists ? 200 : 404 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const res = new Response(JSON.stringify({ success: true, exists, tenantId: tenant }), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Failed to verify tenant', details: err?.message || String(err) }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}