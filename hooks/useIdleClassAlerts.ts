import { useEffect, useRef } from 'react'
import { getIdleClassesAlerts } from '../services/performanceTracker'
import { supabase } from '../services/supabaseClient'
import { apiSendMessage } from '../services/api'

export default function useIdleClassAlerts() {
  const running = useRef(false)
  useEffect(() => {
    let mounted = true
    const check = async () => {
      if (running.current) return
      running.current = true
      try {
        const alerts = await getIdleClassesAlerts(1)
        if (!alerts.length) return
        const now = new Date()
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const startIso = start.toISOString()
        let existing: { class_name: string }[] = []
        if (supabase && typeof (supabase as any).from === 'function' && !(supabase as any)._offline) {
          try {
            const { data, error } = await (supabase as any)
              .from('idle_class_alerts')
              .select('class_name, created_at')
              .gte('created_at', startIso)
            if (!error) existing = Array.isArray(data) ? data : []
          } catch { /* ignore failed query and show friendly UI */ }
        }
        const seen = new Set(existing.map(e => e.class_name))
        const newAlerts = alerts.filter(a => a.className && !seen.has(a.className))
        if (!newAlerts.length) return
        if (supabase && typeof (supabase as any).from === 'function' && !(supabase as any)._offline) {
          try {
            await (supabase as any).from('idle_class_alerts').upsert(
              newAlerts.map(a => ({
                class_name: a.className,
                reason: a.reason,
                teacher_id: a.teacherId || null,
                status: 'new',
                created_at: new Date().toISOString(),
              }))
            )
          } catch {
            window.dispatchEvent(new CustomEvent('show-global-error', { detail: { title: 'Idle Classes', message: 'Unable to write alerts; check Supabase configuration.' } }))
          }
        }
        const msg = `Idle classes detected: ${newAlerts.map(a => a.className).join(', ')}`
        window.dispatchEvent(
          new CustomEvent('show-global-error', { detail: { title: 'Idle Classes', message: msg } })
        )
        try {
          await apiSendMessage({
            channel: 'email',
            toRole: 'Admin',
            subject: 'Idle Classes Detected',
            body: msg,
          } as any)
        } catch {}
      } finally {
        running.current = false
      }
    }
    check()
    const id = setInterval(check, 5 * 60 * 1000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])
}