// functions/_lib/schema.js
// Resolve actual column names for tenants table, supporting camelCase and snake_case.

export async function resolveTenantColumns(env) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};

  const fallback = {
    subscriptionStatus: null,
    trialEndDate: null,
    planId: null,
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

    return {
      subscriptionStatus: pick('subscriptionStatus', 'subscription_status'),
      trialEndDate: pick('trialEndDate', 'trial_end_date'),
      planId: pick('planId', 'plan_id'),
    };
  } catch (err) {
    return fallback;
  }
}