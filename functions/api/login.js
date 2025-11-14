// functions/api/login.js

import { handleCors } from '../_lib/cors';

async function handlePost(request, env) {
    try {
        const { email, password, subdomain } = await request.json();
        const emailStr = String(email || '').trim();
        const passStr = String(password || '');
        const subStr = String(subdomain || '').trim().toLowerCase();
        const emailOk = /.+@.+\..+/.test(emailStr);
        const passOk = passStr.length >= 8;
        const subOk = /^[a-z0-9-]{1,63}$/.test(subStr);
        if (!emailOk || !passOk || !subOk) {
            return new Response(JSON.stringify({ error: 'Email, password, and subdomain are required.' }), { status: 400 });
        }
        // This endpoint is largely conceptual as the client-side handles auth more effectively.
        const res = new Response(JSON.stringify({ message: "Login successful (simulated)." }), { status: 200 });
        res.headers.set('Cache-Control', 'no-store');
        return res;
    } catch (err) {
        return new Response(JSON.stringify({ error: "Authentication Failed", details: err.message }), { status: 401 });
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, env, 'POST, OPTIONS');

    if (corsResponse) {
        return corsResponse;
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

    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}
