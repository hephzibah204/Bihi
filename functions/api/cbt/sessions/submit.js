import { handleCors } from '../../../_lib/cors';
import { requirePlatformRoles } from '../../../_lib/auth';

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'POST, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requirePlatformRoles(request, env, ['Student']);
  if (!auth.ok) return auth.res;

  try {
    if (request.method === 'OPTIONS') {
      const res = new Response('', { status: 200 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (request.method !== 'POST') {
      const res = new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const body = await request.json();
    const { session_id, responses } = body;
    
    if (!session_id) {
      const res = new Response(JSON.stringify({ error: 'session_id is required' }), { status: 400 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const token = request.headers.get('Authorization');
    const userId = auth.user?.id;
    const tenantId = auth.user?.user_metadata?.tenant_id;
    
    if (!userId || !tenantId) {
      const res = new Response(JSON.stringify({ error: 'User authentication incomplete' }), { status: 401 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const headers = { 
      'Authorization': token, 
      'apikey': env.SUPABASE_ANON_KEY, 
      'Accept': 'application/json', 
      'Content-Type': 'application/json' 
    };

    // Verify session ownership and status
    const sessionCheck = await fetch(
      `${env.SUPABASE_URL}/rest/v1/cbt_sessions?id=eq.${session_id}&user_id=eq.${userId}&select=id,status,exam_id`, 
      { headers }
    );
    
    if (!sessionCheck.ok) {
      const res = new Response(JSON.stringify({ error: 'Session validation failed' }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const sessions = await sessionCheck.json();
    if (!sessions || sessions.length === 0) {
      const res = new Response(JSON.stringify({ error: 'Session not found or unauthorized' }), { status: 404 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const session = sessions[0];
    if (session.status === 'submitted') {
      const res = new Response(JSON.stringify({ error: 'Session already submitted' }), { status: 400 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Process responses if provided
    if (responses && Array.isArray(responses)) {
      for (const response of responses) {
        if (!response.item_id || !response.answer) continue;
        
        const responsePayload = {
          session_id: session_id,
          item_id: response.item_id,
          answer: response.answer,
          time_on_item_seconds: response.time_on_item_seconds || 0,
          created_at: new Date().toISOString()
        };

        await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_responses`, { 
          method: 'POST', 
          headers, 
          body: JSON.stringify(responsePayload) 
        });
      }
    }

    // Update session status to submitted
    const updatePayload = {
      status: 'submitted',
      submitted_at: new Date().toISOString()
    };

    const updateSession = await fetch(
      `${env.SUPABASE_URL}/rest/v1/cbt_sessions?id=eq.${session_id}`, 
      { 
        method: 'PATCH', 
        headers, 
        body: JSON.stringify(updatePayload) 
      }
    );

    if (!updateSession.ok) {
      const errorText = await updateSession.text();
      const res = new Response(JSON.stringify({ error: 'Failed to submit session', details: errorText }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Trigger automatic marking
    try {
      await fetch(`${new URL(request.url).origin}/api/cbt/mark-session`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id })
      });
    } catch (markingError) {
      console.error('Automatic marking failed:', markingError);
      // Continue even if marking fails - can be retried later
    }

    const res = new Response(JSON.stringify({
      session_id: session_id,
      status: 'submitted',
      message: 'Session submitted successfully'
    }), { status: 200 });
    
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;

  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}
