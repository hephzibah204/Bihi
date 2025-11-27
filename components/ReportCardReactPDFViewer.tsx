import React, { useState, useEffect, useMemo } from 'react';
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings, apiGetAttendance, apiGetRemarks } from '../services/api';
import { calculateGrade, calculateOverallPerformance } from '../utils/reportCardHelper';
import ReactPDFViewerComponent from './ReactPDFViewer';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import SkeletonLoader from './SkeletonLoader';
import { USER_ROLES } from '../utils/constants';

interface ReportCardReactPDFViewerProps {
  demoUserId?: string;
  onBack?: () => void;
  studentId?: string;
  session?: string;
  term?: string;
  className?: string;
}

const ReportCardReactPDFViewer: React.FC<ReportCardReactPDFViewerProps> = ({
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
          currentStudent = { id: 'stud_1', class: '', name: 'Demo Student' } as any;
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

        // Process scores for the selected student, session, and term
        const studentScores = scores.filter((score: any) => 
          score.studentId === currentStudent.id &&
          score.session === initialSession &&
          score.term === initialTerm
        );

        // Calculate subjects data
        const subjectsData = studentScores.map((score: any) => {
          const subject = subjects.find((sub: any) => sub.id === score.subjectId);
          const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
          const gradeInfo = calculateGrade(total, settings?.gradingSystem || []);
          
          return {
            name: subject ? subject.name : 'Unknown Subject',
            ca1: score.ca1,
            ca2: score.ca2,
            exam: score.exam,
            total,
            grade: gradeInfo.grade
          };
        });

        // Calculate overall performance
        const performance = calculateOverallPerformance(
          currentStudent.id,
          initialClass,
          students,
          scores,
          subjects,
          initialTerm,
          initialSession
        );

        // Get remarks
        const studentRemarks = remarks.filter((remark: any) =>
          remark.studentId === currentStudent.id &&
          remark.session === initialSession &&
          remark.term === initialTerm
        );

        // Get attendance
        const studentAttendance = attendance.find((att: any) =>
          att.studentId === currentStudent.id &&
          att.session === initialSession &&
          att.term === initialTerm
        );

        const processedReportData = {
          student: {
            name: currentStudent.name,
            class: initialClass,
            admissionNo: currentStudent.admissionNo || currentStudent.id
          },
          schoolName: settings?.schoolName || 'SCHOOL NAME',
          session: initialSession,
          term: initialTerm,
          subjects: subjectsData,
          totalScore: performance.totalScore,
          maxScore: performance.maxScore,
          average: performance.average,
          position: performance.position,
          totalStudents: performance.totalStudentsInClass,
          classTeacherRemark: studentRemarks.find((r: any) => r.type === 'class_teacher')?.remark || '',
          principalRemark: studentRemarks.find((r: any) => r.type === 'principal')?.remark || '',
          attendance: studentAttendance ? {
            present: studentAttendance.present || 0,
            absent: studentAttendance.absent || 0,
            total: (studentAttendance.present || 0) + (studentAttendance.absent || 0)
          } : undefined
        };

        setReportData(processedReportData);

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
    // This would need to be implemented based on available data
    return [reportData.session];
  }, [reportData]);

  const termOptions = useMemo(() => {
    if (!reportData) return [] as string[];
    // This would need to be implemented based on available data
    return [reportData.term];
  }, [reportData]);

  const classOptions = useMemo(() => {
    if (!reportData) return [] as string[];
    return [reportData.student.class];
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                React PDF
              </span>
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

      {/* React PDF Viewer */}
      <ReactPDFViewerComponent
        reportData={reportData}
        filename={filename}
        title={`Report Card - ${reportData.student.name} (${selectedSession} ${selectedTerm})`}
        onClose={onBack}
      />
    </div>
  );
};

export default ReportCardReactPDFViewer;
