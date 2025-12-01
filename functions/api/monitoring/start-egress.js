import { requirePlatformRoles } from '../../_lib/auth.js'

export async function onRequest(context) {
  const { request, env } = context
  const auth = await requirePlatformRoles(request, env, ['Super Admin','Admin','Teacher'])
  if (!auth.ok) return auth.res
  let body
  try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }) }
  const { session_id, room } = body || {}
  if (!session_id || !room) return new Response(JSON.stringify({ error: 'session_id and room required' }), { status: 400 })
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = env || {}
  const localOnly = (env && env.LIVEKIT_LOCAL_ONLY === 'true')
  const host = (() => { try { return new URL(request.url).hostname } catch { return '' } })()
  if (localOnly && host !== 'localhost' && host !== '127.0.0.1') {
    return new Response(JSON.stringify({ error: 'Egress restricted to local development' }), { status: 403 })
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Server not configured' }), { status: 500 })
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return new Response(JSON.stringify({ error: 'LiveKit not configured' }), { status: 500 })
  try {
    const { EgressClient } = await import('livekit-server-sdk')
    const client = new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
    const res = await client.startRoomCompositeEgress({ roomName: room }, { hls: { playlistName: 'index.m3u8' } })
    const url = res?.hls?.playlistUrl || res?.hls?.url || ''
    const headers = { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' }
    const sess = await fetch(`${SUPABASE_URL}/rest/v1/class_sessions?select=*&id=eq.${encodeURIComponent(session_id)}`, { headers })
    const data = await sess.json()
    const rec = Array.isArray(data) ? data[0] : data
    const existing = Array.isArray(rec?.recording_urls) ? rec.recording_urls : []
    const next = url ? [...existing, url] : existing
    await fetch(`${SUPABASE_URL}/rest/v1/class_sessions?id=eq.${encodeURIComponent(session_id)}`, { method: 'PATCH', headers, body: JSON.stringify({ recording_urls: next }) })
    return new Response(JSON.stringify({ url }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Egress failed' }), { status: 500 })
  }
}
