import { handleCors } from '../../_lib/cors';
import { requirePlatformRoles } from '../../_lib/auth';

function json(headers) {
  const res = new Response('', { status: 200 });
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, POST, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requirePlatformRoles(request, env, ['Super Admin', 'School Admin', 'Teacher']);
  if (!auth.ok) return auth.res;

  try {
    if (request.method === 'OPTIONS') {
      return json(corsHeaders);
    }

    const url = new URL(request.url);
    const token = request.headers.get('Authorization');
    const headers = { 'Authorization': token, 'apikey': env.SUPABASE_ANON_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' };

    if (request.method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);
      const select = url.searchParams.get('select') || '*';
      const q = new URL(`${env.SUPABASE_URL}/rest/v1/cbt_exams`);
      q.searchParams.set('select', select);
      q.searchParams.set('limit', String(limit));
      const status = url.searchParams.get('status');
      if (status) q.searchParams.set('status', `eq.${status}`);
      const r = await fetch(q.toString(), { headers });
      if (!r.ok) {
        const res = new Response(JSON.stringify({ error: 'Query failed', details: await r.text() }), { status: 500 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      const rows = await r.json();
      const res = new Response(JSON.stringify(rows), { status: 200 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const tenantId = body?.tenant_id || auth.user?.user_metadata?.tenant_id;
      const payload = { ...body, tenant_id: tenantId };
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_exams`, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!r.ok) {
        const res = new Response(JSON.stringify({ error: 'Insert failed', details: await r.text() }), { status: 500 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      const row = await r.json();
      const res = new Response(JSON.stringify(Array.isArray(row) ? row[0] : row), { status: 201 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const res = new Response('Method Not Allowed', { status: 405 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}