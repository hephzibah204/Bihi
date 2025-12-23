import React, { useState, useEffect, useMemo } from 'react';
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings, apiGetAttendance, apiGetRemarks } from '../services/api';
import { calculateGrade, getReportCardTemplate, calculateOverallPerformance } from '../utils/reportCardHelper';
import { downloadElementAsPdf } from '../utils/pdfUtils';
import '../styles/report-card.css';
import Modal from './Modal';
import PrinterIcon from './icons/PrinterIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import SkeletonLoader from './SkeletonLoader';
import AccordionSkeleton from './skeletons/AccordionSkeleton';

const StudentResults = ({ demoUserId }) => {
    const [allResults, setAllResults] = useState({});
    const [student, setStudent] = useState(null);
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTermData, setSelectedTermData] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // Filter states
    const [sessions, setSessions] = useState<string[]>([]);
    const [terms, setTerms] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState(''); // Empty string for 'All Terms'
    
    // State for new accordion UI
    const [expandedTermKey, setExpandedTermKey] = useState<string | null>(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError('');
            try {
                const [scores, subjects, students, settings, attendance, remarks] = await Promise.all([
                    apiGetScores(), apiGetSubjects(), apiGetStudents(), apiGetSchoolSettings(), apiGetAttendance(), apiGetRemarks()
                ]);
                setAllData({ scores, subjects, students, settings, attendance, remarks });

                // Resolve effective demo id with robust fallbacks
                let effectiveId = demoUserId;
                if (!effectiveId && typeof window !== 'undefined') {
                    try {
                        const raw = sessionStorage.getItem('activeUser');
                        const active = raw ? JSON.parse(raw) : null;
                        if (active?.userId) effectiveId = active.userId;
                    } catch {}
                }
                if (!effectiveId) {
                    effectiveId = 'stud_1';
                }

                let currentStudent = students.find(s => s.id === effectiveId);
                if (!currentStudent && students.length > 0) {
                    currentStudent = students[0];
                }
                if (!currentStudent) throw new Error("Student profile not found.");
                setStudent(currentStudent);

                const studentScores = scores.filter(score => score.studentId === currentStudent.id);
                
                const allSessions: string[] = [...new Set<string>(studentScores.map(s => s.session))].sort((a: string, b: string) => b.localeCompare(a));
                const allTerms = ['First Term', 'Second Term', 'Third Term'];
                setSessions(allSessions);
                setTerms(allTerms);

                if (allSessions.length > 0) {
                    const initialSession = allSessions.includes(settings.session as string) ? (settings.session as string) : allSessions[0];
                    setSelectedSession(initialSession);
                } else {
                    setSelectedSession('');
                }
                setSelectedTerm(settings.term || '');
                
                const resultsByTerm = studentScores.reduce((acc, score) => {
                    const termKey = `${score.session} - ${score.term}`;
                    if (!acc[termKey]) acc[termKey] = [];
                    
                    const subject = subjects.find(sub => sub.id === score.subjectId);
                    const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                    const gradeInfo = calculateGrade(total, settings.gradingSystem || []);

                    acc[termKey].push({
                        subjectName: subject ? subject.name : 'Unknown Subject',
                        ...score, total, ...gradeInfo
                    });
                    return acc;
                }, {});
                
                setAllResults(resultsByTerm);

            } catch (err) {
                console.error("Failed to fetch results:", err);
                setError("Could not load your results. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [demoUserId]);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    
    const handleViewReport = (termKey) => {
        const [session, term] = termKey.split(' - ');
        setSelectedTermData({ session, term });
        setIsModalOpen(true);
    };

    const filteredTerms = useMemo(() => {
        return Object.keys(allResults)
            .filter(termKey => {
                const [session, term] = termKey.split(' - ');
                const sessionMatch = !selectedSession || session === selectedSession;
                const termMatch = !selectedTerm || term === selectedTerm;
                return sessionMatch && termMatch;
            })
            .sort()
            .reverse();
    }, [allResults, selectedSession, selectedTerm]);
    
    useEffect(() => {
        if (filteredTerms.length > 0 && !expandedTermKey) {
            setExpandedTermKey(filteredTerms[0]);
        }
    }, [filteredTerms, expandedTermKey]);

    const termSummaries = useMemo(() => {
        if (!student || !allData) return {};
        const summaries = {};
        Object.keys(allResults).forEach(termKey => {
            const [session, term] = termKey.split(' - ');
            const performance = calculateOverallPerformance(student.id, student.class, allData.students, allData.scores, allData.subjects, term, session);
            summaries[termKey] = performance;
        });
        return summaries;
    }, [allResults, student, allData]);

    if (loading) {
        return (
            <div>
                 <div className="card p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SkeletonLoader className="h-10 w-full" />
                        <SkeletonLoader className="h-10 w-full" />
                    </div>
                </div>
                <AccordionSkeleton />
            </div>
        );
    }

    if (error) {
        return <div className="card p-6 text-center text-red-500">{error}</div>;
    }

    const ReportCardComponent = selectedTermData && student
      ? getReportCardTemplate(student.class, allData?.settings)
      : null;

    return (
        <div>
            <div className="card p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="label">Session</label>
                        <select className="input-field" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                         <label className="label">Term</label>
                         <div className="flex rounded-lg border">
                            <button onClick={() => setSelectedTerm('')} className={`flex-1 p-2 text-sm rounded-l-md ${selectedTerm === '' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>All Terms</button>
                            {terms.map(t => <button key={t} onClick={() => setSelectedTerm(t)} className={`flex-1 p-2 text-sm border-l ${selectedTerm === t ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>{t}</button>)}
                         </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredTerms.length === 0 && (
                    <div className="card p-6 text-center text-gray-500">
                        No results found for the selected session/term.
                        <div className="mt-2 text-xs md:hidden">Try picking a different session or term above.</div>
                    </div>
                )}
                {filteredTerms.map(termKey => {
                    const isOpen = expandedTermKey === termKey;
                    const summary = termSummaries[termKey];
                    return (
                        <div key={termKey} className="card">
                            <button onClick={() => setExpandedTermKey(isOpen ? null : termKey)} className="w-full text-left p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-lg">{termKey}</h3>
                                        {summary && <p className="text-sm text-gray-500">Average: {summary.average}% &middot; Position: {summary.position}/{summary.totalStudentsInClass}</p>}
                                    </div>
                                    <ChevronDownIcon className={`w-6 h-6 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
                                </div>
                            </button>
                            {isOpen && (
                                <div className="p-4 border-t">
                                    <div className="table-container">
                                        <table className="table">
                                            <thead><tr><th className="th">Subject</th><th className="th text-center">Score</th><th className="th text-center">Grade</th></tr></thead>
                                            <tbody>
                                                {allResults[termKey].map(res => (
                                                    <tr key={res.subjectName}>
                                                        <td className="td">{res.subjectName}</td>
                                                        <td className="td text-center">{res.total}</td>
                                                        <td className="td text-center">{res.grade}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="text-right mt-4 flex justify-end items-center space-x-2">
                                        <button onClick={() => handleViewReport(termKey)} className="btn btn-primary">View Report Card</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isModalOpen && selectedTermData && ReportCardComponent && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Report Card`} size="full">
                     <div className="bg-gray-100 p-4 md:p-8 flex flex-col items-center">
                        <div className="no-print mb-8 flex gap-2">
                            <button onClick={async () => {
                                const el = document.querySelector('#report-card-modal') as HTMLElement | null;
                                const hadOffscreen = !!el && el.classList.contains('offscreen');
                                if (hadOffscreen) el.classList.remove('offscreen');
                                try {
                                    await downloadElementAsPdf(
                                        '#report-card-modal',
                                        `${student?.name || 'student'}-report-${selectedTermData.session}-${selectedTermData.term}`
                                    );
                                } finally {
                                    if (hadOffscreen && el) el.classList.add('offscreen');
                                }
                            }} className="btn btn-secondary">
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                Download PDF
                            </button>
                            <button onClick={() => window.print()} className="btn btn-primary">
                                <PrinterIcon className="w-5 h-5 mr-2" />
                                Print Report
                            </button>
                        </div>

                        <div id="report-card-modal" className={`printable-content bg-white shadow-lg ${isMobile ? 'offscreen' : ''}`}>
                            <ReportCardComponent
                                student={student}
                                {...allData}
                                session={selectedTermData.session}
                                term={selectedTermData.term}
                            />
                        </div>
                        
                        <div className="no-print text-xs text-gray-500 text-center mt-2 md:hidden">Preview disabled on mobile. Use Download/Print.</div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default StudentResults;