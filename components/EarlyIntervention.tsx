import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetScores, apiGetBehavioralRecords, apiGetSubjects, apiGetSchoolSettings, apiGetAssignments, apiGetAssignmentScores, apiGetAttendance } from '../services/api';
import { generateText } from '../services/geminiService';
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
            // 1. Fetch all necessary data for the selected class
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
                    if (!acc[record.studentId]) {
                        acc[record.studentId] = [];
                    }
                    acc[record.studentId].push(record);
                }
                return acc;
            }, {});

            // 2. Prepare data for the AI prompt
            const studentProfiles = students.map(student => {
                const studentScores = scores.filter(s => s.studentId === student.id && s.session === settings.session && s.term === settings.term);
                const studentBehavior = behaviorByStudent[student.id] || [];
                
                const assignmentsForClass = allAssignments.filter(a => a.class === selectedClass);
                const submittedAssignmentScores = allAssignmentScores.filter(s => s.studentId === student.id && assignmentsForClass.some(a => a.id === s.assignmentId));
                const assignmentSummary = `${submittedAssignmentScores.length} of ${assignmentsForClass.length} assignments submitted.`;

                let absentCount = 0;
                let lateCount = 0;
                allAttendance.forEach(record => {
                    const status = record.statuses?.[student.id];
                    if (status === 'absent') absentCount++;
                    else if (status === 'late') lateCount++;
                });
                const attendanceSummary = `Absent: ${absentCount} days, Late: ${lateCount} days this term.`;

                return {
                    name: student.name,
                    scores: studentScores.length > 0 ? studentScores.map(s => {
                        const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
                        return `${subjectMap.get(s.subjectId) || 'Unknown Subject'}: ${total}%`;
                    }) : ["No scores recorded this term."],
                    behavior: studentBehavior.length > 0 ? studentBehavior.map(b => `${b.type}: ${b.remark}`) : ["No behavioral notes."],
                    assignment_performance: assignmentSummary,
                    attendance_record: attendanceSummary,
                };
            });

            // 3. Create and send the prompt
            const prompt = `
                You are an expert educational psychologist working in a Nigerian secondary school. Your task is to identify students who are at risk of falling behind based on the provided data for the current term.

                **Context:**
                - **Class:** "${selectedClass}"
                - **Current Term:** "${settings.term}, ${settings.session} Session"
                - **Passing Mark:** 40%

                **Student Data:**
                ${JSON.stringify(studentProfiles, null, 2)}

                **Your Task:**
                1.  Analyze each student's profile holistically. Identify students who are "at-risk" based on a combination of these critical indicators:
                    - **Academic Performance:** Failing (scoring below 40) in two or more subjects.
                    - **Assignment Completion:** Missing a significant number of assignments (e.g., 3 or more if total assignments are high).
                    - **Attendance Issues:** A pattern of absenteeism or lateness (e.g., more than 5 days absent).
                    - **Behavioral Patterns:** A series of negative behavioral remarks that could impact learning.
                2.  For each "at-risk" student you identify, provide a brief, data-driven reason for your concern (mentioning the specific data points like missed assignments or low scores) and suggest 2-3 concrete, actionable intervention strategies.
                3.  Return your findings as a single, valid JSON object with a key "intervention_insights", which holds an array of student insight objects. Do not include any text outside the JSON object.
                4.  If NO students meet the at-risk criteria, return a JSON object with the "intervention_insights" key pointing to an empty array.

                The JSON schema must be:
                {
                  "intervention_insights": [
                    {
                      "student_name": "string",
                      "reason_for_concern": "string",
                      "suggested_interventions": ["string", "string"]
                    }
                  ]
                }
            `;
            
            const response = await generateText(prompt);
            const jsonString = response.match(/\{[\s\S]*\}/)?.[0] || '{}';
            const jsonResponse = JSON.parse(jsonString);

            if (jsonResponse.intervention_insights && Array.isArray(jsonResponse.intervention_insights)) {
                if (jsonResponse.intervention_insights.length === 0) {
                    setNoStudentsFlagged(true);
                } else {
                    setInsights(jsonResponse.intervention_insights);
                }
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
                <div className="flex items-center">
                    <UserGroupIcon className="w-6 h-6 mr-3 text-red-500" />
                    <h2 className="text-xl font-semibold">AI Early Intervention Insights</h2>
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
