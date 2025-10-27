import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, Subject, Score, SchoolSettings } from '../types';
import { apiGetStudents, apiGetSubjects, apiGetScores, apiGetSchoolSettings, apiUpsertScore, apiBatchUpsertScores } from '../services/api';
import { debounce } from 'lodash';
import ScoreEntryModal from './ScoreEntryModal';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import BulkScoreImportModal from './BulkScoreImportModal';
import SparklesIcon from './icons/SparklesIcon';
import { generateResponse as aiGenerateResponse } from '../services/geminiAIService';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';
// FIX: Added missing import for SpinnerIcon.
import SpinnerIcon from './icons/SpinnerIcon';

const Results = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [settings, setSettings] = useState<Partial<SchoolSettings>>({});
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    
    // For single student editing modal
    const [editingStudentIndex, setEditingStudentIndex] = useState<number | null>(null);

    // For bulk import modal
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    
    // For AI Comment Generation
    const [isGenerating, setIsGenerating] = useState(false);

    const { settings: tenantSettings } = useTenant();
    const classNames = useMemo(() => generateClassNames(tenantSettings), [tenantSettings]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [studentsData, subjectsData, scoresData, settingsData] = await Promise.all([
                apiGetStudents(), apiGetSubjects(), apiGetScores(), apiGetSchoolSettings()
            ]);
            setStudents(studentsData);
            setSubjects(subjectsData);
            setScores(scoresData);
            setSettings(settingsData || {});
            if (classNames.length > 0 && !selectedClass) setSelectedClass(classNames[0]);
        } catch(e) {
            console.error("Failed to load data for results entry", e);
        } finally {
            setLoading(false);
        }
    }, [classNames, selectedClass]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Preselect class from dashboard drill-down
    useEffect(() => {
        try {
            const preClass = localStorage.getItem('results_preselect_class');
            if (preClass && classNames.includes(preClass)) {
                setSelectedClass(preClass);
                localStorage.removeItem('results_preselect_class');
            }
        } catch { /* noop */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classNames.length]);

    const filteredSubjects = useMemo(() => {
        if (!selectedClass) return [];
        return subjects.filter(s => s.classes.includes(selectedClass));
    }, [subjects, selectedClass]);

    useEffect(() => {
        if (filteredSubjects.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(filteredSubjects[0].id);
        }
    }, [filteredSubjects, selectedSubjectId]);

    // Preselect subject from dashboard drill-down
    useEffect(() => {
        try {
            const preSubjectId = localStorage.getItem('results_preselect_subject_id');
            if (preSubjectId && filteredSubjects.some(s => s.id === preSubjectId)) {
                setSelectedSubjectId(preSubjectId);
                localStorage.removeItem('results_preselect_subject_id');
            }
        } catch { /* noop */ }
    }, [filteredSubjects]);

    const studentsInClass = useMemo(() => {
        return students.filter(s => s.class === selectedClass);
    }, [students, selectedClass]);

    const debouncedSave = useCallback(debounce((studentId: string, field: keyof Score, value: string | number) => {
        const existingScore = scores.find(s => s.studentId === studentId && s.subjectId === selectedSubjectId && s.session === settings.session && s.term === settings.term);
        const scoreData = {
            ...(existingScore || { studentId, subjectId: selectedSubjectId, session: settings.session, term: settings.term }),
            [field]: value
        };
        apiUpsertScore(scoreData);
    }, 500), [scores, selectedSubjectId, settings]);
    
    const handleScoreChange = (studentId: string, field: keyof Score, value: string | number) => {
        setScores(prevScores => {
            const index = prevScores.findIndex(s => s.studentId === studentId && s.subjectId === selectedSubjectId && s.session === settings.session && s.term === settings.term);
            if (index !== -1) {
                const newScores = [...prevScores];
                newScores[index] = { ...newScores[index], [field]: value };
                return newScores;
            } else {
                return [...prevScores, { studentId, subjectId: selectedSubjectId, session: settings.session, term: settings.term, [field]: value } as Score];
            }
        });
        debouncedSave(studentId, field, value);
    };

    const handleGenerateAllComments = async () => {
        if (!window.confirm("This will use AI to generate and overwrite comments for all students in this view. Continue?")) return;
        setIsGenerating(true);
        
        try {
            const scoresToUpdate: Partial<Score>[] = [];
            for (const student of studentsInClass) {
                // FIX: Explicitly type `score` as Partial<Score> to avoid type errors on properties like `ca1`.
                const score: Partial<Score> = scores.find(s => s.studentId === student.id && s.subjectId === selectedSubjectId && s.session === settings.session && s.term === settings.term) || {};
                const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                
                const prompt = `Generate a short, insightful report card comment (1 sentence) for a student's performance in a subject. Use simple HTML for emphasis (e.g., <strong>).
- Student: ${student.name}
- Subject: ${subjects.find(s=>s.id === selectedSubjectId)?.name}
- Performance: Scored ${total}/100.
Comment on their strength or a key area for improvement based on this score.`;
                
                const comment = await aiGenerateResponse(prompt);
                
                const scoreData = {
                    ...score,
                    studentId: student.id,
                    subjectId: selectedSubjectId,
                    session: settings.session,
                    term: settings.term,
                    comment: String(comment).trim(),
                };
                scoresToUpdate.push(scoreData);
            }
            
            await apiBatchUpsertScores(scoresToUpdate);
            fetchData();

        } catch (error) {
            alert(`AI Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex gap-4 w-full md:w-auto">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field">
                        {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="input-field">
                        {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => setImportModalOpen(true)} className="btn btn-secondary flex-1"><ArrowUpTrayIcon className="w-5 h-5 mr-2"/> Import</button>
                    <button onClick={handleGenerateAllComments} className="btn btn-secondary flex-1" disabled={isGenerating}>
                        {isGenerating ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <SparklesIcon className="w-5 h-5"/>}
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Student Name</th>
                            <th className="th text-center">CA 1 ({settings.maxCa1})</th>
                            <th className="th text-center">CA 2 ({settings.maxCa2})</th>
                            <th className="th text-center">Exam ({settings.maxExam})</th>
                            <th className="th text-center">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsInClass.map((student, index) => {
                            // FIX: Explicitly type `score` as Partial<Score> to avoid type errors on properties like `ca1`.
                            const score: Partial<Score> = scores.find(s => s.studentId === student.id && s.subjectId === selectedSubjectId && s.session === settings.session && s.term === settings.term) || {};
                            const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                            return (
                                <tr key={student.id} onClick={() => setEditingStudentIndex(index)} className="cursor-pointer hover:bg-gray-50">
                                    <td className="td">{student.name}</td>
                                    <td className="td text-center">{score.ca1 ?? '-'}</td>
                                    <td className="td text-center">{score.ca2 ?? '-'}</td>
                                    <td className="td text-center">{score.exam ?? '-'}</td>
                                    <td className="td text-center font-bold">{total}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isImportModalOpen && <BulkScoreImportModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onSuccess={fetchData} selectedClass={selectedClass} selectedSubjectId={selectedSubjectId} settings={settings} />}
            
            {editingStudentIndex !== null && (
                <ScoreEntryModal
                    isOpen={editingStudentIndex !== null}
                    onClose={() => setEditingStudentIndex(null)}
                    onSave={handleScoreChange}
                    onNavigate={(dir) => setEditingStudentIndex(prev => (prev == null ? prev : (dir === 'next' ? prev + 1 : prev - 1)))}
                    student={studentsInClass[editingStudentIndex]}
                    score={scores.find(s => s.studentId === studentsInClass[editingStudentIndex].id && s.subjectId === selectedSubjectId && s.session === settings.session && s.term === settings.term) || {}}
                    settings={settings}
                    isFirst={editingStudentIndex === 0}
                    isLast={editingStudentIndex === studentsInClass.length - 1}
                />
            )}
        </div>
    );
};

export default Results;