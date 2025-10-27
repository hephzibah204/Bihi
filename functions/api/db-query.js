// functions/api/db-query.js
import { handleCors } from '../_lib/cors';
import { requireSuperAdmin } from '../_lib/auth';

function parseSelect(sql) {
  if (typeof sql !== 'string') return null;
  const s = sql.trim().replace(/;$/, '');
  const m = s.match(/^select\s+([\*a-z0-9_,\s]+)\s+from\s+([a-zA-Z0-9_]+)(?:\s+limit\s+(\d+))?$/i);
  if (!m) return null;
  const columns = m[1].trim();
  const table = m[2].trim();
  const limit = m[3] ? Math.min(parseInt(m[3], 10), 1000) : 100;
  return { columns, table, limit };
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'POST, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  try {
    if (request.method !== 'POST') {
      const res = new Response('Method Not Allowed', { status: 405 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const body = await request.json();
    const sql = body?.sql || '';
    const parsed = parseSelect(sql);
    if (!parsed) {
      const res = new Response(JSON.stringify({ error: 'Only simple SELECT queries are supported, e.g., SELECT * FROM students LIMIT 50' }), { status: 400 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const { table, columns, limit } = parsed;
    const headers = {
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Accept': 'application/json'
    };
    const url = `${env.SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?select=${encodeURIComponent(columns)}&limit=${limit}`;
    const r = await fetch(url, { headers });
    if (!r.ok) {
      const res = new Response(JSON.stringify({ error: 'Query failed', details: await r.text() }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const rows = await r.json();
    const res = new Response(JSON.stringify({ rows, count: rows.length }), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}