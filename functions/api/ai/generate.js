// functions/api/ai/generate.js

const allowedOriginPatterns = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/reportsheet\.com\.ng$/,
    /^https:\/\/.+\.reportsheet\.com\.ng$/,
    /^https:\/\/reportsheet\.pages\.dev$/,
    /^https:\/\/.+\.pages\.dev$/,
    /^https:\/\/([a-z0-9-]+\.)?aistudio\.google\.com$/,
    /^https:\/\/.+\.googleusercontent\.com$/,
    /^https:\/\/.+\.web\.app$/,
    /^https:\/\/.*\.google\.internal$/,
];

function handleCors(request) {
    const origin = request.headers.get("Origin");
    const headers = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Demo-Mode",
    };
    let isAllowed = false;

    if (origin && allowedOriginPatterns.some((p) => p.test(origin))) {
        headers["Access-Control-Allow-Origin"] = origin;
        isAllowed = true;
    }

    if (request.method === "OPTIONS") {
        return { response: new Response(null, { headers }), corsHeaders: headers, isAllowed };
    }

    return { response: null, corsHeaders: headers, isAllowed };
}

async function handlePost(request, env) {
     try {
        let isAuthenticated = false;
        let userContext = null;
        const authHeader = request.headers.get('Authorization');
        const isDemoMode = request.headers.get('X-Demo-Mode') === 'true';

        if (isDemoMode) {
            isAuthenticated = true;
        } else if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                return new Response(JSON.stringify({ error: 'Server not configured for auth.' }), { status: 500 });
            }
            const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
            });
            if (authResponse.ok) {
                isAuthenticated = true;
                userContext = await authResponse.json();
            }
        }

        if (!isAuthenticated) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const body = await request.json();
        const { prompt, tenantId } = body;
        if (!prompt) return new Response(JSON.stringify({ error: "Prompt is required." }), { status: 400 });

        // Resolve API key with school-specific override support
        let apiKey = env.API_KEY; // Default sitewide key
        
        // If we have a tenant ID and user context, check for school-specific Gemini API key
        if (tenantId && userContext && !isDemoMode) {
            try {
                const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
                const schoolSettingsResponse = await fetch(`${SUPABASE_URL}/rest/v1/settings?tenant_id=eq.${tenantId}&select=integrations`, {
                    headers: { 
                        'Authorization': `Bearer ${authHeader.split(' ')[1]}`, 
                        'apikey': SUPABASE_ANON_KEY,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (schoolSettingsResponse.ok) {
                    const schoolSettings = await schoolSettingsResponse.json();
                    if (schoolSettings && schoolSettings.length > 0 && schoolSettings[0].integrations?.gemini_api_key) {
                        apiKey = schoolSettings[0].integrations.gemini_api_key;
                        console.log('Using school-specific Gemini API key for tenant:', tenantId);
                    }
                }
            } catch (error) {
                console.warn('Failed to fetch school-specific API key, falling back to sitewide key:', error.message);
            }
        }
        
        if (!apiKey) return new Response(JSON.stringify({ error: "API_KEY is missing on server." }), { status: 500 });

        const aiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
            }
        );

        if (!aiRes.ok) {
            const errText = await aiRes.text();
            let errorMessage = `AI service responded with status: ${aiRes.status}`;
            try {
                const errorJson = JSON.parse(errText);
                errorMessage = errorJson.error?.message || errText;
            } catch(e) {
                errorMessage = errText;
            }
            return new Response(JSON.stringify({ error: errorMessage }), { status: aiRes.status });
        }
        
        // Return the streaming response directly
        return new Response(aiRes.body, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { status: 500 });
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);

    if (corsResponse) {
        return corsResponse; // Handle preflight OPTIONS request
    }

    if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), { status: 403 });
    }

    let response;
    if (request.method === 'POST') {
        response = await handlePost(request, env);
    } else {
        response = new Response('Method Not Allowed', { status: 405 });
    }

    // Apply CORS headers to the actual response
    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}