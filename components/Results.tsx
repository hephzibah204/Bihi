
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { apiGetStudentsForClasses, apiGetSubjects } from '../services/api';
import useSyncedLocalStorage from '../hooks/useSyncedLocalStorage';
import { Score, Student, Subject } from '../types';

const PAGE_SIZE = 50;

const Results = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [allScores, setAllScores] = useSyncedLocalStorage<Score[]>('scores', []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // State for virtualization/infinite scroll
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);
    
    // Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, students.length));
            }
        }, { threshold: 1 });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loaderRef, students.length]);

    const visibleStudents = students.slice(0, visibleCount);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const allSubjects = await apiGetSubjects();
            setSubjects(allSubjects);
            const allClasses = [...new Set(allSubjects.flatMap(s => s.classes))];
            setClasses(allClasses.sort());
            if (allClasses.length > 0 && !selectedClass) {
                setSelectedClass(allClasses[0]);
            }
        } catch (err) {
            setError('Failed to load classes and subjects.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedClass]);

    const fetchStudentsForClass = useCallback(async () => {
        if (!selectedClass) {
            setStudents([]);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const fetchedStudents = await apiGetStudentsForClasses([selectedClass]);
            setStudents(fetchedStudents);
        } catch (err) {
            setError('Failed to load students. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedClass]);


    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        fetchStudentsForClass();
        setVisibleCount(PAGE_SIZE);
    }, [fetchStudentsForClass]);
    
    const currentScoresMap = useMemo(() => {
        if (!selectedSubject) return {};
        
        return allScores
            .filter(score => score.subjectId === selectedSubject)
            .reduce((acc, score) => {
                acc[score.studentId] = score;
                return acc;
            }, {} as Record<string, Score>);

    }, [allScores, selectedSubject]);

    const handleScoreChange = useCallback((studentId: string, field: 'ca1' | 'ca2' | 'exam', value: string) => {
        const numericValue = value === '' ? undefined : Number(value);
        
        setAllScores(prevAllScores => {
            const newScores = [...prevAllScores];
            const scoreIndex = newScores.findIndex(s => s.studentId === studentId && s.subjectId === selectedSubject);

            if (scoreIndex !== -1) {
                const updatedScore = { ...newScores[scoreIndex], [field]: numericValue };
                // If all scores are undefined, remove the score entry to keep data clean
                if (updatedScore.ca1 === undefined && updatedScore.ca2 === undefined && updatedScore.exam === undefined) {
                    newScores.splice(scoreIndex, 1);
                } else {
                    newScores[scoreIndex] = updatedScore;
                }
            } else {
                if (numericValue !== undefined) {
                    const newScore: Score = {
                        studentId,
                        subjectId: selectedSubject,
                        term: 'First Term', // TODO: Get from settings
                        session: '2023/2024', // TODO: Get from settings
                        ca1: undefined,
                        ca2: undefined,
                        exam: undefined,
                        [field]: numericValue,
                    };
                    newScores.push(newScore);
                }
            }
            return newScores;
        });
    }, [selectedSubject, setAllScores]);
    
    const filteredSubjects = subjects.filter(s => s.classes.includes(selectedClass));

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Enter Student Scores</h1>
            
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

            {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800">{error}</div>}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Student Name</th>
                            <th className="th text-center">CA 1 (20)</th>
                            <th className="th text-center">CA 2 (20)</th>
                            <th className="th text-center">Exam (60)</th>
                            <th className="th text-center">Total (100)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={5} className="td text-center">Loading...</td></tr>
                        ) : !selectedClass || !selectedSubject ? (
                             <tr><td colSpan={5} className="td text-center">Please select a class and subject to begin.</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={5} className="td text-center">No students found for this class.</td></tr>
                        ) : (
                            <>
                            {visibleStudents.map(student => {
                                const score = currentScoresMap[student.id] || {};
                                const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                                return (
                                    <tr key={student.id}>
                                        <td className="td font-medium text-gray-900 dark:text-white">{student.name}</td>
                                        <td className="td"><input type="number" max="20" className="input-style-sm w-full" value={score.ca1 ?? ''} onChange={e => handleScoreChange(student.id, 'ca1', e.target.value)} /></td>
                                        <td className="td"><input type="number" max="20" className="input-style-sm w-full" value={score.ca2 ?? ''} onChange={e => handleScoreChange(student.id, 'ca2', e.target.value)} /></td>
                                        <td className="td"><input type="number" max="60" className="input-style-sm w-full" value={score.exam ?? ''} onChange={e => handleScoreChange(student.id, 'exam', e.target.value)} /></td>
                                        <td className="td text-center font-semibold text-gray-700 dark:text-gray-200">{total}</td>
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
