// functions/api/conversations/[id]/messages.js
// API endpoints for managing messages within conversations

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
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

async function authenticate(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authenticated: false, user: null };
    }

    const token = authHeader.split(' ')[1];
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return { authenticated: false, user: null };
    }

    try {
        const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'apikey': SUPABASE_ANON_KEY 
            }
        });

        if (authResponse.ok) {
            const user = await authResponse.json();
            return { authenticated: true, user, token };
        }
    } catch (error) {
        console.error('Auth error:', error);
    }

    return { authenticated: false, user: null };
}

async function handleGetMessages(request, env, token, conversationId) {
    try {
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '50');

        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

        // Get messages using the stored function
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/get_conversation_messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    p_conversation_id: conversationId
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get messages: ${errorText}`);
        }

        let messages = await response.json();

        // Apply limit if needed
        if (messages.length > limit) {
            messages = messages.slice(-limit);
        }

        return new Response(JSON.stringify({ messages }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get messages error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to get messages', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleAddMessage(request, env, token, conversationId) {
    try {
        const body = await request.json();
        const { role, content, source, is_fallback, metadata } = body;

        if (!role || !content) {
            return new Response(
                JSON.stringify({ error: 'Role and content are required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/ai_messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    role,
                    content,
                    source: source || 'gemini',
                    is_fallback: is_fallback || false,
                    metadata: metadata || {}
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to add message: ${errorText}`);
        }

        const messages = await response.json();
        return new Response(JSON.stringify({ message: messages[0] }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Add message error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to add message', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleDeleteMessage(request, env, token, messageId) {
    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/ai_messages?id=eq.${messageId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to delete message');
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Delete message error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to delete message', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request);

    if (corsResponse) {
        return corsResponse;
    }

    if (!isAllowed) {
        return new Response(JSON.stringify({ error: "Forbidden: Invalid Origin" }), { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // Authenticate
    const { authenticated, user, token } = await authenticate(request, env);
    if (!authenticated) {
        const response = new Response(JSON.stringify({ error: 'Unauthorized' }), { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    // Extract conversation ID and message ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const conversationIndex = pathParts.indexOf('conversations');
    const conversationId = pathParts[conversationIndex + 1];
    const messageId = pathParts[pathParts.length - 1] !== 'messages' ? pathParts[pathParts.length - 1] : null;

    if (!conversationId) {
        const response = new Response(
            JSON.stringify({ error: 'Conversation ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
        Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
        });
        return response;
    }

    let response;

    try {
        if (request.method === 'GET') {
            // GET /api/conversations/:id/messages
            response = await handleGetMessages(request, env, token, conversationId);
        } else if (request.method === 'POST') {
            // POST /api/conversations/:id/messages
            response = await handleAddMessage(request, env, token, conversationId);
        } else if (request.method === 'DELETE' && messageId) {
            // DELETE /api/conversations/:id/messages/:messageId
            response = await handleDeleteMessage(request, env, token, messageId);
        } else {
            response = new Response('Method Not Allowed', { status: 405 });
        }
    } catch (error) {
        console.error('Request handler error:', error);
        response = new Response(
            JSON.stringify({ error: 'Internal server error', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
}
