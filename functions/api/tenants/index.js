// functions/api/tenants/index.js
import { handleCors } from '../../_lib/cors';
import { requireSuperAdmin } from '../../_lib/auth';
import { resolveTenantColumns, resolveTeachersColumns } from '../../_lib/schema';

async function listTenants(env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Accept': 'application/json'
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=*`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}

async function createTenant(env, body) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
  const headers = {
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Content-Type': 'application/json'
  };

  const { schoolName, slug, schoolType, adminEmail, adminPassword, adminName } = body || {};
  if (!schoolName || !slug || !adminEmail || !adminPassword || !adminName) {
    throw new Error('Missing required fields');
  }

  // 1) Create tenant
  const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const columns = await resolveTenantColumns(env);
  const tenantPayload = { id: slug, name: schoolName };
  // Populate optional routing fields if present in schema
  if (columns.slug) tenantPayload[columns.slug] = slug;
  if (columns.subdomain) tenantPayload[columns.subdomain] = slug;
  if (columns.subscriptionStatus) tenantPayload[columns.subscriptionStatus] = 'trial';
  if (columns.trialEndDate) tenantPayload[columns.trialEndDate] = trialExpiry;
  const tRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
    method: 'POST', headers, body: JSON.stringify(tenantPayload)
  });
  if (!tRes.ok) {
    const text = await tRes.text();
    throw new Error(`Failed to create tenant: ${text}`);
  }

  // 2) Create auth user (admin)
  const uRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST', headers,
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { tenant_id: slug, full_name: adminName, platform_role: 'Tenant Admin' }
    })
  });
  const uData = await uRes.json();
  if (!uRes.ok) {
    // rollback tenant
    await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${slug}`, { method: 'DELETE', headers });
    throw new Error(uData?.msg || 'Failed to create admin user');
  }

  // 3) Create teachers row (schema-aware)
  const tcols = await resolveTeachersColumns(env);
  const tPayload = {};
  if (tcols.authId) tPayload[tcols.authId] = uData.id;
  if (tcols.tenantId) tPayload[tcols.tenantId] = slug;
  if (tcols.name) tPayload[tcols.name] = adminName;
  if (tcols.email) tPayload[tcols.email] = adminEmail;
  if (tcols.role) tPayload[tcols.role] = 'Admin';
  const teachRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers`, {
    method: 'POST', headers,
    body: JSON.stringify(tPayload)
  });
  if (!teachRes.ok) {
    await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${uData.id}`, { method: 'DELETE', headers });
    await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${slug}`, { method: 'DELETE', headers });
    throw new Error(`Failed to create admin profile`);
  }

  // 4) Seed defaults (settings, subjects)
  const defaultSubjects = [
    { name: 'Mathematics', classes: ['JSS 1','JSS 2','JSS 3','SSS 1','SSS 2','SSS 3'] },
    { name: 'English Language', classes: ['JSS 1','JSS 2','JSS 3','SSS 1','SSS 2','SSS 3'] },
  ];
  const defaultSettings = {
    session: '2023/2024', term: 'First Term', schoolName, schoolType,
    gradingSystem: [
      { grade: 'A', from: 75, to: 100, remark: 'Excellent' },
      { grade: 'B', from: 65, to: 74, remark: 'Very Good' },
      { grade: 'C', from: 50, to: 64, remark: 'Good' }
    ],
    maxCa1: 20, maxCa2: 20, maxExam: 60,
  };
  await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/settings`, { method: 'POST', headers, body: JSON.stringify({ ...defaultSettings, tenant_id: slug, id: 1 }) }),
    fetch(`${SUPABASE_URL}/rest/v1/subjects`, { method: 'POST', headers, body: JSON.stringify(defaultSubjects.map(s => ({ ...s, tenant_id: slug }))) })
  ]);

  return { id: slug, name: schoolName, adminEmail };
}

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requireSuperAdmin(request, env);
  if (!auth.ok) return auth.res;

  try {
    let res;
    if (request.method === 'GET') {
      const tenants = await listTenants(env);
      res = new Response(JSON.stringify(tenants), { status: 200 });
    } else if (request.method === 'POST') {
      const body = await request.json();
      const created = await createTenant(env, body);
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