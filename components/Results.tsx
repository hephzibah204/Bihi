
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetScores, apiUpsertScore, apiGetSchoolSettings } from '../services/api';
import { Score, Student, Subject } from '../types';
import { debounce } from 'lodash';
import BulkScoreImportModal from './BulkScoreImportModal';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import { exportToCSV } from '../utils/csvExporter';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';

const PAGE_SIZE = 50;

const Results = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [settings, setSettings] = useState<any>(null);
    const [selectedClass, setSelectedClass] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('reportsheet_results_filters') || '{}').selectedClass || '' } catch { return '' }
    });
    const [selectedSubject, setSelectedSubject] = useState(() => {
        try { return JSON.parse(sessionStorage.getItem('reportsheet_results_filters') || '{}').selectedSubject || '' } catch { return '' }
    });
    const [students, setStudents] = useState<Student[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [generatingForStudentId, setGeneratingForStudentId] = useState<string | null>(null);

    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);

    useEffect(() => {
        try {
            sessionStorage.setItem('reportsheet_results_filters', JSON.stringify({ selectedClass, selectedSubject }));
        } catch (e) {
            console.error("Failed to save results filters", e);
        }
    }, [selectedClass, selectedSubject]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setVisibleCount(prev => Math.min(prev + PAGE_SIZE, students.length));
            }
        }, { threshold: 1 });
        const currentLoader = loaderRef.current;
        if (currentLoader) observer.observe(currentLoader);
        return () => { if (currentLoader) observer.unobserve(currentLoader); };
    }, [loaderRef, students.length]);

    const visibleStudents = students.slice(0, visibleCount);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const [allSubjects, schoolSettings]: [Subject[], any] = await Promise.all([
                apiGetSubjects(),
                apiGetSchoolSettings()
            ]);
            setSubjects(allSubjects);
            setSettings(schoolSettings);
            const allClasses = [...new Set(allSubjects.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            if (allClasses.length > 0 && !selectedClass) {
                setSelectedClass(allClasses[0]);
            }
        } catch (err) {
            setError('Failed to load classes and subjects.');
        } finally {
            setLoading(false);
        }
    }, [selectedClass]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const fetchStudentsAndScores = useCallback(async () => {
        if (!selectedClass) {
            setStudents([]);
            setScores([]);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const fetchedStudents = await apiGetStudents({ classFilter: selectedClass });
            setStudents(fetchedStudents);
            setVisibleCount(PAGE_SIZE);

            if (selectedSubject && fetchedStudents.length > 0) {
                const studentIds = fetchedStudents.map(s => s.id);
                const fetchedScores = await apiGetScores({ studentIds, subjectId: selectedSubject, session: settings?.session, term: settings?.term });
                setScores(fetchedScores);
            } else {
                setScores([]);
            }
        } catch (err) {
            setError('Failed to load students or scores.');
        } finally {
            setLoading(false);
        }
    }, [selectedClass, selectedSubject, settings]);

    useEffect(() => {
        fetchStudentsAndScores();
    }, [fetchStudentsAndScores]);

    const currentScoresMap = useMemo(() => {
        return scores.reduce((acc, score) => {
            if (score.studentId) acc[score.studentId] = score;
            return acc;
        }, {} as Record<string, Score>);
    }, [scores]);

    const maxCa1 = settings?.maxCa1 ?? 20;
    const maxCa2 = settings?.maxCa2 ?? 20;
    const maxExam = settings?.maxExam ?? 60;

    const debouncedSave = useCallback(
        debounce((scoreData: Partial<Score>) => {
            apiUpsertScore({...scoreData, session: settings.session, term: settings.term });
        }, 500),
        [settings]
    );

    const handleScoreChange = useCallback((studentId: string, field: 'ca1' | 'ca2' | 'exam', value: string) => {
        const maxScores = { ca1: maxCa1, ca2: maxCa2, exam: maxExam };
        const max = maxScores[field];
        let numericValue = value === '' ? undefined : Number(value);

        if (numericValue !== undefined) {
            if (numericValue > max) numericValue = max;
            else if (numericValue < 0) numericValue = 0;
        }
        
        const existingScore = scores.find(s => s.studentId === studentId);
        const newScoreData = {
            id: existingScore?.id,
            studentId,
            subjectId: selectedSubject,
            session: settings.session,
            term: settings.term,
            ca1: existingScore?.ca1,
            ca2: existingScore?.ca2,
            exam: existingScore?.exam,
            comment: existingScore?.comment,
            [field]: numericValue,
        };
        
        setScores(prevScores => {
            const index = prevScores.findIndex(s => s.studentId === studentId);
            if (index > -1) {
                const newScores = [...prevScores];
                newScores[index] = { ...newScores[index], [field]: numericValue };
                return newScores;
            }
            return [...prevScores, newScoreData as Score];
        });
        
        debouncedSave(newScoreData);
    }, [selectedSubject, scores, maxCa1, maxCa2, maxExam, debouncedSave, settings]);

    const handleCommentChange = useCallback((studentId: string, value: string) => {
        const existingScore = scores.find(s => s.studentId === studentId);
        const newScoreData: Partial<Score> = {
            id: existingScore?.id,
            studentId,
            subjectId: selectedSubject,
            session: settings.session,
            term: settings.term,
            comment: value,
        };
        
        setScores(prevScores => {
            const index = prevScores.findIndex(s => s.studentId === studentId);
            if (index > -1) {
                const newScores = [...prevScores];
                newScores[index] = { ...newScores[index], comment: value };
                return newScores;
            }
            return [...prevScores, {...existingScore, ...newScoreData, id: existingScore?.id || `score_${Date.now()}`} as Score];
        });
        
        debouncedSave(newScoreData);
    }, [selectedSubject, scores, debouncedSave, settings]);
    
    const handleGenerateComment = async (student: Student) => {
        if (!settings) return;
        setGeneratingForStudentId(student.id);

        try {
            // Fix: Explicitly type `score` as Partial<Score> to inform TypeScript of its potential shape, preventing errors when accessing properties on a potentially empty object.
            const score: Partial<Score> = currentScoresMap[student.id] || {};
            const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
            const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'this subject';

            const prompt = `
                You are a Nigerian teacher writing a subject-specific comment for a student's report card.
                Based on the scores provided, write a brief (1-2 sentences), constructive comment.

                **Student & Subject Data:**
                - Student Name: ${student.name}
                - Subject: ${subjectName}
                - Scores this Term:
                  - CA1: ${score.ca1 ?? 'N/A'} / ${maxCa1}
                  - CA2: ${score.ca2 ?? 'N/A'} / ${maxCa2}
                  - Exam: ${score.exam ?? 'N/A'} / ${maxExam}
                  - **Total:** ${total} / 100

                **Your Task:**
                Comment on the student's performance in this subject. Mention if they are strong, improving, or need to focus more.
            `;
            
            const comment = await generateText(prompt);
            handleCommentChange(student.id, comment);

        } catch (error) {
            alert(`Error generating comment: ${error.message}`);
        } finally {
            setGeneratingForStudentId(null);
        }
    };

    const handleExport = () => {
        const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'subject';
        const dataToExport = students.map(student => {
            // Fix: Explicitly type `score` as Partial<Score> to ensure properties can be safely accessed even if the student has no score record yet.
            const score: Partial<Score> = currentScoresMap[student.id] || {};
            const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
            return {
                student_name: student.name,
                admission_no: student.admissionNo,
                ca1: score.ca1 ?? '',
                ca2: score.ca2 ?? '',
                exam: score.exam ?? '',
                total,
                comment: score.comment ?? ''
            };
        });
        exportToCSV(dataToExport, `scores_${selectedClass}_${subjectName}.csv`);
    };

    const filteredSubjects = subjects.filter(s => s.classes.includes(selectedClass));

    return (
        <div>
            <div className="my-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="md:col-span-1">
                    <label htmlFor="class-select" className="label">Select Class</label>
                    <select id="class-select" className="input-field" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); }}>
                        <option value="">-- Select a Class --</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label htmlFor="subject-select" className="label">Select Subject</label>
                    <select id="subject-select" className="input-field" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedClass}>
                        <option value="">-- Select a Subject --</option>
                        {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                 <div className="md:col-span-2 flex gap-2">
                    <button onClick={handleExport} className="btn btn-secondary w-full" disabled={!selectedClass || !selectedSubject || students.length === 0}>
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        Export Scores
                    </button>
                    <button onClick={() => setImportModalOpen(true)} className="btn btn-secondary w-full" disabled={!selectedClass || !selectedSubject}>
                        <ArrowUpTrayIcon className="w-5 h-5 mr-2"/>
                        Import Scores
                    </button>
                </div>
            </div>

            {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th scope="col" className="th">Student Name</th>
                            <th scope="col" className="th text-center">CA 1 ({maxCa1})</th>
                            <th scope="col" className="th text-center">CA 2 ({maxCa2})</th>
                            <th scope="col" className="th text-center">Exam ({maxExam})</th>
                            <th scope="col" className="th text-center">Total (100)</th>
                            <th scope="col" className="th w-1/4">Comment</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={6} className="td text-center">Loading...</td></tr>
                        ) : !selectedClass || !selectedSubject ? (
                             <tr><td colSpan={6} className="td text-center">Please select a class and subject to begin.</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={6} className="td text-center">No students found for this class.</td></tr>
                        ) : (
                            <>
                            {visibleStudents.map(student => {
                                const score: Partial<Score> = currentScoresMap[student.id] || {};
                                const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                                return (
                                    <tr key={student.id}>
                                        <td className="td font-medium text-gray-900">
                                            <div className="truncate max-w-xs" title={student.name}>{student.name}</div>
                                        </td>
                                        <td className="td"><input type="number" min="0" max={maxCa1} className="input-field p-1 text-sm text-center w-full" value={score.ca1 ?? ''} onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)} aria-label={`CA 1 score for ${student.name}`} /></td>
                                        <td className="td"><input type="number" min="0" max={maxCa2} className="input-field p-1 text-sm text-center w-full" value={score.ca2 ?? ''} onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)} aria-label={`CA 2 score for ${student.name}`} /></td>
                                        <td className="td"><input type="number" min="0" max={maxExam} className="input-field p-1 text-sm text-center w-full" value={score.exam ?? ''} onChange={e => handleScoreChange(student.id, 'exam', e.target.value)} aria-label={`Exam score for ${student.name}`} /></td>
                                        <td className="td text-center font-semibold text-gray-700">{total}</td>
                                        <td className="td">
                                            <div className="flex items-center gap-1">
                                                <input 
                                                    type="text"
                                                    className="input-field p-1 text-sm w-full"
                                                    value={score.comment ?? ''} 
                                                    onChange={e => handleCommentChange(student.id, e.target.value)}
                                                    aria-label={`Comment for ${student.name}`}
                                                    placeholder="Optional comment..."
                                                />
                                                <button 
                                                    onClick={() => handleGenerateComment(student)}
                                                    className="btn btn-secondary p-1"
                                                    disabled={generatingForStudentId === student.id}
                                                    title="Generate with AI"
                                                >
                                                     {generatingForStudentId === student.id 
                                                        ? <SpinnerIcon className="w-4 h-4 animate-spin" />
                                                        : <SparklesIcon className="w-4 h-4" />
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                             {visibleCount < students.length && (
                                <tr ref={loaderRef}>
                                    <td colSpan={6} className="text-center p-4 text-gray-500">
                                        Loading more...
                                    </td>
                                </tr>
                            )}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Your changes are saved automatically.</p>
            
            {isImportModalOpen && (
                <BulkScoreImportModal 
                    isOpen={isImportModalOpen}
                    onClose={() => setImportModalOpen(false)}
                    onSuccess={() => { setImportModalOpen(false); fetchStudentsAndScores(); }}
                    selectedClass={selectedClass}
                    selectedSubjectId={selectedSubject}
                    settings={settings}
                />
            )}
        </div>
    );
};

export default Results;