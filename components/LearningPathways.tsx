import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetSubjects } from '../services/api';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';

const LearningPathways = () => {
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [topic, setTopic] = useState('');
    const [pathway, setPathway] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const [studentData, subjectData] = await Promise.all([apiGetStudents(), apiGetSubjects()]);
            setStudents(studentData);
            setSubjects(subjectData);
        };
        fetchData();
    }, []);

    const handleGenerate = async () => {
        if (!selectedStudentId || !topic) return;
        setLoading(true);
        setPathway('');
        setError('');

        const student = students.find(s => s.id === selectedStudentId);
        const prompt = `Create a personalized, step-by-step learning pathway for a student struggling with a topic.
        
        Student: ${student.name}
        Class: ${student.class}
        Topic: ${topic}

        The pathway should include:
        1. Foundational concepts to review.
        2. Key areas of the main topic to focus on.
        3. Simple practice exercises.
        4. A small project or activity to solidify understanding.
        
        Keep the tone encouraging and clear.`;

        const result = await generateText(prompt);
        if (result.startsWith("Sorry,")) {
            setError(result);
        } else {
            setPathway(result);
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">AI Learning Pathways Generator</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                    <select className="input-field" value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                        <option value="">-- Select Student --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter topic (e.g., Algebra)" className="input-field"/>
                </div>
                <button onClick={handleGenerate} disabled={loading} className="btn btn-primary"><SparklesIcon className="w-5 h-5 mr-2" />Generate Pathway</button>
                
                {error && <div className="mt-4 text-red-500">{error}</div>}

                {pathway && !error && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="font-semibold">Generated Pathway</h3>
                        <p className="prose dark:prose-invert whitespace-pre-wrap mt-2">{pathway}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningPathways;