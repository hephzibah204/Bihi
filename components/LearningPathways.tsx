

import React, { useState, useEffect, useMemo } from 'react';
import { useAI } from '../hooks/useAI';
import { normalizeAIText } from '../utils/aiNormalize';
import { safeHtml } from '../utils/sanitize';
// FIX: Corrected import path for api services.
import { apiGetStudents, apiGetSubjects } from '../services/api';
// FIX: Corrected import path for types.
import { Student, Subject } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import BeakerIcon from './icons/BeakerIcon';
// Fix: Corrected the import path for constants to be a relative path.
import { USER_ROLES } from '../utils/constants';

interface LearningPathwaysProps {
    studentId?: string; // Optional: If provided, component is in "student mode"
    userRole?: string;
    initialTopic?: string;
}

const LearningPathways: React.FC<LearningPathwaysProps> = ({ studentId, userRole, initialTopic = '' }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [topic, setTopic] = useState<string>(initialTopic);
    const [learningStyle, setLearningStyle] = useState<string>('Balanced');
    const [generatedPathway, setGeneratedPathway] = useState<string>('');
    const { status, generateResponse } = useAI();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const isStudentView = userRole === USER_ROLES.STUDENT;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Only fetch all students if in admin/teacher mode
                if (!studentId) {
                    const studentsData = await apiGetStudents();
                    setStudents(studentsData);
                    if (studentsData.length > 0) {
                        setSelectedStudentId(studentsData[0].id);
                    }
                } else {
                    setSelectedStudentId(studentId);
                }
                const subjectsData = await apiGetSubjects();
                setSubjects(subjectsData);
            } catch (err) {
                setError('Failed to load initial data.');
            }
        };
        fetchData();
    }, [studentId]);

    const selectedStudent = useMemo(() => {
        if (!selectedStudentId) return null;
        if (studentId) { // In student mode, we might not have the student list
            return { id: studentId, class: 'your class' }; // Mock object
        }
        return students.find(s => s.id === selectedStudentId);
    }, [selectedStudentId, students, studentId]);

    const handleGenerate = async () => {
        if (!selectedStudentId || !topic) {
            setError('Please select a student and enter a topic.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedPathway('');

        try {
            const studentInfo = studentId 
                ? 'the student' 
                : `a student named ${(selectedStudent as Student)?.name || 'a student'} in ${selectedStudent?.class || 'their class'}`;

            const prompt = `As an expert Nigerian educator, create a personalized learning pathway for ${studentInfo} to master the topic.
Details:
- Topic: "${topic}"
- Preferred Learning Style: "${learningStyle}"

Constraints:
- Return only a single HTML snippet.
- Exactly 3–5 steps, each with: <h3> title, <p> explanation, and a <ul> of 2–3 actionable activities.
- Use <strong> for emphasis where helpful.
- No extra commentary before or after the HTML.`;

            const result = await generateResponse(prompt, undefined, 'learning-pathway', { forceOnlineOnly: true });
            setGeneratedPathway(normalizeAIText(result.content));
        } catch (err) {
            const msg = (err as any)?.message || String(err);
            setError(`Failed to generate learning pathway: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <BeakerIcon className="w-6 h-6 mr-3 text-purple-500" />
                        <h2 className="text-xl font-semibold">AI Learning Pathways</h2>
                    </div>
                     <div className="flex items-center text-xs text-gray-500">
                         <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                         {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    {isStudentView
                        ? "Get a personalized step-by-step plan to master any topic."
                        : "Generate a personalized step-by-step plan for a student to master any topic."
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
                        <label className="label">Topic to Learn</label>
                        <input
                            type="text"
                            className="input-field"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Photosynthesis, Quadratic Equations"
                        />
                    </div>
                     <div>
                        <label className="label">Learning Style (Optional)</label>
                        <select
                            className="input-field"
                            value={learningStyle}
                            onChange={(e) => setLearningStyle(e.target.value)}
                        >
                            <option>Balanced</option>
                            <option>Visual (diagrams, videos)</option>
                            <option>Practical (hands-on examples)</option>
                            <option>Reading/Writing</option>
                        </select>
                    </div>
                </div>
                 <button onClick={handleGenerate} className="btn btn-primary mt-4" disabled={isLoading || !topic}>
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    <span className="ml-2">{isLoading ? 'Generating...' : 'Generate Pathway'}</span>
                </button>
                 
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

                {generatedPathway && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <h4 className="font-semibold text-sm">Your Learning Pathway for "{topic}":</h4>
        <div className="mt-1 text-gray-800 font-sans text-sm prose-content" dangerouslySetInnerHTML={{ __html: safeHtml(generatedPathway) }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningPathways;
