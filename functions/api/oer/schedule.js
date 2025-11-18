import { handleCors } from '../../_lib/cors.js';
import { requireSuperAdmin } from '../../_lib/auth.js';

export const onRequestPost = async ({ request, env }) => {
  const { response: corsResponse, corsHeaders } = handleCors(request, env, 'POST, OPTIONS');
  if (corsResponse) return corsResponse;
  const { ok, res } = await requireSuperAdmin(request, env);
  if (!ok) { Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v)); return res; }
  try {
    const body = await request.json();
    const sources = Array.isArray(body?.sources) ? body.sources : ['OpenStax','LibreTexts'];
    const endpoint = new URL(request.url);
    endpoint.pathname = '/api/oer/index';
    const r = await fetch(endpoint.toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sources }) });
    const okResp = r.ok ? await r.json() : { ok: false };
    const response = new Response(JSON.stringify(okResp), { headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  } catch (e) {
    const response = new Response(JSON.stringify({ ok: false, error: 'schedule_failed', message: e?.message || 'Failed' }), { status: 500, headers: { 'content-type': 'application/json' } });
    Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }
};

