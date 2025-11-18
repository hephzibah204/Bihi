import React, { useEffect, useState } from 'react'
import { supabase } from '../../services/supabaseClient'
import { apiGetTeachers } from '../../services/api'

type Row = {
  teacher_id: string
  score: number
  attendance: number
  assignments: number
  grading: number
  bonus: number
  live_monitoring_usage: number
  lesson_planning_timeliness: number
  exam_marking_turnaround: number
  created_at: string
}

export default function TeacherLeaderboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [names, setNames] = useState<Record<string, string>>({})
  useEffect(() => {
    const load = async () => {
      const startIso = new Date(Date.now() - 30*24*60*60*1000).toISOString()
      if (supabase) {
        const { data } = await supabase
          .from('teacher_ratings')
          .select('*')
          .gte('created_at', startIso)
        setRows(Array.isArray(data) ? data : [])
      }
      const teachers = await apiGetTeachers()
      const map: Record<string, string> = {}
      teachers.forEach(t => { map[t.id] = t.name })
      setNames(map)
    }
    load()
  }, [])

  const aggregated = Object.values(rows.reduce((acc, r) => {
    const curr = acc[r.teacher_id] || {
      teacher_id: r.teacher_id,
      score: 0,
      attendance: 0,
      assignments: 0,
      grading: 0,
      bonus: 0,
      live_monitoring_usage: 0,
      lesson_planning_timeliness: 0,
      exam_marking_turnaround: 0,
      count: 0,
    }
    curr.score += r.score
    curr.attendance += r.attendance
    curr.assignments += r.assignments
    curr.grading += r.grading
    curr.bonus += r.bonus
    curr.live_monitoring_usage += r.live_monitoring_usage
    curr.lesson_planning_timeliness += r.lesson_planning_timeliness
    curr.exam_marking_turnaround += r.exam_marking_turnaround
    curr.count += 1
    acc[r.teacher_id] = curr
    return acc
  }, {} as Record<string, any>)).map(r => ({
    ...r,
    score: Math.round(r.score / r.count),
  })).sort((a,b)=>b.score-a.score).slice(0, 10)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Teacher Leaderboard</h2>
        <span className="text-slate-500 text-sm">Last 30 days</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 px-2">Rank</th>
              <th className="py-2 px-2">Teacher</th>
              <th className="py-2 px-2">Score</th>
              <th className="py-2 px-2">Attendance</th>
              <th className="py-2 px-2">Assignments</th>
              <th className="py-2 px-2">Grading</th>
              <th className="py-2 px-2">Live Monitoring</th>
              <th className="py-2 px-2">Planning Timeliness</th>
              <th className="py-2 px-2">Marking Turnaround</th>
            </tr>
          </thead>
          <tbody>
            {aggregated.map((r, idx) => (
              <tr key={r.teacher_id} className="border-b">
                <td className="py-2 px-2">{idx+1}</td>
                <td className="py-2 px-2">{names[r.teacher_id] || r.teacher_id}</td>
                <td className="py-2 px-2 font-semibold">{r.score}</td>
                <td className="py-2 px-2">{r.attendance}</td>
                <td className="py-2 px-2">{r.assignments}</td>
                <td className="py-2 px-2">{r.grading}</td>
                <td className="py-2 px-2">{r.live_monitoring_usage}</td>
                <td className="py-2 px-2">{r.lesson_planning_timeliness}</td>
                <td className="py-2 px-2">{r.exam_marking_turnaround}</td>
              </tr>
            ))}
            {!aggregated.length && (
              <tr>
                <td className="py-4 px-2 text-slate-500" colSpan={9}>No rating snapshots yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}