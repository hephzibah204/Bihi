// functions/api/invite-parent.js

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

async function getAdminAuthToken(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
    });
    if (authResponse.ok) return await authResponse.json();
    return null;
}

async function handlePost(request, env) {
    try {
        const adminUser = await getAdminAuthToken(request, env);
        if (!adminUser) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required.' }), { status: 401 });
        }

        const { studentId } = await request.json();
        if (!studentId) {
            return new Response(JSON.stringify({ error: 'Student ID is required.' }), { status: 400 });
        }

        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            return new Response(JSON.stringify({ error: 'Server is not configured for user invitations.' }), { status: 500 });
        }

        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json'
        };
        
        const tenantId = adminUser.user_metadata?.tenant_id;
        if (!tenantId) {
             return new Response(JSON.stringify({ error: 'Unauthorized: Admin has no tenant assigned.' }), { status: 401 });
        }

        const studentRes = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}&tenant_id=eq.${tenantId}&select=parentEmail,parentId,parents(id,email)`, { headers: adminHeaders });
        if (!studentRes.ok) throw new Error(`Failed to fetch student data.`);
        const students = await studentRes.json();
        const student = students[0];
        
        if (!student || !student.parentEmail) {
            return new Response(JSON.stringify({ error: 'Student not found or has no parent email.' }), { status: 404 });
        }

        const parentId = student.parentId || student.parents?.id;
        if (!parentId) {
             return new Response(JSON.stringify({ error: 'Parent profile not found for this student.' }), { status: 404 });
        }

        const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/invite`, {
            method: 'POST', headers: adminHeaders,
            body: JSON.stringify({ email: student.parentEmail, data: { parent_id: parentId, tenant_id: tenantId } })
        });
        const inviteData = await inviteRes.json();

        if (!inviteRes.ok) {
            if (inviteData.msg?.includes("already registered")) {
                return new Response(JSON.stringify({ message: "This parent has already registered an account." }), { status: 200 });
            }
            throw new Error(inviteData.msg || 'Failed to send invitation.');
        }

        await fetch(`${SUPABASE_URL}/rest/v1/parents?id=eq.${parentId}`, {
            method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ auth_id: inviteData.id })
        });
        
        return new Response(JSON.stringify({ message: 'Invitation sent successfully!' }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: err.message }), { status: 500 });
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