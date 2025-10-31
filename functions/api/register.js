// functions/api/register.js

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

function handleCors(request) {
    const origin = request.headers.get("Origin");
    const headers = {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    let isAllowed = false;

    if (origin && allowedOriginPatterns.some((p) => p.test(origin))) {
        headers["Access-Control-Allow-Origin"] = origin;
        isAllowed = true;
    }

    if (request.method === "OPTIONS") {
        return { response: new Response(null, { headers }), corsHeaders: headers, isAllowed };
    }

    return { response: null, corsHeaders: headers, isAllowed };
}

// ... (defaultSubjects and defaultSettings remain the same) ...
const defaultSubjects = [
    { name: 'Mathematics', classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] },
    { name: 'English Language', classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] },
    { name: 'Basic Science', classes: ['JSS 1', 'JSS 2'] },
    { name: 'Basic Technology', classes: ['JSS 1', 'JSS 2'] },
    { name: 'Social Studies', classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { name: 'Physics', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
    { name: 'Chemistry', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
    { name: 'Biology', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
    { name: 'Agricultural Science', classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] },
    { name: 'Civic Education', classes: ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'] },
];

const defaultSettings = {
    session: "2023/2024",
    term: "First Term",
    gradingSystem: [
        { grade: 'A', from: 75, to: 100, remark: 'Excellent' },
        { grade: 'B', from: 65, to: 74, remark: 'Very Good' },
        { grade: 'C', from: 50, to: 64, remark: 'Good' },
        { grade: 'D', from: 45, to: 49, remark: 'Fair' },
        { grade: 'E', from: 40, to: 44, remark: 'Weak' },
        { grade: 'F', from: 0, to: 39, remark: 'Fail' },
    ],
    maxCa1: 20,
    maxCa2: 20,
    maxExam: 60,
    reportCardSettings: {
        principalName: 'The Principal',
        schoolMotto: 'Excellence and Integrity',
        sections: [
            { id: 'academics', title: 'Academic Performance', enabled: true },
            { id: 'attendance', title: 'Attendance Record', enabled: true },
            { id: 'affective', title: 'Affective Domain', enabled: true },
            { id: 'psychomotor', title: 'Psychomotor Skills', enabled: true },
            { id: 'comment', title: 'General Comment', enabled: true },
        ],
        affectiveSkills: [{ id: 'skill_1', label: 'Punctuality' }, { id: 'skill_2', label: 'Neatness' }],
        psychomotorSkills: [{ id: 'skill_5', label: 'Handwriting' }, { id: 'skill_6', label: 'Games & Sports' }],
    }
};

import { resolveTenantColumns, resolveTeachersColumns } from '../_lib/schema';

async function handlePost(request, env) {
    try {
        const { schoolName, subdomain, adminEmail, adminPassword, adminName, schoolType, emailRedirectTo } = await request.json();

        if (!schoolName || !subdomain || !adminEmail || !adminPassword || !adminName) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
        }

        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ error: 'Server is not configured for registration.' }), { status: 500 });
        }
        
        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        };
        
        const trialExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        // Step 1: Create Tenant
        const columns = await resolveTenantColumns(env);
        const tenantPayload = { id: subdomain, name: schoolName };
        // Populate optional routing fields if they exist in schema
        if (columns.slug) tenantPayload[columns.slug] = subdomain;
        if (columns.subdomain) tenantPayload[columns.subdomain] = subdomain;
        if (columns.subscriptionStatus) tenantPayload[columns.subscriptionStatus] = 'trial';
        if (columns.trialEndDate) tenantPayload[columns.trialEndDate] = trialExpiry;

        const tenantRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
            method: 'POST', headers: adminHeaders,
            body: JSON.stringify(tenantPayload)
        });

        if (!tenantRes.ok) {
            let raw = '';
            try { raw = await tenantRes.text(); } catch {}
            let tenantError = {};
            try { tenantError = JSON.parse(raw || '{}'); } catch {}
            if (tenantError.code === '23505') throw new Error(`The portal address '${subdomain}' is already taken.`);
            const msg = tenantError.message || raw || `Failed to create school record (status ${tenantRes.status}).`;
            throw new Error(msg);
        }

        // Step 2: Create Auth User
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST', headers: adminHeaders,
            body: JSON.stringify({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { tenant_id: subdomain, full_name: adminName } })
        });
        let userData = {};
        try { userData = await userRes.json(); } catch {}
        if (!userRes.ok) {
            await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { method: 'DELETE', headers: adminHeaders });
            const raw = userData?.msg || `Failed to create admin user (status ${userRes.status}).`;
            throw new Error(raw);
        }

        // Step 3: Create Teacher Profile (schema-aware)
        const teacherCols = await resolveTeachersColumns(env);
        const teacherPayload = {};
        if (teacherCols.name) teacherPayload[teacherCols.name] = adminName;
        if (teacherCols.email) teacherPayload[teacherCols.email] = adminEmail;
        if (teacherCols.role) teacherPayload[teacherCols.role] = 'Admin';
        if (teacherCols.authId) teacherPayload[teacherCols.authId] = userData.id;
        if (teacherCols.tenantId) teacherPayload[teacherCols.tenantId] = subdomain;
        const teacherRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers`, {
            method: 'POST', headers: adminHeaders,
            body: JSON.stringify(teacherPayload)
        });
        let teacherCreationWarning = null;
        if (!teacherRes.ok) {
            // Do NOT rollback tenant or auth user on teacher creation failure.
            // Some deployments use alternate schemas that may temporarily block teacher creation.
            // We keep the tenant and auth user so the portal exists and can be accessed.
            let raw = '';
            try { raw = await teacherRes.text(); } catch {}
            teacherCreationWarning = raw || `Admin profile creation failed (status ${teacherRes.status}). Please complete admin setup after signing in.`;
        }

        // Step 4: Seed Data
        await Promise.all([
             fetch(`${SUPABASE_URL}/rest/v1/settings`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({ ...defaultSettings, schoolName, schoolType, tenant_id: subdomain, id: 1 }) }),
             fetch(`${SUPABASE_URL}/rest/v1/subjects`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(defaultSubjects.map(s => ({ ...s, tenant_id: subdomain }))) })
        ]);

        return new Response(JSON.stringify({ message: "Registration successful!", teacherProfileCreated: !teacherCreationWarning, warning: teacherCreationWarning || undefined }), { status: 201 });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Registration failed", details: err.message }), { status: 500 });
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);

    if (corsResponse) {
        return corsResponse;
    }

    if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), { status: 403 });
    }
    
    let response;
    if (request.method === 'POST') {
        response = await handlePost(request, env);
    } else {
        response = new Response('Method Not Allowed', { status: 405 });
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}