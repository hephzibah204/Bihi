

import React, { lazy, Suspense } from 'react';
import { TeacherView } from '../types';
import { TEACHER_VIEWS } from '../utils/constants';

// Lazy-loaded components
const TeacherHome = lazy(() => import('./TeacherHome'));
const MyStudents = lazy(() => import('./MyStudents'));
const Results = lazy(() => import('./Results'));
const TeacherSchedule = lazy(() => import('./TeacherSchedule'));
const LessonPlanner = lazy(() => import('./LessonPlanner'));
const CommentGenerator = lazy(() => import('./CommentGenerator'));
const LearningPathways = lazy(() => import('./LearningPathways'));
const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const EarlyIntervention = lazy(() => import('./EarlyIntervention'));
const BroadsheetAnalysis = lazy(() => import('./BroadsheetAnalysis'));
const SubjectRecommender = lazy(() => import('./SubjectRecommender'));
const DirectMessages = lazy(() => import('./DirectMessages'));
const ResourceHub = lazy(() => import('./ResourceHub'));
const DashboardKnowledgeBase = lazy(() => import('./DashboardKnowledgeBase'));


interface TeacherDashboardContentProps {
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const AiTools = () => (
    <div className="space-y-8">
        <div>
            <p className="text-gray-600">Use these AI-powered tools to streamline your workflow.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                <Suspense fallback={<div className="card p-4">Loading...</div>}><CommentGenerator /></Suspense>
                <Suspense fallback={<div className="card p-4">Loading...</div>}><LessonPlanner /></Suspense>
                <Suspense fallback={<div className="card p-4">Loading...</div>}><SubjectRecommender /></Suspense>
                <Suspense fallback={<div className="card p-4">Loading...</div>}><LearningPathways /></Suspense>
                <Suspense fallback={<div className="card p-4">Loading...</div>}><PracticeQuiz /></Suspense>
                <Suspense fallback={<div className="card p-4">Loading...</div>}><EarlyIntervention /></Suspense>
            </div>
        </div>
        <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Class Broadsheet</h2>
            <Suspense fallback={<div className="card p-4">Loading...</div>}><BroadsheetAnalysis /></Suspense>
        </div>
    </div>
);

const TeacherDashboardContent = ({ activeView, setActiveView }: TeacherDashboardContentProps) => {
    switch(activeView) {
        case TEACHER_VIEWS.DASHBOARD:
            return <TeacherHome setActiveView={setActiveView} />;
        case TEACHER_VIEWS.MY_STUDENTS:
            return <MyStudents />;
        case TEACHER_VIEWS.ENTER_SCORES:
            return <Results />;
        case TEACHER_VIEWS.MY_SCHEDULE:
            return <TeacherSchedule />;
        case TEACHER_VIEWS.AI_TOOLS:
            return <AiTools />;
        case TEACHER_VIEWS.MESSAGES:
            return <DirectMessages />;
        case TEACHER_VIEWS.RESOURCE_HUB:
            return <ResourceHub />;
        case TEACHER_VIEWS.KNOWLEDGE_BASE:
            return <DashboardKnowledgeBase />;
        default:
            return <TeacherHome setActiveView={setActiveView} />;
    }
};

export default TeacherDashboardContent;