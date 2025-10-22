import React from 'react';

const ThemeManager = () => (
    <div className="space-y-6">
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6 rounded-xl">
            <h1 className="text-2xl font-bold mb-2">Theme Manager</h1>
            <p className="opacity-80">Customize platform appearance and branding</p>
        </div>
        
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Theme Manager</h3>
            <p className="text-slate-600 mb-6">Customize platform appearance and branding</p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Configure ThemeManager
            </button>
        </div>
    </div>
);

export default ThemeManager;