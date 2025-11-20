const allowed = [/^https?:\/\/localhost(:\d+)?$/, /^https?:\/\/127\.0\.0\.1(:\d+)?$/, /^https:\/\/.+\.pages\.dev$/, /^https:\/\/.+\.reportsheet\.com\.ng$/]
function cors(request) {
  const origin = request.headers.get('Origin') || ''
  const allow = allowed.some(r => r.test(origin))
  const headers = { 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }
  if (allow) headers['Access-Control-Allow-Origin'] = origin
  if (request.method === 'OPTIONS') return { response: new Response(null, { headers }) }
  return { headers }
}

export async function onRequest(context) {
  const { request, env } = context
  const c = cors(request)
  if (c.response) return c.response
  const headers = c.headers
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {}
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500, headers })
  const admin = { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY }
  if (request.method === 'GET') {
    const u = new URL(request.url)
    const teacherId = u.searchParams.get('teacher_id') || ''
    const res = await fetch(`${SUPABASE_URL}/rest/v1/monitoring_consent?select=*${teacherId ? `&teacher_id=eq.${encodeURIComponent(teacherId)}` : ''}`, { headers: admin })
    const data = await res.json()
    return new Response(JSON.stringify(data || []), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } })
  }
  if (request.method === 'POST') {
    let body
    try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers }) }
    const payload = { tenant_id: body?.tenant_id || null, teacher_id: body?.teacher_id || null, class_name: body?.class_name || null, consent: !!body?.consent, updated_at: new Date().toISOString() }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/monitoring_consent`, { method: 'POST', headers: { ...admin, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify(payload) })
    if (!res.ok) return new Response(JSON.stringify({ error: await res.text() }), { status: 500, headers })
    const data = await res.json()
    return new Response(JSON.stringify(Array.isArray(data) ? data[0] : data), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } })
  }
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers })
}