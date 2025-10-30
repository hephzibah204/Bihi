
import React, { useState, useMemo, useEffect } from 'react';
import { useAI } from '../hooks/useAI';
import { callGeminiApi } from '../services/geminiService';
import { apiGetStudents, apiGetScores, apiGetSubjects } from '../services/api';
import { Student, Score, Subject } from '../types';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';

interface AtRiskStudent {
    id: string;
    name: string;
    class: string;
    risk_level: 'High' | 'Medium' | 'Low';
    justification: string;
    suggested_action: string;
}

const EarlyIntervention = () => {
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [allScores, setAllScores] = useState<Score[]>([]);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
    const { status } = useAI();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { settings } = useTenant();
    const classNames = useMemo(() => generateClassNames(settings), [settings]);
    const [classFilter, setClassFilter] = useState('all');
    
    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [students, scores, subjects] = await Promise.all([
                    apiGetStudents(), apiGetScores(), apiGetSubjects()
                ]);
                setAllStudents(students);
                setAllScores(scores);
                setAllSubjects(subjects);
            } catch (err) {
                setError("Failed to load school data for analysis.");
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, []);

    const [conversationId] = useState(() => {
        try {
            const existing = localStorage.getItem('early_intervention_conversation_id');
            if (existing) return existing;
            const id = `early-${Date.now()}`;
            localStorage.setItem('early_intervention_conversation_id', id);
            return id;
        } catch { return `early-${Date.now()}`; }
    });

    const handleAnalyze = async () => {
        if (loadingData) return;
        setIsLoading(true);
        setError('');
        setAtRiskStudents([]);

        try {
            const studentsToAnalyze = classFilter === 'all' ? allStudents : allStudents.filter(s => s.class === classFilter);

            const studentPerformanceData = studentsToAnalyze.map(student => {
                const studentScores = allScores.filter(s => s.studentId === student.id);
                const averageScore = studentScores.length > 0
                    ? studentScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0) / studentScores.length
                    : null;

                const failingSubjects = studentScores
                    .filter(s => ((s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0)) < 40)
                    .map(s => allSubjects.find(sub => sub.id === s.subjectId)?.name || 'Unknown')
                    .join(', ');

                return {
                    id: student.id,
                    name: student.name,
                    class: student.class,
                    averageScore: averageScore ? averageScore.toFixed(1) : 'N/A',
                    failingSubjects: failingSubjects || 'None',
                };
            });
            
            const prompt = `You are an expert Nigerian school counselor. Analyze the provided student performance data to identify at-risk students.
Data: ${JSON.stringify(studentPerformanceData)}
Task:
- Identify students at 'High' or 'Medium' risk.
- High: average < 45% OR failing in 3+ core subjects (Math, English).
- Medium: average 45–55% OR failing in 1–2 core subjects.
- For each, include a short 'justification' and a practical 'suggested_action'.
Return ONLY a JSON object matching the schema and no other text.`;

            const expectedSchema = {
                at_risk_students: [
                    { id: 'string', name: 'string', class: 'string', risk_level: 'High|Medium', justification: 'string', suggested_action: 'string' }
                ]
            };

            const result = await callGeminiApi(prompt, {
                conversationId,
                responseMimeType: 'application/json',
                expectedSchema
            });
            const clean = String(result).trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
            const jsonResponse = JSON.parse(clean);
            
            if (jsonResponse.at_risk_students && Array.isArray(jsonResponse.at_risk_students)) {
                setAtRiskStudents(jsonResponse.at_risk_students);
            } else {
                // If no at-risk students are found, the AI might return an empty array or object.
                // This is a valid response, so we don't throw an error.
                setAtRiskStudents([]);
            }

        } catch (err) {
            const msg = (err as any)?.message || String(err);
            setError(`AI Analysis Error: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <ShieldExclamationIcon className="w-6 h-6 mr-3 text-red-500" />
                        <h2 className="text-xl font-semibold">AI Early Intervention Assistant</h2>
                    </div>
                     <div className="flex items-center text-xs text-gray-500">
                         <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                         {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>
                 <p className="mt-2 text-sm text-gray-500">
                    Automatically identify students who may be at academic risk based on their performance data.
                </p>

                <div className="mt-4 flex items-center gap-4">
                     <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field max-w-xs">
                        <option value="all">All Classes</option>
                        {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                     <button onClick={handleAnalyze} className="btn btn-primary" disabled={isLoading || loadingData}>
                        {isLoading || loadingData ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                        <span className="ml-2">{isLoading ? 'Analyzing...' : loadingData ? 'Loading Data...' : 'Find At-Risk Students'}</span>
                    </button>
                </div>

                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
                
                <div className="mt-6 border-t pt-4">
                    <h3 className="font-semibold">Analysis Results</h3>
                    {isLoading ? <div className="text-center p-4"><SpinnerIcon className="w-6 h-6 animate-spin"/></div> :
                    atRiskStudents.length > 0 ? (
                        <div className="table-container mt-2">
                             <table className="table">
                                <thead><tr><th className="th">Student</th><th className="th">Class</th><th className="th">Risk</th><th className="th">Justification</th><th className="th">Suggested Action</th></tr></thead>
                                <tbody>
                                    {atRiskStudents.map(student => (
                                        <tr key={student.id}>
                                            <td className="td font-bold">{student.name}</td>
                                            <td className="td">{student.class}</td>
                                            <td className="td">{student.risk_level === 'High' ? <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">High</span> : <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Medium</span>}</td>
                                            <td className="td text-sm">{student.justification}</td>
                                            <td className="td text-sm">{student.suggested_action}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                         <div className="text-center text-gray-500 py-6">
                            <p>{!error && 'No students identified as at-risk based on the current data, or analysis has not been run.'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EarlyIntervention;
