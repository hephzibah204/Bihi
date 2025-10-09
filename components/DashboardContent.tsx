

import React, { lazy, Suspense } from 'react';
import { DashboardView } from '../types';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import { ADMIN_VIEWS } from '../utils/constants';
import SpinnerIcon from './icons/SpinnerIcon';

// Lazy-loaded components
const Students = lazy(() => import('./Students'));
const Subjects = lazy(() => import('./Subjects'));
const Results = lazy(() => import('./Results'));
const ReportCard = lazy(() => import('./ReportCard'));
const Promotions = lazy(() => import('./Promotions'));
const SchoolSettingsComponent = lazy(() => import('./SchoolSettings'));
const Teachers = lazy(() => import('./Teachers'));
const IDCardGenerator = lazy(() => import('./IDCardGenerator'));
const Attendance = lazy(() => import('./Attendance'));
const BehavioralRemarks = lazy(() => import('./BehavioralRemarks'));
const Timetable = lazy(() => import('./Timetable'));
const CommunicationsDashboard = lazy(() => import('./CommunicationsDashboard'));
const Bursary = lazy(() => import('./Bursary'));
const BillingDashboard = lazy(() => import('./BillingDashboard'));
const AdvancedAnalytics = lazy(() => import('./AdvancedAnalytics'));
const LearningPathways = lazy(() => import('./LearningPathways'));
const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const EarlyIntervention = lazy(() => import('./EarlyIntervention'));
const LessonPlanner = lazy(() => import('./LessonPlanner'));
const CommentGenerator = lazy(() => import('./CommentGenerator'));
const BroadsheetAnalysis = lazy(() => import('./BroadsheetAnalysis'));
const UpgradePrompt = lazy(() => import('./UpgradePrompt'));
const Assignments = lazy(() => import('./Assignments'));
const GeneralRemarks = lazy(() => import('./GeneralRemarks'));
const StudentProfilePage = lazy(() => import('./StudentProfilePage'));
const AlumniDashboard = lazy(() => import('./AlumniDashboard'));
const SubjectRecommender = lazy(() => import('./SubjectRecommender'));
const ComprehensiveReportEntry = lazy(() => import('./ComprehensiveReportEntry'));
const AdminAnalyticsDashboard = lazy(() => import('./AdminAnalyticsDashboard'));
const DashboardKnowledgeBase = lazy(() => import('./DashboardKnowledgeBase'));

interface DashboardContentProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: string;
    profileStudentId?: string;
    onViewStudentProfile?: (studentId: string) => void;
}

const AiTools = () => (
    <div className="space-y-8">
        <div>
            <h2 className="text-2xl font-semibold">AI Assistant Tools</h2>
            <p className="mt-1 text-gray-600">Quick tools to help with daily tasks.</p>
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
             <h2 className="text-2xl font-semibold mb-4">Broadsheet Analysis</h2>
            <Suspense fallback={<div className="card p-4">Loading...</div>}><BroadsheetAnalysis /></Suspense>
        </div>
    </div>
);

const DashboardContent = ({ activeView, setActiveView, userRole, profileStudentId, onViewStudentProfile }: DashboardContentProps) => {
    const { isSubscribed, hasFeature, isLoading } = usePlanFeatures();

    const handleUpgrade = () => setActiveView(ADMIN_VIEWS.BILLING);

    if (isLoading) {
        return <div className="card p-6">Loading subscription status...</div>;
    }
    
    // Always allow access to these pages
    if (activeView === ADMIN_VIEWS.SETTINGS) return <SchoolSettingsComponent />;
    if (activeView === ADMIN_VIEWS.BILLING) return <BillingDashboard />;
    
    if (!isSubscribed) {
        return <UpgradePrompt featureName="this feature" onUpgradeClick={handleUpgrade} />;
    }

    switch(activeView) {
        case ADMIN_VIEWS.DASHBOARD: return <AdminAnalyticsDashboard />;
        case ADMIN_VIEWS.STUDENTS: return <Students onViewProfile={onViewStudentProfile} />;
        case ADMIN_VIEWS.STUDENT_PROFILE: return <StudentProfilePage studentId={profileStudentId} setActiveView={setActiveView} />;
        case ADMIN_VIEWS.TEACHERS: return <Teachers />;
        case ADMIN_VIEWS.SUBJECTS: return <Subjects />;
        case ADMIN_VIEWS.ASSIGNMENTS: return <Assignments />;
        case ADMIN_VIEWS.RESULTS: return <Results />;
        case ADMIN_VIEWS.GENERAL_REMARKS: return <GeneralRemarks />;
        case ADMIN_VIEWS.REPORT_CARDS: return <ReportCard setActiveView={setActiveView} />;
        case ADMIN_VIEWS.COMPREHENSIVE_ENTRY: return <ComprehensiveReportEntry />;
        case ADMIN_VIEWS.PROMOTIONS: return <Promotions />;
        case ADMIN_VIEWS.ID_CARDS: return <IDCardGenerator />;
        case ADMIN_VIEWS.TIMETABLE: return <Timetable />;
        case ADMIN_VIEWS.ATTENDANCE: return <Attendance />;
        case ADMIN_VIEWS.BEHAVIORAL: return <BehavioralRemarks />;
        case ADMIN_VIEWS.BURSARY: return <Bursary />;
        case ADMIN_VIEWS.COMMUNICATIONS: return <CommunicationsDashboard />;
        case ADMIN_VIEWS.BROADSHEET: return <BroadsheetAnalysis />;
        case ADMIN_VIEWS.KNOWLEDGE_BASE: return <DashboardKnowledgeBase />;
        case ADMIN_VIEWS.ALUMNI:
             return hasFeature('alumni') ? <AlumniDashboard /> : <UpgradePrompt featureName="Alumni Management" onUpgradeClick={handleUpgrade} />;
        case ADMIN_VIEWS.ANALYTICS:
             return hasFeature('analytics') ? <AdvancedAnalytics /> : <UpgradePrompt featureName="Advanced Analytics" onUpgradeClick={handleUpgrade} />;
        case ADMIN_VIEWS.AI_TOOLS:
            return hasFeature('ai-tools') ? <AiTools /> : <UpgradePrompt featureName="AI Tools" onUpgradeClick={handleUpgrade} />;
        default:
            return <AdminAnalyticsDashboard />;
    }
};

export default DashboardContent;