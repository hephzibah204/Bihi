import React from 'react';
import DemoSchoolLandingPage from './DemoSchoolLandingPage';

// This component was likely the original name for DemoSchoolLandingPage.
// It now wraps the correct component to ensure any legacy imports don't fail.
const DemoRoleSelector = ({ onSelectProfile }) => {
    return <DemoSchoolLandingPage onSelectProfile={onSelectProfile} />;
};

export default DemoRoleSelector;