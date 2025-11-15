export async function onRequest(context) {
  const { request, env } = context
  let body
  try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const { session_id, subject_id, class_name, term, exam_weight = 100 } = body || {}
  if (!session_id || !subject_id || !class_name || !term) return new Response(JSON.stringify({ error: 'session_id, subject_id, class_name, term required' }), { status: 400 })
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {}
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  const headers = { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY }
  const jsonHeaders = { ...headers, 'Content-Type': 'application/json' }
  try {
    const grade = await (await fetch(`${SUPABASE_URL}/rest/v1/cbt_grades?select=*&session_id=eq.${encodeURIComponent(session_id)}`, { headers })).json()
    const session = await (await fetch(`${SUPABASE_URL}/rest/v1/cbt_sessions?select=*&id=eq.${encodeURIComponent(session_id)}`, { headers })).json()
    const s = Array.isArray(session) ? session[0] : session
    const g = Array.isArray(grade) ? grade[0] : grade
    if (!s || !g) return new Response(JSON.stringify({ error: 'Session or grade not found' }), { status: 404 })
    const studentId = s.user_id
    const total = Number(g.total_score || 0)
    const payload = { studentId: studentId, subjectId: subject_id, class: class_name, term, exam: total, ca1: null, ca2: null, session: s?.academic_session || '' }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) })
    if (!res.ok) {
      await fetch(`${SUPABASE_URL}/rest/v1/scores?studentId=eq.${encodeURIComponent(studentId)}&subjectId=eq.${encodeURIComponent(subject_id)}&term=eq.${encodeURIComponent(term)}`, { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify({ exam: total }) })
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Record failed', details: String(err.message || err) }), { status: 500 })
  }
}
