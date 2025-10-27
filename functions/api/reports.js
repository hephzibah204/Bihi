// functions/api/reports.js
import { handleCors } from '../_lib/cors';
import { requireSuperAdmin } from '../_lib/auth';

const jsonHeaders = (env) => ({
  'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
  'Accept': 'application/json'
});

async function fetchAll(env, path) {
  const res = await fetch(`${env.SUPABASE_URL}${path}`, { headers: jsonHeaders(env) });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  try {
    if (request.method !== 'GET') {
      const res = new Response('Method Not Allowed', { status: 405 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const url = new URL(request.url);
    const rangeDaysRaw = parseInt(url.searchParams.get('range') || '30', 10);
    const rangeDays = [7, 30, 90].includes(rangeDaysRaw) ? rangeDaysRaw : 30;

    // Core counts
    const tenants = await fetchAll(env, `/rest/v1/tenants?select=id,name`);
    const teachers = await fetchAll(env, `/rest/v1/teachers?select=id`);

    // Predefined windows for compatibility
    const since7 = encodeURIComponent(isoDaysAgo(7));
    const since30 = encodeURIComponent(isoDaysAgo(30));

    const comm7 = await fetchAll(env, `/rest/v1/communication_logs?select=id,channel,type,sentAt&sentAt=gte.${since7}&limit=10000`);
    const comm30 = await fetchAll(env, `/rest/v1/communication_logs?select=id,channel,type,sentAt&sentAt=gte.${since30}&limit=10000`);

    const sinceRange = encodeURIComponent(isoDaysAgo(rangeDays));
    const commRange = await fetchAll(env, `/rest/v1/communication_logs?select=id,channel,type,sentAt,tenant_id&sentAt=gte.${sinceRange}&limit=10000`);

    const countByChannel = (arr) => ({
      sms: arr.filter(x => x.channel === 'sms').length,
      email: arr.filter(x => x.channel === 'email').length,
      total: arr.length
    });

    // Daily series
    const seriesMap = new Map();
    for (const c of commRange) {
      const key = formatDate(c.sentAt || c.sentat || c.sent_at);
      if (!seriesMap.has(key)) seriesMap.set(key, { date: key, sms: 0, email: 0, total: 0 });
      const bucket = seriesMap.get(key);
      if (c.channel === 'sms') bucket.sms += 1; else if (c.channel === 'email') bucket.email += 1;
      bucket.total += 1;
    }
    const series = Array.from(seriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Top tenants by communications
    const byTenant = new Map();
    for (const c of commRange) {
      const t = c.tenant_id || 'unknown';
      byTenant.set(t, (byTenant.get(t) || 0) + 1);
    }
    const tenantNameMap = new Map(tenants.map(t => [t.id, t.name]));
    const topTenants = Array.from(byTenant.entries())
      .map(([id, total]) => ({ id, name: tenantNameMap.get(id) || id, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const payload = {
      tenants: tenants.length,
      teachers: teachers.length,
      comms: {
        last7: countByChannel(comm7),
        last30: countByChannel(comm30),
        range: {
          days: rangeDays,
          ...countByChannel(commRange),
          series,
          topTenants
        }
      }
    };

    const res = new Response(JSON.stringify(payload), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
