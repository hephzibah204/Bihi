// functions/_lib/schema.js
// Resolve actual column names for tenants table, supporting camelCase and snake_case.

export async function resolveTenantColumns(env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};

  const fallback = {
    subscriptionStatus: null,
    trialEndDate: null,
    planId: null,
    slug: null,
    subdomain: null,
  };

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return fallback;
  }

  const headers = {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Accept: 'application/json',
  };

  try {
    const url = `${SUPABASE_URL}/rest/v1/pg_meta.columns?select=name,table,schema&table=eq.tenants&schema=eq.public`;
    const res = await fetch(url, { headers });
    if (!res.ok) return fallback;
    const cols = await res.json();
    const names = new Set((cols || []).map(c => c.name));

    const pick = (camel, snake) => (names.has(camel) ? camel : (names.has(snake) ? snake : null));
    const pickAny = (...variants) => variants.find(v => names.has(v)) || null;

    return {
      subscriptionStatus: pick('subscriptionStatus', 'subscription_status'),
      trialEndDate: pick('trialEndDate', 'trial_end_date'),
      planId: pick('planId', 'plan_id'),
      // Optional routing/identity helpers if present in schema
      slug: pickAny('slug'),
      subdomain: pickAny('subdomain', 'sub_domain', 'domain'),
    };
  } catch (err) {
    return fallback;
  }
}

// Resolve columns for teachers table (authId vs auth_id, tenantId vs tenant_id)
export async function resolveTeachersColumns(env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
  // Prefer safe snake_case defaults when we cannot query pg_meta
  // Fallbacks should only include columns we are confident exist universally.
  // Avoid defaulting authId to 'auth_id' to prevent PostgREST cache errors when it doesn't exist.
  const fallback = { authId: null, tenantId: 'tenant_id', email: 'email', name: 'full_name', role: 'role' };
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return fallback;

  const headers = {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Accept: 'application/json',
  };

  try {
    const url = `${SUPABASE_URL}/rest/v1/pg_meta.columns?select=name,table,schema&table=eq.teachers&schema=eq.public`;
    const res = await fetch(url, { headers });
    if (!res.ok) return fallback;
    const cols = await res.json();
    const names = new Set((cols || []).map(c => c.name));
    const pick = (camel, snake, alt) => {
      if (names.has(camel)) return camel;
      if (names.has(snake)) return snake;
      if (alt && names.has(alt)) return alt;
      return null;
    };
    return {
      authId: pick('authId', 'auth_id', 'user_id'),
      tenantId: pick('tenantId', 'tenant_id'),
      email: pick('email', 'email_address', 'emailAddress'),
      name: pick('name', 'full_name', 'display_name'),
      role: pick('role', 'user_role'),
    };
  } catch (err) {
    return fallback;
  }
}