import { resolveTeachersColumns } from '../../_lib/schema'

const allowedOriginPatterns = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/reportsheet\.com\.ng$/,
  /^https:\/\/.+\.reportsheet\.com\.ng$/,
  /^https:\/\/.+\.pages\.dev$/,
]

function handleCors(request) {
  const origin = request.headers.get('Origin')
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
  if (origin && allowedOriginPatterns.some(p => p.test(origin))) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  if (request.method === 'OPTIONS') {
    return { response: new Response(null, { headers }), corsHeaders: headers }
  }
  return { response: null, corsHeaders: headers }
}

async function getUserAndRole(request, env) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = env || {}
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
  })
  if (!authResponse.ok) return null
  const user = await authResponse.json()
  const role = user?.user_metadata?.platform_role || user?.user_metadata?.role
  return { user, role }
}

export async function onRequest(context) {
  const { request, env } = context
  const { response: corsResponse } = handleCors(request)
  if (corsResponse) return corsResponse

  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL } = env || {}
  const localOnly = (env && env.LIVEKIT_LOCAL_ONLY === 'true')
  const host = (() => { try { return new URL(request.url).hostname } catch { return '' } })()
  if (localOnly && host !== 'localhost' && host !== '127.0.0.1') {
    return new Response(JSON.stringify({ error: 'LiveKit restricted to local development' }), { status: 403 })
  }
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
    return new Response(JSON.stringify({ error: 'LiveKit not configured' }), { status: 500 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }
  const roomName = body?.room || body?.room_name
  const grantRole = body?.grantRole || 'subscriber'
  if (!roomName) return new Response(JSON.stringify({ error: 'room is required' }), { status: 400 })

  const identity = body?.identity || `user_${Date.now()}`

  const auth = await getUserAndRole(request, env)
  if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const role = auth.role
  const isAdmin = role === 'Super Admin' || role === 'Admin'
  const isTeacher = role === 'Teacher'

  if (grantRole === 'publisher' && !isTeacher) {
    return new Response(JSON.stringify({ error: 'Only teachers can publish' }), { status: 403 })
  }
  if (grantRole === 'subscriber' && !(isAdmin || isTeacher)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 })
  }

  const { AccessToken, RoomServiceClient } = await import('@livekit/server-sdk')
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity })
  at.addGrant({ room: roomName, roomJoin: true, canPublish: grantRole === 'publisher', canSubscribe: true })
  const token = await at.toJwt()

  return new Response(JSON.stringify({ token, url: LIVEKIT_URL }), { status: 200 })
}