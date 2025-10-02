import React from 'react';
import PortalLogin from './PortalLogin';

// Fix: Accept and pass down the onStudentLoginSuccess prop to the PortalLogin component.
const SchoolLoginPage = ({ onStudentLoginSuccess }) => {
  // This component would handle the logic for displaying a school-specific login page.
  // For now, it renders the generic PortalLogin component.
  return <PortalLogin onStudentLoginSuccess={onStudentLoginSuccess} />;
};

export default SchoolLoginPage;