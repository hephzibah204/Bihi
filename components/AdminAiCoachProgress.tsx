import React, { useMemo, useState } from 'react';
import { listTeacherProgress, listTeacherProgressOnline } from '../services/coachProgress';
import { listMicroCourses } from '../services/teacherCoach';
import SearchIcon from './icons/SearchIcon';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';

const AdminAiCoachProgress: React.FC = () => {
  const [q, setQ] = useState('');
  const [progress, setProgress] = useState(listTeacherProgress());
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const online = await listTeacherProgressOnline();
      if (mounted) setProgress(online);
    })();
    return () => { mounted = false; };
  }, []);
  const catalog = useMemo(() => listMicroCourses(), []);
  const courseTitle = (id: string) => catalog.find(c => c.id === id)?.title || id;

  const filtered = progress.filter(p => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      (p.teacherName || '').toLowerCase().includes(s) ||
      p.teacherId.toLowerCase().includes(s) ||
      p.completedCourseIds.some(cid => courseTitle(cid).toLowerCase().includes(s))
    );
  }).sort((a, b) => (b.avgQuizScorePct - a.avgQuizScorePct));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <ArrowTrendingUpIcon className="h-6 w-6 mr-2" />
          AI Coach — Teacher Progress
        </h2>
        <div className="text-sm text-gray-500">Completions, quiz scores, and recent activity</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded px-2 py-1 w-full max-w-md">
          <SearchIcon className="h-5 w-5 text-gray-500 mr-1" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by teacher or course" className="flex-1 outline-none" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-12 gap-2 p-3 text-xs font-semibold text-gray-600 border-b">
          <div className="col-span-3">Teacher</div>
          <div className="col-span-3">Completed Courses</div>
          <div className="col-span-1">Avg Quiz %</div>
          <div className="col-span-1">Passed</div>
          <div className="col-span-2">Time on Video</div>
          <div className="col-span-1">Attempts</div>
          <div className="col-span-1">Certificate</div>
        </div>
        <div className="divide-y">
          {filtered.map((p) => (
            <div key={p.teacherId} className="grid grid-cols-12 gap-2 p-3 text-sm">
              <div className="col-span-3">
                <div className="font-medium">{p.teacherName || '—'}</div>
                <div className="text-xs text-gray-500">{p.teacherId}</div>
              </div>
              <div className="col-span-3">
                {p.completedCourseIds.length === 0 ? (
                  <span className="text-gray-500 text-xs">None</span>
                ) : (
                  <ul className="list-disc list-inside text-xs text-gray-700">
                    {p.completedCourseIds.map(cid => <li key={cid}>{courseTitle(cid)}</li>)}
                  </ul>
                )}
              </div>
              <div className="col-span-1 font-semibold">{p.avgQuizScorePct}%</div>
              <div className="col-span-1">{p.passedCoursesCount || 0}</div>
              <div className="col-span-2">{Math.round((p.totalWatchSeconds || 0) / 60)} min</div>
              <div className="col-span-1">{p.totalAttempts}</div>
              <div className="col-span-1">{latestCertificateStatus(p.teacherId)}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-4 text-sm text-gray-500">No matching records.</div>
          )}
        </div>
      </div>
    </div>
  );
};

function latestCertificateStatus(teacherId: string): string {
  try {
    const raw = localStorage.getItem('teacher_certificates');
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return '—';
    const own = arr.filter((c: any) => c?.teacherId === teacherId);
    if (own.length === 0) return '—';
    const last = own.reduce((acc: any, c: any) => (!acc || (c.issuedAt > acc.issuedAt) ? c : acc), null);
    return new Date(last.issuedAt).toLocaleDateString();
  } catch { return '—'; }
}

export default AdminAiCoachProgress;
