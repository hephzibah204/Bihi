
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetScores, apiGetSchoolSettings, apiGetRemarks, apiGetAttendance } from '../services/api';
import { Student, Subject, Score, Remark, AttendanceRecord, SchoolSettings } from '../types';
import BulkReportCardPrintView from './BulkReportCardPrintView';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PrinterIcon from './icons/PrinterIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import TableSkeleton from './skeletons/TableSkeleton';

interface ReportCardDashboardProps {
    onBack: () => void;
}

const ReportCardDashboard: React.FC<ReportCardDashboardProps> = ({ onBack }) => {
    const [allData, setAllData] = useState<{
        allStudents: Student[];
        subjects: Subject[];
        scores: Score[];
        remarks: Remark[];
        attendance: AttendanceRecord[];
        settings: SchoolSettings | null;
    }>({ allStudents: [], subjects: [], scores: [], remarks: [], attendance: [], settings: null });
    
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [selectedTerm, setSelectedTerm] = useState<string>('');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [printAction, setPrintAction] = useState<'print' | 'download' | null>(null);
    const [templateKey, setTemplateKey] = useState<'auto' | 'classic' | 'modern' | 'minimalist'>('auto');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [students, subjects, scores, remarks, attendance, settings] = await Promise.all([
                apiGetStudents(), apiGetSubjects(), apiGetScores(), apiGetRemarks(), apiGetAttendance(), apiGetSchoolSettings()
            ]);
            setAllData({ allStudents: students, subjects, scores, remarks, attendance, settings });
            // Class fallback: prefer subjects; if none, derive from students
            const subjectClasses = [...new Set<string>(subjects.flatMap(s => s.classes || []))].sort();
            const studentClasses = [...new Set<string>(students.map(s => s.class).filter(Boolean))].sort();
            const allClasses = subjectClasses.length ? subjectClasses : studentClasses;
            if (allClasses.length > 0) {
                setSelectedClass(allClasses[0]);
            }
            // Robust session/term initialization using available data, with settings fallback
            const availableSess = [...new Set<string>(scores.map(s => s.session).filter(Boolean))].sort();
            const availableTrm = [...new Set<string>(scores.map(s => s.term).filter(Boolean))].sort();
            const initialSession = settings?.session && availableSess.includes(settings.session)
                ? settings.session
                : (availableSess[0] || settings?.session || '');
            const initialTerm = settings?.term && availableTrm.includes(settings.term)
                ? settings.term
                : (availableTrm[0] || settings?.term || '');
            setSelectedSession(initialSession || '');
            setSelectedTerm(initialTerm || '');
        } catch (e) {
            console.error("Failed to load data for report card generation", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const studentsInClass = useMemo(() => {
        return allData.allStudents.filter(s => s.class === selectedClass);
    }, [selectedClass, allData.allStudents]);

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(studentId)) {
                newSet.delete(studentId);
            } else {
                newSet.add(studentId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudents(new Set(studentsInClass.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };

    // Build selectable sessions/terms from available scores
    const availableSessions = useMemo(() => (
        [...new Set(allData.scores.map(s => s.session))].filter(Boolean)
    ), [allData.scores]);
    const availableTerms = useMemo(() => (
        [...new Set(allData.scores.map(s => s.term))].filter(Boolean)
    ), [allData.scores]);

    if (printAction) {
        return (
            <BulkReportCardPrintView
                studentIds={Array.from(selectedStudents)}
                allData={allData}
                onClose={() => setPrintAction(null)}
                action={printAction}
                templateKey={templateKey}
                sessionOverride={selectedSession}
                termOverride={selectedTerm}
            />
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="btn btn-secondary">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to Hub
                </button>
                <h1 className="text-2xl font-semibold">Generate Report Cards</h1>
            </div>

            <div className="card">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="label">Select Class</label>
                            <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field">
                                {allData.subjects && [...new Set<string>(allData.subjects.flatMap(s => s.classes))].sort().map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Session</label>
                            <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="input-field">
                                {availableSessions.length ? availableSessions.map(s => <option key={s} value={s}>{s}</option>) : (
                                    allData.settings?.session ? <option value={allData.settings.session}>{allData.settings.session}</option> : null
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="label">Term</label>
                            <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="input-field">
                                {availableTerms.length ? availableTerms.map(t => <option key={t} value={t}>{t}</option>) : (
                                    allData.settings?.term ? <option value={allData.settings.term}>{allData.settings.term}</option> : null
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="label">Report Card Template</label>
                            <select value={templateKey} onChange={e => setTemplateKey(e.target.value as any)} className="input-field">
                                <option value="auto">Auto (by class/settings)</option>
                                <option value="classic">Classic</option>
                                <option value="modern">Modern</option>
                                <option value="minimalist">Minimalist</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setPrintAction('print')} disabled={selectedStudents.size === 0} className="btn btn-secondary flex-1">
                                <PrinterIcon className="w-5 h-5 mr-2" /> Print ({selectedStudents.size})
                            </button>
                            <button onClick={() => setPrintAction('download')} disabled={selectedStudents.size === 0} className="btn btn-primary flex-1">
                                <ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Download ({selectedStudents.size})
                            </button>
                        </div>
                    </div>

                    {loading ? <TableSkeleton rows={5} cols={1} hasCheckbox /> : (
                         <div className="table-container mt-6">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th className="th w-12"><input type="checkbox" onChange={handleSelectAll} checked={selectedStudents.size === studentsInClass.length && studentsInClass.length > 0} /></th>
                                        <th className="th">Student Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsInClass.map(student => (
                                        <tr key={student.id}>
                                            <td className="td"><input type="checkbox" checked={selectedStudents.has(student.id)} onChange={() => handleSelectStudent(student.id)} /></td>
                                            <td className="td font-medium">{student.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportCardDashboard;
