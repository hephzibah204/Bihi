// functions/api/webhooks/index.js
import { handleCors } from '../../_lib/cors';
import { requireSuperAdmin } from '../../_lib/auth';

async function listWebhooks(env) {
  const headers = { 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Accept': 'application/json' };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/webhooks?select=*`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

async function createWebhook(env, body) {
  const url = (body?.url || '').trim();
  const events = Array.isArray(body?.events) ? body.events : [];
  if (!url) throw new Error('url is required');
  const headers = { 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/webhooks`, { method: 'POST', headers, body: JSON.stringify({ url, events, status: 'active' }) });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json())[0];
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, POST, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  try {
    let res;
    if (request.method === 'GET') {
      const rows = await listWebhooks(env);
      res = new Response(JSON.stringify(rows), { status: 200 });
    } else if (request.method === 'POST') {
      const body = await request.json();
      const row = await createWebhook(env, body);
      res = new Response(JSON.stringify(row), { status: 201 });
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