import { handleCors } from '../../../_lib/cors'
import { requirePlatformRoles } from '../../../_lib/auth'

function json(headers) {
  const res = new Response('', { status: 200 })
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

export async function onRequest(context) {
  const { request, env } = context
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'POST, OPTIONS')
  if (corsResponse) return corsResponse
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

  const auth = await requirePlatformRoles(request, env, ['Super Admin', 'School Admin', 'Teacher', 'Student'])
  if (!auth.ok) return auth.res

  try {
    if (request.method === 'OPTIONS') {
      return json(corsHeaders)
    }

    const body = await request.json()
    const sessionId = body?.session_id
    const responses = Array.isArray(body?.responses) ? body.responses : []
    if (!sessionId || !responses.length) {
      const res = new Response(JSON.stringify({ error: 'session_id and responses[] required' }), { status: 400 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const token = request.headers.get('Authorization')
    const headers = { 'Authorization': token, 'apikey': env.SUPABASE_ANON_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' }

    // Insert responses
    for (const r of responses) {
      const payload = {
        session_id: sessionId,
        item_id: r.item_id,
        answer: r.answer,
        time_on_item_seconds: r.time_on_item_seconds || null
      }
      const ins = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_responses`, { method: 'POST', headers, body: JSON.stringify(payload) })
      if (!ins.ok) {
        const res = new Response(JSON.stringify({ error: 'Response insert failed', details: await ins.text() }), { status: 500 })
        Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
        return res
      }
    }

    // Update session status
    const patch = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_sessions?id=eq.${encodeURIComponent(sessionId)}`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'submitted', submitted_at: new Date().toISOString() }) })
    if (!patch.ok) {
      const res = new Response(JSON.stringify({ error: 'Session update failed', details: await patch.text() }), { status: 500 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    // Fetch session and exam to decide automation rules
    const base = env.SUPABASE_URL
    const serviceHeaders = { 'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': env.SUPABASE_SERVICE_ROLE_KEY }
    let sessionRow = null
    try {
      const sRes = await fetch(`${base}/rest/v1/cbt_sessions?select=*&id=eq.${encodeURIComponent(sessionId)}`, { headers: serviceHeaders })
      const sJson = await sRes.json()
      sessionRow = Array.isArray(sJson) ? sJson[0] : sJson
    } catch {}
    let examRow = null
    try {
      if (sessionRow?.exam_id) {
        const eRes = await fetch(`${base}/rest/v1/cbt_exams?select=id,rules&id=eq.${encodeURIComponent(sessionRow.exam_id)}`, { headers: serviceHeaders })
        const eJson = await eRes.json()
        examRow = Array.isArray(eJson) ? eJson[0] : eJson
      }
    } catch {}

    let gradeBody = null
    const autoGrade = !!(examRow?.rules?.autoGradeOnSubmit)
    const autoEnter = !!(examRow?.rules?.autoEnterScores)
    if (autoGrade) {
      const grade = await fetch(`${new URL(request.url).origin}/api/cbt/mark-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: sessionId }) })
      try { gradeBody = await grade.json() } catch { gradeBody = null }
      if (autoEnter && examRow?.rules?.scoreEntry?.subjectId && examRow?.rules?.scoreEntry?.className && examRow?.rules?.scoreEntry?.term) {
        try {
          await fetch(`${new URL(request.url).origin}/api/cbt/record-scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              subject_id: examRow.rules.scoreEntry.subjectId,
              class_name: examRow.rules.scoreEntry.className,
              term: examRow.rules.scoreEntry.term,
              exam_weight: examRow.rules.scoreEntry.examWeight || 100
            })
          })
        } catch {}
      }
    }

    const res = new Response(JSON.stringify({ ok: true, grade: gradeBody || null, automated: { grade: autoGrade, enterScores: autoEnter } }), { status: 200 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }
}
