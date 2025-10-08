// functions/api/login.js
// This is a conceptual example of a server-side login endpoint.
// In most Supabase applications, authentication is handled directly on the client-side
// for simplicity and to leverage Supabase's session management. A server-side endpoint
// like this is less common but can be used for specific proxying or security requirements.

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    const isAllowed = 
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.reportsheet.com.ng') ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.aistudio.google.com');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
}

export async function onRequestPost({ request, env }) {
    const corsHeaders = { ...getCorsHeaders(request), 'Content-Type': 'application/json' };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403, headers: corsHeaders });
    }
    
    try {
        const { email, password, subdomain } = await request.json();
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

        if (!email || !password || !subdomain) {
            return new Response(JSON.stringify({ error: 'Email, password, and subdomain are required.' }), { status: 400, headers: corsHeaders });
        }

        // In a real application, you would first query your `tenants` table to ensure the `subdomain` is valid.
        // Then, you would attempt to sign in the user. Row Level Security policies in Supabase, based on the
        // user's `tenant_id` metadata, would prevent them from authenticating against the wrong portal.
        
        // The client-side Supabase library handles this flow more seamlessly. This endpoint is for demonstration.
        /*
        
        import { createClient } from '@supabase/supabase-js';
        const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // This call implicitly uses the user's tenant_id via RLS in a real setup
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) throw error;

        // The main challenge of a server-side auth endpoint is securely returning the
        // session/JWT to the client and managing it there (e.g., in a secure, httpOnly cookie).
        return new Response(JSON.stringify({
            message: "Login successful.",
            session: data.session
        }), { status: 200, headers: corsHeaders });
        */
        
        // Simulation for this environment
        return new Response(JSON.stringify({
            message: "Login successful (simulated).",
        }), { status: 200, headers: corsHeaders });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Authentication Failed", details: err.message }), { status: 401, headers: corsHeaders });
    }
}

export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}
