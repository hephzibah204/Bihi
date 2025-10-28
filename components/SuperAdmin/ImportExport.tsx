import React from 'react';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

const ImportExport = () => {
  const { can, loaded } = usePlatformPermission();
  const allowed = can('manage_integrations');

  if (loaded && !allowed) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-1">Access restricted</h3>
        <p className="text-sm text-red-700">You do not have permission to use import/export tools (manage_integrations).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">Import / Export</h1>
        <p className="text-teal-100">Bulk migrate data in and out of the platform</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <p className="text-slate-600">This module will provide CSV/JSON importers and exporters for tenants, users, and content.</p>
        <ul className="list-disc pl-5 mt-3 text-sm text-slate-600">
          <li>Export CSV/JSON for analytics or backup</li>
          <li>Import standardized templates</li>
          <li>Preview & validate before applying</li>
        </ul>
      </div>
    </div>
  );
};

export default ImportExport;
