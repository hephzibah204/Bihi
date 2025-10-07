
import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudents, apiGetSubjects } from '../services/api';
import { generateText } from '../services/geminiService';
import { Student, Subject } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import BeakerIcon from './icons/BeakerIcon';

interface LearningPathwaysProps {
    studentId?: string; // Optional: If provided, component is in "student mode"
}

const LearningPathways: React.FC<LearningPathwaysProps> = ({ studentId }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [topic, setTopic] = useState<string>('');
    const [learningStyle, setLearningStyle] = useState<string>('Balanced');
    const [generatedPathway, setGeneratedPathway] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
            // Fix: Cast `selectedStudent` to `Student` to resolve type error. The component logic ensures this is safe, as this branch is only taken when `studentId` is not provided, meaning `selectedStudent` is a full `Student` object.
            const studentInfo = studentId 
                ? 'the student' 
                : `a student named ${(selectedStudent as Student)?.name || 'a student'} in ${selectedStudent?.class || 'their class'}`;

            const prompt = `
                As an expert Nigerian educator, create a personalized learning pathway for ${studentInfo}.
                The goal is to help them master a specific topic. The plan should be encouraging, clear, and broken into actionable steps.

                **Student & Topic Details:**
                - **Topic to Master:** "${topic}"
                - **Preferred Learning Style:** "${learningStyle}"

                **Your Task:**
                Generate a step-by-step learning pathway with 3 to 5 distinct steps. For each step, provide:
                1. A clear title for the step.
                2. A brief, simple explanation of the goal for that step.
                3. A practical activity the student can do to complete the step.

                Make the language accessible and motivating for a secondary school student.
                Format the response clearly with headings for each step.
            `;

            const result = await generateText(prompt);
            setGeneratedPathway(result);
        } catch (err) {
            setError(`Failed to generate learning pathway: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex items-center">
                    <BeakerIcon className="w-6 h-6 mr-3 text-purple-500" />
                    <h2 className="text-xl font-semibold">AI Learning Pathways</h2>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Generate a personalized step-by-step plan for a student to master any topic.
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
                        <pre className="mt-1 text-gray-800 whitespace-pre-wrap font-sans text-sm">{generatedPathway}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningPathways;