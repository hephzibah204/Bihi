import React, { lazy } from 'react';
// Fix: Correct import path
import { ParentView } from '../types';
import { PARENT_VIEWS } from '../utils/constants';

// Lazy-loaded components
const ParentHome = lazy(() => import('./ParentHome'));
const ParentResults = lazy(() => import('./ParentResults'));
const ParentAttendance = lazy(() => import('./ParentAttendance'));
const ParentBehavioral = lazy(() => import('./ParentBehavioral'));
const NotificationViewer = lazy(() => import('./NotificationViewer'));
const ParentAssignments = lazy(() => import('./ParentAssignments'));
const DirectMessages = lazy(() => import('./DirectMessages'));
// Fix: Correct import path
const ParentFees = lazy(() => import('./ParentFees'));

interface ParentDashboardContentProps {
    activeView: ParentView;
    setActiveView: (view: ParentView) => void;
    demoUserId?: string | null;
}

const ParentDashboardContent = ({ activeView, setActiveView, demoUserId }: ParentDashboardContentProps) => {
    switch(activeView) {
        case PARENT_VIEWS.DASHBOARD:
            return <ParentHome setActiveView={setActiveView} demoUserId={demoUserId} />;
        case PARENT_VIEWS.RESULTS:
            return <ParentResults demoUserId={demoUserId} />;
        case PARENT_VIEWS.FEES:
            return <ParentFees demoUserId={demoUserId} />;
        case PARENT_VIEWS.ATTENDANCE:
            return <ParentAttendance demoUserId={demoUserId} />;
        case PARENT_VIEWS.BEHAVIORAL:
            return <ParentBehavioral demoUserId={demoUserId} />;
        case PARENT_VIEWS.NOTIFICATIONS:
            return <NotificationViewer demoUserId={demoUserId} />;
         case PARENT_VIEWS.ASSIGNMENTS:
            return <ParentAssignments demoUserId={demoUserId} />;
        case PARENT_VIEWS.MESSAGES:
            return <DirectMessages />;
        default:
            return <ParentHome setActiveView={setActiveView} demoUserId={demoUserId} />;
    }
};

export default ParentDashboardContent;
