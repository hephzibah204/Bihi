import React, { useState, useEffect, useMemo } from 'react';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getFallbackLessonPlan } from '../services/fallbackAiService';
import { apiGetSubjects } from '../services/api';
import { Subject } from '../types';

const LessonPlanner = () => {
    const [topic, setTopic] = useState('');
    const [lessonPlan, setLessonPlan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // New state for filters and data
    const [classes, setClasses] = useState<string[]>([]);
    const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('First Term');
    const [selectedCurriculum, setSelectedCurriculum] = useState('NERDC');

    // New state for AI suggestions
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionError, setSuggestionError] = useState('');

    const isOnline = useOnlineStatus();

    // Fetch classes and subjects on mount
    useEffect(() => {
        const fetchPrerequisites = async () => {
            try {
                const subjectsData = await apiGetSubjects();
                setAllSubjects(subjectsData);
                const allClasses = [...new Set(subjectsData.flatMap(s => s.classes))].sort();
                setClasses(allClasses);
                if (allClasses.length > 0) {
                    setSelectedClass(allClasses[0]);
                }
            } catch (error) {
                console.error("Failed to fetch subjects for lesson planner:", error);
            }
        };
        fetchPrerequisites();
    }, []);

    // Memoize filtered subjects for performance
    const filteredSubjects = useMemo(() => {
        if (!selectedClass) return [];
        return allSubjects.filter(s => s.classes.includes(selectedClass));
    }, [selectedClass, allSubjects]);

    // Update selected subject when class changes
    useEffect(() => {
        if (filteredSubjects.length > 0) {
            // Check if the previously selected subject is still valid
            if (!filteredSubjects.some(s => s.id === selectedSubject)) {
                setSelectedSubject(filteredSubjects[0].id);
            }
        } else {
            setSelectedSubject('');
        }
    }, [selectedClass, filteredSubjects, selectedSubject]);

    // Fetch AI topic suggestions when filters change
    useEffect(() => {
        if (!selectedClass || !selectedSubject || !isOnline) {
            setSuggestedTopics([]);
            return;
        }

        const generateSuggestions = async () => {
            setIsSuggesting(true);
            setSuggestionError('');
            setSuggestedTopics([]);
            try {
                const subjectName = allSubjects.find(s => s.id === selectedSubject)?.name;
                if (!subjectName) return;

                const prompt = `Suggest 5 relevant lesson topics for a Nigerian school. Class: "${selectedClass}", Subject: "${subjectName}", Term: "${selectedTerm}", Curriculum: "${selectedCurriculum}". Return the response as a valid JSON object with a single key "topics" which is an array of strings. For example: {"topics": ["Topic 1", "Topic 2"]}`;
                const response = await generateText(prompt);
                const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
                const jsonResponse = JSON.parse(cleanedResponse);
                setSuggestedTopics(jsonResponse.topics || []);
            } catch (error) {
                console.error("Failed to generate topic suggestions:", error);
                setSuggestionError('Could not get suggestions.');
            } finally {
                setIsSuggesting(false);
            }
        };

        const debounceTimer = setTimeout(generateSuggestions, 500);
        return () => clearTimeout(debounceTimer);
    }, [selectedClass, selectedSubject, selectedTerm, selectedCurriculum, isOnline, allSubjects]);


    const handleGenerate = async () => {
        if (!topic || !selectedClass || !selectedSubject) return;
        setIsLoading(true);
        setLessonPlan('');
        try {
            let plan;
            const subjectName = allSubjects.find(s => s.id === selectedSubject)?.name;
            const prompt = `Generate a detailed lesson plan for a Nigerian secondary school class. Topic: "${topic}". Class: "${selectedClass}". Subject: "${subjectName}". Term: "${selectedTerm}". Curriculum: "${selectedCurriculum}". Include: 1. Learning Objectives (3-4 points). 2. 21st Century Skills (Identify and list 2-3 relevant skills like Critical Thinking, Collaboration, etc.). 3. Materials Needed. 4. A detailed 5-step lesson procedure (Introduction, Presentation, Practice, Evaluation, Conclusion). 5. Evaluation Method with sample questions. 6. A relevant take-home assignment. Format the response neatly.`;
            
            if (isOnline) {
                plan = await generateText(prompt);
            } else {
                plan = getFallbackLessonPlan(topic);
            }
            setLessonPlan(plan);
        } catch (error) {
            console.error("Failed to generate lesson plan:", error);
            setLessonPlan("Sorry, I couldn't generate a lesson plan. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">AI Lesson Planner</h2>
                <p className="mt-2 text-sm text-gray-500">
                    Select your class criteria to get topic suggestions, then enter a topic to quickly generate a structured lesson plan.
                </p>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="label">Class</label>
                        <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="label">Subject</label>
                        <select className="input-field" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={filteredSubjects.length === 0}>
                             {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="label">Term</label>
                        <select className="input-field" value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)}>
                            <option>First Term</option>
                            <option>Second Term</option>
                            <option>Third Term</option>
                        </select>
                    </div>
                     <div>
                        <label className="label">Curriculum</label>
                        <select className="input-field" value={selectedCurriculum} onChange={e => setSelectedCurriculum(e.target.value)}>
                            <option>NERDC</option>
                            <option>British</option>
                            <option>American</option>
                        </select>
                    </div>
                </div>

                {isOnline && (
                    <div className="mt-4">
                        <label className="label flex items-center">
                             <SparklesIcon className="w-5 h-5 mr-2 text-indigo-500" />
                            AI Topic Suggestions
                        </label>
                        <div className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md min-h-[40px] flex flex-wrap gap-2 items-center">
                            {isSuggesting && <SpinnerIcon className="w-5 h-5 animate-spin text-indigo-500" />}
                            {suggestionError && <p className="text-xs text-red-500">{suggestionError}</p>}
                            {!isSuggesting && suggestedTopics.length === 0 && !suggestionError && <p className="text-xs text-gray-400">Select class and subject to see suggestions.</p>}
                            {suggestedTopics.map((suggestion, index) => (
                                <button key={index} onClick={() => setTopic(suggestion)} className="text-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 px-3 py-1 rounded-full hover:bg-indigo-200">
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                    <input
                        type="text"
                        className="input-field"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Enter topic or select a suggestion"
                    />
                    <button onClick={handleGenerate} className="btn btn-primary" disabled={isLoading || !topic || !selectedClass || !selectedSubject}>
                         {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                        <span className="ml-2 hidden sm:inline">{isLoading ? 'Generating...' : 'Generate'}</span>
                    </button>
                </div>
                 {lessonPlan && (
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <h4 className="font-semibold text-sm">Generated Lesson Plan:</h4>
                        <pre className="mt-1 text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans text-sm">{lessonPlan}</pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonPlanner;
