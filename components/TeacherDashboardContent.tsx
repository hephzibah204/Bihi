import React, { lazy, Suspense } from 'react';
import { TeacherView } from '../types';
import { TEACHER_VIEWS } from '../utils/constants';
import SpinnerIcon from './icons/SpinnerIcon';

// Lazy-loaded components for teacher dashboard
const Results = lazy(() => import('./Results'));
const TeacherSchedule = lazy(() => import('./TeacherSchedule'));
const AIToolsNavigation = lazy(() => import('./AIToolsNavigation'));
const MyStudents = lazy(() => import('./MyStudents'));
const ResourceHub = lazy(() => import('./ResourceHub'));
const LessonTemplates = lazy(() => import('./LessonTemplates'));
const TeacherCoach = lazy(() => import('./TeacherCoach'));
const DashboardKnowledgeBase = lazy(() => import('./DashboardKnowledgeBase'));
const MyPayslips = lazy(() => import('./MyPayslips'));
const Assignments = lazy(() => import('./Assignments'));
const TeacherBehavioral = lazy(() => import('./TeacherBehavioral'));
const Attendance = lazy(() => import('./Attendance'));
const DirectMessages = lazy(() => import('./DirectMessages'));
const NotificationViewer = lazy(() => import('./NotificationViewer'));
const ReportCard = lazy(() => import('./ReportCard'));
const TeacherHome = lazy(() => import('./TeacherHome'));
const StudentProfilePage = lazy(() => import('./StudentProfilePage'));
const ComprehensiveReportEntry = lazy(() => import('./ComprehensiveReportEntry'));
const Broadsheet = lazy(() => import('./Broadsheet'));

// AI Tool Components
const AIChatPanel = lazy(() => import('./AIChatPanel'));
const ELaboratory = lazy(() => import('./ELaboratory'));
const LessonPlanner = lazy(() => import('./LessonPlanner'));
const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const CommentGenerator = lazy(() => import('./CommentGenerator'));
const EarlyIntervention = lazy(() => import('./EarlyIntervention'));
const LearningPathways = lazy(() => import('./LearningPathways'));
const SubjectRecommender = lazy(() => import('./SubjectRecommender'));
const RubricGenerator = lazy(() => import('./RubricGenerator'));
const ParentMessageComposer = lazy(() => import('./ParentMessageComposer'));

interface TeacherDashboardContentProps {
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
    profileStudentId?: string | null;
    onViewStudentProfile?: (studentId: string) => void;
}

const ContentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
);

const TeacherDashboardContent: React.FC<TeacherDashboardContentProps> = ({ activeView, setActiveView, profileStudentId, onViewStudentProfile }) => {
    return (
        <Suspense fallback={<ContentLoader />}>
            {(() => {
                switch(activeView) {
                    case TEACHER_VIEWS.DASHBOARD:
                        return <TeacherHome setActiveView={setActiveView} />;
                    case TEACHER_VIEWS.MY_STUDENTS:
                        return <MyStudents onViewProfile={onViewStudentProfile} />;
                    case TEACHER_VIEWS.ENTER_SCORES:
                        return <Results />;
                    case TEACHER_VIEWS.MY_SCHEDULE:
                        return <TeacherSchedule />;
                    case TEACHER_VIEWS.AI_TOOLS:
                        return <AIToolsNavigation setActiveView={setActiveView} />;
                    case TEACHER_VIEWS.LESSON_TEMPLATES:
                        return <LessonTemplates />;
                    case TEACHER_VIEWS.AI_COACH:
                        return <TeacherCoach />;
                    case TEACHER_VIEWS.RESOURCE_HUB:
                        return <ResourceHub />;
                    case TEACHER_VIEWS.HELP:
                        return <DashboardKnowledgeBase />;
                    case TEACHER_VIEWS.MY_PAYSLIPS:
                        return <MyPayslips />;
                    case TEACHER_VIEWS.ASSIGNMENTS:
                        return <Assignments />;
                    case TEACHER_VIEWS.BEHAVIORAL:
                        return <TeacherBehavioral />;
                    case TEACHER_VIEWS.ATTENDANCE:
                        return <Attendance />;
                    case TEACHER_VIEWS.MESSAGES:
                        return <DirectMessages />;
                    case TEACHER_VIEWS.NOTIFICATIONS:
                        return <NotificationViewer demoUserId={null} />;
                    case TEACHER_VIEWS.REPORT_CARDS:
                        return <ReportCard setActiveView={setActiveView} />;
                    case TEACHER_VIEWS.BROADSHEET:
                        return <Broadsheet setActiveView={setActiveView} userRole={'Teacher'} />;
                    case TEACHER_VIEWS.COMPREHENSIVE_ENTRY:
                        return <ComprehensiveReportEntry />;
                    case TEACHER_VIEWS.STUDENT_PROFILE:
                        return <StudentProfilePage studentId={profileStudentId} setActiveView={setActiveView} />;
                    
                    // Individual AI Tool Views
                    case TEACHER_VIEWS.AI_CHAT:
                        return <AIChatPanel />;
                    case TEACHER_VIEWS.AI_ELABORATORY:
                        return <ELaboratory />;
                    case TEACHER_VIEWS.AI_LESSON_PLANNER:
                        return <LessonPlanner />;
                    case TEACHER_VIEWS.AI_PRACTICE_QUIZ:
                        return <PracticeQuiz />;
                    case TEACHER_VIEWS.AI_COMMENT_GENERATOR:
                        return <CommentGenerator />;
                    case TEACHER_VIEWS.AI_EARLY_INTERVENTION:
                        return <EarlyIntervention />;
                    case TEACHER_VIEWS.AI_LEARNING_PATHWAYS:
                        return <LearningPathways />;
                    case TEACHER_VIEWS.AI_SUBJECT_RECOMMENDER:
                        return <SubjectRecommender />;
                    case TEACHER_VIEWS.AI_RUBRIC_GENERATOR:
                        return <RubricGenerator />;
                    case TEACHER_VIEWS.AI_PARENT_MESSAGE_COMPOSER:
                        return <ParentMessageComposer />;
                        
                    default:
                        return <TeacherSchedule />;
            }
        })()}
        </Suspense>
    );
};

export default TeacherDashboardContent;
