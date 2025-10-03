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


interface DashboardContentProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: string;
}

const AiTools = () => (
    <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <CommentGenerator />
            <LessonPlanner />
            <LearningPathways />
            <PracticeQuiz />
            <EarlyIntervention />
            <BroadsheetAnalysis />
        </div>
    </div>
);

const DashboardContent = ({ activeView, setActiveView, userRole }: DashboardContentProps) => {
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
        case ADMIN_VIEWS.STUDENTS: return <Students />;
        case ADMIN_VIEWS.TEACHERS: return <Teachers />;
        case ADMIN_VIEWS.SUBJECTS: return <Subjects />;
        case ADMIN_VIEWS.ASSIGNMENTS: return <Assignments />;
        case ADMIN_VIEWS.RESULTS: return <Results />;
        case ADMIN_VIEWS.REPORT_CARDS: return <ReportCard setActiveView={setActiveView} />;
        case ADMIN_VIEWS.PROMOTIONS: return <Promotions />;
        case ADMIN_VIEWS.ID_CARDS: return <IDCardGenerator />;
        case ADMIN_VIEWS.TIMETABLE: return <Timetable />;
        case ADMIN_VIEWS.ATTENDANCE: return <Attendance />;
        case ADMIN_VIEWS.BEHAVIORAL: return <BehavioralRemarks />;
        case ADMIN_VIEWS.BURSARY: return <Bursary />;
        case ADMIN_VIEWS.COMMUNICATIONS: return <CommunicationsDashboard />;
        case ADMIN_VIEWS.ANALYTICS:
             return hasFeature('hasAnalytics') ? <AdvancedAnalytics /> : <UpgradePrompt featureName="Advanced Analytics" onUpgradeClick={handleUpgrade} />;
        case ADMIN_VIEWS.AI_TOOLS:
            return hasFeature('hasAI') ? <AiTools /> : <UpgradePrompt featureName="AI Tools" onUpgradeClick={handleUpgrade} />;
        default:
            return <DashboardHome setActiveView={setActiveView} />;
    }
};

export default DashboardContent;
