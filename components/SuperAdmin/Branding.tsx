import React from 'react';
import { usePlatformPermission } from '../../utils/usePlatformPermission';

const Branding = () => {
  const { can, loaded } = usePlatformPermission();
  const allowed = can('manage_content');

  if (loaded && !allowed) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-red-800 font-semibold mb-1">Access restricted</h3>
        <p className="text-sm text-red-700">You do not have permission to manage branding (manage_content).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white p-6 rounded-xl">
        <h1 className="text-2xl font-bold mb-2">White Label & Branding</h1>
        <p className="text-pink-100">Customize logos, colors, and brand assets across the platform</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <p className="text-slate-600">This module will centralize white-label options like logo, favicon, brand colors, and email templates.</p>
        <ul className="list-disc pl-5 mt-3 text-sm text-slate-600">
          <li>Upload logos and favicons</li>
          <li>Configure brand colors and typography</li>
          <li>Preview platform-wide appearance</li>
        </ul>
      </div>
    </div>
  );
};

export default Branding;
