import React, { Suspense, lazy } from 'react';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import UpgradePrompt from './UpgradePrompt';
import { ADMIN_VIEWS } from '../utils/constants';
import { DashboardView, TeacherView } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES } from '../utils/constants';
import ChatbotPanel from './ChatbotPanel';

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
    const { user, role } = useAuth();
    // Resolve current role, considering demo mode fallback
    const currentRole = role || (typeof window !== 'undefined' ? (localStorage.getItem('demoUserRole') as string | null) : null);
    // Resolve studentId when the viewer is a student or parent (selected child)
    let currentStudentId: string | undefined = undefined;
    if (typeof window !== 'undefined') {
        try {
            const activeUserRaw = sessionStorage.getItem('activeUser');
            const activeUser = activeUserRaw ? JSON.parse(activeUserRaw) : null;
            if (activeUser?.userId) {
                currentStudentId = activeUser.userId;
            }
        } catch {
            // noop
        }
    }
    // If authenticated as a real student, prefer the user object id
    if (currentRole === USER_ROLES.STUDENT && (user as any)?.id) {
        currentStudentId = (user as any).id;
    }
    
    if (isLoading) {
        return <div className="card p-6 text-center">Loading AI features...</div>;
    }

    if (!hasFeature('ai-tools')) {
        return <UpgradePrompt featureName="AI Tools" onUpgradeClick={() => setActiveView(ADMIN_VIEWS.BILLING as DashboardView)} />;
    }
    
    const AIToolSkeleton = () => <div className="card p-6 h-64 animate-pulse bg-gray-200"></div>;

    return (
        <div className="space-y-8">
            {/* Role-aware assistant embedded under AI Tools */}
            <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-semibold">{currentRole === USER_ROLES.PARENT ? "Parent's Coach" : currentRole === USER_ROLES.STUDENT ? 'Student Assistant' : currentRole === USER_ROLES.TEACHER ? 'Teacher Assistant' : 'Admin Assistant'}</h2>
                        <p className="text-sm text-gray-600">Chat with your role-tailored AI assistant.</p>
                    </div>
                </div>
                <div className="max-w-full">
                    <ChatbotPanel 
                        isOpen={true}
                        onClose={() => { /* inline panel; no floating close */ }}
                        userRole={(currentRole || USER_ROLES.ADMIN) as string}
                        demoUserId={currentStudentId}
                        activeView={ADMIN_VIEWS.AI_TOOLS}
                    />
                </div>
            </div>
            {/* Teacher-centric tools */}
            <Suspense fallback={<AIToolSkeleton />}><RubricGenerator /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><ParentMessageComposer /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><LessonPlanner /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><PracticeQuiz /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><CommentGenerator /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><EarlyIntervention /></Suspense>
            <Suspense fallback={<AIToolSkeleton />}><LearningPathways /></Suspense>
            {/* Pass role-aware props so students/parents don't see a generic selector */}
            <Suspense fallback={<AIToolSkeleton />}>
                <SubjectRecommender 
                    userRole={currentRole || undefined} 
                    studentId={currentRole === USER_ROLES.STUDENT || currentRole === USER_ROLES.PARENT ? currentStudentId : undefined} 
                />
            </Suspense>
        </div>
    );
};

export default AITools;