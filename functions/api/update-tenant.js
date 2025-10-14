// functions/api/update-tenant.js

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
    if (origin && allowedOriginPatterns.some(p => p.test(origin))) {
        headers["Access-Control-Allow-Origin"] = origin;
        isAllowed = true;
    }
    if (request.method === "OPTIONS") {
        return { response: new Response(null, { headers }), corsHeaders: headers, isAllowed };
    }
    return { response: null, corsHeaders: headers, isAllowed };
}

async function getSuperAdminUser(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    
    const token = authHeader.split(' ')[1];
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
    
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
    });
    
    if (authResponse.ok) {
        const user = await authResponse.json();
        // Check for a specific role or claim that identifies a super admin
        if (user.user_metadata?.platform_role === 'Super Admin') {
            return user;
        }
    }
    return null;
}

async function handlePost(request, env) {
    try {
        const user = await getSuperAdminUser(request, env);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Super Admin access required.' }), { status: 401 });
        }

        const { tenant } = await request.json();
        if (!tenant || !tenant.id) {
            return new Response(JSON.stringify({ error: 'Tenant data with ID is required.' }), { status: 400 });
        }

        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        };

        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${tenant.id}`, {
            method: 'PATCH',
            headers: adminHeaders,
            body: JSON.stringify(tenant)
        });

        if (!updateRes.ok) {
            const errorBody = await updateRes.text();
            throw new Error(`Failed to update tenant: ${errorBody}`);
        }

        return new Response(JSON.stringify({ success: true, message: 'Tenant updated successfully.' }), { status: 200 });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { status: 500 });
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);

    if (corsResponse) return corsResponse;
    if (!isAllowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    
    let response;
    if (request.method === 'POST') {
        response = await handlePost(request, env);
    } else {
        response = new Response('Method Not Allowed', { status: 405 });
    }

    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
}