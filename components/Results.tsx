import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetScores, apiUpsertScore, apiGetSchoolSettings } from '../services/api';
import { Score, Student, Subject } from '../types';

const PAGE_SIZE = 50;

const Results = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [settings, setSettings] = useState(null);
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

    useEffect(() => {
        const fetchStudentsAndScores = async () => {
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
                    const fetchedScores = await apiGetScores({ studentIds, subjectId: selectedSubject });
                    setScores(fetchedScores);
                } else {
                    setScores([]);
                }
            } catch (err) {
                setError('Failed to load students or scores.');
            } finally {
                setLoading(false);
            }
        };

        fetchStudentsAndScores();
    }, [selectedClass, selectedSubject]);

    const currentScoresMap = useMemo(() => {
        return scores.reduce((acc, score) => {
            acc[score.studentId] = score;
            return acc;
        }, {} as Record<string, Score>);
    }, [scores]);

    const maxCa1 = settings?.maxCa1 ?? 20;
    const maxCa2 = settings?.maxCa2 ?? 20;
    const maxExam = settings?.maxExam ?? 60;

    const handleScoreChange = useCallback((studentId: string, field: 'ca1' | 'ca2' | 'exam', value: string) => {
        const maxScores = { ca1: maxCa1, ca2: maxCa2, exam: maxExam };
        const max = maxScores[field];
        let numericValue = value === '' ? undefined : Number(value);

        // Clamp the value to be within the valid range
        if (numericValue !== undefined) {
            if (numericValue > max) {
                numericValue = max;
            } else if (numericValue < 0) {
                numericValue = 0;
            }
        }
        
        const existingScore = scores.find(s => s.studentId === studentId);
        const newScoreData = {
            ...(existingScore || {}),
            studentId,
            subjectId: selectedSubject,
            [field]: numericValue,
        };
        
        // Optimistic UI update
        setScores(prevScores => {
            const otherScores = prevScores.filter(s => s.studentId !== studentId);
            return [...otherScores, newScoreData as Score];
        });
        
        // Debounced save to API
        apiUpsertScore(newScoreData);

    }, [selectedSubject, scores, maxCa1, maxCa2, maxExam]);
    
    const filteredSubjects = subjects.filter(s => s.classes.includes(selectedClass));

    return (
        <div>
            <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                    <label htmlFor="class-select" className="label">Select Class</label>
                    <select id="class-select" className="input-field" value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSubject(''); }}>
                        <option value="">-- Select a Class --</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="subject-select" className="label">Select Subject</label>
                    <select id="subject-select" className="input-field" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedClass}>
                        <option value="">-- Select a Subject --</option>
                        {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
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
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={5} className="td text-center">Loading...</td></tr>
                        ) : !selectedClass || !selectedSubject ? (
                             <tr><td colSpan={5} className="td text-center">Please select a class and subject to begin.</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={5} className="td text-center">No students found for this class.</td></tr>
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
                                        <td className="td"><input type="number" min="0" max={maxCa1} className="input-style-sm w-full" value={score.ca1 ?? ''} onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)} aria-label={`CA 1 score for ${student.name}`} /></td>
                                        <td className="td"><input type="number" min="0" max={maxCa2} className="input-style-sm w-full" value={score.ca2 ?? ''} onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)} aria-label={`CA 2 score for ${student.name}`} /></td>
                                        <td className="td"><input type="number" min="0" max={maxExam} className="input-style-sm w-full" value={score.exam ?? ''} onChange={e => handleScoreChange(student.id, 'exam', e.target.value)} aria-label={`Exam score for ${student.name}`} /></td>
                                        <td className="td text-center font-semibold text-gray-700">{total}</td>
                                    </tr>
                                );
                            })}
                             {visibleCount < students.length && (
                                <tr ref={loaderRef}>
                                    <td colSpan={5} className="text-center p-4 text-gray-500">
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
        </div>
    );
};

export default Results;