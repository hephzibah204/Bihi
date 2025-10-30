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
        const tenantRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
            method: 'POST', headers: adminHeaders,
            body: JSON.stringify({ id: subdomain, name: schoolName, subscriptionStatus: 'trial', trialEndDate: trialExpiry })
        });
        
        if (!tenantRes.ok) {
            const tenantError = await tenantRes.json();
            if (tenantError.code === '23505') throw new Error(`The portal address '${subdomain}' is already taken.`);
            throw new Error(tenantError.message || 'Failed to create school record.');
        }

        // Step 2: Create Auth User
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST', headers: adminHeaders,
            body: JSON.stringify({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { tenant_id: subdomain, full_name: adminName } })
        });
        const userData = await userRes.json();
        if (!userRes.ok) {
            await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { method: 'DELETE', headers: adminHeaders });
            throw new Error(userData.msg || 'Failed to create admin user.');
        }

        // Step 3: Create Teacher Profile
        const teacherRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers`, {
            method: 'POST', headers: adminHeaders,
            body: JSON.stringify({ auth_id: userData.id, tenant_id: subdomain, name: adminName, email: adminEmail, role: 'Admin' })
        });
        if (!teacherRes.ok) {
            await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.id}`, { method: 'DELETE', headers: adminHeaders });
            await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { method: 'DELETE', headers: adminHeaders });
            throw new Error(`Failed to create admin profile.`);
        }

        // Step 4: Seed Data
        await Promise.all([
             fetch(`${SUPABASE_URL}/rest/v1/settings`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({ ...defaultSettings, schoolName, schoolType, tenant_id: subdomain, id: 1 }) }),
             fetch(`${SUPABASE_URL}/rest/v1/subjects`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(defaultSubjects.map(s => ({ ...s, tenant_id: subdomain }))) })
        ]);

        return new Response(JSON.stringify({ message: "Registration successful!" }), { status: 201 });
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