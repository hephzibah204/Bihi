// functions/api/api-keys/index.js
import { handleCors } from '../../_lib/cors';
import { requireSuperAdmin } from '../../_lib/auth';

function maskKey(k) {
  if (!k || k.length < 8) return '••••••••';
  return `${k.slice(0, 4)}••••••••${k.slice(-4)}`;
}

function genKey(env) {
  const prefix = env === 'production' ? 'sk_live_' : 'sk_test_';
  const rand = crypto.getRandomValues(new Uint8Array(24)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');
  return prefix + rand.slice(0, 40);
}

async function listKeys(env) {
  const headers = { 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Accept': 'application/json' };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/api_keys?select=*`, { headers });
  if (!res.ok) throw new Error(await res.text());
  const arr = await res.json();
  return arr.map(k => ({
    id: k.id,
    name: k.name,
    key_preview: maskKey(k.key),
    environment: k.environment,
    permissions: k.permissions || [],
    rateLimit: k.rate_limit,
    createdAt: k.created_at,
    lastUsed: k.last_used,
    status: k.status
  }));
}

async function createKey(env, body) {
  const name = (body?.name || '').trim();
  const environment = body?.environment === 'production' ? 'production' : 'development';
  const permissions = Array.isArray(body?.permissions) ? body.permissions : [];
  const rate_limit = Number.isFinite(body?.rateLimit) ? Math.max(1, Math.floor(body.rateLimit)) : 1000;
  if (!name) throw new Error('Name is required');
  const key = genKey(environment);
  const headers = { 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' };
  const payload = { name, key, environment, permissions, rate_limit, status: 'active' };
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/api_keys`, { method: 'POST', headers, body: JSON.stringify(payload) });
  if (!res.ok) throw new Error(await res.text());
  const [row] = await res.json();
  return { id: row.id, name, key, environment, permissions, rateLimit: rate_limit, status: 'active', createdAt: row.created_at };
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
      const keys = await listKeys(env);
      res = new Response(JSON.stringify(keys), { status: 200 });
    } else if (request.method === 'POST') {
      const body = await request.json();
      const created = await createKey(env, body);
      res = new Response(JSON.stringify(created), { status: 201 });
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