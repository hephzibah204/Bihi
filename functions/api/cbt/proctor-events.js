import { handleCors } from '../../_lib/cors'
import { requirePlatformRoles } from '../../_lib/auth'

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
    const { session_id, event_type, payload, risk_increment } = body || {}
    if (!session_id || !event_type) {
      const res = new Response(JSON.stringify({ error: 'session_id and event_type required' }), { status: 400 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const token = request.headers.get('Authorization')
    const headers = { 'Authorization': token, 'apikey': env.SUPABASE_ANON_KEY, 'Accept': 'application/json', 'Content-Type': 'application/json' }

    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_proctor_events`, {
      method: 'POST', headers, body: JSON.stringify({ session_id, event_type, payload: payload || {}, risk_increment: risk_increment || 0 })
    })
    if (!r.ok) {
      const res = new Response(JSON.stringify({ error: 'Insert failed', details: await r.text() }), { status: 500 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }
    const row = await r.json()
    const data = Array.isArray(row) ? row[0] : row
    const res = new Response(JSON.stringify(data), { status: 201 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }
}

