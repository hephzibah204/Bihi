import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudents, apiGetScores, apiGetSubjects } from '../services/api';
import { useAI } from '../hooks/useAI';
import { Student, Score, Subject } from '../types';
import GraduationCapIcon from './icons/GraduationCapIcon';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { USER_ROLES } from '../utils/constants';

interface SubjectRecommenderProps {
    studentId?: string; // If provided, hides the selector
    userRole?: string;
}

const SubjectRecommender: React.FC<SubjectRecommenderProps> = ({ studentId, userRole }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [interests, setInterests] = useState<string>('');
    const [recommendations, setRecommendations] = useState<string>('');
    const { generateResponse, status } = useAI();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const isStudentView = userRole === USER_ROLES.STUDENT;

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (studentId) {
                    setSelectedStudentId(studentId);
                    const [allStudents, subjectsData] = await Promise.all([apiGetStudents(), apiGetSubjects()]);
                    setStudents(allStudents);
                    setSubjects(subjectsData);
                } else {
                    const [studentsData, subjectsData] = await Promise.all([
                        apiGetStudents(),
                        apiGetSubjects(),
                    ]);
                    setStudents(studentsData);
                    setSubjects(subjectsData);
                    if (studentsData.length > 0) {
                        setSelectedStudentId(studentsData[0].id);
                    }
                }
            } catch (err) {
                setError('Failed to load initial data.');
            }
        };
        fetchData();
    }, [studentId]);
    
    const student = useMemo(() => students.find(s => s.id === selectedStudentId), [students, selectedStudentId]);

    const handleGenerate = async () => {
        if (!selectedStudentId) {
            setError('Please select a student.');
            return;
        }
        setIsLoading(true);
        setError('');
        setRecommendations('');

        try {
            if (!student) throw new Error("Selected student not found.");

            const studentScores: Score[] = await apiGetScores({ studentIds: [selectedStudentId] });

            const performanceSummary = studentScores.map(score => {
                const subject = subjects.find(s => s.id === score.subjectId);
                const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                return `${subject?.name || 'Unknown Subject'}: ${total}%`;
            }).join(', ');

            const prompt = `
                As an expert Nigerian academic and career counselor, analyze the following student profile to suggest subjects they might excel in.
                **Student Profile:**
                - **Name:** ${student.name}
                - **Class:** ${student.class}
                - **Stated Interests:** "${interests || 'Not specified'}"
                - **Recent Academic Performance:** ${performanceSummary || 'No scores available.'}
                **Your Task:**
                Based *only* on the performance data and interests provided, suggest 3 subjects this student is likely to excel in. For each subject, provide a 1-2 sentence justification connecting your suggestion to their strengths (high scores) or interests. If performance is generally low, focus on subjects related to their interests where they might find more motivation.
                Format the output as a simple list. For example:
                1.  **Subject Name:** Justification text here.
            `;

            const result = await generateResponse({ prompt });
            setRecommendations(result);

        } catch (err) {
            setError(`Failed to generate recommendations: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <GraduationCapIcon className="w-6 h-6 mr-3 text-blue-500" />
                        <h2 className="text-xl font-semibold">AI Subject Recommender</h2>
                    </div>
                     <div className="flex items-center text-xs text-gray-500">
                         <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                         {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    {isStudentView
                        ? "Get AI-powered suggestions for subjects you might excel in based on your scores and interests."
                        : "Get AI-powered suggestions for subjects a student might excel in based on their scores and interests."
                    }
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!studentId && (
                        <div>
                            <label className="label">Select Student</label>
                            <select
                                className="input-field"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                disabled={students.length === 0}
                            >
                                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                            </select>
                        </div>
                    )}
                     <div className={!studentId ? '' : 'md:col-span-2'}>
                        <label className="label">{isStudentView ? 'Your Interests' : "Student's Interests"} (Optional)</label>
                        <input
                            type="text"
                            className="input-field"
                            value={interests}
                            onChange={(e) => setInterests(e.target.value)}
                            placeholder="e.g., drawing, computers, debates"
                        />
                    </div>
                </div>
                 <button onClick={handleGenerate} className="btn btn-primary mt-4" disabled={isLoading || !selectedStudentId}>
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    <span className="ml-2">{isLoading ? 'Analyzing...' : 'Get Recommendations'}</span>
                </button>
                 
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

                {recommendations && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <h4 className="font-semibold text-sm">Suggested Subjects for {isStudentView ? 'You' : student?.name || 'the Student'}:</h4>
                        <pre className="mt-1 text-gray-800 whitespace-pre-wrap font-sans text-sm">{recommendations}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubjectRecommender;
