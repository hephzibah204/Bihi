import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listRecordings } from '../services/recordingService'
import { connectAndSubscribe } from '../services/livekitClient'

type Rec = { url: string; path: string; name: string }

const AdminMonitorView: React.FC = () => {
  const { role, user } = useAuth()
  const [items, setItems] = useState<Rec[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const list = await listRecordings()
        setItems(list)
        const liveRes = await fetch('/api/monitoring/live')
        if (liveRes.ok) setLiveSessions(await liveRes.json())
      } catch (e: any) {
        setError(e?.message || 'Failed to load recordings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const joinLive = async (roomName: string) => {
    try {
      const res = await fetch('/api/monitoring/rtc-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ room: roomName, grantRole: 'subscriber' }) })
      if (!res.ok) throw new Error('Failed to get token')
      const { token, url } = await res.json()
      await connectAndSubscribe(url, token, el => {
        audioRef.current = el
        el.controls = true
        el.autoplay = true
        el.className = 'w-full'
      })
    } catch (e: any) {
      setError(e?.message || 'Failed to join live')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Classroom Monitoring</h1>
      <p className="text-sm text-gray-600 mb-6">Listen to recorded lessons. Live listening will be enabled next.</p>
      {loading && <div className="text-indigo-600">Loading...</div>}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded mb-3">
          <div className="text-red-700">{error}</div>
        </div>
      )}
      <div className="space-y-4">
        {items.map(it => (
          <div key={it.path} className="p-3 border rounded">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-800">{it.name}</div>
              <a href={it.url} target="_blank" rel="noreferrer" className="text-indigo-600">Open</a>
            </div>
            <audio controls src={it.url} className="w-full" />
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div className="text-gray-600">No recordings yet</div>
        )}
      </div>
    </div>
  )
}

export default AdminMonitorView
      <div className="space-y-2 mb-6">
        <div className="font-medium">Live Sessions</div>
        {liveSessions.map(s => (
          <div key={s.id} className="flex items-center justify-between p-2 border rounded">
            <div>{s.class_name} • {s.room_name}</div>
            <button className="btn btn-primary" onClick={() => joinLive(s.room_name)}>Listen</button>
          </div>
        ))}
        {liveSessions.length === 0 && <div className="text-gray-600">No live sessions</div>}
      </div>
