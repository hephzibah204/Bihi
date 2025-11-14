export type CertificationCriteria = {
  minCourses: number;
  minScorePct: number;
};

export type CertificateRecord = {
  id: string;
  teacherName?: string;
  teacherId?: string;
  issuedAt: string;
  completedCourseIds: string[];
  avgScorePct: number;
  criteria: CertificationCriteria;
};

function getCompletedCourses(): string[] {
  try {
    const raw = localStorage.getItem('micro_courses_completed');
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    const ids = arr.map((e: any) => e?.id).filter(Boolean);
    return Array.from(new Set(ids));
  } catch { return []; }
}

function getBestQuizScorePct(courseId: string): number {
  try {
    const key = `coach_quiz_attempts_${courseId}`;
    const raw = localStorage.getItem(key);
    const attempts = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(attempts) || attempts.length === 0) return 0;
    const best = attempts.reduce((acc: number, it: any) => {
      const total = Number(it?.total) || 0;
      const score = Number(it?.score) || 0;
      const pct = total > 0 ? (score / total) * 100 : 0;
      return Math.max(acc, Math.round(pct));
    }, 0);
    return best;
  } catch { return 0; }
}

export function evaluateEligibility(criteria: CertificationCriteria): { eligible: boolean; completedCourseIds: string[]; avgScorePct: number } {
  const completed = getCompletedCourses();
  if (completed.length === 0) return { eligible: false, completedCourseIds: [], avgScorePct: 0 };
  const scores = completed.map(id => getBestQuizScorePct(id));
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const eligible = completed.length >= criteria.minCourses && avg >= criteria.minScorePct;
  return { eligible, completedCourseIds: completed, avgScorePct: avg };
}

function nextCertificateId(): string {
  return `CERT-${Date.now()}`;
}

export function listCertificates(): CertificateRecord[] {
  try {
    const raw = localStorage.getItem('teacher_certificates');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function issueCertificate(teacherName: string | undefined, criteria: CertificationCriteria): CertificateRecord {
  const evaln = evaluateEligibility(criteria);
  const rec: CertificateRecord = {
    id: nextCertificateId(),
    teacherName,
    teacherId: (() => { try { return localStorage.getItem('currentUserId') || undefined; } catch { return undefined; } })(),
    issuedAt: new Date().toISOString(),
    completedCourseIds: evaln.completedCourseIds,
    avgScorePct: evaln.avgScorePct,
    criteria,
  };
  try {
    const list = listCertificates();
    const updated = [...list, rec];
    localStorage.setItem('teacher_certificates', JSON.stringify(updated));
  } catch {}
  // Supabase write (best-effort)
  (async () => {
    try {
      const { supabase } = await import('./supabaseClient');
      const { getTenantId } = await import('./api');
      const tenantId = getTenantId() || 'default';
      if (supabase && !supabase._offline) {
        await supabase.from('ai_coach_certificates').insert({
          certificate_code: rec.id,
          tenant_id: tenantId,
          teacher_id: rec.teacherId || null,
          teacher_name: rec.teacherName || null,
          issued_at: rec.issuedAt,
          completed_course_ids: JSON.stringify(rec.completedCourseIds),
          avg_score_pct: rec.avgScorePct,
          min_courses: rec.criteria.minCourses,
          min_score_pct: rec.criteria.minScorePct,
        });
      }
    } catch {}
  })();
  return rec;
}
