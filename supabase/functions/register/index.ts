// supabase/functions/register/index.ts
// Supabase Edge Function to handle school registration.
// Creates tenant, admin auth user, teacher profile (schema-aware), and seeds defaults.

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/reportsheet\.com\.ng$/,
  /^https:\/\/.+\.reportsheet\.com\.ng$/,
  /^https:\/\/reportsheet\.pages\.dev$/,
  /^https:\/\/.+\.pages\.dev$/,
  /^https:\/\/([a-z0-9-]+\.)?aistudio\.google\.com$/,
  /^https:\/\/.+\.googleusercontent\.com$/,
  /^https:\/\/.+\.web\.app$/,
  /^https:\/\/.*\.google\.internal$/,
];

function handleCors(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  };
  let isAllowed = false;
  if (origin && allowedOriginPatterns.some((p) => p.test(origin))) {
    headers["Access-Control-Allow-Origin"] = origin;
    isAllowed = true;
  }
  if (req.method === "OPTIONS") {
    return { response: new Response(null, { headers }), corsHeaders: headers, isAllowed };
  }
  return { response: null as Response | null, corsHeaders: headers, isAllowed };
}

const defaultSubjects = [
  { name: "Mathematics", classes: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"] },
  { name: "English Language", classes: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"] },
  { name: "Basic Science", classes: ["JSS 1", "JSS 2"] },
  { name: "Basic Technology", classes: ["JSS 1", "JSS 2"] },
  { name: "Social Studies", classes: ["JSS 1", "JSS 2", "JSS 3"] },
  { name: "Physics", classes: ["SSS 1", "SSS 2", "SSS 3"] },
  { name: "Chemistry", classes: ["SSS 1", "SSS 2", "SSS 3"] },
  { name: "Biology", classes: ["SSS 1", "SSS 2", "SSS 3"] },
  { name: "Agricultural Science", classes: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"] },
  { name: "Civic Education", classes: ["JSS 1", "JSS 2", "JSS 3", "SSS 1", "SSS 2", "SSS 3"] },
];

const defaultSettings = {
  session: "2023/2024",
  term: "First Term",
  gradingSystem: [
    { grade: "A", from: 75, to: 100, remark: "Excellent" },
    { grade: "B", from: 65, to: 74, remark: "Very Good" },
    { grade: "C", from: 50, to: 64, remark: "Good" },
    { grade: "D", from: 45, to: 49, remark: "Fair" },
    { grade: "E", from: 40, to: 44, remark: "Weak" },
    { grade: "F", from: 0, to: 39, remark: "Fail" },
  ],
  maxCa1: 20,
  maxCa2: 20,
  maxExam: 60,
  reportCardSettings: {
    principalName: "The Principal",
    schoolMotto: "Excellence and Integrity",
    sections: [
      { id: "academics", title: "Academic Performance", enabled: true },
      { id: "attendance", title: "Attendance Record", enabled: true },
      { id: "affective", title: "Affective Domain", enabled: true },
      { id: "psychomotor", title: "Psychomotor Skills", enabled: true },
      { id: "comment", title: "General Comment", enabled: true },
    ],
    affectiveSkills: [
      { id: "skill_1", label: "Punctuality" },
      { id: "skill_2", label: "Neatness" },
    ],
    psychomotorSkills: [
      { id: "skill_5", label: "Handwriting" },
      { id: "skill_6", label: "Games & Sports" },
    ],
  },
};

async function resolveTenantColumns(env: Record<string, string | undefined>) {
  const SUPABASE_URL = env["SUPABASE_URL"];
  const SUPABASE_SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];
  const fallback = {
    subscriptionStatus: null as string | null,
    trialEndDate: null as string | null,
    planId: null as string | null,
    slug: null as string | null,
    subdomain: null as string | null,
  };
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return fallback;
  const headers = {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Accept: "application/json",
  };
  try {
    const url = `${SUPABASE_URL}/rest/v1/pg_meta.columns?select=name,table,schema&table=eq.tenants&schema=eq.public`;
    const res = await fetch(url, { headers });
    if (!res.ok) return fallback;
    const cols = (await res.json()) as Array<{ name: string }>;
    const names = new Set(cols.map((c) => c.name));
    const pick = (camel: string, snake: string) =>
      names.has(camel) ? camel : names.has(snake) ? snake : null;
    const pickAny = (...variants: string[]) => variants.find((v) => names.has(v)) || null;
    return {
      subscriptionStatus: pick("subscriptionStatus", "subscription_status"),
      trialEndDate: pick("trialEndDate", "trial_end_date"),
      planId: pick("planId", "plan_id"),
      slug: pickAny("slug"),
      subdomain: pickAny("subdomain", "sub_domain", "domain"),
    };
  } catch (err) {
    return fallback;
  }
}

async function resolveTeachersColumns(env: Record<string, string | undefined>) {
  const SUPABASE_URL = env["SUPABASE_URL"];
  const SUPABASE_SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];
  const fallback = {
    authId: null as string | null,
    tenantId: "tenant_id",
    email: "email",
    name: "full_name",
    role: "role",
  };
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return fallback;
  const headers = {
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Accept: "application/json",
  };
  try {
    const url = `${SUPABASE_URL}/rest/v1/pg_meta.columns?select=name,table,schema&table=eq.teachers&schema=eq.public`;
    const res = await fetch(url, { headers });
    if (!res.ok) return fallback;
    const cols = (await res.json()) as Array<{ name: string }>;
    const names = new Set(cols.map((c) => c.name));
    const pick = (camel: string, snake: string, alt?: string) => {
      if (names.has(camel)) return camel;
      if (names.has(snake)) return snake;
      if (alt && names.has(alt)) return alt;
      return null;
    };
    return {
      authId: pick("authId", "auth_id", "user_id"),
      tenantId: pick("tenantId", "tenant_id"),
      email: pick("email", "email_address", "emailAddress") || "email",
      name: pick("name", "full_name", "display_name") || "full_name",
      role: pick("role", "user_role") || "role",
    };
  } catch (err) {
    return fallback;
  }
}

serve(async (req: Request) => {
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(req);
  if (corsResponse) return corsResponse;
  if (!isAllowed) {
    const res = new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), { status: 403 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  if (req.method !== "POST") {
    const res = new Response("Method Not Allowed", { status: 405 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  try {
    const env = {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL"),
      SUPABASE_SERVICE_ROLE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    };
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      const res = new Response(JSON.stringify({ error: "Server not configured for registration." }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const body = await req.json();
    const { schoolName, subdomain, adminEmail, adminPassword, adminName, schoolType } = body || {};
    if (!schoolName || !subdomain || !adminEmail || !adminPassword || !adminName) {
      const res = new Response(JSON.stringify({ error: "Missing required fields." }), { status: 400 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const adminHeaders = {
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: env.SUPABASE_SERVICE_ROLE_KEY!,
      "Content-Type": "application/json",
    };

    const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    // Step 1: Create Tenant
    const tcols = await resolveTenantColumns(env);
    const tenantPayload: Record<string, any> = { id: subdomain, name: schoolName };
    if (tcols.slug) tenantPayload[tcols.slug] = subdomain;
    if (tcols.subdomain) tenantPayload[tcols.subdomain] = subdomain;
    if (tcols.subscriptionStatus) tenantPayload[tcols.subscriptionStatus] = "trial";
    if (tcols.trialEndDate) tenantPayload[tcols.trialEndDate] = trialExpiry;
    const tenantRes = await fetch(`${env.SUPABASE_URL}/rest/v1/tenants`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(tenantPayload),
    });
    if (!tenantRes.ok) {
      let raw = "";
      try {
        raw = await tenantRes.text();
      } catch {}
      let tenantError: any = {};
      try {
        tenantError = JSON.parse(raw || "{}");
      } catch {}
      const msg = tenantError.message || raw || `Failed to create school record (status ${tenantRes.status}).`;
      const res = new Response(JSON.stringify({ error: "Registration failed", details: msg }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Step 2: Create Auth User
    const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { tenant_id: subdomain, full_name: adminName },
      }),
    });
    let userData: any = {};
    try {
      userData = await userRes.json();
    } catch {}
    if (!userRes.ok) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { method: "DELETE", headers: adminHeaders });
      const raw = userData?.msg || `Failed to create admin user (status ${userRes.status}).`;
      const res = new Response(JSON.stringify({ error: "Registration failed", details: raw }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Step 3: Create Teacher Profile (schema-aware)
    const teacherCols = await resolveTeachersColumns(env);
    const teacherPayload: Record<string, any> = {};
    if (teacherCols.name) teacherPayload[teacherCols.name] = adminName;
    if (teacherCols.email) teacherPayload[teacherCols.email] = adminEmail;
    if (teacherCols.role) teacherPayload[teacherCols.role] = "Admin";
    if (teacherCols.authId) teacherPayload[teacherCols.authId] = userData.id;
    if (teacherCols.tenantId) teacherPayload[teacherCols.tenantId] = subdomain;
    const teacherRes = await fetch(`${env.SUPABASE_URL}/rest/v1/teachers`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify(teacherPayload),
    });
    let teacherCreationWarning: string | null = null;
    if (!teacherRes.ok) {
      let raw = "";
      try {
        raw = await teacherRes.text();
      } catch {}
      teacherCreationWarning = raw || `Admin profile creation failed (status ${teacherRes.status}). Please complete admin setup after signing in.`;
      // Do NOT rollback tenant or auth user on teacher creation failure.
    }

    // Step 4: Seed Data
    await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/settings`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ ...defaultSettings, schoolName, schoolType, tenant_id: subdomain, id: 1 }),
      }),
      fetch(`${env.SUPABASE_URL}/rest/v1/subjects`, {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify(defaultSubjects.map((s) => ({ ...s, tenant_id: subdomain }))),
      }),
    ]);

    const res = new Response(
      JSON.stringify({ message: "Registration successful!", teacherProfileCreated: !teacherCreationWarning, warning: teacherCreationWarning || undefined }),
      { status: 201 },
    );
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (err: any) {
    const res = new Response(JSON.stringify({ error: "Registration failed", details: err?.message || String(err) }), { status: 500 });
    // Add CORS headers to the error response too
    const { corsHeaders } = handleCors(req);
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
});