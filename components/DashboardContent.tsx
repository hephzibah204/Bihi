import React from 'react';
import { DashboardView } from '../types';
import DashboardHome from './DashboardHome';
import Students from './Students';
import Subjects from './Subjects';
import Results from './Results';
import SchoolSettings from './SchoolSettings';
import Teachers from './Teachers';
import Promotions from './Promotions';
import IDCardGenerator from './IDCardGenerator';
import Timetable from './Timetable';
import Attendance from './Attendance';
import BehavioralRemarks from './BehavioralRemarks';
import Bursary from './Bursary';
import AdvancedAnalytics from './AdvancedAnalytics';
import CommentGenerator from './CommentGenerator';
import LearningPathways from './LearningPathways';
import LessonPlanner from './LessonPlanner';
import EarlyIntervention from './EarlyIntervention';
import ReportCard from './ReportCard';
import CommunicationsDashboard from './CommunicationsDashboard';
import BillingDashboard from './BillingDashboard';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import UpgradePrompt from './UpgradePrompt';
import { hasPermission } from './Sidebar';
import LockIcon from './icons/LockIcon';


interface DashboardContentProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: string;
}

const AiToolsDashboard = () => (
    <div>
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">AI Tools</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <CommentGenerator />
            <LessonPlanner />
            <LearningPathways />
            <EarlyIntervention />
        </div>
    </div>
);

const AccessDenied = () => (
    <div className="card text-center p-8 max-w-lg mx-auto">
        <LockIcon className="w-16 h-16 mx-auto text-red-500" />
        <h2 className="mt-4 text-2xl font-bold">Access Denied</h2>
        <p className="mt-2 text-gray-500">You do not have the required permissions to view this page.</p>
    </div>
);


const DashboardContent = ({ activeView, setActiveView, userRole }: DashboardContentProps) => {
    // Fix: Default hasAI to false to prevent errors if the context value is an empty object.
    const { hasAI = false } = usePlanFeatures();

    if (!hasPermission(userRole, activeView)) {
        return <AccessDenied />;
    }

    switch(activeView) {
        case 'dashboard':
            return <DashboardHome />;
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
        case 'communications':
            return <CommunicationsDashboard />;
        case 'billing':
            return <BillingDashboard />;
        case 'analytics':
            return <AdvancedAnalytics />;
        case 'ai-tools':
            return hasAI ? <AiToolsDashboard /> : <UpgradePrompt featureName="AI Tools" setActiveView={setActiveView} />;
        case 'settings':
            return <SchoolSettings />;
        default:
            return <DashboardHome />;
    }
};

export default DashboardContent;