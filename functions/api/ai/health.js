// functions/api/ai/health.js

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';

    // Define allowed origin patterns. This is more robust and explicit.
    const allowedOriginPatterns = [
        // Local development
        /^http:\/\/localhost:\d+$/,
        /^http:\/\/127\.0\.0\.1:\d+$/,
        
        // Production domains
        /^https:\/\/reportsheet\.com\.ng$/,      // Root domain
        /^https:\/\/.+\.reportsheet\.com\.ng$/,    // Subdomains e.g., www. or demo.

        // Preview/Staging domains
        /^https:\/\/reportsheet\.pages\.dev$/,   // Root preview domain
        /^https:\/\/.+\.pages\.dev$/,             // Any other pages.dev URL (covers branches)

        // External services
        /\.aistudio\.google\.com$/,
    ];

    let isOriginAllowed = false;
    for (const pattern of allowedOriginPatterns) {
        if (pattern.test(origin)) {
            isOriginAllowed = true;
            break;
        }
    }
    
    return {
        'Access-Control-Allow-Origin': isOriginAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Demo-Mode',
    };
}


/**
 * Handles GET requests to check the health of the AI service.
 * This endpoint is public and uses a wildcard CORS policy for simple diagnostics.
 */
export async function onRequestGet({ request, env }) {
    const corsHeaders = getCorsHeaders(request);
    const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403, headers: corsHeaders });
    }

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

/**
 * Handles OPTIONS requests for CORS preflight.
 */
export async function onRequestOptions({ request }) {
    return new Response(null, { 
        headers: getCorsHeaders(request)
    });
}