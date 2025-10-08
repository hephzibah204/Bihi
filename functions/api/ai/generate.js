// functions/api/ai/generate.js

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    
    // A "null" origin can occur for server-to-server requests, sandboxed iframes, or local file access.
    // For this application's development and deployment environment, we need to allow it to prevent CORS errors.
    const isAllowed = 
        origin === 'null' ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.reportsheet.com.ng') ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.aistudio.google.com');

    return {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Demo-Mode',
    };
}

export async function onRequestPost({ request, env }) {
    const corsHeaders = getCorsHeaders(request);
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        // If the origin is not allowed, return a 403 Forbidden response.
        return new Response(JSON.stringify({ error: 'Forbidden: Invalid Origin' }), { status: 403, headers: corsHeaders });
    }

    try {
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

        // --- AI Generation ---
        const body = await request.json();
        const { prompt } = body;
        if (!prompt) return new Response(JSON.stringify({ error: "Prompt is required." }), { status: 400, headers: corsHeaders });

        const apiKey = env.API_KEY;
        if (!apiKey) return new Response(JSON.stringify({ error: "API_KEY is missing on server." }), { status: 500, headers: corsHeaders });

        const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
            }
        );

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            return new Response(errText, { status: aiRes.status, headers: corsHeaders });
        }

        const data = await aiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response text received.";
        
        return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { status: 500, headers: corsHeaders });
    }
}

export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}
