import React from 'react';
import ParentHome from './ParentHome';
import ParentAttendance from './ParentAttendance';
import ParentBehavioral from './ParentBehavioral';
// Fix: Import ParentView from the central types file to break a circular dependency.
import { ParentView } from '../types';
import NotificationViewer from './NotificationViewer';
import ParentResults from './ParentResults';

interface ParentDashboardContentProps {
    activeView: ParentView;
    demoUserId?: string | null;
    setActiveView: (view: ParentView) => void;
}

const ParentDashboardContent = ({ activeView, demoUserId, setActiveView }: ParentDashboardContentProps) => {
    switch(activeView) {
        case 'dashboard':
            return <ParentHome demoUserId={demoUserId} setActiveView={setActiveView} />;
        case 'results':
            return <ParentResults demoUserId={demoUserId} />;
        case 'attendance':
            return <ParentAttendance demoUserId={demoUserId} />;
        case 'behavioral':
            return <ParentBehavioral demoUserId={demoUserId} />;
        case 'notifications':
            return <NotificationViewer demoUserId={demoUserId} />;
        default:
            return <ParentHome demoUserId={demoUserId} setActiveView={setActiveView} />;
    }
};

export default ParentDashboardContent;
