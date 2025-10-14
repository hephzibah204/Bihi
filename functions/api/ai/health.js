// functions/api/ai/health.js

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
    const responseHeaders = { 'Content-Type': 'application/json' };

    if (env.API_KEY && env.API_KEY.startsWith("AIza")) {
        return new Response(
            JSON.stringify({ status: "ok", message: "API_KEY is set." }),
            { headers: responseHeaders }
        );
    }
    return new Response(
        JSON.stringify({
            status: "error",
            message: "API_KEY not found or is invalid. Please set it in your Cloudflare Pages environment variables.",
        }),
        { status: 500, headers: responseHeaders }
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