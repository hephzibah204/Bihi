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
    const { exam_id } = body;
    
    if (!exam_id) {
      const res = new Response(JSON.stringify({ error: 'exam_id is required' }), { status: 400 });
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

    // Check if exam exists and is available
    const examCheck = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_exams?id=eq.${exam_id}&select=id,status,time_window_start,time_window_end`, { headers });
    if (!examCheck.ok) {
      const res = new Response(JSON.stringify({ error: 'Exam validation failed' }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }
    
    const exams = await examCheck.json();
    if (!exams || exams.length === 0) {
      const res = new Response(JSON.stringify({ error: 'Exam not found' }), { status: 404 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const exam = exams[0];
    const now = new Date();
    
    // Check exam status and time window
    if (exam.status !== 'ready') {
      const res = new Response(JSON.stringify({ error: 'Exam is not available for taking' }), { status: 403 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (exam.time_window_start && new Date(exam.time_window_start) > now) {
      const res = new Response(JSON.stringify({ error: 'Exam window has not started' }), { status: 403 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    if (exam.time_window_end && new Date(exam.time_window_end) < now) {
      const res = new Response(JSON.stringify({ error: 'Exam window has ended' }), { status: 403 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    // Check for existing active session
    const existingSessionCheck = await fetch(
      `${env.SUPABASE_URL}/rest/v1/cbt_sessions?exam_id=eq.${exam_id}&user_id=eq.${userId}&status=in.(not_started,in_progress)&select=id,status`, 
      { headers }
    );
    
    if (existingSessionCheck.ok) {
      const existingSessions = await existingSessionCheck.json();
      if (existingSessions && existingSessions.length > 0) {
        const res = new Response(JSON.stringify({ 
          session_id: existingSessions[0].id,
          status: existingSessions[0].status,
          message: 'Existing session found'
        }), { status: 200 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
    }

    // Create new session
    const sessionPayload = {
      exam_id,
      user_id: userId,
      tenant_id: tenantId,
      status: 'not_started',
      risk_score: 0,
      created_at: new Date().toISOString()
    };

    const createSession = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_sessions`, { 
      method: 'POST', 
      headers, 
      body: JSON.stringify(sessionPayload) 
    });

    if (!createSession.ok) {
      const errorText = await createSession.text();
      const res = new Response(JSON.stringify({ error: 'Failed to create session', details: errorText }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const newSession = await createSession.json();
    const responseData = Array.isArray(newSession) ? newSession[0] : newSession;

    const res = new Response(JSON.stringify({
      session_id: responseData.id,
      status: responseData.status,
      exam_id: responseData.exam_id,
      message: 'Session created successfully'
    }), { status: 201 });
    
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;

  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

