import React, { lazy, Suspense } from 'react';
import { StudentView } from '../types';
import { STUDENT_VIEWS, USER_ROLES } from '../utils/constants';
import HeadsetIcon from './icons/HeadsetIcon';
const StudentAITools = lazy(() => import('./StudentAITools'));

// Lazy-loaded components
const StudentHome = lazy(() => import('./StudentHome'));
const StudentResults = lazy(() => import('./StudentResults'));
const StudentProfile = lazy(() => import('./StudentProfile'));
const StudentTimetable = lazy(() => import('./StudentTimetable'));
const NotificationViewer = lazy(() => import('./NotificationViewer'));
const StudentAssignments = lazy(() => import('./StudentAssignments'));
const AIAcademicTutor = lazy(() => import('./AIAcademicTutor'));
const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const LearningPathways = lazy(() => import('./LearningPathways'));
const SubjectRecommender = lazy(() => import('./SubjectRecommender'));
const StudentReportCardViewer = lazy(() => import('./StudentReportCardViewer'));

interface StudentDashboardContentProps {
    activeView: StudentView;
    setActiveView: (view: StudentView) => void;
    demoUserId?: string | null;
}

const StudentDashboardContent = ({ activeView, setActiveView, demoUserId }: StudentDashboardContentProps) => {
    switch(activeView) {
        case STUDENT_VIEWS.DASHBOARD:
            return <StudentHome setActiveView={setActiveView} demoUserId={demoUserId} />;
        case STUDENT_VIEWS.RESULTS:
            return <StudentReportCardViewer demoUserId={demoUserId} />;
        case STUDENT_VIEWS.TRANSCRIPT:
            return <StudentResults demoUserId={demoUserId} />;
        case STUDENT_VIEWS.ASSIGNMENTS:
            return <StudentAssignments demoUserId={demoUserId} />;
        case STUDENT_VIEWS.TIMETABLE:
            return <StudentTimetable demoUserId={demoUserId} />;
        case STUDENT_VIEWS.PROFILE:
            return <StudentProfile demoUserId={demoUserId} />;
        case STUDENT_VIEWS.NOTIFICATIONS:
            return <NotificationViewer demoUserId={demoUserId} />;
        case STUDENT_VIEWS.AI_TUTOR:
            return <AIAcademicTutor demoUserId={demoUserId} />;
        case STUDENT_VIEWS.AI_TOOLS:
            return <Suspense fallback={<div className="card p-4">Loading...</div>}><StudentAITools setActiveView={setActiveView} demoUserId={demoUserId} /></Suspense>;
        default:
            return <StudentHome setActiveView={setActiveView} demoUserId={demoUserId} />;
    }
};

export default StudentDashboardContent;
