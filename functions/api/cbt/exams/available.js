import { handleCors } from '../../../_lib/cors'
import { requirePlatformRoles } from '../../../_lib/auth'

function json(headers) {
  const res = new Response('', { status: 200 })
  Object.entries(headers).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

export async function onRequest(context) {
  const { request, env } = context
  const { response: corsResponse, corsHeaders, isAllowed } = handleCors(request, 'GET, OPTIONS')
  if (corsResponse) return corsResponse
  if (!isAllowed) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

  const auth = await requirePlatformRoles(request, env, ['Super Admin', 'School Admin', 'Teacher', 'Student'])
  if (!auth.ok) return auth.res

  try {
    if (request.method === 'OPTIONS') {
      return json(corsHeaders)
    }

    const now = Date.now()
    const token = request.headers.get('Authorization')
    const headers = { 'Authorization': token, 'apikey': env.SUPABASE_ANON_KEY, 'Accept': 'application/json' }
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_exams?select=id,title,rules,time_window_start,time_window_end,status&status=eq.ready&limit=1000`, { headers })
    if (!r.ok) {
      const res = new Response(JSON.stringify({ error: 'Query failed', details: await r.text() }), { status: 500 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }
    const rows = await r.json()
    const role = auth.user?.user_metadata?.platform_role || auth.user?.user_metadata?.role
    let className = auth.user?.user_metadata?.class_name || auth.user?.user_metadata?.class || null
    const available = rows.filter(e => {
      const start = e.time_window_start ? new Date(e.time_window_start).getTime() : 0
      const end = e.time_window_end ? new Date(e.time_window_end).getTime() : Number.MAX_SAFE_INTEGER
      const windowOk = now >= start && now <= end
      const targets = Array.isArray(e?.rules?.targetClasses) ? e.rules.targetClasses : []
      const classOk = role === 'Student' ? (!targets.length || (className && targets.includes(className))) : true
      return windowOk && classOk
    })
    const res = new Response(JSON.stringify(available), { status: 200 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }
}