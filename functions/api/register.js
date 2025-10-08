// functions/api/register.js

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    
    // A "null" origin can occur for server-to-server requests, sandboxed iframes, or local file access.
    // For this application's development and deployment environment, we need to allow it to prevent CORS errors.
    const isAllowed = 
        origin === 'null' ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.reportsheet.com.ng') ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.aistudio.google.com');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Demo-Mode',
    };
}

// Default data to seed for a new tenant
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

export async function onRequestPost({ request, env }) {
    const corsHeaders = { ...getCorsHeaders(request), 'Content-Type': 'application/json' };
    
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403, headers: corsHeaders });
    }

    try {
        const { schoolName, subdomain, adminEmail, adminPassword, adminName, schoolType, emailRedirectTo } = await request.json();

        if (!schoolName || !subdomain || !adminEmail || !adminPassword || !adminName) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400, headers: corsHeaders });
        }

        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ error: 'Server is not configured for registration.' }), { status: 500, headers: corsHeaders });
        }
        
        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        };

        // --- Step 1: Create the Tenant Record ---
        const tenantRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({
                id: subdomain,
                name: schoolName,
                subscriptionStatus: 'trial',
                trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            })
        });
        
        if (!tenantRes.ok) {
            const tenantError = await tenantRes.json();
            if (tenantError.code === '23505') { // unique_violation
                 throw new Error(`The portal address '${subdomain}' is already taken. Please choose another.`);
            }
            throw new Error(tenantError.message || 'Failed to create school record.');
        }

        // --- Step 2: Create the Admin User in Auth ---
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({
                email: adminEmail,
                password: adminPassword,
                email_confirm: true, // Auto-confirm for simplicity, or set to false to require email verification
                user_metadata: { tenant_id: subdomain, full_name: adminName },
                // email_redirect_to: emailRedirectTo, // Optional: if you want Supabase to handle the verification email link
            })
        });

        const userData = await userRes.json();
        if (!userRes.ok) {
            // Attempt to clean up the tenant if user creation fails
            await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { method: 'DELETE', headers: adminHeaders });
            throw new Error(userData.msg || 'Failed to create admin user.');
        }

        // --- Step 3: Create the Teacher Profile ---
        const teacherRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({
                auth_id: userData.id,
                tenant_id: subdomain,
                name: adminName,
                email: adminEmail,
                role: 'Admin'
            })
        });

        if (!teacherRes.ok) throw new Error('Failed to create admin profile.');

        // --- Step 4: Seed Default Data ---
        const settingsPayload = { ...defaultSettings, schoolName, schoolType, tenant_id: subdomain, id: 1 };
        const subjectsPayload = defaultSubjects.map(s => ({ ...s, tenant_id: subdomain }));

        await Promise.all([
             fetch(`${SUPABASE_URL}/rest/v1/settings`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(settingsPayload) }),
             fetch(`${SUPABASE_URL}/rest/v1/subjects`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(subjectsPayload) })
        ]);

        return new Response(JSON.stringify({
            message: "Registration successful! Your portal is ready.",
        }), { status: 201, headers: corsHeaders });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Registration failed", details: err.message }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}
