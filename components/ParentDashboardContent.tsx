import React from 'react';
import ParentHome from './ParentHome';
import ParentAttendance from './ParentAttendance';
import ParentBehavioral from './ParentBehavioral';
import ParentTutor from './ParentTutor';
// Fix: Import ParentView from the central types file to break a circular dependency.
import { ParentView } from '../types';
import NotificationViewer from './NotificationViewer';

interface ParentDashboardContentProps {
    activeView: ParentView;
    demoUserId?: string | null;
}

const ParentDashboardContent = ({ activeView, demoUserId }: ParentDashboardContentProps) => {
    switch(activeView) {
        case 'dashboard':
            return <ParentHome demoUserId={demoUserId} />;
        case 'attendance':
            return <ParentAttendance demoUserId={demoUserId} />;
        case 'behavioral':
            return <ParentBehavioral demoUserId={demoUserId} />;
        case 'tutor':
            return <ParentTutor />;
        case 'notifications':
            return <NotificationViewer demoUserId={demoUserId} />;
        default:
            return <ParentHome demoUserId={demoUserId} />;
    }
};

export default ParentDashboardContent;