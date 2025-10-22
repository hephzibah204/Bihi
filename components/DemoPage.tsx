

import React from 'react';
import { useNavigate } from 'react-router-dom';
import DemoSchoolLandingPage from './DemoSchoolLandingPage';
import { USER_ROLES } from '../utils/constants';

const DemoPage = () => {
    const navigate = useNavigate();

    const handleSelectProfile = (profile) => {
        // Set demo mode with additional user role information
        sessionStorage.setItem('isDemoMode', 'true');
        localStorage.setItem('isDemoMode', 'true');
        
        const sessionData = { 
            role: profile.role, 
            userId: profile.id, // For student/parent, this is the student's ID
        };
        sessionStorage.setItem('activeUser', JSON.stringify(sessionData));
        localStorage.setItem('demoUserRole', profile.role);

        // For Admin/Bursar/Teacher, we don't set an activeUser session,
        // as the Dashboard will simulate the Supabase auth state.
        if (profile.role === USER_ROLES.ADMIN || profile.role === USER_ROLES.TEACHER || profile.role === USER_ROLES.BURSAR) {
            sessionStorage.removeItem('activeUser');
        }
        
        const searchParams = new URLSearchParams();
        if (profile.role === USER_ROLES.BURSAR) {
            searchParams.set('view', 'bursary');
        }

        // Force reload to ensure all components recognize demo mode
        window.location.href = `/?${searchParams.toString()}`;
    };

    return <DemoSchoolLandingPage onSelectProfile={handleSelectProfile} />;
};

export default DemoPage;
