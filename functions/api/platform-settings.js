// functions/api/platform-settings.js

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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500 });
    }

    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/platform_settings?select=data&id=eq.1`, {
                headers: {
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Accept: "application/vnd.pgrst.object+json",
                },
            }
        );

        if (res.status === 406) { // Not acceptable, likely means no rows found when one was expected
            return new Response(JSON.stringify({}), { status: 200 });
        }

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Supabase responded with ${res.status}: ${text}`);
        }

        const record = await res.json();
        const platformData = record.data || {};

        return new Response(JSON.stringify(platformData), { status: 200 });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch platform settings", details: err.message }), 
            { status: 500 }
        );
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);

    if (corsResponse) {
        return corsResponse; // Handle preflight OPTIONS request
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
    
    // Apply CORS headers to the actual response
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}