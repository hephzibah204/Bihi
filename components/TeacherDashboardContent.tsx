import React, { lazy, Suspense } from 'react';
import { TeacherView } from '../types';
import { TEACHER_VIEWS, USER_ROLES } from '../utils/constants';
import SpinnerIcon from './icons/SpinnerIcon';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import UpgradePrompt from './UpgradePrompt';

const TeacherHome = lazy(() => import('./TeacherHome'));
const MyStudents = lazy(() => import('./MyStudents'));
const Results = lazy(() => import('./Results'));
const TeacherSchedule = lazy(() => import('./TeacherSchedule'));
const Assignments = lazy(() => import('./Assignments'));
const DirectMessages = lazy(() => import('./DirectMessages'));
const ResourceHub = lazy(() => import('./ResourceHub'));
const LessonPlanner = lazy(() => import('./LessonPlanner'));
const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const MyPayslips = lazy(() => import('./MyPayslips'));

interface TeacherDashboardContentProps {
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const AIToolsDashboard = () => (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-semibold">AI Teacher Tools</h2>
            <p className="mt-1 text-gray-600">Your assistants for planning, grading, and more.</p>
        </div>
        <LessonPlanner />
        <PracticeQuiz />
    </div>
);


const TeacherDashboardContent = ({ activeView, setActiveView }: TeacherDashboardContentProps) => {
    const { hasFeature } = usePlanFeatures();
    
    // A teacher doesn't have an "upgrade" path, but this prevents access if disabled by admin
    const handleUpgrade = () => alert("This feature is not enabled for your role. Please contact your school administrator.");

    const featureMap = {
        [TEACHER_VIEWS.DASHBOARD]: { component: <TeacherHome setActiveView={setActiveView} />, feature: null, name: 'Dashboard' },
        [TEACHER_VIEWS.MY_STUDENTS]: { component: <MyStudents />, feature: null, name: 'My Students' },
        [TEACHER_VIEWS.ENTER_SCORES]: { component: <Results />, feature: 'enter-scores', name: 'Score Entry' },
        [TEACHER_VIEWS.MY_SCHEDULE]: { component: <TeacherSchedule />, feature: null, name: 'My Schedule' },
        [TEACHER_VIEWS.ASSIGNMENTS]: { component: <Assignments />, feature: 'assignments', name: 'Assignments' },
        [TEACHER_VIEWS.MESSAGES]: { component: <DirectMessages />, feature: 'messages', name: 'Direct Messages' },
        [TEACHER_VIEWS.RESOURCE_HUB]: { component: <ResourceHub />, feature: 'resource-hub', name: 'Resource Hub' },
        [TEACHER_VIEWS.AI_TOOLS]: { component: <AIToolsDashboard />, feature: 'ai-tools', name: 'AI Tools' },
        [TEACHER_VIEWS.MY_PAYSLIPS]: { component: <MyPayslips />, feature: 'my-payslips', name: 'My Payslips' },
    };

    const currentView = featureMap[activeView];

    if (!currentView) {
        return <TeacherHome setActiveView={setActiveView} />;
    }

    if (currentView.feature && !hasFeature(USER_ROLES.TEACHER, currentView.feature)) {
        return <UpgradePrompt featureName={currentView.name} onUpgradeClick={handleUpgrade} />;
    }

    return currentView.component;
};

export default TeacherDashboardContent;