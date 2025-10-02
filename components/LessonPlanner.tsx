import React, { useState, useEffect } from 'react';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import { apiGetSubjects } from '../services/api';
import { Subject } from '../types';
import Tooltip from './Tooltip';
import { getFallbackLessonPlan } from '../services/fallbackAiService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import WifiSlashIcon from './icons/WifiSlashIcon';

const LessonPlanner = () => {
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState('40');
    const [className, setClassName] = useState('');
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [lessonPlan, setLessonPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const isOnline = useOnlineStatus();
    const [isOfflineResult, setIsOfflineResult] = useState(false);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const subjects: Subject[] = await apiGetSubjects();
                const allClasses = [...new Set(subjects.flatMap(s => s.classes))].sort();
                setAvailableClasses(allClasses);
                if (allClasses.length > 0) {
                    setClassName(allClasses[0]);
                }
            } catch (err) {
                console.error("Failed to fetch classes for lesson planner:", err);
            }
        };
        fetchClasses();
    }, []);

    const handleGenerate = async () => {
        if (!topic || !className) {
            setError("Please select a class and enter a topic.");
            return;
        }
        setLoading(true);
        setError('');
        setLessonPlan('');
        setIsOfflineResult(false);

        const useFallback = () => {
             console.warn("Using offline fallback for lesson plan.");
             const fallbackPlan = getFallbackLessonPlan(topic);
             setLessonPlan(fallbackPlan);
             setIsOfflineResult(true);
        }

        if (!isOnline) {
            useFallback();
            setLoading(false);
            return;
        }

        try {
            const prompt = `
                Create a detailed lesson plan for a Nigerian secondary school class.

                Class: ${className}
                Topic: ${topic}
                Duration: ${duration} minutes

                The lesson plan should include the following sections:
                1.  **Instructional Objectives:** What students should be able to do after the lesson (use behavioral terms).
                2.  **Instructional Materials:** List of materials needed.
                3.  **Instructional Procedure:** A step-by-step guide for the teacher, including introduction, main content delivery, and activities.
                4.  **Evaluation:** Questions or tasks to assess student understanding.
                5.  **Conclusion & Assignment:** How to wrap up the lesson and a relevant homework assignment.

                Format the output clearly with headings for each section.
            `;
            const response = await generateText(prompt);
             if (response.startsWith("Sorry,")) {
                throw new Error(response);
            }
            setLessonPlan(response);
        } catch (err) {
            useFallback();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">AI Lesson Planner</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="label">Class</label>
                        <select
                            className="input-field"
                            value={className}
                            onChange={e => setClassName(e.target.value)}
                        >
                            {availableClasses.length === 0 ? (
                                <option>Loading classes...</option>
                            ) : (
                                availableClasses.map(c => <option key={c} value={c}>{c}</option>)
                            )}
                        </select>
                    </div>
                    <div>
                        <label className="label">Topic</label>
                        <input 
                            type="text" 
                            className="input-field" 
                            value={topic} 
                            onChange={e => setTopic(e.target.value)} 
                            placeholder={className ? `Topic for ${className}` : 'Select a class first'}
                            disabled={!className}
                        />
                    </div>
                    <div>
                        <label className="label">Duration (minutes)</label>
                        <input type="number" className="input-field" value={duration} onChange={e => setDuration(e.target.value)} />
                    </div>
                </div>
                 <div className="mt-4">
                    <Tooltip text="Requires an internet connection for full AI capabilities">
                        <div className="inline-block"> {/* Wrapper for tooltip on disabled element */}
                            <button onClick={handleGenerate} className="btn btn-primary w-full md:w-auto" disabled={loading || !className}>
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                {loading ? 'Generating...' : 'Generate Lesson Plan'}
                            </button>
                        </div>
                    </Tooltip>
                </div>

                {error && <div className="mt-4 text-yellow-600 dark:text-yellow-400 text-sm">{error}</div>}

                {lessonPlan && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-lg font-semibold">Generated Lesson Plan</h3>
                        {isOfflineResult && (
                             <div className="my-2 p-2 bg-yellow-100 text-yellow-800 text-sm rounded-md flex items-center">
                                <WifiSlashIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                                <span>You are offline. Showing a basic template.</span>
                            </div>
                        )}
                        <div className="prose dark:prose-invert max-w-none mt-2 whitespace-pre-wrap">{lessonPlan}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonPlanner;