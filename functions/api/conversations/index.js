// functions/api/conversations/index.js
// API endpoints for chat conversation management
import { handleCors } from "../../_lib/cors.js";

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

async function handleListConversations(request, env, user, token) {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const type = url.searchParams.get('type');

    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;
        
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/get_user_conversations`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    p_user_id: user.id,
                    p_limit: limit,
                    p_offset: offset
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to list conversations: ${errorText}`);
        }

        let conversations = await response.json();

        // Filter by type if specified
        if (type) {
            conversations = conversations.filter(c => c.type === type);
        }

        return new Response(JSON.stringify({ conversations }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('List conversations error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to list conversations', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleCreateConversation(request, env, user, token) {
    try {
        const body = await request.json();
        const { title, type, metadata, initialMessage } = body;

        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

        // Create conversation
        const convResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/ai_conversations`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    user_id: user.id,
                    title: title || 'New Conversation',
                    type: type || 'text_chat',
                    metadata: metadata || {}
                })
            }
        );

        if (!convResponse.ok) {
            const errorText = await convResponse.text();
            throw new Error(`Failed to create conversation: ${errorText}`);
        }

        const conversations = await convResponse.json();
        const conversation = conversations[0];

        // Add initial message if provided
        let message = null;
        if (initialMessage) {
            const msgResponse = await fetch(
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
                        conversation_id: conversation.id,
                        role: 'user',
                        content: initialMessage,
                        source: 'gemini',
                        is_fallback: false
                    })
                }
            );

            if (msgResponse.ok) {
                const messages = await msgResponse.json();
                message = messages[0];
            }
        }

        return new Response(JSON.stringify({ conversation, message }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Create conversation error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to create conversation', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleGetConversation(request, env, user, token, conversationId) {
    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

        // Get conversation
        const convResponse = await fetch(
            `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${conversationId}&select=*`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!convResponse.ok) {
            throw new Error('Failed to get conversation');
        }

        const conversations = await convResponse.json();
        if (conversations.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Conversation not found' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const conversation = conversations[0];

        // Get messages
        const msgResponse = await fetch(
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

        const messages = msgResponse.ok ? await msgResponse.json() : [];

        return new Response(JSON.stringify({ conversation, messages }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to get conversation', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleUpdateConversation(request, env, user, token, conversationId) {
    try {
        const body = await request.json();
        const { title, metadata } = body;

        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${conversationId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ title, metadata })
            }
        );

        if (!response.ok) {
            throw new Error('Failed to update conversation');
        }

        const conversations = await response.json();
        return new Response(JSON.stringify({ conversation: conversations[0] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Update conversation error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to update conversation', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleDeleteConversation(request, env, user, token, conversationId) {
    try {
        const { SUPABASE_URL, SUPABASE_ANON_KEY } = env;

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/ai_conversations?id=eq.${conversationId}`,
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
            throw new Error('Failed to delete conversation');
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Delete conversation error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to delete conversation', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, env, 'GET, POST, PUT, DELETE, OPTIONS');

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

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const conversationId = pathParts[pathParts.length - 1];

    let response;

    try {
        if (request.method === 'GET' && conversationId && conversationId !== 'conversations') {
            // GET /api/conversations/:id
            response = await handleGetConversation(request, env, user, token, conversationId);
        } else if (request.method === 'GET') {
            // GET /api/conversations
            response = await handleListConversations(request, env, user, token);
        } else if (request.method === 'POST') {
            // POST /api/conversations
            response = await handleCreateConversation(request, env, user, token);
        } else if (request.method === 'PUT' && conversationId) {
            // PUT /api/conversations/:id
            response = await handleUpdateConversation(request, env, user, token, conversationId);
        } else if (request.method === 'DELETE' && conversationId) {
            // DELETE /api/conversations/:id
            response = await handleDeleteConversation(request, env, user, token, conversationId);
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
