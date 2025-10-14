

import React, { lazy } from 'react';
import { DashboardView, UserRole } from '../types';
import { ADMIN_VIEWS } from '../utils/constants';

// Lazy load all the components
const DashboardHome = lazy(() => import('./DashboardHome'));
const Students = lazy(() => import('./Students'));
const StudentProfilePage = lazy(() => import('./StudentProfilePage'));
const Subjects = lazy(() => import('./Subjects'));
const Results = lazy(() => import('./Results'));
const ReportCard = lazy(() => import('./ReportCard'));
const ComprehensiveReportEntry = lazy(() => import('./ComprehensiveReportEntry'));
const Promotions = lazy(() => import('./Promotions'));
const Attendance = lazy(() => import('./Attendance'));
const SchoolSettings = lazy(() => import('./SchoolSettings'));
const Bursary = lazy(() => import('./Bursary'));
const CommunicationsDashboard = lazy(() => import('./CommunicationsDashboard'));
const AITools = lazy(() => import('./AITools'));
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

interface DashboardContentProps {
    activeView: DashboardView;
    setActiveView: (view: DashboardView) => void;
    userRole: UserRole | null;
    profileStudentId: string | null;
    onViewStudentProfile: (studentId: string) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ activeView, setActiveView, userRole, profileStudentId, onViewStudentProfile }) => {
    switch (activeView) {
        case ADMIN_VIEWS.DASHBOARD:
            return <DashboardHome setActiveView={setActiveView} />;
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
        case ADMIN_VIEWS.COMPREHENSIVE_ENTRY:
            return <ComprehensiveReportEntry />;
        case ADMIN_VIEWS.PROMOTIONS:
            return <Promotions />;
        case ADMIN_VIEWS.ATTENDANCE:
            return <Attendance />;
        case ADMIN_VIEWS.SETTINGS:
            return <SchoolSettings />;
        case ADMIN_VIEWS.BURSARY:
            return <Bursary />;
        case ADMIN_VIEWS.COMMUNICATIONS:
            return <CommunicationsDashboard setActiveView={setActiveView}/>;
        case ADMIN_VIEWS.AI_TOOLS:
            return <AITools setActiveView={setActiveView} />;
        case ADMIN_VIEWS.ANALYTICS:
            return <AdvancedAnalytics />;
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
        default:
            return <DashboardHome setActiveView={setActiveView} />;
    }
};

export default DashboardContent;