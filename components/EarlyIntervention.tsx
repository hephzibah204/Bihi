import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetScores, apiGetBehavioralRecords, apiGetSubjects, apiGetSchoolSettings, apiGetAssignments, apiGetAssignmentScores, apiGetAttendance } from '../services/api';
import { useAI } from '../hooks/useAI';
import { Student, Score, Subject, BehavioralLogEntry, SchoolSettings, Assignment, AssignmentScore } from '../types';
import UserGroupIcon from './icons/UserGroupIcon';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface Insight {
    student_name: string;
    reason_for_concern: string;
    suggested_interventions: string[];
}

const EarlyIntervention = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const { generateResponse, status } = useAI();
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [noStudentsFlagged, setNoStudentsFlagged] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const subjects: Subject[] = await apiGetSubjects();
                const allClasses = [...new Set(subjects.flatMap(s => s.classes))].sort();
                setClasses(allClasses);
                if (allClasses.length > 0) {
                    setSelectedClass(allClasses[0]);
                }
            } catch (e) {
                setError("Failed to load class data.");
            }
        };
        fetchClasses();
    }, []);

    const handleRunAnalysis = async () => {
        if (!selectedClass) {
            setError('Please select a class to analyze.');
            return;
        }
        setIsLoading(true);
        setError('');
        setInsights([]);
        setNoStudentsFlagged(false);

        try {
            const students: Student[] = await apiGetStudents({ classFilter: selectedClass });
            if (students.length === 0) {
                setNoStudentsFlagged(true);
                setIsLoading(false);
                return;
            }
            const studentIds = students.map(s => s.id);

            const [scores, allBehavioralRecords, settings, subjects, allAssignments, allAssignmentScores, allAttendance]: [Score[], BehavioralLogEntry[], SchoolSettings, Subject[], Assignment[], AssignmentScore[], any[]] = await Promise.all([
                apiGetScores({ studentIds }),
                apiGetBehavioralRecords(),
                apiGetSchoolSettings(),
                apiGetSubjects(),
                apiGetAssignments(),
                apiGetAssignmentScores(),
                apiGetAttendance(),
            ]);
            
            const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
            const behaviorByStudent = allBehavioralRecords.reduce((acc, record) => {
                if(studentIds.includes(record.studentId)) {
                    if (!acc[record.studentId]) acc[record.studentId] = [];
                    acc[record.studentId].push(record);
                }
                return acc;
            }, {});

            const studentProfiles = students.map(student => {
                const studentScores = scores.filter(s => s.studentId === student.id && s.session === settings.session && s.term === settings.term);
                const studentBehavior = behaviorByStudent[student.id] || [];
                const assignmentsForClass = allAssignments.filter(a => a.class === selectedClass);
                const submittedAssignmentScores = allAssignmentScores.filter(s => s.studentId === student.id && assignmentsForClass.some(a => a.id === s.assignmentId));
                const assignmentSummary = `${submittedAssignmentScores.length} of ${assignmentsForClass.length} assignments submitted.`;
                let absentCount = 0; let lateCount = 0;
                allAttendance.forEach(record => {
                    const status = record.statuses?.[student.id];
                    if (status === 'absent') absentCount++; else if (status === 'late') lateCount++;
                });
                const attendanceSummary = `Absent: ${absentCount} days, Late: ${lateCount} days this term.`;

                return {
                    name: student.name,
                    scores: studentScores.length > 0 ? studentScores.map(s => { const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0); return `${subjectMap.get(s.subjectId) || 'Unknown'}: ${total}%`; }) : ["No scores recorded."],
                    behavior: studentBehavior.length > 0 ? studentBehavior.map(b => `${b.type}: ${b.remark}`) : ["No behavioral notes."],
                    assignment_performance: assignmentSummary,
                    attendance_record: attendanceSummary,
                };
            });

            const prompt = `
                You are an expert educational psychologist in a Nigerian school identifying at-risk students.
                Context: Class "${selectedClass}", Term "${settings.term}, ${settings.session}", Passing Mark: 40%.
                Student Data: ${JSON.stringify(studentProfiles, null, 2)}
                Task: Analyze each student. Identify those at risk due to: failing (below 40%) in >=2 subjects, missing many assignments, high absenteeism, or negative behavioral patterns.
                For each at-risk student, provide a data-driven reason and 2-3 intervention strategies.
                Return a single JSON object: { "intervention_insights": [{ "student_name": "string", "reason_for_concern": "string", "suggested_interventions": ["string"] }] }.
                If no students are at-risk, return an empty array for "intervention_insights".
            `;
            
            const response = await generateResponse({ prompt });

            if (status === 'fallback') {
                setError(response);
                setIsLoading(false);
                return;
            }

            const jsonString = response.match(/\{[\s\S]*\}/)?.[0] || '{}';
            const jsonResponse = JSON.parse(jsonString);

            if (jsonResponse.intervention_insights && Array.isArray(jsonResponse.intervention_insights)) {
                if (jsonResponse.intervention_insights.length === 0) setNoStudentsFlagged(true);
                else setInsights(jsonResponse.intervention_insights);
            } else {
                throw new Error("AI returned data in an unexpected format.");
            }

        } catch (err) {
            setError(`An error occurred during analysis: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <UserGroupIcon className="w-6 h-6 mr-3 text-red-500" />
                        <h2 className="text-xl font-semibold">AI Early Intervention Insights</h2>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                         <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                         {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Automatically identify students who may be falling behind and get actionable suggestions.
                </p>

                <div className="mt-4 flex items-end gap-4">
                    <div>
                        <label className="label">Select Class</label>
                        <select
                            className="input-field"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            disabled={classes.length === 0 || isLoading}
                        >
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button onClick={handleRunAnalysis} className="btn btn-primary" disabled={isLoading || !selectedClass}>
                        {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                        <span className="ml-2">{isLoading ? 'Analyzing...' : 'Run Analysis'}</span>
                    </button>
                </div>

                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

                <div className="mt-6 border-t pt-6 min-h-[100px]">
                    {isLoading && <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" /><p className="ml-3 text-gray-500">AI is analyzing student data...</p></div>}
                    {!isLoading && insights.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Students Flagged for Intervention:</h3>
                            {insights.map((insight, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                                    <h4 className="font-bold text-yellow-800">{insight.student_name}</h4>
                                    <p className="text-sm text-yellow-700 mt-1"><strong>Reason:</strong> {insight.reason_for_concern}</p>
                                    <div className="mt-2 text-sm text-yellow-700">
                                        <strong>Suggestions:</strong>
                                        <ul className="list-disc list-inside space-y-1 mt-1">
                                            {insight.suggested_interventions.map((s, i) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!isLoading && noStudentsFlagged && (
                        <div className="text-center p-4">
                            <p className="font-semibold text-green-600">Great news! All students in {selectedClass} appear to be on track based on the available data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EarlyIntervention;
