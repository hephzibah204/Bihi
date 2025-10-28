import React from 'react';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

const AccessControl = () => {
  const { can, loaded } = usePlatformPermission();
  const allowed = can('manage_users');

  if (loaded && !allowed) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-1">Access restricted</h3>
        <p className="text-sm text-red-700">You do not have permission to manage access control (manage_users).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-600 to-slate-800 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Access Control</h1>
        <p className="text-slate-200">Manage role permissions and platform access policies</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <p className="text-slate-600">This module will provide a UI for managing role permissions already enforced across the app.</p>
        <ul className="list-disc pl-5 mt-3 text-sm text-slate-600">
          <li>Review and edit role-based permissions</li>
          <li>Assign roles to users</li>
          <li>Audit recent access changes</li>
        </ul>
      </div>
    </div>
  );
};

export default AccessControl;
