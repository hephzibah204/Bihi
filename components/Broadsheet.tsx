import React, { useEffect, useMemo, useState } from 'react';
import {
  DashboardView,
  TeacherView,
  UserRole,
  Student,
  Subject,
  Score,
  Remark,
  AttendanceRecord,
} from '../types';
import { ADMIN_VIEWS, TEACHER_VIEWS } from '../utils/constants';
import {
  apiGetStudents,
  apiGetSubjects,
  apiGetScores,
  apiGetSchoolSettings,
  apiGetAttendance,
  apiGetRemarks,
  apiUpsertRemark,
} from '../services/api';
import { generateClassNames } from '../utils/classManager';
import SpinnerIcon from './icons/SpinnerIcon';
import { useAuth } from '../contexts/AuthContext';
import PencilSquareIcon from './icons/PencilSquareIcon';
import DocumentArrowDownIcon from './icons/DocumentArrowDownIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';

interface BroadsheetProps {
  setActiveView: (view: DashboardView | TeacherView) => void;
  userRole?: UserRole | null;
}

import { ContentLoader as Loader } from './ui/LoadingSpinner';

const Broadsheet: React.FC<BroadsheetProps> = ({
  setActiveView,
  userRole = 'Admin',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const { user, role } = useAuth();

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [session, setSession] = useState<string>('');
  const [term, setTerm] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setIsLoading(true);
      try {
        const [
          settingsRes,
          subjectsRes,
          studentsRes,
          scoresRes,
          attendanceRes,
          remarksRes,
        ] = await Promise.all([
          apiGetSchoolSettings(),
          apiGetSubjects(),
          apiGetStudents(),
          apiGetScores(),
          apiGetAttendance(),
          apiGetRemarks(),
        ]);

        if (!mounted) return;

        setSettings(settingsRes || null);
        setSubjects(subjectsRes || []);
        setStudents(studentsRes || []);
        setScores(scoresRes || []);
        setAttendance(attendanceRes || []);
        setRemarks(remarksRes || []);

        const effectiveRole = userRole || role || null;
        const activeUserId = (() => {
          try {
            const raw = sessionStorage.getItem('activeUser');
            const au = raw ? JSON.parse(raw) : null;
            return au?.userId || null;
          } catch {
            return null;
          }
        })();
        const currentId = effectiveRole === 'Student' || effectiveRole === 'Parent'
          ? (String((user as any)?.id || activeUserId || '') || '')
          : '';
        const currentStudent = currentId ? (studentsRes || []).find((s) => String(s.id) === String(currentId)) : null;
        const defaultClass = currentStudent?.class || studentsRes?.[0]?.class || '';
        setSelectedClass(defaultClass);

        // Build robust defaults for session/term from settings + scores
        const scoreSessions: string[] = Array.from(
          new Set(
            (scoresRes || [])
              .map((s) => String(s.session || '').trim())
              .filter(Boolean)
          )
        );
        const scoreTerms: string[] = Array.from(
          new Set(
            (scoresRes || [])
              .map((s) => String(s.term || '').trim())
              .filter(Boolean)
          )
        );

        const sortedSessions = [...scoreSessions].sort((a, b) =>
          String(b).localeCompare(String(a))
        );

        const knownTermsOrder = ['First Term', 'Second Term', 'Third Term'];
        const normalizeTerm = (t?: string) =>
          knownTermsOrder.includes(String(t))
            ? String(t)
            : scoreTerms.find((st) => knownTermsOrder.includes(st)) ||
              scoreTerms[0] ||
              'First Term';

        const effectiveSession =
          (settingsRes?.session as string) || sortedSessions[0] || '';
        const effectiveTerm =
          normalizeTerm(settingsRes?.term as string) || 'First Term';

        setSession(effectiveSession);
        setTerm(effectiveTerm);
      } catch (e) {
        console.error('Failed to load broadsheet data', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Class options
  const classOptions = useMemo(
    () => generateClassNames(settings),
    [settings]
  );

  // Students in selected class
  const classStudents = useMemo(() => {
    const effectiveRole = userRole || role || null;
    const activeUserId = (() => {
      try {
        const raw = sessionStorage.getItem('activeUser');
        const au = raw ? JSON.parse(raw) : null;
        return au?.userId || null;
      } catch {
        return null;
      }
    })();
    const currentId = effectiveRole === 'Student' || effectiveRole === 'Parent'
      ? (String((user as any)?.id || activeUserId || '') || '')
      : '';
    const base = students.filter((s) => !selectedClass || s.class === selectedClass);
    if (currentId) return base.filter((s) => String(s.id) === String(currentId));
    return base;
  }, [students, selectedClass, user, role, userRole]);

  // Fast lookup for class students
  const classStudentIds = useMemo(
    () => new Set(classStudents.map((s) => s.id)),
    [classStudents]
  );

  // Session & term options (read from data + settings)
  const sessionOptions = useMemo(() => {
    const set = new Set<string>();
    if (settings?.session) set.add(String(settings.session));
    scores.forEach((s) => {
      if (s.session) set.add(String(s.session));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [scores, settings]);

  const termOptions = useMemo(() => {
    const known = ['First Term', 'Second Term', 'Third Term'];
    const set = new Set<string>();
    if (settings?.term) set.add(String(settings.term));
    scores.forEach((s) => {
      if (s.term) set.add(String(s.term));
    });

    const values = Array.from(set);
    const knownSorted = known.filter((k) => values.includes(k));
    const others = values.filter((v) => !known.includes(v)).sort();

    return [...knownSorted, ...others];
  }, [scores, settings]);

  // Filter scores/remarks for selected class + session + term
  const filteredScores = useMemo(
    () =>
      scores.filter(
        (s) =>
          (!selectedClass || classStudentIds.has(s.studentId)) &&
          (!session || String(s.session) === String(session)) &&
          (!term || String(s.term) === String(term))
      ),
    [scores, classStudentIds, selectedClass, session, term]
  );

  const filteredRemarks = useMemo(
    () =>
      remarks.filter(
        (r) =>
          (!selectedClass || classStudentIds.has(r.studentId)) &&
          (!session || String(r.session) === String(session)) &&
          (!term || String(r.term) === String(term))
      ),
    [remarks, classStudentIds, selectedClass, session, term]
  );

  // Remark lookup
  const remarkByStudent = useMemo(() => {
    const map = new Map<string, Remark>();
    filteredRemarks.forEach((r) => map.set(r.studentId, r));
    return map;
  }, [filteredRemarks]);

  // Controlled remark drafts to keep UI in sync with filtered remarks
  const [remarkDrafts, setRemarkDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    const next: Record<string, string> = {};
    filteredRemarks.forEach((r) => {
      next[r.studentId] = r.generalComment || '';
    });
    setRemarkDrafts(next);
  }, [filteredRemarks]);

  const handleRemarkChange = (studentId: string, value: string) => {
    setRemarkDrafts((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleRemarkBlur = (studentId: string) => {
    const value = remarkDrafts[studentId] || '';
    saveRemark(studentId, value);
  };

  // Subjects taught in selected class
  const classSubjectIds = useMemo(() => {
    return subjects
      .filter(
        (sub) =>
          !selectedClass ||
          (sub.classes || []).includes(selectedClass)
      )
      .map((s) => s.id as string);
  }, [subjects, selectedClass]);

  // Precompute totals by student & subject (current term/session)
  const studentSubjectTotals: Record<
    string,
    Record<string, number>
  > = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const sc of filteredScores) {
      const total =
        (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0);

      if (!map[sc.studentId]) map[sc.studentId] = {};

      // Business rule: if multiple rows exist, keep the highest total
      // (adjust to "last in" or "sum" if your domain requires)
      map[sc.studentId][sc.subjectId] = Math.max(
        map[sc.studentId][sc.subjectId] || 0,
        total
      );
    }
    return map;
  }, [filteredScores]);

  // Compute totals, averages & positions (class-level)
  const perf = useMemo(() => {
    const subjectIds = classSubjectIds;
    const totalsByStudent: Record<
      string,
      { total: number; average: number }
    > = {};

    classStudents.forEach((st) => {
      let total = 0;
      subjectIds.forEach((subId) => {
        total += studentSubjectTotals[st.id]?.[subId] ?? 0;
      });
      const average =
        subjectIds.length > 0
          ? total / subjectIds.length
          : 0;
      totalsByStudent[st.id] = { total, average };
    });

    // Ranking with tie handling:
    // same average => same position; next position based on index.
    const sorted = [...classStudents]
      .map((st) => ({
        studentId: st.id,
        avg: totalsByStudent[st.id]?.average ?? 0,
      }))
      .sort((a, b) => b.avg - a.avg);

    const positions: Record<string, number> = {};
    let lastAvg: number | null = null;
    let lastRank = 0;
    sorted.forEach((entry, index) => {
      if (lastAvg === null || entry.avg !== lastAvg) {
        lastRank = index + 1;
        lastAvg = entry.avg;
      }
      positions[entry.studentId] = lastRank;
    });

    return { studentTotals: totalsByStudent, positions };
  }, [classStudents, classSubjectIds, studentSubjectTotals]);

  // Summarize attendance per student
  const attnSummary = useMemo(() => {
    const summary: Record<
      string,
      { presentDays: number; absentDays: number; lateDays: number }
    > = {};

    classStudents.forEach((st) => {
      summary[st.id] = {
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
      };
    });

    const relevantRecords = attendance.filter(
      (rec) =>
        !selectedClass || rec.class === selectedClass
    );

    relevantRecords.forEach((rec) => {
      Object.entries(rec.statuses || {}).forEach(
        ([sid, status]) => {
          if (!summary[sid]) return;
          const normalized = String(status || '').toLowerCase();
          if (normalized === 'present') summary[sid].presentDays += 1;
          else if (normalized === 'absent') summary[sid].absentDays += 1;
          else if (normalized === 'late') summary[sid].lateDays += 1;
          // ignore unknown statuses
        }
      );
    });

    return summary;
  }, [attendance, classStudents, selectedClass]);

  // Save remark (optimistic)
  const saveRemark = async (
    studentId: string,
    generalComment: string
  ) => {
    const payload: Partial<Remark> = {
      studentId,
      session,
      term,
      generalComment,
    };

    setRemarks((prev) => {
      const idx = prev.findIndex(
        (r) =>
          r.studentId === studentId &&
          String(r.session) === String(session) &&
          String(r.term) === String(term)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          generalComment,
        };
        return next;
      }
      return [...prev, payload as Remark];
    });

    try {
      await apiUpsertRemark(payload);
      window.dispatchEvent(
        new CustomEvent('show-global-success', {
          detail: { message: 'Remark saved.' },
        })
      );
    } catch (e) {
      console.error('Failed saving remark', e);
      window.dispatchEvent(
        new CustomEvent('show-global-error', {
          detail: {
            message: 'Could not save remark.',
          },
        })
      );
    }
  };

  const goToScores = () => {
    try {
      localStorage.setItem(
        'results_preselect_class',
        selectedClass
      );
    } catch {
      /* no-op */
    }
    if (userRole === 'Teacher') {
      setActiveView(
        TEACHER_VIEWS.ENTER_SCORES as unknown as TeacherView
      );
    } else {
      setActiveView(
        ADMIN_VIEWS.RESULTS as DashboardView
      );
    }
  };

  const goToDossier = () => {
    if (userRole === 'Teacher') {
      setActiveView(
        TEACHER_VIEWS
          .COMPREHENSIVE_ENTRY as unknown as TeacherView
      );
    } else {
      setActiveView(
        ADMIN_VIEWS
          .COMPREHENSIVE_ENTRY as DashboardView
      );
    }
  };

  if (isLoading) return <Loader />;

  const isReadOnly = (userRole || role) === 'Student' || (userRole || role) === 'Parent';
  const canNavigate = userRole === 'Admin' || userRole === 'Teacher';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Broadsheet / Transcript
          </h1>
          <p className="text-gray-600 text-sm">
            Class-wide overview of subject totals, averages,
            positions, attendance, and remarks.
          </p>
        </div>
        {canNavigate && (
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary"
              onClick={goToScores}
            >
              <ClipboardListIcon className="w-5 h-5 mr-2" />
              Enter Scores
            </button>
            <button className="btn" onClick={goToDossier}>
              <PencilSquareIcon className="w-5 h-5 mr-2" />
              Dossier
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="label">Class</label>
          <select
            className="input"
            value={selectedClass}
            onChange={(e) =>
              setSelectedClass(e.target.value)
            }
            disabled={isReadOnly}
          >
            {[selectedClass &&
            !classOptions.includes(selectedClass)
              ? selectedClass
              : null,
            ...classOptions]
              .filter(Boolean)
              .map((cls) => (
                <option
                  key={cls as string}
                  value={cls as string}
                >
                  {cls as string}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="label">Session</label>
          <select
            className="input"
            value={session}
            onChange={(e) =>
              setSession(e.target.value)
            }
          >
            {sessionOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Term</label>
          <select
            className="input"
            value={term}
            onChange={(e) =>
              setTerm(e.target.value)
            }
          >
            {termOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            className="btn-outline w-full"
            onClick={(e) => {
              e.preventDefault();
              window.print();
            }}
            disabled={classStudents.length === 0}
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-2" />
            Print
          </button>
        </div>
      </div>

      {/* Broadsheet Table */}
      <div className="card overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left">
                Student
              </th>
              {classSubjectIds.map((subId) => {
                const sub = subjects.find(
                  (s) => s.id === subId
                );
                return (
                  <th
                    key={subId}
                    className="px-3 py-2 text-left"
                  >
                    {sub?.name || subId}
                  </th>
                );
              })}
              <th className="px-3 py-2 text-left">
                Average
              </th>
              <th className="px-3 py-2 text-left">
                Position
              </th>
              <th className="px-3 py-2 text-left">
                Attendance
              </th>
              <th className="px-3 py-2 text-left">
                Remark
              </th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((st) => {
              const totals =
                perf.studentTotals[st.id];
              const pos =
                perf.positions[st.id];
              const attn =
                attnSummary[st.id] || {
                  presentDays: 0,
                  absentDays: 0,
                  lateDays: 0,
                };
              const existingRemark =
                remarkByStudent.get(st.id)
                  ?.generalComment || '';

              const daysCount =
                attn.presentDays +
                attn.absentDays;

              return (
                <tr
                  key={st.id}
                  className="border-t"
                >
                  <td className="px-3 py-2 whitespace-nowrap">
                    {st.name}
                  </td>

                  {classSubjectIds.map(
                    (subId) => {
                      const val =
                        studentSubjectTotals[
                          st.id
                        ]?.[subId] ?? 0;
                      return (
                        <td
                          key={`${st.id}-${subId}`}
                          className="px-3 py-2"
                        >
                          {val || ''}
                        </td>
                      );
                    }
                  )}

                  <td className="px-3 py-2">
                    {totals
                      ? Math.round(
                          totals.average
                        )
                      : '-'}
                  </td>
                  <td className="px-3 py-2">
                    {pos ?? '-'}
                  </td>
                  <td className="px-3 py-2">
                    {attn.presentDays}
                    {daysCount > 0
                      ? `/${daysCount}`
                      : ''}
                  </td>
                  <td className="px-3 py-2 w-64">
                    <textarea
                      className="input w-full text-[10px]"
                      value={remarkDrafts[st.id] ?? existingRemark}
                      onChange={(e) => !isReadOnly && handleRemarkChange(st.id, e.target.value)}
                      onBlur={() => !isReadOnly && handleRemarkBlur(st.id)}
                      readOnly={isReadOnly}
                      placeholder={isReadOnly ? 'Remark' : 'Enter teacher remark'}
                      rows={2}
                    />
                  </td>
                </tr>
              );
            })}
            {classStudents.length === 0 && (
              <tr>
                <td
                  colSpan={
                    4 +
                    classSubjectIds.length
                  }
                  className="px-3 py-4 text-center text-gray-400"
                >
                  No students found for the
                  selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Broadsheet;
