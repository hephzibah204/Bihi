import React from 'react';
import { ParentView } from '../types';
import ParentHome from './ParentHome';
import ParentResults from './ParentResults';
import ParentAttendance from './ParentAttendance';
import ParentBehavioral from './ParentBehavioral';
import NotificationViewer from './NotificationViewer';
import ParentAssignments from './ParentAssignments';
import { PARENT_VIEWS } from '../utils/constants';


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
        case PARENT_VIEWS.ATTENDANCE:
            return <ParentAttendance demoUserId={demoUserId} />;
        case PARENT_VIEWS.BEHAVIORAL:
            return <ParentBehavioral demoUserId={demoUserId} />;
        case PARENT_VIEWS.NOTIFICATIONS:
            return <NotificationViewer demoUserId={demoUserId} />;
         case PARENT_VIEWS.ASSIGNMENTS:
            return <ParentAssignments demoUserId={demoUserId} />;
        default:
            return <ParentHome setActiveView={setActiveView} demoUserId={demoUserId} />;
    }
};

export default ParentDashboardContent;
