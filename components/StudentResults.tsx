import React, { useState, useEffect, useMemo } from 'react';
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings, apiGetAttendance, apiGetRemarks } from '../services/api';
import { calculateGrade, getReportCardTemplate, calculateOverallPerformance } from '../utils/reportCardHelper';
import Modal from './Modal';
import PrinterIcon from './icons/PrinterIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
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

    // Filter states
    const [sessions, setSessions] = useState<string[]>([]);
    const [terms, setTerms] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState(''); // Empty string for 'All Terms'
    
    // State for new accordion UI
    const [expandedTermKey, setExpandedTermKey] = useState<string | null>(null);

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            setError("Student profile not selected.");
            return;
        }
        
        const fetchResults = async () => {
            setLoading(true);
            setError('');
            try {
                const [scores, subjects, students, settings, attendance, remarks] = await Promise.all([
                    apiGetScores(), apiGetSubjects(), apiGetStudents(), apiGetSchoolSettings(), apiGetAttendance(), apiGetRemarks()
                ]);
                setAllData({ scores, subjects, students, settings, attendance, remarks });

                const currentStudent = students.find(s => s.id === demoUserId);
                if (!currentStudent) throw new Error("Student profile not found.");
                setStudent(currentStudent);

                const studentScores = scores.filter(score => score.studentId === demoUserId);
                
                // Fix: Explicitly type `a` and `b` as strings in the sort function to resolve the `localeCompare` error on the `unknown` type.
                const allSessions = [...new Set(studentScores.map(s => s.session))].sort((a: string, b: string) => b.localeCompare(a));
                const allTerms = ['First Term', 'Second Term', 'Third Term'];
                setSessions(allSessions);
                setTerms(allTerms);

                if (allSessions.length > 0) {
                    setSelectedSession(settings.session || allSessions[0]);
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
    
    // Effect to expand the most recent term by default
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
            // Note: This uses the student's current class for historical calculations, which is a limitation of the current data model.
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
      ? getReportCardTemplate(student.class)
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
                    <div className="md:col-span-1">
                         <label className="label">Term</label>
                         <select className="input-field" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                            <option value="">All Terms</option>
                            {terms.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {filteredTerms.length > 0 ? filteredTerms.map(termKey => {
                    const summary = termSummaries[termKey];
                    const isExpanded = expandedTermKey === termKey;
                    return (
                        <div key={termKey} className="card overflow-hidden transition-all duration-300">
                            <button
                                onClick={() => setExpandedTermKey(isExpanded ? null : termKey)}
                                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 focus:outline-none"
                                aria-expanded={isExpanded}
                            >
                                <div>
                                    <h2 className="text-lg font-semibold">{termKey}</h2>
                                    {summary && (
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                                            <span>Avg: <strong>{summary.average}%</strong></span>
                                            <span>Position: <strong>{summary.position} of {summary.totalStudentsInClass}</strong></span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2 md:space-x-4">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleViewReport(termKey); }}
                                        className="btn btn-secondary text-sm py-1.5 px-3"
                                    >
                                        View Report
                                    </button>
                                    <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="table-container border-t">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th className="th">Subject</th>
                                                <th className="th text-center">Total Score</th>
                                                <th className="th">Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allResults[termKey].map((res, index) => (
                                                <tr key={index}>
                                                    <td className="td font-medium">
                                                        <div className="truncate max-w-xs md:max-w-sm" title={res.subjectName}>{res.subjectName}</div>
                                                    </td>
                                                    <td className="td text-center">{res.total}</td>
                                                    <td className="td">{res.remark}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <div className="card mt-6 p-6 text-center">No results found for the selected filter.</div>
                )}
            </div>

            {selectedTermData && student && (
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Report Card for ${selectedTermData.term}`} size="full">
                    <div className="bg-gray-100 p-4 md:p-8 flex flex-col items-center">
                        <div className="printable-content bg-white shadow-lg">
                           {ReportCardComponent && <ReportCardComponent
                                student={student}
                                students={allData.students}
                                scores={allData.scores}
                                subjects={allData.subjects}
                                settings={allData.settings}
                                term={selectedTermData.term}
                                session={selectedTermData.session}
                                remarks={allData.remarks}
                                attendance={allData.attendance}
                            />}
                        </div>
                        <div className="no-print mt-8">
                             <button onClick={() => window.print()} className="btn btn-primary">
                                <PrinterIcon className="w-5 h-5 mr-2" />
                                Print Report
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default StudentResults;
