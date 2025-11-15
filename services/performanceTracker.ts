import { apiGetAttendance, apiGetAssignments, apiGetScores, apiGetTeachers } from './api'
import { getTotalWatchTimeForTeacher } from './watchTime'

export type IdleClassAlert = { className: string; reason: string; teacherId?: string }
export type TeacherRating = { teacherId: string; score: number; breakdown: Record<string, number> }

export async function getIdleClassesAlerts(daysBack = 1): Promise<IdleClassAlert[]> {
  const [attendance, assignments, scores, teachers] = await Promise.all([
    apiGetAttendance(),
    apiGetAssignments(),
    apiGetScores(),
    apiGetTeachers(),
  ])

  const classToTeacher = new Map<string, string>()
  teachers.forEach(t => { if ((t as any).classTeacherOf) classToTeacher.set((t as any).classTeacherOf, t.id) })

  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (daysBack - 1))
  const startIso = start.toISOString().split('T')[0]

  const attClasses = new Set<string>()
  attendance.forEach(a => { try { const d = String(a.date || a.timestamp || '').slice(0,10); if (d >= startIso) attClasses.add(a.class) } catch {} })

  const assignClasses = new Set<string>()
  assignments.forEach(a => { try { const d = String(a.dueDate || a.created_at || '').slice(0,10); if (d >= startIso) assignClasses.add(a.class) } catch {} })

  const scoreClasses = new Set<string>()
  scores.forEach(s => { try { const d = String((s as any).created_at || '').slice(0,10); if (!d || d >= startIso) scoreClasses.add((s as any).class || '') } catch {} })

  const allClasses = new Set<string>([...classToTeacher.keys()])

  const alerts: IdleClassAlert[] = []
  allClasses.forEach(cls => {
    const reasons: string[] = []
    if (!attClasses.has(cls)) reasons.push('No attendance recorded')
    if (!assignClasses.has(cls)) reasons.push('No assignments posted')
    if (!scoreClasses.has(cls)) reasons.push('No scores recorded')
    if (reasons.length >= 2) {
      alerts.push({ className: cls, reason: reasons.join(' • '), teacherId: classToTeacher.get(cls) })
    }
  })
  return alerts
}

export async function computeTeacherRatings(): Promise<TeacherRating[]> {
  const [attendance, assignments, scores, teachers] = await Promise.all([
    apiGetAttendance(),
    apiGetAssignments(),
    apiGetScores(),
    apiGetTeachers(),
  ])
  const classToTeacher = new Map<string, string>()
  teachers.forEach(t => { if ((t as any).classTeacherOf) classToTeacher.set((t as any).classTeacherOf, t.id) })

  const teacherMetrics = new Map<string, { attDays: number; assignCount: number; scoreCount: number; watchBonus: number }>()

  attendance.forEach(a => { const tid = classToTeacher.get(a.class || '') || '' ; if (tid) { const m = teacherMetrics.get(tid)||{attDays:0,assignCount:0,scoreCount:0,watchBonus:0}; m.attDays += 1; teacherMetrics.set(tid,m) } })
  assignments.forEach(a => { const tid = classToTeacher.get(a.class || '') || '' ; if (tid) { const m = teacherMetrics.get(tid)||{attDays:0,assignCount:0,scoreCount:0,watchBonus:0}; m.assignCount += 1; teacherMetrics.set(tid,m) } })
  scores.forEach(s => { const cls = (s as any).class || ''; const tid = classToTeacher.get(cls)||''; if (tid) { const m = teacherMetrics.get(tid)||{attDays:0,assignCount:0,scoreCount:0,watchBonus:0}; m.scoreCount += 1; teacherMetrics.set(tid,m) } })

  for (const t of teachers) {
    const m = teacherMetrics.get(t.id)||{attDays:0,assignCount:0,scoreCount:0,watchBonus:0}
    m.watchBonus = Math.min(10, Math.floor(getTotalWatchTimeForTeacher(t.id)/3600)) // up to +10 for 10h
    teacherMetrics.set(t.id, m)
  }

  const ratings: TeacherRating[] = []
  teacherMetrics.forEach((m, tid) => {
    const score = m.attDays*2 + m.assignCount*1 + m.scoreCount*1 + m.watchBonus
    ratings.push({ teacherId: tid, score, breakdown: { attendance: m.attDays*2, assignments: m.assignCount, grading: m.scoreCount, bonus: m.watchBonus } })
  })
  return ratings.sort((a,b)=>b.score-a.score)
}
