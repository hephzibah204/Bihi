import React, { lazy, Suspense } from 'react';
import { ParentView } from '../types';
import { PARENT_VIEWS, USER_ROLES } from '../utils/constants';
import SpinnerIcon from './icons/SpinnerIcon';

const ParentHome = lazy(() => import('./ParentHome'));
const ParentResults = lazy(() => import('./ParentResults'));
const ParentFees = lazy(() => import('./ParentFees'));
const ParentAttendance = lazy(() => import('./ParentAttendance'));
const ParentBehavioral = lazy(() => import('./ParentBehavioral'));
const ParentAssignments = lazy(() => import('./ParentAssignments'));
const DirectMessages = lazy(() => import('./DirectMessages'));
const ParentProfile = lazy(() => import('./ParentProfile'));
const ParentEvents = lazy(() => import('./ParentEvents'));
const ParentAbsenceReport = lazy(() => import('./ParentAbsenceReport'));

const ContentLoader = () => (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
    </div>
);

interface ParentDashboardContentProps {
    activeView: ParentView;
    setActiveView: (view: ParentView) => void;
    demoUserId?: string | null;
}

const ParentDashboardContent: React.FC<ParentDashboardContentProps> = ({ activeView, setActiveView, demoUserId }) => {
    return (
        <Suspense fallback={<ContentLoader />}>
            {(() => {
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
                    case PARENT_VIEWS.ASSIGNMENTS:
                        return <ParentAssignments demoUserId={demoUserId} />;
                    case PARENT_VIEWS.MESSAGES:
                        return <DirectMessages />;
                    case PARENT_VIEWS.PROFILE:
                        return <ParentProfile demoUserId={demoUserId} />;
                    case PARENT_VIEWS.EVENTS:
                        return <ParentEvents />;
                    case PARENT_VIEWS.REPORT_ABSENCE:
                        return <ParentAbsenceReport demoUserId={demoUserId}/>;
                    default:
                        return <ParentHome setActiveView={setActiveView} demoUserId={demoUserId} />;
                }
            })()}
        </Suspense>
    );
};

export default ParentDashboardContent;
