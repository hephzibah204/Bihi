import React, { useEffect, useMemo, useState } from 'react'
import { computeTeacherRatings } from '../services/performanceTracker'
import { apiGetTeachers } from '../services/api'

const TeacherPerformanceWidget: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [ratings, setRatings] = useState<{ teacherId: string; score: number; breakdown: Record<string, number> }[]>([])
  const [teacherName, setTeacherName] = useState<Map<string,string>>(new Map())

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [rs, ts] = await Promise.all([computeTeacherRatings(), apiGetTeachers()])
        const map = new Map<string,string>()
        ts.forEach(t => map.set(t.id, t.name))
        setTeacherName(map)
        setRatings(rs.slice(0, 5))
      } finally { setLoading(false) }
    }
    run()
  }, [])

  const formatted = useMemo(() => ratings.map(r => ({ id: r.teacherId, name: teacherName.get(r.teacherId)||r.teacherId, score: r.score, b: r.breakdown })), [ratings, teacherName])

  return (
    <div className="card">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold">Teacher Performance (Top 5)</h3>
          {loading && <span className="text-xs text-gray-500">Loading...</span>}
        </div>
        <div className="mt-3 space-y-3">
          {formatted.length === 0 && !loading && (<div className="text-sm text-gray-600">No data</div>)}
          {formatted.map(t => (
            <div key={t.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-gray-600">Attendance {t.b.attendance} • Assignments {t.b.assignments} • Grading {t.b.grading} • Bonus {t.b.bonus}</div>
              </div>
              <div className="text-indigo-600 font-semibold">{t.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TeacherPerformanceWidget