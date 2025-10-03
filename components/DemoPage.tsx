import React, { useState } from 'react';
import DemoSchoolLandingPage from './DemoSchoolLandingPage';
import Dashboard from './Dashboard';
import { USER_ROLES } from '../utils/constants';

const DemoPage = () => {
    const [selectedProfile, setSelectedProfile] = useState<{ role: string, userId?: string } | null>(null);

    React.useEffect(() => {
        // Set a flag in sessionStorage to indicate demo mode.
        // The getSubdomain utility will check for this flag.
        sessionStorage.setItem('isDemoMode', 'true');
    }, []);

    const handleSelectProfile = (profile: { role: string, userId?: string }) => {
        const userSession = {
            role: profile.role,
            userId: profile.userId,
            // For Admin/Teacher in demo, we can just set a flag, as the Dashboard handles login state.
            // For Student/Parent, we need to fake a session.
        };

        if (profile.role === USER_ROLES.STUDENT || profile.role === USER_ROLES.PARENT) {
            sessionStorage.setItem('activeUser', JSON.stringify(userSession));
        }
        
        setSelectedProfile(profile);
    };

    if (selectedProfile) {
        // The Dashboard component will now operate in demo mode because of the sessionStorage flag.
        return <Dashboard />;
    }

    return <DemoSchoolLandingPage onSelectProfile={handleSelectProfile} />;
};

export default DemoPage;
