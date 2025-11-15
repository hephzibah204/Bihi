import { useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

export default function useActiveTeacherAnnouncer() {
  useEffect(() => {
    const run = async () => {
      if (!supabase) return
      const start = new Date()
      start.setHours(0,0,0,0)
      const startIso = start.toISOString()
      const { data: todays } = await supabase
        .from('teacher_ratings')
        .select('teacher_id, score, created_at')
        .gte('created_at', startIso)
      const top = Array.isArray(todays) ? todays.sort((a,b)=>b.score-a.score).slice(0,3) : []
      if (!top.length) return
      const { data: announced } = await supabase
        .from('teacher_announcements')
        .select('teacher_id, created_at')
        .gte('created_at', startIso)
      const announcedSet = new Set((announced||[]).map((a:any)=>a.teacher_id))
      const fresh = top.filter(t => !announcedSet.has(t.teacher_id))
      if (!fresh.length) return
      const msg = `Active teachers today: ${fresh.map(f=>f.teacher_id).join(', ')}`
      window.dispatchEvent(new CustomEvent('show-global-success', { detail: { title: 'Active Teachers', message: msg } }))
      await supabase.from('teacher_announcements').upsert(
        fresh.map(f => ({ teacher_id: f.teacher_id, type: 'active_teacher', message: msg, created_at: new Date().toISOString() }))
      )
    }
    run()
  }, [])
}
