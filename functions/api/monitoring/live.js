import { requirePlatformRoles } from '../_lib/auth.js'

export async function onRequest(context) {
  const { request, env } = context
  const auth = await requirePlatformRoles(request, env, ['Super Admin','Admin','Teacher'])
  if (!auth.ok) return auth.res
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {}
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  const headers = { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/class_sessions?select=*&status=eq.live&order=started_at.desc`, { headers })
  if (!res.ok) { const t = await res.text(); return new Response(JSON.stringify({ error: t || 'Failed to list live sessions' }), { status: 500 }) }
  const data = await res.json()
  return new Response(JSON.stringify(data || []), { status: 200 })
}