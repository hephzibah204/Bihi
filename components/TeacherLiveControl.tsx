import React, { useCallback, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { uploadRecording } from '../services/recordingService'
import { connectAndPublishAudio } from '../services/livekitClient'

type Status = 'idle' | 'recording' | 'saving' | 'saved' | 'error'
type LiveStatus = 'not_live' | 'connecting' | 'live' | 'stopping'

const TeacherLiveControl: React.FC = () => {
  const { user } = useAuth()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const liveRoomRef = useRef<any>(null)
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('not_live')

  const startRecording = useCallback(async () => {
    setErrorMessage(null)
    setRecordingUrl(null)
    const isSecure = typeof window !== 'undefined' && ((window as any).isSecureContext || location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname))
    if (!isSecure || !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      setErrorMessage('Microphone requires HTTPS or localhost')
      setStatus('error')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recorder.ondataavailable = e => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = async () => {
        try {
          setStatus('saving')
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          chunksRef.current = []
          const teacherId = String((user as any)?.id || 'unknown')
          const { url } = await uploadRecording(blob, teacherId)
          setRecordingUrl(url)
          setStatus('saved')
        } catch (e: any) {
          setErrorMessage(e?.message || 'Failed to save recording')
          setStatus('error')
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setStatus('recording')
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to access microphone')
      setStatus('error')
    }
  }, [user])

  const stopRecording = useCallback(() => {
    try { recorderRef.current?.stop() } catch {}
    try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    streamRef.current = null
    recorderRef.current = null
  }, [])

  const goLive = useCallback(async () => {
    setErrorMessage(null)
    const isSecure = typeof window !== 'undefined' && ((window as any).isSecureContext || location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname))
    if (!isSecure) { setErrorMessage('Live requires HTTPS or localhost'); setLiveStatus('not_live'); return }
    try {
      setLiveStatus('connecting')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const roomName = `tenant_${localStorage.getItem('tenantId') || 'default'}_class_${(user as any)?.classTeacherOf || 'general'}`
      const res = await fetch('/api/monitoring/rtc-token', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': typeof window !== 'undefined' ? `Bearer ${sessionStorage.getItem('sb:token') || ''}` : '' }, body: JSON.stringify({ room: roomName, grantRole: 'publisher' }) })
      if (!res.ok) throw new Error('Failed to get RTC token')
      const { token, url } = await res.json()
      const room = await connectAndPublishAudio(url, token, stream)
      liveRoomRef.current = room
      setLiveStatus('live')
    } catch (e: any) {
      setErrorMessage(e?.message || 'Failed to go live')
      setLiveStatus('not_live')
    }
  }, [user])

  const stopLive = useCallback(async () => {
    setLiveStatus('stopping')
    try {
      await liveRoomRef.current?.disconnect?.()
    } catch {}
    try { streamRef.current?.getTracks().forEach(t => t.stop()) } catch {}
    liveRoomRef.current = null
    setLiveStatus('not_live')
  }, [])

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Classroom Monitoring</h1>
      <p className="text-sm text-gray-600 mb-6">Record lesson audio and upload for Admin review.</p>
      <div className="mb-4 p-3 border rounded">
        <div className="font-medium mb-2">Live Streaming</div>
        {liveStatus === 'not_live' && (
          <button onClick={goLive} className="btn btn-primary">Go Live (Audio)</button>
        )}
        {liveStatus === 'connecting' && <div className="text-indigo-600">Connecting...</div>}
        {liveStatus === 'live' && (
          <div className="flex items-center gap-3">
            <span className="text-green-700">Live</span>
            <button onClick={stopLive} className="btn btn-secondary">Stop Live</button>
          </div>
        )}
      </div>
      {status === 'idle' && (
        <button onClick={startRecording} className="btn btn-primary">Start Recording</button>
      )}
      {status === 'recording' && (
        <div className="flex items-center gap-3">
          <span className="text-green-700">Recording...</span>
          <button onClick={stopRecording} className="btn btn-secondary">Stop</button>
        </div>
      )}
      {status === 'saving' && (
        <div className="text-indigo-600">Saving recording...</div>
      )}
      {status === 'saved' && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="text-green-700">Recording uploaded</div>
          </div>
          {recordingUrl && (
            <audio controls src={recordingUrl} className="w-full" />
          )}
        </div>
      )}
      {status === 'error' && (
        <div className="space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-red-700">{errorMessage || 'Error'}</div>
          </div>
          <button onClick={startRecording} className="btn btn-primary">Try Again</button>
        </div>
      )}
    </div>
  )
}

export default TeacherLiveControl
