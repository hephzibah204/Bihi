// functions/api/ai/client-key.js

import { handleCors } from '../../_lib/cors';

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

    if (isDemoMode) {
        const r = new Response(JSON.stringify({ key: 'DEMO' }), { headers });
        r.headers.set('Cache-Control', 'no-store');
        return r;
    }

    const r = new Response(JSON.stringify({ key: null }), { headers });
    r.headers.set('Cache-Control', 'no-store');
    return r;
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, env, 'GET, OPTIONS');

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
