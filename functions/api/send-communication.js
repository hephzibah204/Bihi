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

        if (channel === 'sms') {
            const provider = integrations?.sms_provider || 'termii';
            const hasTermii = integrations?.termii_api_key && integrations?.termii_sender_id;
            const hasCustom = integrations?.sms_api_url && integrations?.sms_api_key && integrations?.sms_sender_id;
            if (provider === 'termii' && !hasTermii) {
                return new Response(JSON.stringify({ error: 'Termii SMS is not configured for this school.' }), { status: 400 });
            }
            if (provider === 'custom' && !hasCustom) {
                return new Response(JSON.stringify({ error: 'Custom SMS provider is not configured for this school.' }), { status: 400 });
            }
            if (provider === 'smartsmssolutions') {
                const ok = integrations?.smartsms_username && integrations?.smartsms_password && integrations?.smartsms_sender;
                if (!ok) return new Response(JSON.stringify({ error: 'Smart SMS Solutions is not fully configured.' }), { status: 400 });
            }
            if (provider === 'bulk-sms-nigeria') {
                const ok = integrations?.bulksms_api_token && integrations?.bulksms_sender;
                if (!ok) return new Response(JSON.stringify({ error: 'Bulk SMS Nigeria requires API token and sender ID.' }), { status: 400 });
            }
            if (provider === 'nigeriabulksms') {
                const ok = integrations?.nigeriabulksms_username && integrations?.nigeriabulksms_password && integrations?.nigeriabulksms_sender;
                if (!ok) return new Response(JSON.stringify({ error: 'Nigeria Bulk SMS is not fully configured.' }), { status: 400 });
            }
        }
        
        // Step 2: Log the communication
        const logPayload = {
            tenant_id, type, channel, content,
            recipients: Array.isArray(recipients) ? recipients : [recipients],
            sentAt: new Date().toISOString()
        };
        await fetch(`${SUPABASE_URL}/rest/v1/communication_logs`, { method: 'POST', headers: adminHeaders, body: JSON.stringify(logPayload) });

                // Step 3: Perform real sending via provider APIs using tenant\'s keys
        const recipientsArray = Array.isArray(recipients) ? recipients : [recipients];

        if (channel === 'sms') {
            const provider = integrations?.sms_provider || 'termii';
            if (provider === 'termii') {
                const payload = {
                    api_key: integrations.termii_api_key,
                    to: recipientsArray.join(','),
                    from: integrations.termii_sender_id,
                    sms: content,
                    type: 'plain',
                    channel: 'generic',
                };
                const termiiRes = await fetch('https://api.ng.termii.com/api/sms/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const termiiBody = await termiiRes.text();
                if (!termiiRes.ok) {
                    return new Response(JSON.stringify({ error: 'SMS provider error', details: termiiBody }), { status: 502 });
                }
            } else if (provider === 'custom') {
                const customRes = await fetch(integrations.sms_api_url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${integrations.sms_api_key}`,
                    },
                    body: JSON.stringify({
                        from: integrations.sms_sender_id,
                        to: recipientsArray,
                        message: content,
                    }),
                });
                const customBody = await customRes.text();
                if (!customRes.ok) {
                    return new Response(JSON.stringify({ error: 'SMS provider error', details: customBody }), { status: 502 });
                }
            } else if (provider === 'smartsmssolutions') {
                const params = new URLSearchParams({
                    username: integrations.smartsms_username,
                    password: integrations.smartsms_password,
                    sender: integrations.smartsms_sender,
                    recipient: recipientsArray.join(','),
                    message: content,
                });
                const smsRes = await fetch(`https://api.smartsmssolutions.com/smsapi.php?${params.toString()}`, { method: 'GET' });
                const smsBody = await smsRes.text();
                if (!smsRes.ok || /error|failed/i.test(smsBody)) {
                    return new Response(JSON.stringify({ error: 'SMS provider error', details: smsBody }), { status: 502 });
                }
            } else if (provider === 'bulk-sms-nigeria') {
                const payload = {
                    api_token: integrations.bulksms_api_token,
                    from: integrations.bulksms_sender,
                    to: recipientsArray.join(','),
                    body: content,
                    dnd: 2,
                };
                const bsnRes = await fetch('https://www.bulksmsnigeria.com/api/v1/sms/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const bsnText = await bsnRes.text();
                if (!bsnRes.ok || /error|failed/i.test(bsnText)) {
                    return new Response(JSON.stringify({ error: 'SMS provider error', details: bsnText }), { status: 502 });
                }
            } else if (provider === 'nigeriabulksms') {
                const params = new URLSearchParams({
                    username: integrations.nigeriabulksms_username,
                    password: integrations.nigeriabulksms_password,
                    sender: integrations.nigeriabulksms_sender,
                    message: content,
                    numbers: recipientsArray.join(','),
                });
                const nbsRes = await fetch(`https://nigeriabulksms.com/smsapi.php?${params.toString()}`, { method: 'GET' });
                const nbsBody = await nbsRes.text();
                if (!nbsRes.ok || /error|failed/i.test(nbsBody)) {
                    return new Response(JSON.stringify({ error: 'SMS provider error', details: nbsBody }), { status: 502 });
                }
            } else {
                return new Response(JSON.stringify({ error: `SMS provider '${provider}' not implemented.` }), { status: 400 });
            }
        } else if (channel === 'email') {
            const subject = type === 'reminder' ? 'Reminder' : (type === 'direct' ? 'Message' : 'Announcement');
            if (integrations?.sendgrid_api_key) {
                const payload = {
                    personalizations: [
                        { to: recipientsArray.map((email) => ({ email })) }
                    ],
                    from: {
                        email: integrations.sendgrid_from_email || 'no-reply@example.com',
                        name: integrations.sendgrid_from_name || 'School',
                    },
                    subject,
                    content: [ { type: 'text/plain', value: content } ],
                };
                const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${integrations.sendgrid_api_key}`,
                    },
                    body: JSON.stringify(payload),
                });
                const sgBody = await sgRes.text();
                if (!sgRes.ok) {
                    return new Response(JSON.stringify({ error: 'Email provider error', details: sgBody }), { status: 502 });
                }
            } else if (integrations?.mailgun_api_key && integrations?.mailgun_domain) {
                const params = new URLSearchParams();
                params.append('from', integrations.mailgun_from_email || 'no-reply@example.com');
                params.append('to', recipientsArray.join(','));
                params.append('subject', subject);
                params.append('text', content);

                const authHeader = 'Basic ' + btoa('api:' + integrations.mailgun_api_key);
                const mgRes = await fetch(`https://api.mailgun.net/v3/${integrations.mailgun_domain}/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': authHeader },
                    body: params,
                });
                const mgBody = await mgRes.text();
                if (!mgRes.ok) {
                    return new Response(JSON.stringify({ error: 'Email provider error', details: mgBody }), { status: 502 });
                }
            } else {
                return new Response(JSON.stringify({ error: 'Email provider is not configured for this school.' }), { status: 400 });
            }
        }

        return new Response(JSON.stringify({ success: true, message: `${channel.charAt(0).toUpperCase() + channel.slice(1)} sent successfully.` }), { status: 200 });

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




