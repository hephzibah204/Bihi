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

    const handleUpgrade = () => setActiveView('billing');

    if (isLoading) {
        return <div className="card p-6">Loading subscription status...</div>;
    }
    
    // Allow access to these pages even if not subscribed
    if (activeView === 'settings' || activeView === 'billing') {
        if (activeView === 'settings') return <SchoolSettings />;
        if (activeView === 'billing') return <BillingDashboard />;
    }
    
    if (!isSubscribed) {
        if (activeView === 'dashboard') {
            return <DashboardHome setActiveView={setActiveView} />;
        }
        return <UpgradePrompt featureName="this feature" onUpgradeClick={handleUpgrade} />;
    }

    switch(activeView) {
        case 'dashboard':
            return <DashboardHome setActiveView={setActiveView} />;
        case 'students':
            return <Students />;
        case 'teachers':
            return <Teachers />;
        case 'subjects':
            return <Subjects />;
        case 'results':
            return <Results />;
        case 'report-cards':
            return <ReportCard setActiveView={setActiveView} />;
        case 'promotions':
            return <Promotions />;
        case 'id-cards':
            return <IDCardGenerator />;
        case 'timetable':
            return <Timetable />;
        case 'attendance':
            return <Attendance />;
        case 'behavioral':
            return <BehavioralRemarks />;
        case 'bursary':
            return <Bursary />;
        case 'billing':
            return <BillingDashboard />;
        case 'communications':
            return <CommunicationsDashboard />;
        case 'analytics':
// Fix: Corrected feature key from 'ANALYTICS' to 'hasAnalytics' to match plan definition.
             return hasFeature('hasAnalytics') ? <AdvancedAnalytics /> : <UpgradePrompt featureName="Advanced Analytics" onUpgradeClick={handleUpgrade} />;
        case 'ai-tools':
            return hasFeature('hasAI') ? <AiTools /> : <UpgradePrompt featureName="AI Tools" onUpgradeClick={handleUpgrade} />;
        case 'settings':
            return <SchoolSettings />;
        default:
            return <DashboardHome setActiveView={setActiveView} />;
    }
};

export default DashboardContent;