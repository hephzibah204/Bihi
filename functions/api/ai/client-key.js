// functions/api/ai/client-key.js

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Demo-Mode',
    };
}

export async function onRequestGet({ request, env }) {
    const corsHeaders = getCorsHeaders(request);
    corsHeaders['Content-Type'] = 'application/json';
    
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
    }

    let isAuthenticated = false;

    // --- Authentication ---
    const authHeader = request.headers.get('Authorization');
    const isDemoMode = request.headers.get('X-Demo-Mode') === 'true';

    if (authHeader && authHeader.startsWith('Bearer ')) {
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
    } else if (isDemoMode) {
        const origin = request.headers.get('Origin') || '';
        if (corsHeaders['Access-Control-Allow-Origin'] === origin) {
            isAuthenticated = true;
        } else {
             return new Response(JSON.stringify({ error: 'Forbidden: Invalid origin for demo mode' }), { status: 403, headers: corsHeaders });
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