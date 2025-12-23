import React, { useState, useEffect, useMemo } from 'react';
// Fix: Replaced non-existent `getTenantData` with `apiGetRemarks`.
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings, apiGetAttendance, apiGetRemarks } from '../services/api';
import { getReportCardTemplate } from '../utils/reportCardHelper';
import PrinterIcon from './icons/PrinterIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import { useReportCardExporter } from '../hooks/useReportCardExporter';
import '../styles/report-card.css';
import ZoomablePreview from './ZoomablePreview';
import { USER_ROLES } from '../utils/constants';
import EyeIcon from './icons/EyeIcon';
import ReportCardPDF from '../components/pdf/ReportCardPDF'; // Added import
import KendoReportCardPDF from '../components/pdf/KendoReportCardPDF'; // Added import

interface StudentReportCardViewerProps {
    demoUserId?: string;
    reportCardId?: string;
}

const StudentReportCardViewer = ({ demoUserId, reportCardId }: StudentReportCardViewerProps) => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [previewMode, setPreviewMode] = useState(false);

    // Filters
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    // Detect mobile to render preview offscreen while keeping content printable/downloadable
    const [isMobile, setIsMobile] = useState(false);
    const [showMobilePreview, setShowMobilePreview] = useState(true);
    const { exporting, exportToPDF } = useReportCardExporter();
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
                // Stage 1: Fetch students and school settings concurrently
                const [studentsResult, settingsResult] = await Promise.allSettled([
                    apiGetStudents(),
                    apiGetSchoolSettings()
                ]);

                const students = studentsResult.status === 'fulfilled' ? studentsResult.value : [];
                const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : null;

                // Resolve currentStudent
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
                    currentStudent = { id: 'stud_1', class: '' } as any; // Fallback with minimal structure
                }

                if (!students || students.length === 0) {
                    throw new Error('No student data available.');
                }
                if (!currentStudent || !currentStudent.id) {
                    throw new Error('Student profile not selected.');
                }

                if (!settings) {
                    console.warn('Warning: No school settings available');
                }

                // Determine initial filter values based on currentStudent and settings
                const initialClass = currentStudent.class || '';
                const initialSession = settings?.session || '';
                const initialTerm = settings?.term || '';

                // Stage 2: Fetch remaining data concurrently with determined filters
                const subsequentResults = await Promise.allSettled([
                    apiGetScores({ studentId: currentStudent.id, session: initialSession, term: initialTerm }),
                    apiGetSubjects({ classId: initialClass }),
                    apiGetAttendance({ studentId: currentStudent.id, session: initialSession, term: initialTerm }),
                    apiGetRemarks({ studentId: currentStudent.id, session: initialSession, term: initialTerm })
                ]);

                const scores = subsequentResults[0].status === 'fulfilled' ? subsequentResults[0].value : [];
                const subjects = subsequentResults[1].status === 'fulfilled' ? subsequentResults[1].value : [];
                const attendance = subsequentResults[2].status === 'fulfilled' ? subsequentResults[2].value : [];
                const remarks = subsequentResults[3].status === 'fulfilled' ? subsequentResults[3].value : [];

                if (!subjects || subjects.length === 0) {
                    console.warn('Warning: No subject data available for the student\'s class');
                }

                setSelectedSession(initialSession);
                setSelectedTerm(initialTerm);
                setSelectedClass(initialClass);

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
        // Filter sessions based on reportData which now contains filtered scores/remarks
        const { scores, remarks, settings } = reportData as any;
        const allSessions = Array.from(new Set([
            ...scores.map((s: any) => s.session).filter(Boolean),
            ...remarks.map((r: any) => r.session).filter(Boolean),
            settings?.session // Include default setting session if applicable
        ].filter(Boolean)));
        return allSessions.sort();
    }, [reportData]);

    const termOptions = useMemo(() => {
        if (!reportData) return [] as string[];
        const { scores, remarks, settings } = reportData as any;
        const termsForSession = Array.from(new Set([
            ...scores.filter((s: any) => s.session === selectedSession).map((s: any) => s.term).filter(Boolean),
            ...remarks.filter((r: any) => r.session === selectedSession).map((r: any) => r.term).filter(Boolean),
            settings?.term // Include default setting term if applicable
        ].filter(Boolean)));
        return termsForSession.sort();
    }, [reportData, selectedSession]);

    // Keep selected session/term valid when options change
    useEffect(() => {
        if (selectedSession && !sessionOptions.includes(selectedSession)) {
            setSelectedSession(sessionOptions[0] || '');
        } else if (!selectedSession && sessionOptions.length > 0) {
            setSelectedSession(sessionOptions[0]);
        }
    }, [sessionOptions, selectedSession]);

    useEffect(() => {
        if (selectedTerm && !termOptions.includes(selectedTerm)) {
            setSelectedTerm(termOptions[0] || '');
        } else if (!selectedTerm && termOptions.length > 0) {
            setSelectedTerm(termOptions[0]);
        }
    }, [termOptions, selectedTerm]);


    const classOptions = useMemo(() => {
        if (!reportData) return [] as string[];
        const { subjects, student } = reportData;
        const sClass = student?.class;
        return Array.from(new Set([sClass, ...subjects.flatMap((sub: any) => sub.classes || [])].filter(Boolean))).sort();
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

    const renderControls = () => (
        <div className="no-print w-full max-w-4xl mb-4 sticky top-0 z-40 bg-white/95 backdrop-blur supports-backdrop-blur:bg-white shadow-sm">
            <div className="card p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
                        {isMobile && (
                            <button onClick={() => setShowMobilePreview(p => !p)} className="btn btn-secondary">
                                {showMobilePreview ? 'Hide' : 'Show'} Preview
                            </button>
                        )}
                         <button onClick={() => setPreviewMode(true)} className="btn btn-primary">
                            <EyeIcon className="w-5 h-5 mr-2" />
                            Preview
                        </button>
                        <button
                            onClick={() => exportToPDF('report-card-student-preview', reportData?.student?.name || 'report-card')}
                            className="btn btn-secondary"
                            title="Download as PDF"
                            disabled={exporting}
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                            {exporting ? '...' : 'Download'}
                        </button>
                        <button onClick={() => window.print()} className="btn btn-secondary">
                            <PrinterIcon className="w-5 h-5 mr-2" />
                            Print
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    if (previewMode) {
        return (
            <ZoomablePreview
                title={`Report Card Preview - ${reportData.student.name}`}
                onClose={() => setPreviewMode(false)}
            >
                <div id="report-card-student-preview">
                    <ReportCardComponent
                        {...reportData}
                        student={{ ...reportData.student, class: effectiveClass }}
                        term={selectedTerm || reportData.term}
                        session={selectedSession || reportData.session}
                    />
                </div>
            </ZoomablePreview>
        );
    }

    return (
        <div className="w-full bg-gray-50 min-h-[60vh] flex flex-col items-center py-4">
            {renderControls()}

            {/* A4-like preview container */}
            <div className="w-full px-2 report-card-wrapper">
                <div className="mx-auto max-w-full md:max-w-4xl">
                    <div className={`${isMobile && !showMobilePreview ? 'hidden' : 'block'} md:block`}>
                         <div id="report-card-student-preview" className="printable-content mx-auto bg-white shadow-lg report-card-page rounded-md md:rounded-lg">
                            <ReportCardComponent
                                {...reportData}
                                student={{ ...reportData.student, class: effectiveClass }}
                                term={selectedTerm || reportData.term}
                                session={selectedSession || reportData.session}
                            />
                        </div>
                    </div>
                     {isMobile && !showMobilePreview && (
                        <div className="text-center p-4 card mt-4">
                            Preview is hidden. Use the controls above to preview, download, or print.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentReportCardViewer;