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
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
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

// Reusable JSON response helper for consistent payloads
const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
});

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
        let rolledBack = false;

        console.log('Registration attempt:', { subdomain, adminEmail, schoolName });

        if (!schoolName || !subdomain || !adminEmail || !adminPassword || !adminName) {
            return json({ success: false, error: 'Missing required fields' }, 400);
        }
        // Basic validation
        if (!/^.{6,}$/.test(adminPassword)) {
            return json({ success: false, error: 'Password must be at least 6 characters.' }, 400);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
            return json({ success: false, error: 'Invalid email format.' }, 400);
        }

        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;

        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return json({ success: false, error: 'Server is not configured for registration.' }, 500);
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
        console.log('Tenant creation result:', { ok: tenantRes.ok, status: tenantRes.status });

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
        console.log('Auth user creation result:', { ok: userRes.ok, userId: userData?.id });
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
        
        console.log('Creating teacher profile with payload:', teacherPayload);
        console.log('Teacher columns detected:', teacherCols);
        
        // Retry mechanism for teacher profile creation
        const teacherUrl = `${SUPABASE_URL}/rest/v1/teachers`;
        const maxAttempts = 3;
        let teacherRes;
        let attempt = 0;
        let lastErrorDetails = '';
        while (attempt < maxAttempts) {
            attempt++;
            teacherRes = await fetch(teacherUrl, { method: 'POST', headers: adminHeaders, body: JSON.stringify(teacherPayload) });
            console.log('Teacher profile creation attempt', attempt, 'result:', { ok: teacherRes.ok, status: teacherRes.status });
            if (teacherRes.ok) break;
            try {
                const errorJson = await teacherRes.clone().json();
                lastErrorDetails = errorJson.message || errorJson.hint || JSON.stringify(errorJson);
            } catch {
                try { lastErrorDetails = await teacherRes.text(); } catch {}
            }
            // backoff
            await new Promise(r => setTimeout(r, 400 * attempt));
        }
        if (!teacherRes || !teacherRes.ok) {
            // Teacher creation is CRITICAL - rollback everything if it fails
            let errorDetails = '';
            try { 
                const errorJson = await teacherRes.json();
                errorDetails = errorJson.message || errorJson.hint || JSON.stringify(errorJson);
            } catch {
                try { errorDetails = await teacherRes.text(); } catch {}
            }
            
            console.error('Teacher profile creation failed:', errorDetails);
            
            // Rollback: Delete the auth user we just created
            try {
                await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.id}`, { 
                    method: 'DELETE', 
                    headers: adminHeaders 
                });
                console.log('Rolled back auth user:', userData.id);
            } catch (rollbackErr) {
                console.error('Failed to rollback auth user:', rollbackErr);
            }
            
            // Rollback: Delete the tenant we just created
            try {
                await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { 
                    method: 'DELETE', 
                    headers: adminHeaders 
                });
                console.log('Rolled back tenant:', subdomain);
            } catch (rollbackErr) {
                console.error('Failed to rollback tenant:', rollbackErr);
            }
            rolledBack = true;
            
            throw new Error(`Failed to create admin profile: ${errorDetails}. Registration has been rolled back. Please try again or contact support if the issue persists.`);
        }
        
        // Verify teacher was actually created by fetching it
        const verifyRes = await fetch(
            `${SUPABASE_URL}/rest/v1/teachers?${teacherCols.email}=eq.${adminEmail}&${teacherCols.tenantId}=eq.${subdomain}`, 
            { headers: adminHeaders }
        );
        console.log('Teacher verification request status:', verifyRes.status);
        
        if (!verifyRes.ok) {
            console.error('Teacher verification request failed:', verifyRes.status);
            throw new Error('Failed to verify admin profile creation.');
        }
        
        const teachers = await verifyRes.json();
        if (!Array.isArray(teachers) || teachers.length === 0) {
            console.error('Teacher verification failed: No teacher record found');
            
            // Rollback everything
            try {
                await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.id}`, { 
                    method: 'DELETE', 
                    headers: adminHeaders 
                });
                await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { 
                    method: 'DELETE', 
                    headers: adminHeaders 
                });
                console.log('Rolled back due to verification failure');
            } catch (rollbackErr) {
                console.error('Failed to rollback after verification failure:', rollbackErr);
            }
            
            throw new Error('Admin profile creation verification failed. Registration has been rolled back. Please try again.');
        }
        
        console.log('Teacher profile verified successfully:', teachers[0]);

        // Step 4: Seed Data
        await Promise.all([
             fetch(`${SUPABASE_URL}/rest/v1/settings`, { method: 'POST', headers: adminHeaders, body: JSON.stringify({ ...defaultSettings, schoolName, schoolType, tenant_id: subdomain, id: 1 }) }),
             fetch(`${SUPABASE_URL}/rest/v1/subjects`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(defaultSubjects.map(s => ({ ...s, tenant_id: subdomain }))) })
        ]);
        console.log('Seeding complete for:', subdomain);

        // Final verification: ensure tenant row exists before returning success
        const tenantVerifyRes = await fetch(
            `${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}&select=id`,
            { headers: adminHeaders }
        );
        if (!tenantVerifyRes.ok) {
            console.error('Tenant verification request failed:', tenantVerifyRes.status);
            // Rollback defensively
            try { await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.id}`, { method: 'DELETE', headers: adminHeaders }); } catch {}
            try { await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { method: 'DELETE', headers: adminHeaders }); } catch {}
            rolledBack = true;
            throw new Error('Tenant verification failed. Registration has been rolled back. Please try again.');
        }
        const tenantRows = await tenantVerifyRes.json();
        if (!Array.isArray(tenantRows) || tenantRows.length === 0) {
            console.error('Tenant verification failed: No tenant record found');
            // Rollback defensively
            try { await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userData.id}`, { method: 'DELETE', headers: adminHeaders }); } catch {}
            try { await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${subdomain}`, { method: 'DELETE', headers: adminHeaders }); } catch {}
            rolledBack = true;
            throw new Error('Tenant verification failed. Registration has been rolled back. Please try again.');
        }

        console.log('Registration completed successfully for:', subdomain);
        // Return explicit success flags so frontend only shows success when tenant truly exists
        return json({
            success: true,
            tenantId: subdomain,
            tenantCreated: true,
            teacherProfileCreated: true,
            userCreated: true,
        }, 200);
    } catch (err) {
        const details = err && (err.stack || err.message) ? (err.stack || err.message) : String(err);
        const errorMsg = typeof rolledBack !== 'undefined' && rolledBack ? 'Registration failed, changes rolled back' : 'Registration failed';
        return json({ success: false, error: errorMsg, details }, 500);
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