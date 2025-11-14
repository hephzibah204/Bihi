export type TeacherProgress = {
  teacherId: string;
  teacherName?: string;
  completedCourseIds: string[];
  avgQuizScorePct: number;
  totalAttempts: number;
  lastCompletedAt?: string;
  totalWatchSeconds?: number;
  passedCoursesCount?: number;
};

function readCompletions(): Array<{ id: string; completedAt: string; teacherId?: string; teacherName?: string }> {
  try {
    const raw = localStorage.getItem('micro_courses_completed');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function readAttemptsForCourse(courseId: string): Array<{ at: string; total: number; score: number; teacherId?: string; teacherName?: string }> {
  try {
    const key = `coach_quiz_attempts_${courseId}`;
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function readWatchTimeForTeacherAcrossCourses(teacherId: string): number {
  try {
    let total = 0;
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('coach_watch_time_')) {
        try {
          const map = JSON.parse(localStorage.getItem(k) || '{}');
          total += Number(map[teacherId] || 0);
        } catch {}
      }
    });
    return total;
  } catch { return 0; }
}

export function listTeacherProgress(): TeacherProgress[] {
  const completions = readCompletions();
  const byTeacher = new Map<string, { name?: string; courses: string[]; lastCompletedAt?: string }>();
  completions.forEach(c => {
    const tid = c.teacherId || 'unknown';
    const entry = byTeacher.get(tid) || { name: c.teacherName, courses: [], lastCompletedAt: undefined };
    entry.name = entry.name || c.teacherName;
    entry.courses.push(c.id);
    entry.lastCompletedAt = (entry.lastCompletedAt && entry.lastCompletedAt > c.completedAt) ? entry.lastCompletedAt : c.completedAt;
    byTeacher.set(tid, entry);
  });

  const results: TeacherProgress[] = [];
  byTeacher.forEach((entry, teacherId) => {
    const uniqueCourses = Array.from(new Set(entry.courses));
    let totalAttempts = 0;
    const bestPercents: number[] = [];
    let passedCount = 0;
    uniqueCourses.forEach(cid => {
      const attempts = readAttemptsForCourse(cid).filter(a => (a.teacherId || 'unknown') === teacherId);
      totalAttempts += attempts.length;
      const best = attempts.reduce((acc, a) => {
        const total = Number(a.total) || 0;
        const score = Number(a.score) || 0;
        const pct = total > 0 ? (score / total) * 100 : 0;
        return Math.max(acc, Math.round(pct));
      }, 0);
      bestPercents.push(best);
      if (best >= 70) passedCount += 1;
    });
    const avgQuizScorePct = bestPercents.length > 0 ? Math.round(bestPercents.reduce((a, b) => a + b, 0) / bestPercents.length) : 0;
    const totalWatchSeconds = readWatchTimeForTeacherAcrossCourses(teacherId);
    results.push({
      teacherId,
      teacherName: entry.name,
      completedCourseIds: uniqueCourses,
      avgQuizScorePct,
      totalAttempts,
      lastCompletedAt: entry.lastCompletedAt,
      totalWatchSeconds,
      passedCoursesCount: passedCount,
    });
  });
  return results;
}

// Supabase-backed read (best-effort); falls back to local if offline
export async function listTeacherProgressOnline(): Promise<TeacherProgress[]> {
  try {
    const { supabase } = await import('./supabaseClient');
    const { getTenantId } = await import('./api');
    const tenantId = getTenantId() || 'default';
    if (!supabase || supabase._offline) return listTeacherProgress();

    const { data: comps, error: e1 } = await supabase
      .from('ai_coach_course_completions')
      .select('teacher_id, teacher_name, course_id, completed_at')
      .eq('tenant_id', tenantId);
    if (e1) throw e1;

    const byTeacher = new Map<string, { name?: string; courses: string[]; lastCompletedAt?: string }>();
    (Array.isArray(comps) ? comps : []).forEach((c: any) => {
      const tid = c.teacher_id || 'unknown';
      const entry = byTeacher.get(tid) || { name: c.teacher_name, courses: [], lastCompletedAt: undefined };
      entry.name = entry.name || c.teacher_name;
      entry.courses.push(c.course_id);
      entry.lastCompletedAt = (entry.lastCompletedAt && entry.lastCompletedAt > c.completed_at) ? entry.lastCompletedAt : c.completed_at;
      byTeacher.set(tid, entry);
    });

    const results: TeacherProgress[] = [];
    for (const [teacherId, entry] of byTeacher.entries()) {
      const uniqueCourses = Array.from(new Set(entry.courses));
      let totalAttempts = 0;
      const bestPercents: number[] = [];
      let passedCount = 0;
      for (const cid of uniqueCourses) {
        const { data: atts } = await supabase
          .from('ai_coach_quiz_attempts')
          .select('total, score')
          .eq('tenant_id', tenantId)
          .eq('teacher_id', teacherId)
          .eq('course_id', cid);
        const attempts = (Array.isArray(atts) ? atts : []);
        totalAttempts += attempts.length;
        const best = attempts.reduce((acc: number, a: any) => {
          const total = Number(a.total) || 0;
          const score = Number(a.score) || 0;
          const pct = total > 0 ? (score / total) * 100 : 0;
          return Math.max(acc, Math.round(pct));
        }, 0);
        bestPercents.push(best);
        if (best >= 70) passedCount += 1;
      }
      const avgQuizScorePct = bestPercents.length > 0 ? Math.round(bestPercents.reduce((a, b) => a + b, 0) / bestPercents.length) : 0;
      const { data: wt } = await supabase
        .from('ai_coach_watch_time')
        .select('total_seconds')
        .eq('tenant_id', tenantId)
        .eq('teacher_id', teacherId);
      const totalWatchSeconds = (Array.isArray(wt) ? wt : []).reduce((sum: number, r: any) => sum + Number(r.total_seconds || 0), 0);
      results.push({
        teacherId,
        teacherName: entry.name,
        completedCourseIds: uniqueCourses,
        avgQuizScorePct,
        totalAttempts,
        lastCompletedAt: entry.lastCompletedAt,
        totalWatchSeconds,
        passedCoursesCount: passedCount,
      });
    }
    return results;
  } catch {
    return listTeacherProgress();
  }
}
