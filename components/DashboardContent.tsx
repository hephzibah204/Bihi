import React from 'react';
import DashboardHome from './DashboardHome';
import Students from './Students';
import Subjects from './Subjects';
import Results from './Results';
import ReportCard from './ReportCard';
import { DashboardView } from '../types';
import Promotions from './Promotions';
import SchoolSettings from './SchoolSettings';
import Teachers from './Teachers';
import IDCardGenerator from './IDCardGenerator';
import Attendance from './Attendance';
import BehavioralRemarks from './BehavioralRemarks';
import Timetable from './Timetable';
import CommunicationsDashboard from './CommunicationsDashboard';
import Bursary from './Bursary';
import BillingDashboard from './BillingDashboard';
import AdvancedAnalytics from './AdvancedAnalytics';
import LearningPathways from './LearningPathways';
import PracticeQuiz from './PracticeQuiz';
import EarlyIntervention from './EarlyIntervention';
import LessonPlanner from './LessonPlanner';
import CommentGenerator from './CommentGenerator';
import BroadsheetAnalysis from './BroadsheetAnalysis';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import UpgradePrompt from './UpgradePrompt';
import Assignments from './Assignments';
import { ADMIN_VIEWS } from '../utils/constants';
import GeneralRemarks from './GeneralRemarks';
import StudentProfilePage from './StudentProfilePage';
import AlumniDashboard from './AlumniDashboard';
import SubjectRecommender from './SubjectRecommender';
import ComprehensiveReportEntry from './ComprehensiveReportEntry';


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
                <CommentGenerator />
                <LessonPlanner />
                <SubjectRecommender />
                <LearningPathways />
                <PracticeQuiz />
                <EarlyIntervention />
            </div>
        </div>
        <div className="mt-8">
             <h2 className="text-2xl font-semibold mb-4">Broadsheet Analysis</h2>
            <BroadsheetAnalysis />
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
    if (activeView === ADMIN_VIEWS.SETTINGS) return <SchoolSettings />;
    if (activeView === ADMIN_VIEWS.BILLING) return <BillingDashboard />;
    
    if (!isSubscribed) {
        // For unsubscribed users, only show the dashboard prompt
        if (activeView === ADMIN_VIEWS.DASHBOARD) {
            return <DashboardHome setActiveView={setActiveView} />;
        }
        return <UpgradePrompt featureName="this feature" onUpgradeClick={handleUpgrade} />;
    }

    switch(activeView) {
        case ADMIN_VIEWS.DASHBOARD: return <DashboardHome setActiveView={setActiveView} />;
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
        case ADMIN_VIEWS.ALUMNI:
             return hasFeature('alumni') ? <AlumniDashboard /> : <UpgradePrompt featureName="Alumni Management" onUpgradeClick={handleUpgrade} />;
        case ADMIN_VIEWS.ANALYTICS:
             return hasFeature('analytics') ? <AdvancedAnalytics /> : <UpgradePrompt featureName="Advanced Analytics" onUpgradeClick={handleUpgrade} />;
        case ADMIN_VIEWS.AI_TOOLS:
            return hasFeature('ai-tools') ? <AiTools /> : <UpgradePrompt featureName="AI Tools" onUpgradeClick={handleUpgrade} />;
        default:
            return <DashboardHome setActiveView={setActiveView} />;
    }
};

export default DashboardContent;