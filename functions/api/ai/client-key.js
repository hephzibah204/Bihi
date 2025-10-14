// functions/api/ai/client-key.js

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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Demo-Mode",
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

async function handleGet(request, env) {
    const headers = { 'Content-Type': 'application/json' };
    let isAuthenticated = false;
    const authHeader = request.headers.get('Authorization');
    const isDemoMode = request.headers.get('X-Demo-Mode') === 'true';

    if (isDemoMode) {
        isAuthenticated = true;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return new Response(JSON.stringify({ error: 'Server not configured for auth.' }), { status: 500, headers });
        }
        const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
        });
        if (authResponse.ok) {
            isAuthenticated = true;
        }
    }

    if (!isAuthenticated) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
    }

    if (env.API_KEY) {
        return new Response(JSON.stringify({ key: env.API_KEY }), { headers });
    }
    return new Response(
        JSON.stringify({ error: "API_KEY not found in server environment" }),
        { status: 500, headers }
    );
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
    if (request.method === 'GET') {
        response = await handleGet(request, env);
    } else {
        response = new Response('Method Not Allowed', { status: 405 });
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}