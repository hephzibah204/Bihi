import React, { lazy, Suspense } from 'react';
import { StudentView } from '../types';
import { STUDENT_VIEWS, USER_ROLES } from '../utils/constants';
import HeadsetIcon from './icons/HeadsetIcon';
const AIToolsNavigation = lazy(() => import('./AIToolsNavigation'));

// Lazy-loaded components
const StudentHome = lazy(() => import('./StudentHome'));
const StudentResults = lazy(() => import('./StudentResults'));
const StudentProfile = lazy(() => import('./StudentProfile'));
const StudentTimetable = lazy(() => import('./StudentTimetable'));
const NotificationViewer = lazy(() => import('./NotificationViewer'));
const StudentAssignments = lazy(() => import('./StudentAssignments'));
const OpenBooksHub = lazy(() => import('./OpenBooksHub'));
const AIAcademicTutor = lazy(() => import('./AIAcademicTutor'));
const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const LearningPathways = lazy(() => import('./LearningPathways'));
const SubjectRecommender = lazy(() => import('./SubjectRecommender'));
const StudentReportCardViewer = lazy(() => import('./StudentReportCardViewer'));
const Broadsheet = lazy(() => import('./Broadsheet'));

// AI Tool Components
const AIChatPanel = lazy(() => import('./AIChatPanel'));
const ELaboratory = lazy(() => import('./ELaboratory'));

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
        case STUDENT_VIEWS.BROADSHEET:
            return <Broadsheet setActiveView={() => { /* student view: no cross-navigation */ }} userRole={USER_ROLES.STUDENT} />;
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
            return <Suspense fallback={<div className="card p-4">Loading...</div>}><AIToolsNavigation setActiveView={setActiveView} /></Suspense>;
        case STUDENT_VIEWS.OPEN_BOOKS:
            return <OpenBooksHub />;
        
        // Individual AI Tool Views
                    case STUDENT_VIEWS.AI_CHAT:
                        return <AIChatPanel />;
                    case STUDENT_VIEWS.AI_ELABORATORY:
                        return <ELaboratory />;
                    case STUDENT_VIEWS.AI_SUBJECT_RECOMMENDER:
                        return <SubjectRecommender userRole={USER_ROLES.STUDENT} />;
                    case STUDENT_VIEWS.AI_PRACTICE_QUIZ:
                        return <PracticeQuiz userRole={USER_ROLES.STUDENT} />;
                    case STUDENT_VIEWS.AI_LEARNING_PATHWAYS:
                        return <LearningPathways userRole={USER_ROLES.STUDENT} />;
            
        default:
            return <StudentHome setActiveView={setActiveView} demoUserId={demoUserId} />;
    }
};

export default StudentDashboardContent;
