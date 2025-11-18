import { useEffect, useMemo, useState } from 'react'
import { apiGetAttendance, apiGetSchoolSettings } from '../services/api'

export type AttendanceMetrics = {
  label: string
  todayRate: number | null
  termRate: number
  snapshotRate: number
}

export default function useAttendanceMetrics(session?: string, term?: string) {
  const [metrics, setMetrics] = useState<AttendanceMetrics>({ label: '', todayRate: null, termRate: 0, snapshotRate: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [settings, attendance] = await Promise.all([ apiGetSchoolSettings(), apiGetAttendance() ])
        const currentTerm = term || settings?.currentTerm || settings?.term || 'Current Term'
        const currentSession = session || settings?.currentSession || settings?.session || ''
        const label = [currentSession, currentTerm].filter(Boolean).join(' • ')

        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate()+1)

        let todayMarked = 0
        let todayPresent = 0
        let termMarked = 0
        let termPresent = 0

        const last30 = new Date()
        last30.setDate(today.getDate() - 30)
        let snapshotMarked = 0
        let snapshotPresent = 0

        attendance.forEach(rec => {
          const ts = new Date(rec.date).getTime()
          const statuses = rec.statuses || {}
          const ids = Object.keys(statuses)
          const presentValue = (st: string) => st === 'present' ? 1 : (st === 'late' ? 0.5 : 0)

          // Today
          if (ts >= todayStart.getTime() && ts < todayEnd.getTime()) {
            ids.forEach(id => { todayMarked += 1; todayPresent += presentValue(statuses[id]) })
          }

          // Snapshot (last 30 days)
          if (ts >= last30.getTime()) {
            ids.forEach(id => { snapshotMarked += 1; snapshotPresent += presentValue(statuses[id]) })
          }

          // Term-to-date (filter by term/session when present)
          const matchSession = !rec.session || rec.session === currentSession
          const matchTerm = !rec.term || rec.term === currentTerm
          if (matchSession && matchTerm) {
            ids.forEach(id => { termMarked += 1; termPresent += presentValue(statuses[id]) })
          }
        })

        const safeRate = (present: number, marked: number) => marked > 0 ? +(100 * (present / marked)).toFixed(1) : 0

        const todayRate = todayMarked > 0 ? safeRate(todayPresent, todayMarked) : null
        const termRate = safeRate(termPresent, termMarked)
        const snapshotRate = safeRate(snapshotPresent, snapshotMarked)

        setMetrics({ label, todayRate, termRate, snapshotRate })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return { metrics, loading }
}
