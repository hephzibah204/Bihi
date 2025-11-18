import { connectAndPublishAudio, connectAndSubscribe } from './livekitClient'
import { uploadRecording } from './recordingService'
import { getSupabase } from './supabaseClient'
import { getTurnEnv } from '../utils/env'

type PubResult = { provider: 'livekit' | 'webrtc' | 'recorder'; room?: any }
type SubResult = { provider: 'livekit' | 'webrtc'; room?: any }

function makePC() {
  const turn = getTurnEnv()
  const servers: RTCIceServer[] = [{ urls: ['stun:stun.l.google.com:19302'] }]
  if (turn.url) {
    servers.push({ urls: [turn.url], username: turn.username, credential: turn.password })
  }
  return new RTCPeerConnection({ iceServers: servers })
}

export async function startPublisher(roomName: string, stream: MediaStream, prefer: Array<'livekit' | 'webrtc' | 'recorder'>): Promise<PubResult> {
  for (const p of prefer) {
    try {
      if (p === 'livekit') {
        const res = await fetch('/api/monitoring/rtc-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: roomName, grantRole: 'publisher' }) })
        if (!res.ok) throw new Error('token')
        const { token, url } = await res.json()
        const room = await connectAndPublishAudio(url, token, stream)
        return { provider: 'livekit', room }
      }
      if (p === 'webrtc') {
        const supabase = getSupabase()
        const channel = supabase.channel(`monitor_${roomName}`)
        const pc = makePC()
        stream.getAudioTracks().forEach(t => pc.addTrack(t, stream))
        channel.on('broadcast', { event: 'answer' }, async payload => { await pc.setRemoteDescription(new RTCSessionDescription(payload.data)) })
        channel.on('broadcast', { event: 'ice' }, payload => { pc.addIceCandidate(new RTCIceCandidate(payload.data)) })
        pc.onicecandidate = e => { if (e.candidate) channel.send({ type: 'broadcast', event: 'ice', payload: e.candidate }) }
        await channel.subscribe()
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        channel.send({ type: 'broadcast', event: 'offer', payload: offer })
        return { provider: 'webrtc', room: { pc, channel } }
      }
      if (p === 'recorder') {
        const r = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        const chunks: Blob[] = []
        r.ondataavailable = e => { if (e.data && e.data.size > 0) chunks.push(e.data) }
        r.onstop = async () => { const blob = new Blob(chunks, { type: 'audio/webm' }); chunks.length = 0; const teacherId = localStorage.getItem('currentUserId') || 'unknown'; await uploadRecording(blob, teacherId) }
        r.start()
        return { provider: 'recorder', room: { recorder: r } }
      }
    } catch {}
  }
  throw new Error('no_provider')
}

export async function startSubscriber(roomName: string, onAudio: (el: HTMLAudioElement) => void, prefer: Array<'livekit' | 'webrtc'>): Promise<SubResult> {
  for (const p of prefer) {
    try {
      if (p === 'livekit') {
        const res = await fetch('/api/monitoring/rtc-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: roomName, grantRole: 'subscriber' }) })
        if (!res.ok) throw new Error('token')
        const { token, url } = await res.json()
        const room = await connectAndSubscribe(url, token, onAudio)
        return { provider: 'livekit', room }
      }
      if (p === 'webrtc') {
        const supabase = getSupabase()
        const channel = supabase.channel(`monitor_${roomName}`)
        const pc = makePC()
        channel.on('broadcast', { event: 'offer' }, async payload => { await pc.setRemoteDescription(new RTCSessionDescription(payload.data)); const answer = await pc.createAnswer(); await pc.setLocalDescription(answer); channel.send({ type: 'broadcast', event: 'answer', payload: answer }) })
        channel.on('broadcast', { event: 'ice' }, payload => { pc.addIceCandidate(new RTCIceCandidate(payload.data)) })
        pc.ontrack = e => { const el = e.streams[0] ? Object.assign(document.createElement('audio'), { autoplay: true, srcObject: e.streams[0] }) : null; if (el) onAudio(el) }
        await channel.subscribe()
        return { provider: 'webrtc', room: { pc, channel } }
      }
    } catch {}
  }
  throw new Error('no_provider')
}
