

import React, { useState, useEffect, useMemo } from 'react';
import { useAI } from '../hooks/useAI';
import { generateResponse as aiGenerateResponse } from '../services/geminiAIService';
// FIX: Corrected import path for api services.
import { apiGetSubjects, apiGetStudents } from '../services/api';
// FIX: Corrected import path for types.
import { Student, Subject } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
// Fix: Corrected the import path for constants to be a relative path.
import { USER_ROLES } from '../utils/constants';

// Define the structure for a quiz item
interface QuizItem {
    question: string;
    options: { [key: string]: string };
    answer: string;
}

const PracticeQuiz = ({ userRole, studentId, initialTopic = '' }: { userRole?: string, studentId?: string, initialTopic?: string }) => {
    // State for inputs
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [topic, setTopic] = useState(initialTopic);
    const [numQuestions, setNumQuestions] = useState(5);

    // State for generation process
    const { generateResponse, status } = useAI();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedQuiz, setGeneratedQuiz] = useState<QuizItem[]>([]);

    // State for UI feedback
    const [copySuccess, setCopySuccess] = useState('');
    const isStudentView = userRole === USER_ROLES.STUDENT;

    useEffect(() => {
        const fetchPrerequisites = async () => {
            try {
                const subs: Subject[] = await apiGetSubjects();
                setSubjects(subs);
                const allClasses = [...new Set(subs.flatMap(s => s.classes))].sort();
                setClasses(allClasses);
                if (!isStudentView && allClasses.length > 0) {
                    setSelectedClass(allClasses[0]);
                }
            } catch (e) {
                console.error("Failed to fetch subjects for quiz generator", e);
                setError("Could not load necessary data. Please refresh.");
            }
        };
        fetchPrerequisites();
    }, [isStudentView]);
    
    useEffect(() => {
        const fetchStudentData = async () => {
            if (studentId && isStudentView) {
                const studentsData = await apiGetStudents();
                const currentStudent = studentsData.find(s => s.id === studentId);
                if (currentStudent) {
                    setSelectedClass(currentStudent.class);
                }
            }
        };
        fetchStudentData();
    }, [studentId, isStudentView]);

    const filteredSubjects = useMemo(() => {
        if (!selectedClass) return [];
        return subjects.filter(s => s.classes.includes(selectedClass));
    }, [selectedClass, subjects]);

    useEffect(() => {
        if (filteredSubjects.length > 0) {
            if (!filteredSubjects.some(s => s.id === selectedSubject)) {
                setSelectedSubject(filteredSubjects[0].id);
            }
        } else {
            setSelectedSubject('');
        }
    }, [selectedClass, filteredSubjects, selectedSubject]);

    const handleGenerate = async () => {
        if (!topic || !selectedClass || !selectedSubject) {
            setError('Please provide a class, subject, and topic.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedQuiz([]);

        const subjectName = subjects.find(s => s.id === selectedSubject)?.name || '';

        const prompt = `
            You are an expert quiz creator for Nigerian secondary schools. Generate a practice quiz based on the following criteria:
            - Subject: "${subjectName}"
            - Class Level: "${selectedClass}"
            - Topic: "${topic}"
            - Number of Questions: ${numQuestions}
            - Question Type: Multiple Choice (4 options labeled A, B, C, D)
            Your task is to generate exactly ${numQuestions} questions. For each question, provide four plausible options and clearly indicate the correct answer's letter.
            Return the response as a single, valid JSON object with a key "quiz" which holds an array of question objects. Do not include any explanatory text, comments, or markdown formatting like \`\`\`json. The entire response must be only the JSON object.
            The JSON schema must be:
            {
              "quiz": [
                {
                  "question": "string",
                  "options": { "A": "string", "B": "string", "C": "string", "D": "string" },
                  "answer": "string"
                }
              ]
            }
        `;

        try {
            const response = await aiGenerateResponse(prompt);

            if (status === 'fallback') {
                setError(String(response)); // Show the fallback message as an error/info
                setIsLoading(false);
                return;
            }

            const jsonString = String(response).match(/\{[\s\S]*\}/)?.[0] || '{}';
            const jsonResponse = JSON.parse(jsonString);
            
            if (jsonResponse.quiz && Array.isArray(jsonResponse.quiz) && jsonResponse.quiz.length > 0) {
                setGeneratedQuiz(jsonResponse.quiz);
            } else {
                throw new Error("AI returned data in an unexpected or empty format.");
            }
        } catch (err) {
            console.error("Failed to generate or parse quiz:", err);
            const msg = (err as any)?.message || String(err);
            setError(`An error occurred while generating the quiz. Please try again. Details: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getQuizAsText = () => {
        if (generatedQuiz.length === 0) return '';
        return generatedQuiz.map((item, index) => {
            const optionsString = Object.entries(item.options).map(([key, value]) => `   ${key}. ${value}`).join('\n');
            return `${index + 1}. ${item.question}\n${optionsString}\n\nAnswer: ${item.answer}`;
        }).join('\n\n');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getQuizAsText()).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            setCopySuccess('Failed!');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        <DocumentTextIcon className="w-6 h-6 mr-3 text-green-500" />
                        <h2 className="text-xl font-semibold">AI Practice Quiz Generator</h2>
                    </div>
                     <div className="flex items-center text-xs text-gray-500">
                         <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                         {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    {isStudentView
                        ? "Instantly create practice quizzes on any topic to help you prepare for exams."
                        : "Instantly create practice quizzes on any topic to help students prepare for exams."
                    }
                </p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">Class</label>
                        <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)} disabled={isStudentView || classes.length === 0}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Subject</label>
                        <select className="input-field" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={filteredSubjects.length === 0}>
                            {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="label">Topic</label>
                        <input type="text" className="input-field" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g., Photosynthesis, Quadratic Equations"/>
                    </div>
                    <div>
                        <label className="label">Number of Questions</label>
                        <input type="number" className="input-field" value={numQuestions} onChange={e => setNumQuestions(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="20" />
                    </div>
                </div>

                <button onClick={handleGenerate} className="btn btn-primary mt-4" disabled={isLoading || !topic}>
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    <span className="ml-2">{isLoading ? 'Generating...' : 'Generate Quiz'}</span>
                </button>

                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

                {generatedQuiz.length > 0 && (
                    <div className="mt-6 border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Generated Quiz</h3>
                            <button onClick={copyToClipboard} className="btn btn-secondary">
                                {copySuccess ? <CheckIcon className="w-5 h-5 text-green-500"/> : <CopyIcon className="w-5 h-5" />}
                                <span className="ml-2">{copySuccess || 'Copy'}</span>
                            </button>
                        </div>
                        <div className="space-y-6 text-sm p-4 bg-gray-50 rounded-lg">
                            {generatedQuiz.map((item, index) => (
                                <div key={index}>
                                    <p className="font-semibold">{index + 1}. {item.question}</p>
                                    <ul className="mt-2 space-y-1 pl-4">
                                        {Object.entries(item.options).map(([key, value]) => (
                                            <li key={key}>{key}. {value}</li>
                                        ))}
                                    </ul>
                                    <p className="mt-2 font-bold text-green-600">Answer: {item.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeQuiz;