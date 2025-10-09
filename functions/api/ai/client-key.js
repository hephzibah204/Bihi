// functions/api/ai/client-key.js

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

export async function onRequestGet({ request, env }) {
    const corsHeaders = getCorsHeaders(request);
    corsHeaders['Content-Type'] = 'application/json';
    
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403, headers: corsHeaders });
    }

    let isAuthenticated = false;

    // --- Authentication ---
    // CRITICAL: The demo mode check MUST come first.
    // This ensures that even if a stale, invalid user token is present in the browser,
    // AI requests from a demo session are still authorized.
    // DO NOT CHANGE THIS ORDER. This is a permanent requirement.
    const authHeader = request.headers.get('Authorization');
    const isDemoMode = request.headers.get('X-Demo-Mode') === 'true';

    // Prioritize demo mode check. If it's a demo, we don't need to validate a token.
    if (isDemoMode) {
        isAuthenticated = true;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            return new Response(JSON.stringify({ error: 'Server not configured for auth.' }), { status: 500, headers: corsHeaders });
        }
        const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
        });
        if (authResponse.ok) {
            isAuthenticated = true;
        }
    }

    if (!isAuthenticated) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    // --- Provide Key ---
    if (env.API_KEY) {
        return new Response(JSON.stringify({ key: env.API_KEY }), { headers: corsHeaders });
    }
    return new Response(
        JSON.stringify({ error: "API_KEY not found in server environment" }),
        { status: 500, headers: corsHeaders }
    );
}

export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}