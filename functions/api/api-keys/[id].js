// functions/api/api-keys/[id].js
import { handleCors } from '../../_lib/cors';
import { requireSuperAdmin } from '../../_lib/auth';

export async function onRequest(context) {
  const { request, env, params } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'PATCH, DELETE, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  const id = params?.id;
  if (!id) {
    const res = new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  const headers = { 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' };

  try {
    let res;
    if (request.method === 'PATCH') {
      const body = await request.json();
      const patch = {};
      if (body?.status && (body.status === 'revoked' || body.status === 'active')) patch['status'] = body.status;
      if (Object.keys(patch).length === 0) {
        res = new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400 });
      } else {
        const r = await fetch(`${env.SUPABASE_URL}/rest/v1/api_keys?id=eq.${id}`, { method: 'PATCH', headers, body: JSON.stringify(patch) });
        if (!r.ok) throw new Error(await r.text());
        res = new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
    } else if (request.method === 'DELETE') {
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/api_keys?id=eq.${id}`, { method: 'DELETE', headers });
      if (!r.ok) throw new Error(await r.text());
      res = new Response(JSON.stringify({ ok: true }), { status: 200 });
    } else {
      res = new Response('Method Not Allowed', { status: 405 });
    }
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}