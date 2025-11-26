import React, { useState, useEffect, useMemo } from 'react';
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings, apiGetAttendance, apiGetRemarks } from '../services/api';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import PDFViewer from './PDFViewer';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SkeletonLoader from './SkeletonLoader';
import { USER_ROLES } from '../utils/constants';

interface ReportCardPrintViewerProps {
  demoUserId?: string;
  onBack?: () => void;
  studentId?: string;
  session?: string;
  term?: string;
  className?: string;
}

const ReportCardPrintViewer: React.FC<ReportCardPrintViewerProps> = ({
  demoUserId,
  onBack,
  studentId: propStudentId,
  session: propSession,
  term: propTerm,
  className: propClassName
}) => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedSession, setSelectedSession] = useState(propSession || '');
  const [selectedTerm, setSelectedTerm] = useState(propTerm || '');
  const [selectedClass, setSelectedClass] = useState(propClassName || '');

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.allSettled([
          apiGetScores(),
          apiGetSubjects(),
          apiGetStudents(),
          apiGetSchoolSettings(),
          apiGetAttendance(),
          apiGetRemarks()
        ]);

        const scores = results[0].status === 'fulfilled' ? results[0].value : [];
        const subjects = results[1].status === 'fulfilled' ? results[1].value : [];
        const students = results[2].status === 'fulfilled' ? results[2].value : [];
        const settings = results[3].status === 'fulfilled' ? results[3].value : null;
        const attendance = results[4].status === 'fulfilled' ? results[4].value : [];
        const remarks = results[5].status === 'fulfilled' ? results[5].value : [];

        // Resolve student
        let effectiveId = propStudentId || demoUserId;
        if (!effectiveId) {
          try {
            const raw = sessionStorage.getItem('activeUser');
            const active = raw ? JSON.parse(raw) : null;
            if (active?.userId) effectiveId = active.userId;
          } catch {}
        }
        
        let currentStudent = effectiveId ? students.find((s: any) => s.id === effectiveId) : null;
        if (!currentStudent) {
          currentStudent = students[0] || null;
        }
        if (!currentStudent) {
          currentStudent = { id: 'stud_1', class: '' } as any;
        }

        if (!students || students.length === 0) {
          throw new Error('No student data available.');
        }

        if (!currentStudent || !currentStudent.id) {
          throw new Error('Student profile not selected.');
        }

        // Initialize filters
        const allSessions = Array.from(new Set([
          ...scores.map((s: any) => s.session).filter(Boolean),
          ...remarks.map((r: any) => r.session).filter(Boolean),
          settings?.session
        ].filter(Boolean)));
        const initialSession = propSession || (allSessions.includes(settings?.session) ? settings.session : (allSessions[0] || settings?.session || ''));

        const termsForSession = Array.from(new Set([
          ...scores.filter((s: any) => s.session === initialSession).map((s: any) => s.term).filter(Boolean),
          ...remarks.filter((r: any) => r.session === initialSession).map((r: any) => r.term).filter(Boolean),
          settings?.term
        ].filter(Boolean)));
        const initialTerm = propTerm || (termsForSession.includes(settings?.term) ? settings.term : (termsForSession[0] || settings?.term || ''));

        const allClasses = Array.from(new Set([
          currentStudent.class,
          ...subjects.flatMap((sub: any) => sub.classes || [])
        ].filter(Boolean)));
        const initialClass = propClassName || (allClasses.includes(currentStudent.class) ? currentStudent.class : (allClasses[0] || currentStudent.class || ''));

        setSelectedSession(initialSession || '');
        setSelectedTerm(initialTerm || '');
        setSelectedClass(initialClass || currentStudent.class || '');

        setReportData({
          student: currentStudent,
          students,
          scores,
          subjects,
          settings,
          term: initialTerm,
          session: initialSession,
          remarks,
          attendance
        });

      } catch (err: any) {
        console.error("Failed to fetch report card data:", err);
        setError(err?.message || "Could not load report card data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [demoUserId, propStudentId, propSession, propTerm, propClassName]);

  // Filter options based on current student and data
  const sessionOptions = useMemo(() => {
    if (!reportData) return [] as string[];
    const { scores, subjects } = reportData;
    const studentId = reportData.student?.id;
    const effectiveClass = selectedClass || reportData.student?.class;
    const subjectIdsForClass = new Set(
      (subjects || []).filter((sub: any) => (sub.classes || []).includes(effectiveClass)).map((s: any) => s.id)
    );
    const sessions = scores
      .filter((s: any) => s.studentId === studentId && subjectIdsForClass.has(s.subjectId))
      .map((s: any) => s.session)
      .filter(Boolean);
    const set = new Set<string>(sessions);
    if (reportData?.session) set.add(reportData.session as string);
    if (reportData?.settings?.session) set.add((reportData.settings as any).session as string);
    return Array.from(set).sort().reverse();
  }, [reportData, selectedClass]);

  const termOptions = useMemo(() => {
    if (!reportData) return [] as string[];
    const { scores, subjects } = reportData;
    const studentId = reportData.student?.id;
    const effectiveClass = selectedClass || reportData.student?.class;
    const subjectIdsForClass = new Set(
      (subjects || []).filter((sub: any) => (sub.classes || []).includes(effectiveClass)).map((s: any) => s.id)
    );
    const terms = scores
      .filter((s: any) => s.studentId === studentId && (selectedSession ? s.session === selectedSession : true) && subjectIdsForClass.has(s.subjectId))
      .map((s: any) => s.term)
      .filter(Boolean);
    const set = new Set<string>(terms);
    if (reportData?.term) set.add(reportData.term as string);
    if (reportData?.settings?.term) set.add((reportData.settings as any).term as string);
    return Array.from(set);
  }, [reportData, selectedClass, selectedSession]);

  const classOptions = useMemo(() => {
    if (!reportData) return [] as string[];
    const { subjects } = reportData;
    const sClass = reportData.student?.class;
    return Array.from(new Set([sClass, ...subjects.flatMap((sub: any) => sub.classes || [])].filter(Boolean)));
  }, [reportData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="space-y-4">
              <SkeletonLoader className="h-8 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SkeletonLoader className="h-10 w-full" />
                <SkeletonLoader className="h-10 w-full" />
                <SkeletonLoader className="h-10 w-full" />
              </div>
              <SkeletonLoader className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const handleUseDefaultDemo = () => {
      try {
        sessionStorage.setItem('isDemoMode', 'true');
        localStorage.setItem('isDemoMode', 'true');
        const sessionData = { role: USER_ROLES.STUDENT, userId: 'stud_1' };
        sessionStorage.setItem('activeUser', JSON.stringify(sessionData));
        localStorage.setItem('demoUserRole', USER_ROLES.STUDENT);
        window.location.reload();
      } catch (e) {
        window.location.href = '/demo';
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            {error.includes('not selected') && (
              <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                <a href="/demo" className="btn btn-secondary">Select a student on Demo page</a>
                <button onClick={handleUseDefaultDemo} className="btn btn-primary">Use default demo student</button>
              </div>
            )}
            {onBack && (
              <button onClick={onBack} className="btn btn-secondary mt-4">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-6 text-center text-gray-500">
            No report card available for the current term.
            {onBack && (
              <div className="mt-4">
                <button onClick={onBack} className="btn btn-secondary">
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Go Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const effectiveClass = selectedClass || reportData.student.class;
  const ReportCardComponent = getReportCardTemplate(effectiveClass, reportData.settings);
  const filename = `${reportData.student.name || 'report-card'}-${selectedSession}-${selectedTerm}`.replace(/\s+/g, '-');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter Controls */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button onClick={onBack} className="btn btn-secondary">
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Back
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                Report Card - {reportData.student.name}
              </h1>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
              <select 
                className="input-field" 
                value={selectedSession} 
                onChange={e => setSelectedSession(e.target.value)}
              >
                {sessionOptions.length === 0 ? (
                  <option value="">No sessions available</option>
                ) : (
                  sessionOptions.map(s => <option key={s} value={s}>{s}</option>)
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select 
                className="input-field" 
                value={selectedTerm} 
                onChange={e => setSelectedTerm(e.target.value)}
              >
                {termOptions.length === 0 ? (
                  <option value="">No terms available</option>
                ) : (
                  termOptions.map(t => <option key={t} value={t}>{t}</option>)
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <select 
                className="input-field" 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)}
              >
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <PDFViewer
        elementId="report-card-content"
        filename={filename}
        title={`Report Card - ${reportData.student.name} (${selectedSession} ${selectedTerm})`}
        onClose={onBack}
        showPreview={true}
      >
        <div className="report-card-page bg-white">
          <ReportCardComponent
            {...reportData}
            student={{ ...reportData.student, class: effectiveClass }}
            term={selectedTerm || reportData.term}
            session={selectedSession || reportData.session}
          />
        </div>
      </PDFViewer>
    </div>
  );
};

export default ReportCardPrintViewer;
