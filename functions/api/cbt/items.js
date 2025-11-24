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
      const defaultColumns = 'id,question,type,tags,learning_objectives,difficulty,marks,tenant_id,created_at,updated_at';
      const select = url.searchParams.get('select') || defaultColumns;

      if (select.trim() === '*') {
        const res = new Response(JSON.stringify({ error: 'Broad SELECT * queries are not allowed. Please specify explicit columns.' }), { status: 400 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }

      const baseUrl = `${env.SUPABASE_URL}/rest/v1/cbt_items`;
      const type = url.searchParams.get('type');
      const tags = url.searchParams.get('tags');
      const lo = url.searchParams.get('lo');
      const dmin = url.searchParams.get('difficultyMin');
      const dmax = url.searchParams.get('difficultyMax');
      const idsParam = url.searchParams.get('ids');

      const buildParams = () => {
        const params = new URLSearchParams();
        params.set('select', select);
        params.set('limit', String(limit));
        if (type) params.set('type', `eq.${type}`);
        if (tags) params.set('tags', `cs.{${tags}}`);
        if (lo) params.set('learning_objectives', `cs.{${lo}}`);
        if (dmin) params.set('difficulty', `gte.${dmin}`);
        if (dmax) params.set('difficulty', `lte.${dmax}`);
        return params;
      };

      if (idsParam && idsParam.trim()) {
        const idsList = idsParam.split(',').map(s => s.trim()).filter(Boolean);
        const chunkSize = 200;
        const chunks = [];
        for (let i = 0; i < idsList.length; i += chunkSize) {
          chunks.push(idsList.slice(i, i + chunkSize));
        }
        let combined = [];
        for (const chunk of chunks) {
          const params = buildParams();
          params.set('id', `in.(${chunk.join(',')})`);
          const r = await fetch(`${baseUrl}?${params.toString()}`, { headers });
          if (!r.ok) {
            const res = new Response(JSON.stringify({ error: 'Query failed', details: await r.text() }), { status: 500 });
            Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
            return res;
          }
          const rows = await r.json();
          combined = combined.concat(rows);
          if (combined.length >= limit) break;
        }
        const res = new Response(JSON.stringify(combined.slice(0, limit)), { status: 200 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      } else {
        const params = buildParams();
        const r = await fetch(`${baseUrl}?${params.toString()}`, { headers });
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
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const tenantId = body?.tenant_id || auth.user?.user_metadata?.tenant_id;
      const payload = { ...body, tenant_id: tenantId };
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_items`, { method: 'POST', headers, body: JSON.stringify(payload) });
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