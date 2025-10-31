// functions/api/env-check.js
import { handleCors } from '../_lib/cors';
import { resolveTenantColumns, resolveTeachersColumns } from '../_lib/schema';

async function checkSupabase(env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = env || {};
  const result = {
    env: {
      hasSupabaseUrl: Boolean(SUPABASE_URL),
      hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      hasAnonKey: Boolean(SUPABASE_ANON_KEY),
      supabaseUrlHost: SUPABASE_URL ? (new URL(SUPABASE_URL)).host : null,
    },
    checks: {
      tenantsBasic: null,
      tenantsColumns: null,
    }
  };

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return result;
  }

  const adminHeaders = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Accept': 'application/json'
  };

  // Basic connectivity check
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=id&limit=1`, { headers: adminHeaders });
    result.checks.tenantsBasic = {
      ok: res.ok,
      status: res.status,
      error: res.ok ? null : (await res.text()).slice(0, 500)
    };
  } catch (err) {
    result.checks.tenantsBasic = { ok: false, status: 0, error: err?.message };
  }

  // Schema / column presence check with fallback to snake_case
  try {
    const cols = await resolveTenantColumns(env);
    const selectParts = ['id'];
    if (cols.subscriptionStatus) selectParts.push(cols.subscriptionStatus);
    if (cols.trialEndDate) selectParts.push(cols.trialEndDate);
    const select = encodeURIComponent(selectParts.join(','));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=${select}&limit=1`, { headers: adminHeaders });
    result.checks.tenantsColumns = {
      ok: res.ok,
      status: res.status,
      using: selectParts,
      error: res.ok ? null : (await res.text()).slice(0, 500)
    };
    result.checks.tenantsMeta = cols;
  } catch (err) {
    result.checks.tenantsColumns = { ok: false, status: 0, error: err?.message };
    result.checks.tenantsMeta = { error: err?.message };
  }

  // Teachers column presence check (authId vs auth_id, tenantId, email)
  try {
    const tcols = await resolveTeachersColumns(env);
    const tSelectParts = ['id'];
    if (tcols.authId) tSelectParts.push(tcols.authId);
    if (tcols.tenantId) tSelectParts.push(tcols.tenantId);
    if (tcols.email) tSelectParts.push(tcols.email);
    if (tcols.name) tSelectParts.push(tcols.name);
    const tSelect = encodeURIComponent(tSelectParts.join(','));
    const tres = await fetch(`${SUPABASE_URL}/rest/v1/teachers?select=${tSelect}&limit=1`, { headers: adminHeaders });
    result.checks.teachersColumns = {
      ok: tres.ok,
      status: tres.status,
      using: tSelectParts,
      error: tres.ok ? null : (await tres.text()).slice(0, 500)
    };
    result.checks.teachersMeta = tcols;
  } catch (err) {
    result.checks.teachersColumns = { ok: false, status: 0, error: err?.message };
    result.checks.teachersMeta = { error: err?.message };
  }

  return result;
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403 });

  if (request.method !== 'GET') {
    const res = new Response('Method Not Allowed', { status: 405 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  try {
    const data = await checkSupabase(env);
    const res = new Response(JSON.stringify({ ok: true, data }), { status: 200 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ ok: false, error: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}