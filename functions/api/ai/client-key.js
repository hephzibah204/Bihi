
// functions/api/ai/client-key.js

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    // This is a simplified check. A production app might use a more robust regex or an env variable list.
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

/**
 * Handles GET requests to provide the API key to the client for the Live API.
 */
export async function onRequestGet({ request, env }) {
    const corsHeaders = getCorsHeaders(request);
    corsHeaders['Content-Type'] = 'application/json';
    
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response('Forbidden', { status: 403 });
    }

    // --- Authentication ---
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.split(' ')[1];

    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return new Response(JSON.stringify({ error: 'Server is not configured for authentication.' }), { status: 500, headers: corsHeaders });
    }
    
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY
        }
    });

    if (!authResponse.ok) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401, headers: corsHeaders });
    }
    // User is authenticated.

    if (env.API_KEY) {
        return new Response(JSON.stringify({ key: env.API_KEY }), { headers: corsHeaders });
    }
    return new Response(
        JSON.stringify({ error: "API_KEY not found in server environment" }),
        { status: 500, headers: corsHeaders }
    );
}

/**
 * Handles OPTIONS requests for CORS preflight.
 */
export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}
