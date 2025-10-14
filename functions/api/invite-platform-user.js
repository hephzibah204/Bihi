// functions/api/invite-platform-user.js

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
        if (user.user_metadata?.platform_role === 'Super Admin') return user;
    }
    return null;
}

async function handlePost(request, env) {
    try {
        const superAdminUser = await getSuperAdminUser(request, env);
        if (!superAdminUser) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Super Admin access required.' }), { status: 401 });
        }

        const { email, role } = await request.json();
        if (!email || !role) {
            return new Response(JSON.stringify({ error: 'Email and role are required.' }), { status: 400 });
        }
        
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json'
        };

        const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/invite`, {
            method: 'POST', headers: adminHeaders,
            body: JSON.stringify({ email, data: { platform_role: role } })
        });
        const inviteData = await inviteRes.json();
        if (!inviteRes.ok) {
            if (inviteData.msg?.includes("already registered")) throw new Error("This user is already registered.");
            throw new Error(inviteData.msg || 'Failed to send invitation.');
        }

        const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/platform_settings?select=data&id=eq.1`, { headers: adminHeaders });
        if (!settingsRes.ok) throw new Error('Failed to fetch platform settings.');
        const settingsData = await settingsRes.json();
        const platformData = settingsData[0]?.data || {};
        const platformUsers = platformData.platform_users || [];

        const newUser = { id: inviteData.id, email: inviteData.email, role, lastLogin: inviteData.created_at };
        const updatedUsers = [...platformUsers.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase()), newUser];
        platformData.platform_users = updatedUsers;

        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/platform_settings?id=eq.1`, {
            method: 'PATCH', headers: adminHeaders, body: JSON.stringify({ data: platformData })
        });
        if (!updateRes.ok) throw new Error('Failed to save updated user list.');

        return new Response(JSON.stringify({ message: 'Invitation sent.' }), { status: 200 });
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