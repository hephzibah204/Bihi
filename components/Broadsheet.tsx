import React, { useEffect, useMemo, useState } from 'react';
import { DashboardView, TeacherView, UserRole, Student, Subject, Score, Remark, AttendanceRecord } from '../types';
import { ADMIN_VIEWS, TEACHER_VIEWS } from '../utils/constants';
import { apiGetStudents, apiGetSubjects, apiGetScores, apiGetSchoolSettings, apiGetAttendance, apiGetRemarks, apiUpsertRemark } from '../services/api';
import { generateClassNames } from '../utils/classManager';
import SpinnerIcon from './icons/SpinnerIcon';
import PencilSquareIcon from './icons/PencilSquareIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';

interface BroadsheetProps {
  setActiveView: (view: DashboardView | TeacherView) => void;
  userRole?: UserRole | null;
}

const Loader = () => (
  <div className="flex items-center justify-center p-8">
    <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
  </div>
);

const Broadsheet: React.FC<BroadsheetProps> = ({ setActiveView, userRole = 'Admin' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [session, setSession] = useState<string>('');
  const [term, setTerm] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const [settingsRes, subjectsRes, studentsRes, scoresRes, attendanceRes, remarksRes] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetSubjects(),
          apiGetStudents(),
          apiGetScores(),
          apiGetAttendance(),
          apiGetRemarks(),
        ]);

        if (!mounted) return;
        setSettings(settingsRes);
        setSubjects(subjectsRes || []);
        setStudents(studentsRes || []);
        setScores(scoresRes || []);
        setAttendance(attendanceRes || []);
        setRemarks(remarksRes || []);

        const defaultClass = studentsRes?.[0]?.class || '';
        setSelectedClass(defaultClass);

        // Robust fallbacks for session and term using available scores
        const scoreSessions = Array.from(new Set((scoresRes || []).map(s => s.session))).filter(Boolean);
        const scoreTerms = Array.from(new Set((scoresRes || []).map(s => s.term))).filter(Boolean);
        const sortedSessions = [...scoreSessions].sort((a, b) => b.localeCompare(a));
        const knownTermsOrder = ['First Term', 'Second Term', 'Third Term'];
        const pickTerm = (t?: string) => t && knownTermsOrder.includes(t) ? t : (scoreTerms.find(st => knownTermsOrder.includes(st)) || scoreTerms[0] || 'First Term');

        const effectiveSession = settingsRes?.session || sortedSessions[0] || '';
        const effectiveTerm = settingsRes?.term || pickTerm(settingsRes?.term);
        setSession(effectiveSession);
        setTerm(effectiveTerm);
      } catch (e) {
        console.error('Failed to load broadsheet data', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const classOptions = useMemo(() => generateClassNames(settings), [settings]);

  const classStudents = useMemo(() => students.filter(s => !selectedClass || s.class === selectedClass), [students, selectedClass]);

  const filteredScores = useMemo(() => scores.filter(s => (!selectedClass || classStudents.some(cs => cs.id === s.studentId)) && s.session === session && s.term === term), [scores, classStudents, session, term, selectedClass]);

  const filteredRemarks = useMemo(() => remarks.filter(r => (!selectedClass || classStudents.some(cs => cs.id === r.studentId)) && r.session === session && r.term === term), [remarks, classStudents, session, term, selectedClass]);

  const remarkByStudent = useMemo(() => {
    const map = new Map<string, Remark>();
    filteredRemarks.forEach(r => map.set(r.studentId, r));
    return map;
  }, [filteredRemarks]);

  // Compute totals, averages, and positions for the class
  const perf = useMemo(() => {
    const subjectIds = classSubjectIds;
    const totalsByStudent: Record<string, { total: number; average: number }> = {};
    classStudents.forEach(st => {
      let total = 0;
      subjectIds.forEach(subId => {
        total += studentSubjectTotals[st.id]?.[subId] ?? 0;
      });
      const average = subjectIds.length > 0 ? total / subjectIds.length : 0;
      totalsByStudent[st.id] = { total, average };
    });
    const ranking = [...classStudents]
      .map(st => ({ studentId: st.id, avg: totalsByStudent[st.id]?.average ?? 0 }))
      .sort((a, b) => b.avg - a.avg);
    const positions: Record<string, number> = {};
    ranking.forEach((r, idx) => { positions[r.studentId] = idx + 1; });
    return { studentTotals: totalsByStudent, positions };
  }, [classStudents, classSubjectIds, studentSubjectTotals]);

  // Summarize attendance per student within selected class
  const attnSummary = useMemo(() => {
    const classRecords = attendance.filter(rec => !selectedClass || rec.class === selectedClass);
    const summary: Record<string, { presentDays: number; absentDays: number; lateDays: number }> = {};
    classStudents.forEach(st => {
      summary[st.id] = { presentDays: 0, absentDays: 0, lateDays: 0 };
    });
    classRecords.forEach(rec => {
      for (const [sid, status] of Object.entries(rec.statuses || {})) {
        if (!summary[sid]) continue;
        if (status === 'present') summary[sid].presentDays++;
        else if (status === 'absent') summary[sid].absentDays++;
        else if (status === 'late') summary[sid].lateDays++;
      }
    });
    return summary;
  }, [attendance, selectedClass, classStudents]);

  // Build subject columns present in selected class
  const classSubjectIds = useMemo(() => {
    const classSubs = subjects.filter(sub => !selectedClass || sub.classes.includes(selectedClass)).map(s => s.id);
    return classSubs;
  }, [subjects, selectedClass]);

  const studentSubjectTotals: Record<string, Record<string, number>> = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const sc of filteredScores) {
      const total = (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0);
      if (!map[sc.studentId]) map[sc.studentId] = {};
      map[sc.studentId][sc.subjectId] = Math.max(map[sc.studentId][sc.subjectId] || 0, total);
    }
    return map;
  }, [filteredScores]);

  const saveRemark = async (studentId: string, generalComment: string) => {
    const payload: Partial<Remark> = { studentId, session, term, generalComment };
    setRemarks(prev => {
      const idx = prev.findIndex(r => r.studentId === studentId && r.session === session && r.term === term);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], generalComment };
        return next;
      }
      return [...prev, payload as Remark];
    });
    try {
      await apiUpsertRemark(payload);
      window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Remark saved.' } }));
    } catch (e) {
      console.error('Failed saving remark', e);
      window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: 'Could not save remark.' } }));
    }
  };

  const goToScores = () => {
    try { localStorage.setItem('results_preselect_class', selectedClass); } catch (e) { /* noop */ }
    if (userRole === 'Teacher') {
      setActiveView(TEACHER_VIEWS.ENTER_SCORES as unknown as TeacherView);
    } else {
      setActiveView(ADMIN_VIEWS.RESULTS as DashboardView);
    }
  };

  const goToDossier = () => {
    if (userRole === 'Teacher') {
      setActiveView(TEACHER_VIEWS.COMPREHENSIVE_ENTRY as unknown as TeacherView);
    } else {
      setActiveView(ADMIN_VIEWS.COMPREHENSIVE_ENTRY as DashboardView);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Broadsheet / Transcript</h1>
          <p className="text-gray-600">View class-wide subject totals, averages, positions, attendance, and remarks.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={goToScores}><ClipboardListIcon className="w-5 h-5 mr-2" /> Enter Scores</button>
          <button className="btn" onClick={goToDossier}><PencilSquareIcon className="w-5 h-5 mr-2" /> Dossier</button>
        </div>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="label">Class</label>
          <select className="input" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
            {[selectedClass && !classOptions.includes(selectedClass) ? selectedClass : null, ...classOptions]
              .filter(Boolean)
              .map(cls => (
                <option key={cls as string} value={cls as string}>{cls as string}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="label">Session</label>
          <input className="input" value={session} onChange={e => setSession(e.target.value)} />
        </div>
        <div>
          <label className="label">Term</label>
          <input className="input" value={term} onChange={e => setTerm(e.target.value)} />
        </div>
        <div className="flex items-end">
          <a className="btn-outline" href="#" onClick={e => { e.preventDefault(); window.print(); }}><DocumentArrowDownIcon className="w-5 h-5 mr-2" /> Print</a>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left">Student</th>
              {classSubjectIds.map(subId => {
                const sub = subjects.find(s => s.id === subId);
                return <th key={subId} className="px-3 py-2 text-left">{sub?.name || subId}</th>;
              })}
              <th className="px-3 py-2 text-left">Average</th>
              <th className="px-3 py-2 text-left">Position</th>
              <th className="px-3 py-2 text-left">Attendance</th>
              <th className="px-3 py-2 text-left">Remark</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map(st => {
              const totals = perf.studentTotals[st.id];
              const pos = perf.positions[st.id];
              const attn = attnSummary[st.id] || { presentDays: 0, absentDays: 0 };
              const existingRemark = remarkByStudent.get(st.id)?.generalComment || '';
              return (
                <tr key={st.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{st.name}</td>
                  {classSubjectIds.map(subId => {
                    const val = studentSubjectTotals[st.id]?.[subId] ?? 0;
                    return <td key={`${st.id}-${subId}`} className="px-3 py-2">{val}</td>;
                  })}
                  <td className="px-3 py-2">{totals ? Math.round(totals.average) : '-'}</td>
                  <td className="px-3 py-2">{pos ?? '-'}</td>
                  <td className="px-3 py-2">{attn.presentDays}/{attn.presentDays + attn.absentDays}</td>
                  <td className="px-3 py-2 w-64">
                    <textarea
                      className="input w-full"
                      defaultValue={existingRemark}
                      onBlur={(e) => saveRemark(st.id, e.target.value)}
                      placeholder="Enter teacher remark"
                      rows={2}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Broadsheet;