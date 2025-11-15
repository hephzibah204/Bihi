export async function onRequest(context) {
  const { request, env } = context
  let body
  try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const { session_id, recording_urls } = body || {}
  if (!session_id) return new Response(JSON.stringify({ error: 'session_id required' }), { status: 400 })
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env || {}
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  const headers = { 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/class_sessions?id=eq.${encodeURIComponent(session_id)}`, { method: 'PATCH', headers, body: JSON.stringify({ status: 'ended', ended_at: new Date().toISOString(), recording_urls: recording_urls || [] }) })
  if (!res.ok) { const t = await res.text(); return new Response(JSON.stringify({ error: t || 'Failed to end session' }), { status: 500 }) }
  const updated = await res.json()
  return new Response(JSON.stringify(Array.isArray(updated) ? updated[0] : updated), { status: 200 })
}
