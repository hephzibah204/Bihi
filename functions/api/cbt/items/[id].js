import { handleCors } from '../../../_lib/cors';
import { requirePlatformRoles } from '../../../_lib/auth';

function json(headers) {
  const res = new Response('', { status: 200 });
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, PUT, DELETE, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requirePlatformRoles(request, env, ['Super Admin', 'School Admin', 'Teacher']);
  if (!auth.ok) return auth.res;

  try {
    if (request.method === 'OPTIONS') {
      return json(corsHeaders);
    }

    const id = params?.id;
    const token = request.headers.get('Authorization');
    const headers = { 'Authorization': token, 'apikey': env.SUPABASE_ANON_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' };

    if (request.method === 'GET') {
      const q = new URL(`${env.SUPABASE_URL}/rest/v1/cbt_items`);
      q.searchParams.set('select', '*');
      q.searchParams.set('id', `eq.${id}`);
      const r = await fetch(q.toString(), { headers });
      if (!r.ok) {
        const res = new Response(JSON.stringify({ error: 'Query failed', details: await r.text() }), { status: 500 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      const rows = await r.json();
      const row = Array.isArray(rows) ? rows[0] : rows;
      const res = new Response(JSON.stringify(row || null), { status: row ? 200 : 404 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_items?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (!r.ok) {
        const res = new Response(JSON.stringify({ error: 'Update failed', details: await r.text() }), { status: 500 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      const rows = await r.json();
      const row = Array.isArray(rows) ? rows[0] : rows;
      const res = new Response(JSON.stringify(row), { status: 200 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (request.method === 'DELETE') {
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_items?id=eq.${id}`, { method: 'DELETE', headers });
      if (!r.ok) {
        const res = new Response(JSON.stringify({ error: 'Delete failed', details: await r.text() }), { status: 500 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
      const res = new Response('', { status: 204 });
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