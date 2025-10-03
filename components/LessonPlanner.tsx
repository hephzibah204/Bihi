import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getFallbackLessonPlan } from '../services/fallbackAiService';

const LessonPlanner = () => {
    const [topic, setTopic] = useState('');
    const [lessonPlan, setLessonPlan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isOnline = useOnlineStatus();

    const handleGenerate = async () => {
        if (!topic) return;
        setIsLoading(true);
        setLessonPlan('');
        try {
            let plan;
            const prompt = `Generate a simple lesson plan for a Nigerian secondary school class on the topic: "${topic}". Include: 1. Learning Objectives (2-3 points). 2. Materials Needed. 3. A 5-step lesson procedure (Introduction, Presentation, Practice, etc.). 4. Evaluation Method. 5. A simple take-home assignment.`;
            
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
                    Enter a topic to quickly generate a structured lesson plan.
                </p>
                <div className="mt-4 flex items-center gap-2">
                    <input
                        type="text"
                        className="input-field"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Photosynthesis"
                    />
                    <button onClick={handleGenerate} className="btn btn-primary" disabled={isLoading || !topic}>
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
