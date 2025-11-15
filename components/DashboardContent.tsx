

import React, { lazy } from 'react';
import { DashboardView, UserRole } from '../types';
import { ADMIN_VIEWS } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';

// Lazy load all the components
const DashboardHome = lazy(() => import('./DashboardHome'));
const Students = lazy(() => import('./Students'));
const StudentProfilePage = lazy(() => import('./StudentProfilePage'));
const Subjects = lazy(() => import('./Subjects'));
const Results = lazy(() => import('./Results'));
const ReportCard = lazy(() => import('./ReportCard'));
const Broadsheet = lazy(() => import('./Broadsheet'));
const ComprehensiveReportEntry = lazy(() => import('./ComprehensiveReportEntry'));
const Promotions = lazy(() => import('./Promotions'));
const Attendance = lazy(() => import('./Attendance'));
const TeacherAttendanceHistory = lazy(() => import('./TeacherAttendanceHistory'));
const SchoolSettings = lazy(() => import('./SchoolSettings'));
const Bursary = lazy(() => import('./Bursary'));
const CommunicationsDashboard = lazy(() => import('./CommunicationsDashboard'));
const AIToolsNavigation = lazy(() => import('./AIToolsNavigation'));
const AdvancedAnalytics = lazy(() => import('./AdvancedAnalytics'));
const AlumniDashboard = lazy(() => import('./AlumniDashboard'));
const Teachers = lazy(() => import('./Teachers'));
const Parents = lazy(() => import('./Parents'));
const Timetable = lazy(() => import('./Timetable'));
const IDCardGenerator = lazy(() => import('./IDCardGenerator'));
const BehavioralRemarks = lazy(() => import('./BehavioralRemarks'));
const GeneralRemarks = lazy(() => import('./GeneralRemarks'));
const ResourceHub = lazy(() => import('./ResourceHub'));
const DashboardKnowledgeBase = lazy(() => import('./DashboardKnowledgeBase'));
const BillingDashboard = lazy(() => import('./BillingDashboard'));
const BursaryDashboard = lazy(() => import('./BursaryDashboard'));
const AdminAiCoachManager = lazy(() => import('./AdminAiCoachManager'));
const AdminAiCoachProgress = lazy(() => import('./AdminAiCoachProgress'));
const PrintCenter = lazy(() => import('./PrintCenter'));
const TeacherCertificatePrintView = lazy(() => import('./TeacherCertificatePrintView'));
const AdminMonitorView = lazy(() => import('./AdminMonitorView'));

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

interface DashboardContentProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: UserRole | null;
    profileStudentId: string | null;
    onViewStudentProfile: (studentId: string) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ activeView, setActiveView, userRole, profileStudentId, onViewStudentProfile }) => {
    const { settings } = useAuth() as any;
    switch (activeView) {
        case ADMIN_VIEWS.DASHBOARD:
            // Show bursary KPIs for Bursar on Home
            return userRole === 'Bursar' ? <BursaryDashboard /> : <DashboardHome setActiveView={setActiveView} />;
        case ADMIN_VIEWS.STUDENTS:
            return <Students onViewProfile={onViewStudentProfile} />;
        case ADMIN_VIEWS.STUDENT_PROFILE:
            return <StudentProfilePage studentId={profileStudentId} setActiveView={setActiveView} />;
        case ADMIN_VIEWS.SUBJECTS:
            return <Subjects />;
        case ADMIN_VIEWS.RESULTS:
            return <Results />;
        case ADMIN_VIEWS.REPORT_CARDS:
            return <ReportCard setActiveView={setActiveView} />;
        case ADMIN_VIEWS.BROADSHEET:
            return <Broadsheet setActiveView={setActiveView} userRole={userRole} />;
        case ADMIN_VIEWS.COMPREHENSIVE_ENTRY:
            return <ComprehensiveReportEntry />;
        case ADMIN_VIEWS.PROMOTIONS:
            return <Promotions />;
        case ADMIN_VIEWS.ATTENDANCE:
            return <Attendance />;
        case ADMIN_VIEWS.TEACHER_ATTENDANCE_HISTORY:
            return <TeacherAttendanceHistory />;
        case ADMIN_VIEWS.SETTINGS:
            return <SchoolSettings />;
        case ADMIN_VIEWS.BURSARY:
            return <Bursary />;
        case ADMIN_VIEWS.COMMUNICATIONS:
            return <CommunicationsDashboard setActiveView={setActiveView}/>;
        case ADMIN_VIEWS.AI_TOOLS:
            return <AIToolsNavigation setActiveView={setActiveView} />;
        case ADMIN_VIEWS.AI_COACH_MANAGER:
            return <AdminAiCoachManager />;
        case ADMIN_VIEWS.AI_COACH_PROGRESS:
            return <AdminAiCoachProgress />;
        case ADMIN_VIEWS.ANALYTICS:
            return <AdvancedAnalytics />;
        case ADMIN_VIEWS.PRINT_CENTER:
            return <PrintCenter setActiveView={setActiveView} />;
        case ADMIN_VIEWS.TEACHER_CERTIFICATES:
            return <TeacherCertificatePrintView />;
        case ADMIN_VIEWS.CLASSROOM_MONITORING:
            {
                const isEnabled = (settings?.features?.['classroom-monitoring'] ?? true) && (settings?.roleBasedFeatures?.admin?.['classroom-monitoring'] ?? true);
                return isEnabled ? <AdminMonitorView /> : <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">Classroom Monitoring is disabled for Admins.</div>;
            }
        case ADMIN_VIEWS.ALUMNI:
            return <AlumniDashboard />;
        case ADMIN_VIEWS.STAFF:
            return <Teachers />;
        case ADMIN_VIEWS.PARENTS:
            return <Parents />;
        case ADMIN_VIEWS.TIMETABLE:
            return <Timetable />;
        case ADMIN_VIEWS.ID_CARDS:
            return <IDCardGenerator />;
        case ADMIN_VIEWS.BEHAVIORAL_REMARKS:
            return <BehavioralRemarks />;
        case ADMIN_VIEWS.GENERAL_REMARKS:
             return <GeneralRemarks />;
        case ADMIN_VIEWS.HELP:
            return <DashboardKnowledgeBase />;
        case ADMIN_VIEWS.RESOURCE_HUB:
            return <ResourceHub />;
        case ADMIN_VIEWS.BILLING:
            return <BillingDashboard />;
        
        // Individual AI Tool Views
                    case ADMIN_VIEWS.AI_CHAT:
                        return <AIChatPanel />;
                    case ADMIN_VIEWS.AI_ELABORATORY:
                        return <ELaboratory />;
                    case ADMIN_VIEWS.AI_LESSON_PLANNER:
                        return <LessonPlanner />;
                    case ADMIN_VIEWS.AI_SUBJECT_RECOMMENDER:
                        return <SubjectRecommender />;
        case ADMIN_VIEWS.AI_PRACTICE_QUIZ:
            return <PracticeQuiz />;
        case ADMIN_VIEWS.AI_COMMENT_GENERATOR:
            return <CommentGenerator />;
        case ADMIN_VIEWS.AI_EARLY_INTERVENTION:
            return <EarlyIntervention />;
        case ADMIN_VIEWS.AI_LEARNING_PATHWAYS:
            return <LearningPathways />;
        case ADMIN_VIEWS.AI_SUBJECT_RECOMMENDER:
            return <SubjectRecommender />;
        case ADMIN_VIEWS.AI_RUBRIC_GENERATOR:
            return <RubricGenerator />;
        case ADMIN_VIEWS.AI_PARENT_MESSAGE_COMPOSER:
            return <ParentMessageComposer />;
            
        default:
            return <DashboardHome setActiveView={setActiveView} />;
    }
};

export default DashboardContent;
