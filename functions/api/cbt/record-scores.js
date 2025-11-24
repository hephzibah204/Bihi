import { handleCors } from '../../../_lib/cors';
import { requirePlatformRoles } from '../../../_lib/auth';

export async function onRequest(context) {
  const { request, env } = context;
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'POST, OPTIONS');
  if (corsResponse) return corsResponse;
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const auth = await requirePlatformRoles(request, env, ['Teacher', 'School Admin', 'Super Admin']);
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
    const { session_ids } = body;
    
    if (!session_ids || !Array.isArray(session_ids) || session_ids.length === 0) {
      const res = new Response(JSON.stringify({ error: 'session_ids array is required' }), { status: 400 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const token = request.headers.get('Authorization');
    const tenantId = auth.user?.user_metadata?.tenant_id;
    
    if (!tenantId) {
      const res = new Response(JSON.stringify({ error: 'Tenant information missing' }), { status: 401 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const headers = { 
      'Authorization': token, 
      'apikey': env.SUPABASE_ANON_KEY, 
      'Accept': 'application/json', 
      'Content-Type': 'application/json' 
    };

    // Fetch session data with exam and grade information
    const sessionsQuery = session_ids.map(id => `eq.${id}`).join(',');
    const sessionsResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/cbt_sessions?select=id,user_id,exam_id,status&in.id=(${sessionsQuery})`, 
      { headers }
    );

    if (!sessionsResponse.ok) {
      const res = new Response(JSON.stringify({ error: 'Failed to fetch sessions' }), { status: 500 });
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const sessions = await sessionsResponse.json();
    const examIds = [...new Set(sessions.map(s => s.exam_id))];
    const userIds = [...new Set(sessions.map(s => s.user_id))];

    // Fetch exam metadata and grades
    const examsQuery = examIds.map(id => `eq.${id}`).join(',');
    const examsResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/cbt_exams?select=id,subject,class,session,term&in.id=(${examsQuery})`, 
      { headers }
    );

    const gradesResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/cbt_grades?select=session_id,total_score&session_id=in.(${sessionsQuery})`, 
      { headers }
    );

    const [exams, grades] = await Promise.all([
      examsResponse.json(),
      gradesResponse.json()
    ]);

    const examMap = new Map(exams.map(e => [e.id, e]));
    const gradeMap = new Map(grades.map(g => [g.session_id, g]));

    const scoresToInsert = [];
    const errors = [];

    for (const session of sessions) {
      try {
        if (session.status !== 'submitted') {
          errors.push({ session_id: session.id, error: 'Session not submitted' });
          continue;
        }

        const exam = examMap.get(session.exam_id);
        const grade = gradeMap.get(session.id);

        if (!exam) {
          errors.push({ session_id: session.id, error: 'Exam metadata not found' });
          continue;
        }

        if (!grade) {
          errors.push({ session_id: session.id, error: 'Grade not found' });
          continue;
        }

        // Map exam metadata to score record
        const scoreRecord = {
          student_id: session.user_id,
          subject: exam.subject,
          class: exam.class,
          session: exam.session,
          term: exam.term,
          ca_score: 0, // CBT exams are typically exam-only
          exam_score: grade.total_score,
          total_score: grade.total_score,
          grade: calculateGrade(grade.total_score), // Simple grade calculation
          tenant_id: tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        scoresToInsert.push(scoreRecord);
      } catch (error) {
        errors.push({ session_id: session.id, error: error.message });
      }
    }

    // Insert scores in batch
    if (scoresToInsert.length > 0) {
      const insertResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers,
        body: JSON.stringify(scoresToInsert)
      });

      if (!insertResponse.ok) {
        const errorText = await insertResponse.text();
        const res = new Response(JSON.stringify({ 
          error: 'Failed to insert scores', 
          details: errorText,
          errors 
        }), { status: 500 });
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
        return res;
      }
    }

    const res = new Response(JSON.stringify({
      message: 'Scores recorded successfully',
      inserted_count: scoresToInsert.length,
      errors: errors.length > 0 ? errors : undefined
    }), { status: 200 });
    
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;

  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 });
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

function calculateGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  if (score >= 50) return 'E';
  return 'F';
}