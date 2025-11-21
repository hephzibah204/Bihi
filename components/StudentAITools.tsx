import React, { lazy, Suspense, useEffect, useState } from 'react';
import { StudentView } from '../types';
import { STUDENT_VIEWS, USER_ROLES } from '../utils/constants';
import HeadsetIcon from './icons/HeadsetIcon';
import { useAI } from '../hooks/useAI';
import ChatbotPanel from './ChatbotPanel';

const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const LearningPathways = lazy(() => import('./LearningPathways'));
const SubjectRecommender = lazy(() => import('./SubjectRecommender'));
const ELaboratory = lazy(() => import('./ELaboratory'));

interface StudentAIToolsProps {
    setActiveView: (view: StudentView) => void;
    demoUserId?: string | null;
}

const StudentAITools = ({ setActiveView, demoUserId }: StudentAIToolsProps) => {
    const AIToolSkeleton = () => <div className="card p-6 h-48 animate-pulse bg-gray-200"></div>;

    // Resolve the current student id: prefer demoUserId, fallback to activeUser session
    let resolvedStudentId: string | null | undefined = demoUserId;
    if (!resolvedStudentId && typeof window !== 'undefined') {
        try {
            const raw = sessionStorage.getItem('activeUser');
            const active = raw ? JSON.parse(raw) : null;
            resolvedStudentId = active?.userId || null;
        } catch {
            // noop
        }
    }

    // AI status for a subtle availability indicator
    const { status } = useAI();

    // Simple student preferences for AI responses, persisted in localStorage
    const [tone, setTone] = useState<string>('Encouraging');
    const [difficulty, setDifficulty] = useState<string>('Medium');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('sitewide_ai_settings');
            const settings = raw ? JSON.parse(raw) : {};
            const prefs = settings?.studentPreferences || {};
            if (prefs.tone) setTone(prefs.tone);
            if (prefs.difficulty) setDifficulty(prefs.difficulty);
        } catch { /* noop */ }
    }, []);

    const savePreferences = (next: { tone?: string; difficulty?: string }) => {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('sitewide_ai_settings');
            const settings = raw ? JSON.parse(raw) : {};
            const merged = {
                ...settings,
                studentPreferences: {
                    ...(settings?.studentPreferences || {}),
                    tone: next.tone ?? tone,
                    difficulty: next.difficulty ?? difficulty,
                },
            };
            localStorage.setItem('sitewide_ai_settings', JSON.stringify(merged));
        } catch { /* noop */ }
    };

    return (
        <div className="space-y-8">
            {/* Student Assistant under AI Tools */}
            <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">Student Assistant</h2>
                        <p className="text-sm text-gray-600">Chat with your personalized AI helper.</p>
                    </div>
                </div>
                <ChatbotPanel 
                    isOpen={true}
                    onClose={() => {
                      // Log the close action for analytics
                      console.log('Student AI Assistant closed');
                      // Could add analytics tracking here
                      // Could also trigger a save of chat state if needed
                    }}
                    userRole={USER_ROLES.STUDENT}
                    demoUserId={resolvedStudentId ?? undefined}
                    activeView={STUDENT_VIEWS.AI_TOOLS}
                />
            </div>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-semibold">AI Tools</h2>
                    <p className="mt-1 text-gray-600">Your personal AI-powered learning assistants.</p>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                    <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {status === 'gemini' ? 'AI Online' : 'AI Offline'}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <button onClick={() => document.getElementById('practice-quiz')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-secondary w-full">Start a Quiz</button>
                <button onClick={() => document.getElementById('learning-pathways')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-secondary w-full">Explore Pathways</button>
                <button onClick={() => document.getElementById('subject-recommender')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-secondary w-full">Get Subject Advice</button>
                <button onClick={() => setActiveView(STUDENT_VIEWS.AI_TUTOR as StudentView)} className="btn btn-primary w-full">Start Voice Tutor</button>
                <button onClick={() => document.getElementById('e-laboratory')?.scrollIntoView({ behavior: 'smooth' })} className="btn btn-secondary w-full">Open E-Laboratory</button>
            </div>

            {/* Preferences */}
            <div className="card p-4">
                <h3 className="text-lg font-semibold">Preferences</h3>
                <p className="text-sm text-gray-600 mb-3">Adjust AI tone and difficulty to match your style.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label">AI Tone</label>
                        <select className="input-field" value={tone} onChange={(e) => { setTone(e.target.value); savePreferences({ tone: e.target.value }); }}>
                            <option>Encouraging</option>
                            <option>Neutral</option>
                            <option>Direct</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Difficulty</label>
                        <select className="input-field" value={difficulty} onChange={(e) => { setDifficulty(e.target.value); savePreferences({ difficulty: e.target.value }); }}>
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Link to the live tutor */}
            <div className="card p-6 flex flex-col md:flex-row items-center justify-between hover:shadow-lg transition-shadow gap-4 bg-indigo-50 border border-indigo-200">
                <div className="flex items-center gap-4">
                    <div className="text-indigo-500 flex-shrink-0 w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-full">
                        <HeadsetIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Live AI Tutor</h3>
                        <p className="text-gray-500 mt-1">Have a real-time voice conversation about any topic.</p>
                    </div>
                </div>
                <button onClick={() => setActiveView(STUDENT_VIEWS.AI_TUTOR as StudentView)} className="btn btn-primary w-full md:w-auto">
                   Start Session
                </button>
            </div>

            <div id="practice-quiz">
                <Suspense fallback={<AIToolSkeleton />}><PracticeQuiz userRole={USER_ROLES.STUDENT} studentId={resolvedStudentId} /></Suspense>
            </div>
            <div id="learning-pathways">
                <Suspense fallback={<AIToolSkeleton />}><LearningPathways userRole={USER_ROLES.STUDENT} studentId={resolvedStudentId} /></Suspense>
            </div>
            <div id="subject-recommender">
                <Suspense fallback={<AIToolSkeleton />}><SubjectRecommender userRole={USER_ROLES.STUDENT} studentId={resolvedStudentId} /></Suspense>
            </div>
            <div id="e-laboratory">
                <div className="card p-4 mt-2">
                    <h3 className="text-lg font-semibold mb-2">E-Laboratory</h3>
                    <p className="text-sm text-gray-600 mb-3">Search and launch interactive PhET science simulations.</p>
                    <Suspense fallback={<AIToolSkeleton />}>
                        <ELaboratory />
                    </Suspense>
                </div>
            </div>
        </div>
    );
};

export default StudentAITools;