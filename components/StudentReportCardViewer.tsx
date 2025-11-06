import React, { useState, useEffect, useMemo } from 'react';
// Fix: Replaced non-existent `getTenantData` with `apiGetRemarks`.
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings, apiGetAttendance, apiGetRemarks } from '../services/api';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import PrinterIcon from './icons/PrinterIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import { downloadElementAsPdf } from '../utils/pdfUtils';
import '../styles/report-card.css';
import ZoomablePreview from './ZoomablePreview';
import { USER_ROLES } from '../utils/constants';

const StudentReportCardViewer = ({ demoUserId }) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filters
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    // Detect mobile to render preview offscreen while keeping content printable/downloadable
    const [isMobile, setIsMobile] = useState(false);
    const [showMobilePreview, setShowMobilePreview] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                // Use Promise.allSettled() for graceful degradation if one API fails
                const results = await Promise.allSettled([
                    apiGetScores(),
                    apiGetSubjects(),
                    apiGetStudents(),
                    apiGetSchoolSettings(),
                    apiGetAttendance(),
                    apiGetRemarks()
                ]);

                // Extract values, defaulting to empty arrays on failure
                const scores = results[0].status === 'fulfilled' ? results[0].value : [];
                const subjects = results[1].status === 'fulfilled' ? results[1].value : [];
                const students = results[2].status === 'fulfilled' ? results[2].value : [];
                const settings = results[3].status === 'fulfilled' ? results[3].value : null;
                const attendance = results[4].status === 'fulfilled' ? results[4].value : [];
                const remarks = results[5].status === 'fulfilled' ? results[5].value : [];

                // Resolve a student to show: prefer prop; otherwise try activeUser; else fall back to first student; finally hardcode demo id.
                let effectiveId = demoUserId as string | undefined;
                if (!effectiveId) {
                    try {
                        const raw = sessionStorage.getItem('activeUser');
                        const active = raw ? JSON.parse(raw) : null;
                        if (active?.userId) effectiveId = active.userId;
                    } catch {}
                }
                let currentStudent = effectiveId ? students.find(s => s.id === effectiveId) : null;
                if (!currentStudent) {
                    currentStudent = students[0] || null;
                }
                if (!currentStudent) {
                    // Last resort demo fallback
                    currentStudent = { id: 'stud_1', class: '' } as any;
                }
                if (!students || students.length === 0) {
                    throw new Error('No student data available.');
                }

                if (!currentStudent || !currentStudent.id) {
                    throw new Error('Student profile not selected.');
                }

                // Log warnings if critical data is missing
                if (!subjects || subjects.length === 0) {
                    console.warn('Warning: No subject data available');
                }
                if (!settings) {
                    console.warn('Warning: No school settings available');
                }

                // Initialize filters
                const allSessions = Array.from(new Set([
                    ...scores.map(s => s.session).filter(Boolean),
                    ...remarks.map(r => r.session).filter(Boolean),
                    settings?.session
                ].filter(Boolean)));
                const initialSession = allSessions.includes(settings?.session) ? settings.session : (allSessions[0] || settings?.session || '');

                const termsForSession = Array.from(new Set([
                    ...scores.filter(s => s.session === initialSession).map(s => s.term).filter(Boolean),
                    ...remarks.filter(r => r.session === initialSession).map(r => r.term).filter(Boolean),
                    settings?.term
                ].filter(Boolean)));
                const initialTerm = termsForSession.includes(settings?.term) ? settings.term : (termsForSession[0] || settings?.term || '');

                const allClasses = Array.from(new Set([
                    currentStudent.class,
                    ...subjects.flatMap(sub => sub.classes || [])
                ].filter(Boolean)));
                const initialClass = allClasses.includes(currentStudent.class) ? currentStudent.class : (allClasses[0] || currentStudent.class || '');

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

            } catch (err) {
                console.error("Failed to fetch report card data:", err);
                setError((err as any)?.message || "Could not load your report card. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [demoUserId]);

    // Lock options to only values available for the current student and effective class
    const sessionOptions = useMemo(() => {
        if (!reportData) return [] as string[];
        const { scores, subjects } = reportData as any;
        const studentId = reportData.student?.id;
        const effectiveClass = (reportData.student?.classHistory || [])
            .find((h: any) => (!selectedSession || h.session === selectedSession) && (!selectedTerm || h.term === selectedTerm))?.class
            || selectedClass
            || reportData.student?.class;
        const subjectIdsForClass = new Set(
            (subjects || []).filter((sub: any) => (sub.classes || []).includes(effectiveClass)).map((s: any) => s.id)
        );
        const sessions = scores
            .filter((s: any) => s.studentId === studentId && subjectIdsForClass.has(s.subjectId))
            .map((s: any) => s.session)
            .filter(Boolean);
        return Array.from(new Set(sessions));
    }, [reportData, selectedClass, selectedTerm, selectedSession]);

    const termOptions = useMemo(() => {
        if (!reportData) return [] as string[];
        const { scores, subjects } = reportData as any;
        const studentId = reportData.student?.id;
        const effectiveClass = (reportData.student?.classHistory || [])
            .find((h: any) => (!selectedSession || h.session === selectedSession) && (!selectedTerm || h.term === selectedTerm))?.class
            || selectedClass
            || reportData.student?.class;
        const subjectIdsForClass = new Set(
            (subjects || []).filter((sub: any) => (sub.classes || []).includes(effectiveClass)).map((s: any) => s.id)
        );
        const terms = scores
            .filter((s: any) => s.studentId === studentId && (!!selectedSession ? s.session === selectedSession : true) && subjectIdsForClass.has(s.subjectId))
            .map((s: any) => s.term)
            .filter(Boolean);
        return Array.from(new Set(terms));
    }, [reportData, selectedClass, selectedSession, selectedTerm]);

    // Keep selected session/term valid when options change
    useEffect(() => {
        if (selectedSession && !sessionOptions.includes(selectedSession)) {
            setSelectedSession(sessionOptions[0] || '');
        }
    }, [sessionOptions]);
    useEffect(() => {
        if (selectedTerm && !termOptions.includes(selectedTerm)) {
            setSelectedTerm(termOptions[0] || '');
        }
    }, [termOptions]);

    const classOptions = useMemo(() => {
        if (!reportData) return [] as string[];
        const { subjects } = reportData;
        const sClass = reportData.student?.class;
        return Array.from(new Set([sClass, ...subjects.flatMap((sub: any) => sub.classes || [])].filter(Boolean)));
    }, [reportData]);

    const historyClass = useMemo(() => {
        const hist = (reportData?.student?.classHistory || []) as Array<{session: string; term: string; class: string}>;
        if (!hist.length) return '';
        const match = hist.find(h => (!selectedSession || h.session === selectedSession) && (!selectedTerm || h.term === selectedTerm));
        return match?.class || '';
    }, [reportData, selectedSession, selectedTerm]);

    if (loading) {
        return <div className="card p-6 text-center">Loading your report card...</div>;
    }
    if (error) {
        const handleUseDefaultDemo = () => {
            try {
                // Ensure demo mode and set a default demo student
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
            <div className="card p-6 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                {error.includes('not selected') && (
                    <div className="flex flex-col md:flex-row items-center justify-center gap-3">
                        <a href="/demo" className="btn btn-secondary">Select a student on Demo page</a>
                        <button onClick={handleUseDefaultDemo} className="btn btn-primary">Use default demo student</button>
                    </div>
                )}
            </div>
        );
    }
    if (!reportData) {
        return <div className="card p-6 text-center text-gray-500">No report card available for the current term.</div>;
    }

    const effectiveClass = historyClass || selectedClass || reportData.student.class;
    const ReportCardComponent = getReportCardTemplate(effectiveClass, reportData.settings);

    return (
        <div className="w-full bg-gray-50 min-h-[60vh] flex flex-col items-center py-4">
            {/* Controls */}
            <div className="no-print w-full max-w-4xl mb-4">
                <div className="card p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="label">Session</label>
                            <select className="input-field" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                                {sessionOptions.length === 0 ? (
                                    <option value="">Select session</option>
                                ) : (
                                    sessionOptions.map(s => <option key={s} value={s}>{s}</option>)
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="label">Term</label>
                            <select className="input-field" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                                {termOptions.length === 0 ? (
                                    <option value="">Select term</option>
                                ) : (
                                    termOptions.map(t => <option key={t} value={t}>{t}</option>)
                                )}
                            </select>
                        </div>
                        {/* Class: if history has a match for selected session/term, lock to history; else allow manual selection */}
                        {historyClass ? (
                            <div>
                                <label className="label">Class (from history)</label>
                                <input className="input-field" value={historyClass} readOnly />
                            </div>
                        ) : (
                            <div>
                                <label className="label">Class</label>
                                <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="flex items-end gap-2 justify-end">
                            {/* Mobile: Toggle visible preview */}
                            {isMobile && (
                                <button
                                    onClick={() => setShowMobilePreview(prev => !prev)}
                                    className="btn btn-secondary flex-1 md:flex-none"
                                    title="Toggle mobile preview"
                                >
                                    {showMobilePreview ? 'Hide Preview' : 'Show Preview'}
                                </button>
                            )}
                            <button
                                onClick={async () => {
                                    const el = document.querySelector('.printable-content') as HTMLElement | null;
                                    const hadOffscreen = !!el && el.classList.contains('offscreen');
                                    if (hadOffscreen) el.classList.remove('offscreen');
                                    try {
                                        await downloadElementAsPdf('.printable-content', reportData?.student?.name || 'report-card');
                                    } finally {
                                        if (hadOffscreen && el) el.classList.add('offscreen');
                                    }
                                }}
                                className="btn btn-secondary flex-1 md:flex-none"
                                title="Download as PDF"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                Download PDF
                            </button>
                            <button onClick={() => window.print()} className="btn btn-primary flex-1 md:flex-none">
                                <PrinterIcon className="w-5 h-5 mr-2" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* A4-like preview container; hide visible preview on mobile */}
            <div className="w-full px-2 report-card-wrapper">
                <div className="mx-auto max-w-full md:max-w-4xl">
                    {/* Mobile: render content offscreen to avoid heavy preview while keeping print/download working */}
                    <div className="block md:hidden">
                        <div className={`printable-content mx-auto bg-white shadow-lg report-card-page rounded-md ${isMobile && !showMobilePreview ? 'offscreen' : ''}`}>
                            <ReportCardComponent
                                {...reportData}
                                student={{ ...reportData.student, class: effectiveClass }}
                                term={selectedTerm || reportData.term}
                                session={selectedSession || reportData.session}
                            />
                        </div>
                        {!showMobilePreview && (
                            <div className="no-print text-xs text-gray-500 text-center mt-2">Preview disabled on mobile. Tap "Show Preview" to view.</div>
                        )}
                    </div>
                    {/* Desktop: normal visible preview */}
                    <div className="hidden md:block">
                        <div className="printable-content mx-auto bg-white shadow-lg report-card-page rounded-md md:rounded-lg">
                            <ReportCardComponent
                                {...reportData}
                                student={{ ...reportData.student, class: effectiveClass }}
                                term={selectedTerm || reportData.term}
                                session={selectedSession || reportData.session}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentReportCardViewer;