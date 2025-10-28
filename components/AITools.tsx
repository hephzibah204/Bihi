import React, { Suspense, lazy } from 'react';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import UpgradePrompt from './UpgradePrompt';
import { ADMIN_VIEWS } from '../utils/constants';
import { DashboardView, TeacherView } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

const LessonPlanner = lazy(() => import('./LessonPlanner'));
const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const CommentGenerator = lazy(() => import('./CommentGenerator'));
const EarlyIntervention = lazy(() => import('./EarlyIntervention'));
const LearningPathways = lazy(() => import('./LearningPathways'));
const SubjectRecommender = lazy(() => import('./SubjectRecommender'));
const RubricGenerator = lazy(() => import('./RubricGenerator'));
const ParentMessageComposer = lazy(() => import('./ParentMessageComposer'));

const AITools = ({ setActiveView }: { setActiveView: (view: DashboardView | TeacherView) => void }) => {
    const { hasFeature, isLoading } = usePlanFeatures();
    
    if (isLoading) {
        return <div className="card p-6 text-center">Loading AI features...</div>;
    }

    if (!hasFeature('ai-tools')) {
        return <UpgradePrompt featureName="AI Tools" onUpgradeClick={() => setActiveView(ADMIN_VIEWS.BILLING as DashboardView)} />;
    }
    
    const AIToolSkeleton = () => <div className="card p-6 h-64 animate-pulse bg-gray-200"></div>;

    return (
        <div className="space-y-8">
            {/* Teacher-centric tools */}
            <Suspense fallback={<AIToolSkeleton />}><RubricGenerator /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><ParentMessageComposer /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><LessonPlanner /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><PracticeQuiz /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><CommentGenerator /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><EarlyIntervention /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><LearningPathways /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><SubjectRecommender /></Suspense>
        </div>
    );
};

export default AITools;