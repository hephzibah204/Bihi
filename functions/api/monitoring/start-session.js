import { requirePlatformRoles } from '../../_lib/auth.js'

export async function onRequest(context) {
  const { request, env } = context
  const auth = await requirePlatformRoles(request, env, ['Super Admin','Admin','Teacher'])
  if (!auth.ok) return auth.res
  let body
  try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const { room, class_name, is_audio_only = true } = body || {}
  if (!room || !class_name) return new Response(JSON.stringify({ error: 'room and class_name required' }), { status: 400 })
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {}
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  const headers = { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
  const payload = { tenant_id: body?.tenant_id || null, teacher_id: body?.teacher_id || null, class_name, room_name: room, status: 'live', is_audio_only, started_at: new Date().toISOString() }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/class_sessions`, { method: 'POST', headers, body: JSON.stringify(payload) })
  if (!res.ok) { const t = await res.text(); return new Response(JSON.stringify({ error: t || 'Failed to create session' }), { status: 500 }) }
  const created = await res.json()
  return new Response(JSON.stringify(Array.isArray(created) ? created[0] : created), { status: 200 })
}