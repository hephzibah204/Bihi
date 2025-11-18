import { apiGetAttendance, apiGetAssignments, apiGetScores, apiGetTeachers, apiGetAssignmentScores } from './api'
import { getTotalWatchTimeForTeacher } from './watchTime'
import { supabase } from './supabaseClient'
import { getTenantId } from './api'

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
  attendance.forEach(a => { try { const d = String(a.date || (a as any).timestamp || '').slice(0,10); if (d >= startIso) attClasses.add(a.class) } catch {} })

  const assignClasses = new Set<string>()
  assignments.forEach(a => { try { const d = String(a.dueDate || (a as any).created_at || '').slice(0,10); if (d >= startIso) assignClasses.add(a.class) } catch {} })

  const scoreClasses = new Set<string>()
  scores.forEach(s => { try { const d = String((s as any).created_at || '').slice(0,10); if (!d || d >= startIso) scoreClasses.add((s as any).class || '') } catch {} })

  const sessionClasses = new Set<string>()
  if (supabase) {
    const { data: sessions } = await supabase
      .from('class_sessions')
      .select('class_name, started_at')
      .gte('started_at', new Date(startIso).toISOString())
    ;(sessions||[]).forEach((s:any)=>{ if (s.class_name) sessionClasses.add(s.class_name) })
  }

  const allClasses = new Set<string>([...classToTeacher.keys()])

  const alerts: IdleClassAlert[] = []
  allClasses.forEach(cls => {
    const reasons: string[] = []
    if (!attClasses.has(cls)) reasons.push('No attendance recorded')
    if (!assignClasses.has(cls)) reasons.push('No assignments posted')
    if (!scoreClasses.has(cls)) reasons.push('No scores recorded')
    if (!sessionClasses.has(cls)) reasons.push('No sessions held')
    if (reasons.length >= 2) {
      alerts.push({ className: cls, reason: reasons.join(' • '), teacherId: classToTeacher.get(cls) })
    }
  })
  return alerts
}

export async function computeTeacherRatings(): Promise<TeacherRating[]> {
  const [attendance, assignments, scores, teachers, assignmentScores] = await Promise.all([
    apiGetAttendance(),
    apiGetAssignments(),
    apiGetScores(),
    apiGetTeachers(),
    apiGetAssignmentScores(),
  ])
  const classToTeacher = new Map<string, string>()
  teachers.forEach(t => { if ((t as any).classTeacherOf) classToTeacher.set((t as any).classTeacherOf, t.id) })

  const teacherMetrics = new Map<string, { attDays: number; assignCount: number; scoreCount: number; watchBonus: number; liveSessions: number; timelyPlansScore: number; markingTurnaroundScore: number }>()

  attendance.forEach(a => { const tid = classToTeacher.get(a.class || '') || '' ; if (tid) { const m = teacherMetrics.get(tid)||{attDays:0,assignCount:0,scoreCount:0,watchBonus:0,liveSessions:0,timelyPlansScore:0,markingTurnaroundScore:0}; m.attDays += 1; teacherMetrics.set(tid,m) } })
  assignments.forEach(a => { const tid = classToTeacher.get(a.class || '') || '' ; if (tid) { const m = teacherMetrics.get(tid)||{attDays:0,assignCount:0,scoreCount:0,watchBonus:0,liveSessions:0,timelyPlansScore:0,markingTurnaroundScore:0}; m.assignCount += 1; teacherMetrics.set(tid,m) } })
  scores.forEach(s => { const cls = (s as any).class || ''; const tid = classToTeacher.get(cls)||''; if (tid) { const m = teacherMetrics.get(tid)||{attDays:0,assignCount:0,scoreCount:0,watchBonus:0,liveSessions:0,timelyPlansScore:0,markingTurnaroundScore:0}; m.scoreCount += 1; teacherMetrics.set(tid,m) } })

  for (const t of teachers) {
    const m = teacherMetrics.get(t.id)||{attDays:0,assignCount:0,scoreCount:0,watchBonus:0,liveSessions:0,timelyPlansScore:0,markingTurnaroundScore:0}
    m.watchBonus = Math.min(10, Math.floor(getTotalWatchTimeForTeacher(t.id)/3600))
    if (supabase) {
      const { data: sessions } = await supabase
        .from('class_sessions')
        .select('id, teacher_id, started_at')
        .eq('teacher_id', t.id)
        .gte('started_at', new Date(Date.now() - 30*24*60*60*1000).toISOString())
      m.liveSessions = Array.isArray(sessions) ? sessions.length : 0
    }
    const teacherClass = (t as any).classTeacherOf || ''
    const teacherAssignments = assignments.filter(a => (a.class || '') === teacherClass)
    let timelyCount = 0
    teacherAssignments.forEach(a => {
      const due = a.dueDate ? new Date(a.dueDate) : null
      const created = (a as any).created_at ? new Date((a as any).created_at) : null
      if (due && created) {
        const diffDays = Math.floor((due.getTime() - created.getTime())/(24*60*60*1000))
        if (diffDays >= 2) timelyCount += 1
      }
    })
    m.timelyPlansScore = teacherAssignments.length ? Math.round((timelyCount/teacherAssignments.length)*10) : 0
    const teacherScores = assignmentScores.filter(s => (s as any).teacherId ? (s as any).teacherId === t.id : true)
    const withTurnaround = teacherScores
      .map(s => {
        const graded = (s as any).graded_at ? new Date((s as any).graded_at) : null
        const submitted = (s as any).submitted_at ? new Date((s as any).submitted_at) : null
        const assignment = teacherAssignments.find(a => a.id === (s as any).assignmentId)
        const due = assignment?.dueDate ? new Date(assignment.dueDate as any) : null
        let base: Date | null = submitted || due
        if (graded && base) return Math.max(0, Math.floor((graded.getTime() - base.getTime())/(24*60*60*1000)))
        return null
      })
      .filter(d => typeof d === 'number') as number[]
    const avgDays = withTurnaround.length ? withTurnaround.reduce((a,b)=>a+b,0)/withTurnaround.length : 0
    const turnaroundScore = avgDays ? Math.max(0, 10 - Math.min(10, Math.round(avgDays))) : 0
    m.markingTurnaroundScore = turnaroundScore
    teacherMetrics.set(t.id, m)
  }

  const ratings: TeacherRating[] = []
  teacherMetrics.forEach((m, tid) => {
    const score = m.attDays*2 + m.assignCount*1 + m.scoreCount*1 + m.watchBonus + Math.round(m.liveSessions/2) + m.timelyPlansScore + m.markingTurnaroundScore
    ratings.push({ teacherId: tid, score, breakdown: {
      attendance: m.attDays*2,
      assignments: m.assignCount,
      grading: m.scoreCount,
      bonus: m.watchBonus,
      liveMonitoringUsage: Math.round(m.liveSessions/2),
      lessonPlanningTimeliness: m.timelyPlansScore,
      examMarkingTurnaround: m.markingTurnaroundScore,
    } })
  })
  return ratings.sort((a,b)=>b.score-a.score)
}

export async function saveTeacherRatingsSnapshot(ratings: TeacherRating[]) {
  if (!supabase || !ratings?.length) return []
  const tenant_id = getTenantId() || 'default'
  const rows = ratings.map(r => ({
    teacher_id: r.teacherId,
    tenant_id,
    score: Math.round(r.score),
    attendance: Math.round(r.breakdown.attendance || 0),
    assignments: Math.round(r.breakdown.assignments || 0),
    grading: Math.round(r.breakdown.grading || 0),
    bonus: Math.round(r.breakdown.bonus || 0),
    live_monitoring_usage: Math.round(r.breakdown.liveMonitoringUsage || 0),
    lesson_planning_timeliness: Math.round(r.breakdown.lessonPlanningTimeliness || 0),
    exam_marking_turnaround: Math.round(r.breakdown.examMarkingTurnaround || 0),
    created_at: new Date().toISOString(),
  }))
  const { data } = await supabase.from('teacher_ratings').upsert(rows).select()
  return Array.isArray(data) ? data : []
}
