// functions/api/security-scan.js
import { handleCors } from '../_lib/cors';
import { requireSuperAdmin } from '../_lib/auth';

async function logFinding(env, finding) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  };
  await fetch(`${SUPABASE_URL}/rest/v1/security_findings`, { method: 'POST', headers, body: JSON.stringify(finding) });
}

async function listFindings(env, limit = 20) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Accept': 'application/json'
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/security_findings?select=*&order=created_at.desc&limit=${limit}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, POST, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  try {
    if (request.method === 'GET') {
      const data = await listFindings(env);
      const res = new Response(JSON.stringify(data), { status: 200 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    if (request.method !== 'POST') {
      const res = new Response('Method Not Allowed', { status: 405 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const body = await request.json().catch(() => ({}));
    const clientEnv = body?.clientEnv || {};

    const findings = [];
    // Check env presence
    if (!env.SUPABASE_URL) findings.push({ category: 'config', severity: 'HIGH', message: 'SUPABASE_URL missing', details: {} });
    if (!env.SUPABASE_SERVICE_ROLE_KEY) findings.push({ category: 'config', severity: 'HIGH', message: 'SUPABASE_SERVICE_ROLE_KEY missing', details: {} });
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) findings.push({ category: 'config', severity: 'PASS', message: 'Core env present', details: {} });

    // Client hint: service role key in client env (should never happen)
    if (clientEnv.hasServiceRoleKey) findings.push({ category: 'client', severity: 'HIGH', message: 'Service role key exposed client-side', details: {} });

    // Persist
    await Promise.all(findings.map(f => logFinding(env, f)));

    const res = new Response(JSON.stringify({ ok: true, findings }), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}