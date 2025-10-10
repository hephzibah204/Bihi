import React from 'react';
// Fix: Use a named import to resolve module export ambiguity.
import { SuperAdminDashboard } from './SuperAdminDashboard';

const AdminDashboard = () => {
  // This file acts as a wrapper for the main SuperAdminDashboard component.
  return <SuperAdminDashboard />;
};

export default AdminDashboard;