import React, { useState } from 'react';

type LicenseTab = 'overview' | 'tenants' | 'billing';

const LicenseManager = () => {
    const [activeTab, setActiveTab] = useState<LicenseTab>('overview');

    const licenseSummary = [
        { label: 'Active Tenants', value: 128, color: 'from-blue-500 to-indigo-500' },
        { label: 'Pending Renewals', value: 14, color: 'from-amber-500 to-orange-500' },
        { label: 'Trials', value: 22, color: 'from-emerald-500 to-teal-500' },
        { label: 'Annual Revenue', value: '₦84.6M', color: 'from-purple-500 to-fuchsia-500' }
    ];

    const renderTab = () => {
        switch (activeTab) {
            case 'tenants':
                return (
                    <div className="bg-white border border-slate-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Tenant Licenses</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">School</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Plan</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Seats</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Renewal</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-slate-600"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { school: 'Greenfield Academy', plan: 'Enterprise', seats: '450 / 500', renewal: 'Feb 12, 2025', status: 'Active' },
                                        { school: 'Lagos STEM School', plan: 'Growth', seats: '310 / 350', renewal: 'Jan 28, 2025', status: 'Due Soon' },
                                        { school: 'Unity College', plan: 'Starter', seats: '120 / 150', renewal: 'Mar 04, 2025', status: 'Trial' }
                                    ].map(tenant => (
                                        <tr key={tenant.school} className="border-t border-slate-100">
                                            <td className="py-3 px-4 font-medium text-slate-900">{tenant.school}</td>
                                            <td className="py-3 px-4 text-slate-600">{tenant.plan}</td>
                                            <td className="py-3 px-4 text-slate-600">{tenant.seats}</td>
                                            <td className="py-3 px-4 text-slate-600">{tenant.renewal}</td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        tenant.status === 'Active'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : tenant.status === 'Due Soon'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                    }`}
                                                >
                                                    {tenant.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-blue-600 font-medium">Manage</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Revenue Snapshot</h3>
                            <p className="text-sm text-slate-500 mb-6">MTD vs last month performance.</p>
                            <div className="space-y-4">
                                {[{ label: 'Monthly Recurring Revenue', value: '₦7.1M', change: '+6%' }, { label: 'Average Contract Value', value: '₦562k', change: '+3%' }, { label: 'Churn', value: '1.2%', change: '-0.4%' }].map(metric => (
                                    <div key={metric.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="text-sm text-slate-500">{metric.label}</p>
                                            <p className="text-xl font-semibold text-slate-900 mt-1">{metric.value}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-green-600">{metric.change}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Billing Events</h3>
                            <div className="space-y-3">
                                {[
                                    { event: 'Auto-charge successful', amount: '₦820,000', time: '2 hours ago' },
                                    { event: 'Invoice overdue reminder', amount: '₦430,000', time: 'Yesterday' },
                                    { event: 'Contract upgrade - Growth → Enterprise', amount: '₦1.4M', time: '2 days ago' }
                                ].map(item => (
                                    <div key={item.event} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{item.event}</p>
                                            <p className="text-xs text-slate-500 mt-1">{item.time}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-blue-600">{item.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'overview':
            default:
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">License Distribution</h3>
                            <div className="h-40 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                Distribution chart placeholder
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Usage Compliance</h3>
                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex items-center justify-between">Active seats within limit<span className="text-emerald-600 font-semibold">96%</span></li>
                                <li className="flex items-center justify-between">Modules enabled<span className="text-blue-600 font-semibold">12/14</span></li>
                                <li className="flex items-center justify-between">Storage utilization<span className="text-amber-600 font-semibold">68%</span></li>
                            </ul>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">Upcoming Renewals</h3>
                            <div className="space-y-3 text-sm text-slate-600">
                                {[
                                    { name: 'Crestfall Academy', date: 'Jan 24', plan: 'Growth' },
                                    { name: 'Beacon Schools', date: 'Jan 26', plan: 'Enterprise' },
                                    { name: 'Northern STEM', date: 'Jan 31', plan: 'Starter' }
                                ].map(renewal => (
                                    <div key={renewal.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900">{renewal.name}</p>
                                            <p className="text-xs text-slate-500">{renewal.plan} plan</p>
                                        </div>
                                        <span className="text-sm font-semibold text-blue-600">{renewal.date}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">License Manager</h1>
                        <p className="text-sm text-slate-500 mt-1">Track subscription usage, renewals, and billing performance across tenants.</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        📄 Generate Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {licenseSummary.map(item => (
                    <div key={item.label} className={`bg-gradient-to-r ${item.color} text-white p-5 rounded-xl`}>
                        <p className="text-xs text-white/80 uppercase">{item.label}</p>
                        <p className="text-2xl font-semibold mt-2">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                    {([
                        { id: 'overview', label: 'Overview', icon: '📊' },
                        { id: 'tenants', label: 'Tenants', icon: '🏫' },
                        { id: 'billing', label: 'Billing', icon: '💳' }
                    ] as { id: LicenseTab; label: string; icon: string }[]).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                                activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {renderTab()}
        </div>
    );
};

export default LicenseManager;

