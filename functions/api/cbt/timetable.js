import { handleCors } from '../_lib/cors'
import { requirePlatformRoles } from '../_lib/auth'

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

    const url = new URL(request.url)
    const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '30', 10), 1), 90)
    const until = new Date(Date.now() + days * 86400000).toISOString()
    const token = request.headers.get('Authorization')
    const headers = { 'Authorization': token, 'apikey': env.SUPABASE_ANON_KEY, 'Accept': 'application/json' }
    const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cbt_exams?select=id,title,rules,time_window_start,time_window_end,status&status=eq.ready&time_window_start=lte.${encodeURIComponent(until)}&limit=1000`, { headers })
    if (!r.ok) {
      const res = new Response(JSON.stringify({ error: 'Query failed', details: await r.text() }), { status: 500 })
      Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }
    const rows = await r.json()
    const timetable = rows
      .map(e => ({ id: e.id, title: e.title, start: e.time_window_start, end: e.time_window_end, classes: Array.isArray(e?.rules?.targetClasses) ? e.rules.targetClasses : [] }))
      .sort((a, b) => new Date(a.start || 0).getTime() - new Date(b.start || 0).getTime())
    const res = new Response(JSON.stringify({ days, entries: timetable }), { status: 200 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  } catch (err) {
    const res = new Response(JSON.stringify({ error: 'Internal Server Error', details: err?.message }), { status: 500 })
    Object.entries(corsHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }
}

