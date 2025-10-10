import React, { lazy } from 'react';
// FIX: Correct import path for types
import { DashboardView, UserRole } from '../types';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import UpgradePrompt from './UpgradePrompt';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';

// Lazy-loaded components
const DashboardHome = lazy(() => import('./DashboardHome'));
const Students = lazy(() => import('./Students'));
const Teachers = lazy(() => import('./Teachers'));
const Subjects = lazy(() => import('./Subjects'));
const Results = lazy(() => import('./Results'));
const ReportCard = lazy(() => import('./ReportCard'));
const Attendance = lazy(() => import('./Attendance'));
const Promotions = lazy(() => import('./Promotions'));
const Timetable = lazy(() => import('./Timetable'));
const SchoolSettings = lazy(() => import('./SchoolSettings'));
const CommunicationsDashboard = lazy(() => import('./CommunicationsDashboard'));
// FIX: Correct import path for Bursary
const Bursary = lazy(() => import('./Bursary'));
const Analytics = lazy(() => import('./AdvancedAnalytics'));
const StudentProfilePage = lazy(() => import('./StudentProfilePage'));
const ComprehensiveReportEntry = lazy(() => import('./ComprehensiveReportEntry'));
const BillingDashboard = lazy(() => import('./BillingDashboard'));
const AlumniDashboard = lazy(() => import('./AlumniDashboard'));

// AI Tool Components
const LessonPlanner = lazy(() => import('./LessonPlanner'));
const CommentGenerator = lazy(() => import('./CommentGenerator'));
const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const LearningPathways = lazy(() => import('./LearningPathways'));
const SubjectRecommender = lazy(() => import('./SubjectRecommender'));
const EarlyIntervention = lazy(() => import('./EarlyIntervention'));
const IDCardGenerator = lazy(() => import('./IDCardGenerator'));

interface DashboardContentProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: UserRole | null;
    profileStudentId: string | null;
    onViewStudentProfile: (studentId: string) => void;
}

const AIToolsDashboard = () => (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-semibold">AI Tools</h2>
            <p className="mt-1 text-gray-600">Your suite of AI-powered assistants to make school management smarter and faster.</p>
        </div>
        <LessonPlanner />
        <CommentGenerator />
        <PracticeQuiz />
        <LearningPathways />
        <SubjectRecommender />
        <EarlyIntervention />
        <IDCardGenerator />
    </div>
);


const DashboardContent = ({ activeView, setActiveView, userRole, profileStudentId, onViewStudentProfile }: DashboardContentProps) => {
    const { hasFeature } = usePlanFeatures();
    
    const handleUpgrade = () => setActiveView(ADMIN_VIEWS.SETTINGS); // Or a dedicated billing view

    const featureMap = {
        [ADMIN_VIEWS.DASHBOARD]: { component: <DashboardHome setActiveView={setActiveView} />, feature: null, name: 'Dashboard' },
        [ADMIN_VIEWS.STUDENTS]: { component: <Students onViewProfile={onViewStudentProfile} />, feature: null, name: 'Student Management' },
        [ADMIN_VIEWS.STAFF]: { component: <Teachers />, feature: null, name: 'Staff Management' },
        [ADMIN_VIEWS.SUBJECTS]: { component: <Subjects />, feature: null, name: 'Subjects' },
        [ADMIN_VIEWS.RESULTS]: { component: <Results />, feature: 'results', name: 'Score Entry' },
        [ADMIN_VIEWS.REPORT_CARDS]: { component: <ReportCard setActiveView={setActiveView} />, feature: 'results', name: 'Dossier' },
        [ADMIN_VIEWS.ATTENDANCE]: { component: <Attendance />, feature: 'attendance', name: 'Attendance' },
        [ADMIN_VIEWS.PROMOTIONS]: { component: <Promotions />, feature: null, name: 'Promotions' },
        [ADMIN_VIEWS.TIMETABLE]: { component: <Timetable />, feature: 'timetable', name: 'Timetable' },
        [ADMIN_VIEWS.COMMUNICATIONS]: { component: <CommunicationsDashboard />, feature: 'communications', name: 'Communications' },
        [ADMIN_VIEWS.BURSARY]: { component: <Bursary />, feature: 'bursary', name: 'Bursary' },
        [ADMIN_VIEWS.ANALYTICS]: { component: <Analytics />, feature: 'analytics', name: 'Analytics' },
        [ADMIN_VIEWS.AI_TOOLS]: { component: <AIToolsDashboard />, feature: 'ai-tools', name: 'AI Tools' },
        [ADMIN_VIEWS.SETTINGS]: { component: <SchoolSettings />, feature: null, name: 'Settings' },
        [ADMIN_VIEWS.STUDENT_PROFILE]: { component: <StudentProfilePage studentId={profileStudentId} setActiveView={setActiveView} />, feature: null, name: 'Student Profile' },
        [ADMIN_VIEWS.COMPREHENSIVE_ENTRY]: { component: <ComprehensiveReportEntry />, feature: 'results', name: 'Dossier Entry' },
        [ADMIN_VIEWS.ALUMNI]: { component: <AlumniDashboard />, feature: 'alumni', name: 'Alumni Portal'},
    };
    
    const currentView = featureMap[activeView];

    if (!currentView) {
        return <DashboardHome setActiveView={setActiveView} />;
    }

    if (currentView.feature && !hasFeature(USER_ROLES.ADMIN, currentView.feature)) {
        return <UpgradePrompt featureName={currentView.name} onUpgradeClick={handleUpgrade} />;
    }

    return currentView.component;
};

export default DashboardContent;
