
// functions/api/ai/health.js

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    // In a real production environment, this list should come from an environment variable.
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
    ];

    let allowOrigin = '';
    if (origin.startsWith('http://localhost:')) {
        allowOrigin = origin;
    } 
    else if (allowedOrigins.includes(origin) || origin.endsWith('.reportsheet.com.ng') || origin.endsWith('.pages.dev')) {
        allowOrigin = origin;
    }
    
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

/**
 * Handles GET requests to check the health of the AI service.
 */
export async function onRequestGet({ request, env }) {
    const headers = getCorsHeaders(request);
    headers['Content-Type'] = 'application/json';
    
    if (!headers['Access-Control-Allow-Origin']) {
        return new Response('Forbidden', { status: 403 });
    }

    if (env.API_KEY && env.API_KEY.startsWith("AIza")) {
        return new Response(
            JSON.stringify({ status: "ok", message: "API_KEY is set." }),
            { headers }
        );
    }
    return new Response(
        JSON.stringify({
            status: "error",
            message: "API_KEY not found. Please set it in Cloudflare Pages → Settings → Environment Variables.",
        }),
        { status: 500, headers }
    );
}

/**
 * Handles OPTIONS requests for CORS preflight.
 */
export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}
