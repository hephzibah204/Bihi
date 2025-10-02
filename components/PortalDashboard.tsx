// This component is redundant and no longer in use. The main Dashboard component in Dashboard.tsx handles all portal logic. It can be safely deleted.
import React from 'react';
import MainDashboard from '../Dashboard';

const PortalDashboard = () => {
  return <MainDashboard />;
};

export default PortalDashboard;
