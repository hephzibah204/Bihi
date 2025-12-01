import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listRecordings } from '../services/recordingService'
import { startSubscriber } from '../services/rtcRouter'
import { initSupabase, isSupabaseOnline, getSupabase } from '../services/supabaseClient'
import { getSupabaseConfig } from '../utils/env'

type Rec = { url: string; path: string; name: string }

const AdminMonitorView: React.FC = () => {
  const { role, user } = useAuth()
  const [items, setItems] = useState<Rec[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [provider, setProvider] = useState<'livekit' | 'webrtc' | null>(null)
  const [isDbOnline, setIsDbOnline] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)

  // Initialize database connection
  useEffect(() => {
    let mounted = true
    const initDb = async () => {
      try {
        // Check configuration first
        const config = getSupabaseConfig()
        if (!config.url || !config.anonKey) {
          if (mounted) {
            setIsDbOnline(false)
            setDbError('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
          }
          return
        }

        await initSupabase()
        
        // Verify client was created
        try {
          const client = getSupabase()
          if (!client || client._offline) {
            if (mounted) {
              setIsDbOnline(false)
              setDbError('Database client initialized in offline mode. Check your configuration.')
            }
            return
          }
        } catch (clientErr: any) {
          if (mounted) {
            setIsDbOnline(false)
            setDbError(`Failed to get database client: ${clientErr?.message || 'Client initialization error'}`)
          }
          return
        }

        const online = await isSupabaseOnline()
        if (mounted) {
          setIsDbOnline(online)
          setDbError(null)
        }
      } catch (err: any) {
        if (mounted) {
          setIsDbOnline(false)
          const errorMsg = err?.message || 'Failed to connect to database'
          if (errorMsg.includes('fetch')) {
            setDbError('Network error. Check your internet connection and Supabase URL.')
          } else {
            setDbError(errorMsg)
          }
        }
      }
    }
    initDb()
    
    const onReconnect = () => {
      setIsDbOnline(true)
      setDbError(null)
    }
    const onLost = () => {
      setIsDbOnline(false)
      setDbError('Connection lost')
    }
    
    window.addEventListener('supabase-reconnected', onReconnect as EventListener)
    window.addEventListener('supabase-connection-lost', onLost as EventListener)
    
    return () => {
      mounted = false
      window.removeEventListener('supabase-reconnected', onReconnect as EventListener)
      window.removeEventListener('supabase-connection-lost', onLost as EventListener)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      // Only load data if database is connected
      if (!isDbOnline) {
        setError('Database not connected. Please check your connection.')
        return
      }
      
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
  }, [isDbOnline])

  const testConnection = async () => {
    setTestingConnection(true)
    setDbError(null)
    try {
      // Check configuration first
      const config = getSupabaseConfig()
      if (!config.url) {
        setDbError('Missing Supabase URL. Please set VITE_SUPABASE_URL in .env.local')
        setIsDbOnline(false)
        return
      }
      if (!config.anonKey) {
        setDbError('Missing Supabase Anon Key. Please set VITE_SUPABASE_ANON_KEY in .env.local')
        setIsDbOnline(false)
        return
      }

      // Try to initialize
      await initSupabase()
      
      // Get client with error handling
      let client
      try {
        client = getSupabase()
      } catch (initErr: any) {
        setDbError(`Failed to get database client: ${initErr?.message || 'Initialization error'}. Check your configuration.`)
        setIsDbOnline(false)
        return
      }
      
      // Check if client exists and is valid
      if (!client) {
        setDbError('Database client is null. Check your configuration.')
        setIsDbOnline(false)
        return
      }
      
      // Check if client is in offline mode
      if (client._offline) {
        setDbError('Database client initialized in offline mode. Check your configuration.')
        setIsDbOnline(false)
        return
      }
      
      // Check if client has the 'from' method (required for queries)
      if (typeof client.from !== 'function') {
        setDbError('Database client is not properly initialized. Missing query methods.')
        setIsDbOnline(false)
        return
      }

      // Test connection
      const online = await isSupabaseOnline()
      setIsDbOnline(online)
      
      if (!online) {
        // Try to get more details about why it failed
        try {
          if (client && typeof client.from === 'function') {
            // Additional validation before making the query
            const queryBuilder = client.from('platform_settings')
            if (!queryBuilder || typeof queryBuilder.select !== 'function') {
              setDbError('Database query builder not available. The Supabase client may not be properly initialized.')
              return
            }
            
            const { error } = await queryBuilder.select('id').limit(1)
            if (error) {
              setDbError(`Connection failed: ${error.message || error.code || 'Unknown error'}. Check your API key and network connection.`)
            } else {
              setDbError('Connection test failed. Check your network and configuration.')
            }
          } else {
            setDbError('Database client methods not available. Check your Supabase configuration.')
          }
        } catch (testErr: any) {
          const errorMsg = testErr?.message || 'Unable to reach database'
          // Provide more specific error messages
          if (errorMsg.includes('fetch') || errorMsg.includes('undefined')) {
            setDbError('Database client initialization error. Please restart the application and check your configuration.')
          } else if (errorMsg.includes('network') || errorMsg.includes('Failed to fetch')) {
            setDbError('Network error. Check your internet connection and verify the Supabase URL is correct.')
          } else {
            setDbError(`Connection test failed: ${errorMsg}. Verify your Supabase URL and API key are correct.`)
          }
        }
      }
    } catch (err: any) {
      setIsDbOnline(false)
      const errorMsg = err?.message || 'Connection test failed'
      if (errorMsg.includes('not initialized')) {
        setDbError('Database initialization failed. Check your environment variables.')
      } else if (errorMsg.includes('Invalid API key') || errorMsg.includes('JWT')) {
        setDbError('Invalid API key. Please verify VITE_SUPABASE_ANON_KEY in .env.local')
      } else if (errorMsg.includes('Failed to fetch') || errorMsg.includes('network')) {
        setDbError('Network error. Check your internet connection and Supabase URL.')
      } else {
        setDbError(`Connection error: ${errorMsg}`)
      }
    } finally {
      setTestingConnection(false)
    }
  }

  const getConfigStatus = () => {
    try {
      const config = getSupabaseConfig()
      return {
        hasUrl: !!config.url,
        hasKey: !!config.anonKey,
        url: config.url ? `${config.url.substring(0, 20)}...` : 'Not set',
        keyType: config.anonKey ? (config.anonKey.length > 200 ? 'service_role' : 'anon') : 'none'
      }
    } catch {
      return {
        hasUrl: false,
        hasKey: false,
        url: 'Error reading config',
        keyType: 'none'
      }
    }
  }

  const joinLive = async (roomName: string) => {
    try {
      const isLocalHost = typeof window !== 'undefined' && (['localhost','127.0.0.1'].includes(location.hostname))
      const res = await startSubscriber(roomName, el => {
        audioRef.current = el
        el.controls = true
        el.autoplay = true
        el.className = 'w-full'
      }, (isLocalHost ? ['livekit','webrtc'] : ['webrtc']) as any)
      setProvider(res.provider as any)
    } catch (e: any) {
      setError(e?.message || 'Failed to join live')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Classroom Monitoring</h1>
      <p className="text-sm text-gray-600 mb-6">Listen to recorded lessons. Live listening will be enabled next.</p>
      
      {/* Database Connection Status */}
      {!isDbOnline && (
        <div className="p-4 text-sm bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-semibold text-amber-800 mb-1">
                Database Disconnected
              </div>
              <div className="text-amber-700 mb-2">
                {dbError || 'Please check configuration or network.'}
              </div>
              {typeof navigator !== 'undefined' && !navigator.onLine && (
                <div className="text-xs text-amber-600 mb-2">
                  ⚠️ Your device appears to be offline. Check your internet connection.
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={testConnection}
              disabled={testingConnection}
              className="ml-2 px-3 py-1 text-xs bg-amber-200 hover:bg-amber-300 text-amber-800 rounded disabled:opacity-50"
            >
              {testingConnection ? 'Testing...' : 'Connect'}
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-amber-200">
            <div className="text-xs font-semibold text-amber-800 mb-2">Configuration Status:</div>
            <div className="space-y-1 text-xs text-amber-700">
              {(() => {
                const config = getConfigStatus()
                return (
                  <>
                    <div className="flex items-center">
                      <span className="w-32">Supabase URL:</span>
                      <span className={config.hasUrl ? 'text-green-700' : 'text-red-700'}>
                        {config.hasUrl ? '✓ Set' : '✗ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32">API Key:</span>
                      <span className={config.hasKey ? 'text-green-700' : 'text-red-700'}>
                        {config.hasKey ? `✓ Set (${config.keyType})` : '✗ Missing'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-32">Network:</span>
                      <span className={typeof navigator !== 'undefined' && navigator.onLine ? 'text-green-700' : 'text-red-700'}>
                        {typeof navigator !== 'undefined' && navigator.onLine ? '✓ Online' : '✗ Offline'}
                      </span>
                    </div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      
      {isDbOnline && (
        <div className="p-2 mb-4 bg-green-50 border border-green-200 rounded text-xs text-green-700">
          ✓ Database Connected
        </div>
      )}
      
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
      <div className="space-y-2 mb-6">
        <div className="font-medium">Live Sessions</div>
        {provider && <div className="text-xs text-gray-600">Provider: {provider}</div>}
        {liveSessions.map(s => (
          <div key={s.id} className="flex items-center justify-between p-2 border rounded">
            <div>{s.class_name} - {s.room_name}</div>
            <button className="btn btn-primary" onClick={() => joinLive(s.room_name)}>Listen</button>
          </div>
        ))}
        {liveSessions.length === 0 && <div className="text-gray-600">No live sessions</div>}
      </div>
    </div>
  )
}

export default AdminMonitorView
