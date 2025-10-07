// functions/api/ai/health.js

/**
 * Handles GET requests to check the health of the AI service.
 * This endpoint is public and uses a wildcard CORS policy for simple diagnostics.
 */
export async function onRequestGet({ env }) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (env.API_KEY && env.API_KEY.startsWith("AIza")) {
        return new Response(
            JSON.stringify({ status: "ok", message: "API_KEY is set." }),
            { headers }
        );
    }
    return new Response(
        JSON.stringify({
            status: "error",
            message: "API_KEY not found or is invalid. Please set it in your Cloudflare Pages environment variables.",
        }),
        { status: 500, headers }
    );
}

/**
 * Handles OPTIONS requests for CORS preflight.
 */
export async function onRequestOptions() {
    return new Response(null, { 
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
