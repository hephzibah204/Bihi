import React, { lazy, Suspense } from 'react';
import { TeacherView } from '../types';
import { TEACHER_VIEWS } from '../utils/constants';
import SpinnerIcon from './icons/SpinnerIcon';

// Lazy-loaded components for teacher dashboard
const TeacherHome = lazy(() => import('./TeacherHome'));
const Results = lazy(() => import('./Results'));
const TeacherSchedule = lazy(() => import('./TeacherSchedule'));
const AITools = lazy(() => import('./AITools'));
const MyStudents = lazy(() => import('./MyStudents'));
const ResourceHub = lazy(() => import('./ResourceHub'));
const DashboardKnowledgeBase = lazy(() => import('./DashboardKnowledgeBase'));
const MyPayslips = lazy(() => import('./MyPayslips'));
const TeacherAssignments = lazy(() => import('./TeacherAssignments'));
const TeacherBehavioral = lazy(() => import('./TeacherBehavioral'));


interface TeacherDashboardContentProps {
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const ContentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
);

const TeacherDashboardContent: React.FC<TeacherDashboardContentProps> = ({ activeView, setActiveView }) => {
    return (
        <Suspense fallback={<ContentLoader />}>
            {(() => {
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
                        return <AITools setActiveView={setActiveView} />;
                    case TEACHER_VIEWS.RESOURCE_HUB:
                        return <ResourceHub />;
                    case TEACHER_VIEWS.HELP:
                        return <DashboardKnowledgeBase />;
                    case TEACHER_VIEWS.MY_PAYSLIPS:
                        return <MyPayslips />;
                    default:
                        return <TeacherHome setActiveView={setActiveView} />;
                }
            })()}
        </Suspense>
    );
};

export default TeacherDashboardContent;
