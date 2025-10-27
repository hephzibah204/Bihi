// functions/api/platform-settings.js

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

async function getSuperAdminUser(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env || {};
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
    });

    if (!authResponse.ok) return null;
    const user = await authResponse.json();
    if (user?.user_metadata?.platform_role === 'Super Admin') return user;
    return null;
}

function sanitizeSettings(data) {
    try {
        const clone = JSON.parse(JSON.stringify(data || {}));
        if (clone.payment_gateways && typeof clone.payment_gateways === 'object') {
            for (const key of Object.keys(clone.payment_gateways)) {
                if (clone.payment_gateways[key] && typeof clone.payment_gateways[key] === 'object') {
                    if ('secretKey' in clone.payment_gateways[key]) {
                        delete clone.payment_gateways[key].secretKey; // redact
                    }
                }
            }
        }
        return clone;
    } catch {
        return data || {};
    }
}

async function handleGet(request, env) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500 });
    }

    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/platform_settings?select=data&id=eq.1`, {
                headers: {
                    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                    apikey: SUPABASE_SERVICE_ROLE_KEY,
                    Accept: "application/vnd.pgrst.object+json",
                },
            }
        );

        if (res.status === 406) { // Not acceptable, likely means no rows found when one was expected
            return new Response(JSON.stringify({}), { status: 200 });
        }

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Supabase responded with ${res.status}: ${text}`);
        }

        const record = await res.json();
        const platformData = record.data || {};

        // Redact sensitive fields for public GET
        const sanitized = sanitizeSettings(platformData);
        return new Response(JSON.stringify(sanitized), { status: 200 });
    } catch (err) {
        return new Response(
            JSON.stringify({ error: "Failed to fetch platform settings", details: err.message }), 
            { status: 500 }
        );
    }
}

async function handlePost(request, env) {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {};
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return new Response(JSON.stringify({ error: "Server not configured" }), { status: 500 });
    }

    const user = await getSuperAdminUser(request, env);
    if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Super Admin access required.' }), { status: 401 });
    }

    try {
        let body;
        try {
            body = await request.json();
        } catch {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
        }
        const incoming = body && typeof body === 'object' && body.settings ? body.settings : body;
        if (!incoming || typeof incoming !== 'object') {
            return new Response(JSON.stringify({ error: 'Settings object is required.' }), { status: 400 });
        }

        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
        };

        // Fetch existing to preserve sensitive fields
        let existing = {};
        try {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/platform_settings?select=data&id=eq.1`, { headers: { ...adminHeaders, Accept: 'application/vnd.pgrst.object+json' } });
            if (res.ok) {
                const rec = await res.json();
                existing = rec?.data || {};
            }
        } catch {}

        // Merge, preserving secretKey if not provided
        const merged = { ...existing, ...incoming };
        if (existing.payment_gateways || incoming.payment_gateways) {
            merged.payment_gateways = { ...(existing.payment_gateways || {}) };
            const submitted = incoming.payment_gateways || {};
            for (const key of Object.keys({ ...merged.payment_gateways, ...submitted })) {
                const prev = (existing.payment_gateways || {})[key] || {};
                const next = (submitted[key] || {});
                const combined = { ...prev, ...next };
                if ((!('secretKey' in next) || !next.secretKey) && prev.secretKey) {
                    combined.secretKey = prev.secretKey; // preserve previous secret
                }
                merged.payment_gateways[key] = combined;
            }
        }

        const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/platform_settings`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({ id: 1, data: merged })
        });

        if (!upsertRes.ok) {
            const text = await upsertRes.text();
            throw new Error(`Failed to save settings: ${text}`);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Failed to save settings', details: err.message }), { status: 500 });
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
    if (request.method === 'GET') {
        response = await handleGet(request, env);
    } else if (request.method === 'POST') {
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
