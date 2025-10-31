// functions/api/tenants/[tenantId]/admin.js
import { handleCors } from '../../../_lib/cors';
import { requireSuperAdmin } from '../../../_lib/auth';
import { resolveTeachersColumns } from '../../../_lib/schema';

async function createTenantAdmin(env, tenantId, body) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  };
  const { adminEmail, adminPassword, adminName } = body || {};
  if (!adminEmail || !adminPassword || !adminName) throw new Error('Missing adminEmail, adminPassword, adminName');

  // Create auth user
  const uRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST', headers,
    body: JSON.stringify({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { tenant_id: tenantId, full_name: adminName, platform_role: 'Tenant Admin' } })
  });
  const uData = await uRes.json();
  if (!uRes.ok) throw new Error(uData?.msg || 'Failed to create admin user');

  // Teacher row (schema-aware)
  const tcols = await resolveTeachersColumns(env);
  const tPayload = {};
  if (tcols.name) tPayload[tcols.name] = adminName;
  if (tcols.email) tPayload[tcols.email] = adminEmail;
  if (tcols.role) tPayload[tcols.role] = 'Admin';
  if (tcols.authId) tPayload[tcols.authId] = uData.id;
  if (tcols.tenantId) tPayload[tcols.tenantId] = tenantId;
  const teachRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers`, {
    method: 'POST', headers, body: JSON.stringify(tPayload)
  });
  if (!teachRes.ok) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uData.id}`, { method: 'DELETE', headers });
    throw new Error('Failed to create admin profile');
  }
  return { userId: uData.id, email: adminEmail };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  const tenantId = params?.tenantId;
  if (!tenantId) {
    const res = new Response(JSON.stringify({ error: 'Missing tenantId' }), { status: 400 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  try {
    if (request.method !== 'POST') {
      const res = new Response('Method Not Allowed', { status: 405 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    const body = await request.json();
    const created = await createTenantAdmin(env, tenantId, body);
    const res = new Response(JSON.stringify(created), { status: 201 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}