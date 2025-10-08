
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetSchoolSettings, apiUpsertRemark, apiGetRemarks, apiGetScores, apiGetBehavioralRecords } from '../services/api';
import { Student, Subject, Remark, SchoolSettings, Score, BehavioralLogEntry } from '../types';
import { debounce } from 'lodash';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';

const GeneralRemarks = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [behavioralRecords, setBehavioralRecords] = useState<BehavioralLogEntry[]>([]);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [generatingForStudentId, setGeneratingForStudentId] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [subjectsData, settingsData, allScores, allBehavioral] = await Promise.all([
                    apiGetSubjects(),
                    apiGetSchoolSettings(),
                    apiGetScores(),
                    apiGetBehavioralRecords(),
                ]);
                setSubjects(subjectsData);
                setScores(allScores);
                setBehavioralRecords(allBehavioral);
                // Fix: Specify the generic type for `new Set` as `<string>` to ensure `allClasses` is correctly typed as `string[]`.
                const allClasses = [...new Set<string>(subjectsData.flatMap(s => s.classes))].sort();
                setClasses(allClasses);
                setSettings(settingsData);
                if (allClasses.length > 0) {
                    setSelectedClass(allClasses[0]);
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.error("Failed to fetch initial data for remarks:", e);
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedClass) return;
        const fetchClassData = async () => {
            setLoading(true);
            const [classStudents, allRemarks] = await Promise.all([
                apiGetStudents({ classFilter: selectedClass }),
                apiGetRemarks()
            ]);
            setStudents(classStudents);
            setRemarks(allRemarks);
            setLoading(false);
        };
        fetchClassData();
    }, [selectedClass]);

    const remarksMap = useMemo(() => {
        if (!settings) return {};
        return remarks.reduce((acc, remark) => {
            if (remark.session === settings.session && remark.term === settings.term) {
                acc[remark.studentId] = remark;
            }
            return acc;
        }, {} as Record<string, Remark>);
    }, [remarks, settings]);

    const debouncedSave = useCallback(
        debounce((remarkData: Partial<Remark>) => {
            apiUpsertRemark(remarkData);
        }, 500),
        []
    );

    const handleRemarkChange = (studentId: string, value: string) => {
        if (!settings) return;

        const existingRemark = remarks.find(r => r.studentId === studentId && r.session === settings.session && r.term === settings.term);
        const newRemarkData: Partial<Remark> = {
            id: existingRemark?.id,
            studentId,
            session: settings.session,
            term: settings.term,
            generalComment: value,
        };

        const updatedRemark = { ...existingRemark, ...newRemarkData, id: existingRemark?.id || `rem_${Date.now()}` } as Remark;
        
        setRemarks(prev => {
            const otherRemarks = prev.filter(r => r.id !== updatedRemark.id);
            return [...otherRemarks, updatedRemark];
        });
        
        debouncedSave(newRemarkData);
    };

    const handleGenerateComment = async (student: Student) => {
        if (!settings) return;
        setGeneratingForStudentId(student.id);

        try {
            const studentScores = scores.filter(s => s.studentId === student.id && s.session === settings.session && s.term === settings.term);
            const studentBehavior = behavioralRecords.filter(b => b.studentId === student.id);

            const scoresSummary = studentScores.map(score => {
                const subject = subjects.find(s => s.id === score.subjectId);
                const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                const gradeInfo = settings.gradingSystem.find(g => total >= g.from && total <= g.to);
                return `- ${subject?.name || 'Unknown Subject'}: ${total} (${gradeInfo?.grade || 'N/A'})`;
            }).join('\n');
            
            const behavioralNotes = studentBehavior.length > 0
                ? studentBehavior.map(b => `- ${b.remark} (${b.type})`).join('\n')
                : "No behavioral notes recorded.";

            const gradingScale = settings.gradingSystem.map(g => `${g.grade}: ${g.from}-${g.to} (${g.remark})`).join(', ');

            const prompt = `
                You are an expert Nigerian teacher writing a general comment for a student's end-of-term report card.
                Based on the data provided below, write a comprehensive, balanced, and encouraging comment (2-3 sentences).
                Incorporate Nigerian English phrasing where appropriate to sound natural (e.g., "is doing well", "needs to put in more effort", "has shown great improvement").

                **Student Data:**
                - **Name:** ${student.name}
                - **Class:** ${student.class}

                **Academic Performance this Term:**
                ${scoresSummary || "No scores recorded for this term."}

                **Behavioral Notes:**
                ${behavioralNotes}

                **Grading Scale for Reference:**
                ${gradingScale}

                **Your Task:**
                Synthesize this information into a thoughtful general comment. Highlight strengths, identify areas for improvement constructively, and end with an encouraging remark.
            `;
            
            const comment = await generateText(prompt);
            handleRemarkChange(student.id, comment);

        } catch (error) {
            console.error("AI comment generation failed:", error);
            alert(`Error generating comment: ${error.message}`);
        } finally {
            setGeneratingForStudentId(null);
        }
    };

    if (loading && !students.length) return <div className="card p-6 text-center">Loading...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">General Remarks for Report Cards</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Enter general comments for each student for the current term ({settings?.term}, {settings?.session} session).
                </p>
                 <div className="my-6">
                    <label htmlFor="class-select" className="label">Select Class</label>
                    <select id="class-select" className="input-field max-w-sm" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th sticky left-0 bg-slate-100 z-10">Student Name</th>
                                <th className="th">General Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={2} className="td text-center">Loading students...</td></tr>
                            ) : students.length > 0 ? (
                                students.map((student, index) => {
                                    const isEvenRow = index % 2 === 1;
                                    return (
                                    <tr key={student.id} className="group">
                                        <td className={`td font-medium sticky left-0 z-10 ${isEvenRow ? 'bg-slate-100' : 'bg-white'} group-hover:bg-indigo-50`}>{student.name}</td>
                                        <td className="td">
                                            <div className="flex items-center gap-2">
                                                <textarea
                                                    className="input-field w-full"
                                                    value={remarksMap[student.id]?.generalComment || ''}
                                                    onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                                                    placeholder="Enter comment or generate with AI..."
                                                    rows={2}
                                                />
                                                <button 
                                                    onClick={() => handleGenerateComment(student)}
                                                    className="btn btn-secondary p-2"
                                                    disabled={generatingForStudentId === student.id}
                                                    title="Generate with AI"
                                                >
                                                    {generatingForStudentId === student.id 
                                                        ? <SpinnerIcon className="w-5 h-5 animate-spin" />
                                                        : <SparklesIcon className="w-5 h-5" />
                                                    }
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={2} className="td text-center">No students in this class.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 <p className="text-xs text-gray-500 mt-2 text-center">Your changes are saved automatically.</p>
            </div>
        </div>
    );
};

export default GeneralRemarks;