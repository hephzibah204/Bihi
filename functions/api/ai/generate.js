
// functions/api/ai/generate.js

function getCorsHeaders(request) {
    const origin = request.headers.get('Origin') || '';
    // In a real production environment, this list should come from an environment variable.
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        // Add your production and preview domains here
    ];

    let allowOrigin = '';
    // Allow any localhost port for local development
    if (origin.startsWith('http://localhost:')) {
        allowOrigin = origin;
    } 
    // Allow production and preview domains
    else if (allowedOrigins.includes(origin) || origin.endsWith('.reportsheet.com.ng') || origin.endsWith('.pages.dev')) {
        allowOrigin = origin;
    }
    
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}


/**
 * Handles POST requests to generate content using the Gemini API, with authentication.
 */
export async function onRequestPost({ request, env }) {
    const corsHeaders = getCorsHeaders(request);
    // If the origin is not allowed, don't even process the request.
    if (!corsHeaders['Access-Control-Allow-Origin']) {
        return new Response('Forbidden', { status: 403 });
    }

    try {
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

        // --- AI Generation ---
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt is required." }), { status: 400, headers: corsHeaders });
        }

        const apiKey = env.API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({ error: "API_KEY is missing on server." }), { status: 500, headers: corsHeaders });
        }

        const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                }),
            }
        );

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            return new Response(errText, { status: aiRes.status, headers: corsHeaders });
        }

        const data = await aiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response text received.";
        
        return new Response(JSON.stringify({ text }), { headers: corsHeaders });

    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Internal Server Error", details: err.message }),
            { status: 500, headers: corsHeaders }
        );
    }
}

/**
 * Handles OPTIONS requests for CORS preflight.
 */
export async function onRequestOptions({ request }) {
    return new Response(null, { headers: getCorsHeaders(request) });
}
