// functions/api/send-communication.js

const allowedOriginPatterns = [
    /^https?:\/\/localhost(:\d+)?$/,
    /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
    /^https:\/\/reportsheet\.com\.ng$/,
    /^https:\/\/.+\.reportsheet\.com\.ng$/,
    /^https:\/\/reportsheet\.pages\.dev$/,
    /^https:\/\/.+\\.pages\.dev$/,
    /^https:\/\/([a-z0-9-]+\.)?aistudio\.google\.com$/,
    /^https:\/\/.+\.googleusercontent\.com$/,
    /^https:\/\/.+\.web\.app$/,
    /^https:\/\/.*\.google\.internal$/,
];

function handleCors(request) {
    const origin = request.headers.get("Origin");
    const headers = {
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

async function getAuthenticatedUser(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_ANON_KEY }
    });
    
    if (authResponse.ok) return await authResponse.json();
    return null;
}

async function handlePost(request, env) {
    try {
        const user = await getAuthenticatedUser(request, env);
        if (!user || !user.user_metadata?.tenant_id) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const { channel, content, recipients, type } = await request.json();
        if (!channel || !content || !recipients || !type) {
            return new Response(JSON.stringify({ error: 'Missing required fields.' }), { status: 400 });
        }

        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env;
        const adminHeaders = {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
        };
        const tenant_id = user.user_metadata.tenant_id;

        // Step 1: Fetch tenant-specific settings
        const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=integrations&tenant_id=eq.${tenant_id}&limit=1`, { headers: adminHeaders });
        if (!settingsRes.ok) throw new Error('Failed to fetch school settings.');
        const settingsData = await settingsRes.json();
        const integrations = settingsData[0]?.integrations;

        if (channel === 'sms' && (!integrations?.sms_api_key || !integrations?.sms_sender_id)) {
            return new Response(JSON.stringify({ error: 'SMS Gateway is not configured for this school.' }), { status: 400 });
        }
        
        // Step 2: Log the communication
        const logPayload = {
            tenant_id, type, channel, content,
            recipients: Array.isArray(recipients) ? recipients : [recipients],
            sentAt: new Date().toISOString()
        };
        await fetch(`${SUPABASE_URL}/rest/v1/communication_logs`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(logPayload) });

        // Step 3: Simulate sending via a 3rd party service using tenant's keys
        console.log(`[${tenant_id}] SERVER-SIDE SIMULATION: Sending ${channel} to ${recipients.length} recipients using Sender ID: ${integrations?.sms_sender_id}.`);
        
        return new Response(JSON.stringify({ success: true, message: `${channel.charAt(0).toUpperCase() + channel.slice(1)} sent successfully (simulated).` }), { status: 200 });

    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal Server Error", details: err.message }), { status: 500 });
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);

    if (corsResponse) return corsResponse;
    if (!isAllowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    
    let response;
    if (request.method === 'POST') {
        response = await handlePost(request, env);
    } else {
        response = new Response('Method Not Allowed', { status: 405 });
    }

    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
}