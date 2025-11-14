export function incrementWatchTime(courseId: string, teacherId: string | null, seconds: number) {
  try {
    const key = `coach_watch_time_${courseId}`;
    const raw = localStorage.getItem(key);
    const map = raw ? JSON.parse(raw) : {};
    const tid = teacherId || 'unknown';
    const prev = Number(map[tid] || 0);
    map[tid] = prev + seconds;
    localStorage.setItem(key, JSON.stringify(map));
  } catch {}
  // Supabase upsert (best-effort)
  (async () => {
    try {
      const { supabase } = await import('./supabaseClient');
      const { getTenantId } = await import('./api');
      const tenantId = getTenantId() || 'default';
      if (supabase && !supabase._offline) {
        await supabase.from('ai_coach_watch_time').upsert({
          tenant_id: tenantId,
          teacher_id: teacherId || 'unknown',
          course_id: courseId,
          total_seconds: getWatchTimeForTeacher(courseId, teacherId),
          updated_at: new Date().toISOString(),
        });
      }
    } catch {}
  })();
}

export function getWatchTimeForTeacher(courseId: string, teacherId: string | null): number {
  try {
    const key = `coach_watch_time_${courseId}`;
    const raw = localStorage.getItem(key);
    const map = raw ? JSON.parse(raw) : {};
    const tid = teacherId || 'unknown';
    return Number(map[tid] || 0);
  } catch { return 0; }
}

export function getTotalWatchTimeForTeacher(teacherId: string | null): number {
  try {
    const tid = teacherId || 'unknown';
    let total = 0;
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('coach_watch_time_')) {
        try {
          const map = JSON.parse(localStorage.getItem(k) || '{}');
          total += Number(map[tid] || 0);
        } catch {}
      }
    });
    return total;
  } catch { return 0; }
}
