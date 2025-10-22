import React from 'react';

const SecurityCenter = () => {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Security Center</h1>
                <p className="text-red-100">Advanced security monitoring and threat protection</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="text-4xl mb-4">🛡️</div>
                    <h3 className="font-semibold mb-2">Firewall Status</h3>
                    <p className="text-green-600 font-medium">Protected</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="font-semibold mb-2">Threat Detection</h3>
                    <p className="text-green-600 font-medium">Active</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="text-4xl mb-4">🔐</div>
                    <h3 className="font-semibold mb-2">SSL Certificate</h3>
                    <p className="text-green-600 font-medium">Valid</p>
                </div>
            </div>
        </div>
    );
};

export default SecurityCenter;