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

    useEffect(() => {
        const fetchReportData = async () => {
            setLoading(true);
            setError('');
            try {
                const [scores, subjects, students, settings, attendance, remarks] = await Promise.all([
                    apiGetScores(), apiGetSubjects(), apiGetStudents(), apiGetSchoolSettings(), apiGetAttendance(), apiGetRemarks()
                ]);

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
                if (!currentStudent || !currentStudent.id) {
                    throw new Error('Student profile not selected.');
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

    // Options recomputed when data or selected session changes
    const sessionOptions = useMemo(() => {
        if (!reportData) return [] as string[];
        const { scores, remarks, settings } = reportData;
        return Array.from(new Set([
            ...scores.map(s => s.session).filter(Boolean),
            ...remarks.map(r => r.session).filter(Boolean),
            settings?.session
        ].filter(Boolean)));
    }, [reportData]);

    const termOptions = useMemo(() => {
        if (!reportData) return [] as string[];
        const { scores, remarks, settings } = reportData;
        return Array.from(new Set([
            ...scores.filter(s => !selectedSession || s.session === selectedSession).map(s => s.term).filter(Boolean),
            ...remarks.filter(r => !selectedSession || r.session === selectedSession).map(r => r.term).filter(Boolean),
            settings?.term
        ].filter(Boolean)));
    }, [reportData, selectedSession]);

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
                                {sessionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Term</label>
                            <select className="input-field" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                                {termOptions.map(t => <option key={t} value={t}>{t}</option>)}
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
                            <button
                                onClick={() => downloadElementAsPdf('.printable-content', reportData?.student?.name || 'report-card')}
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

            {/* A4-like preview container with zoom for mobile */}
            <div className="w-full px-2 report-card-wrapper">
                <div className="mx-auto max-w-full md:max-w-4xl">
                    <div className="no-print block md:hidden mb-2 text-xs text-gray-500 text-center">Pinch or use buttons to zoom</div>
                    <div className="block md:hidden">
                        <ZoomablePreview>
                            <div className="printable-content mx-auto bg-white shadow-lg report-card-page rounded-md">
                                <ReportCardComponent
                                    {...reportData}
                                    student={{ ...reportData.student, class: effectiveClass }}
                                    term={selectedTerm || reportData.term}
                                    session={selectedSession || reportData.session}
                                />
                            </div>
                        </ZoomablePreview>
                    </div>
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