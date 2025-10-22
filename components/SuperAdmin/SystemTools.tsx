import React, { useState } from 'react';

type ToolCategory = 'maintenance' | 'automation' | 'debug';

const SystemTools = () => {
    const [activeCategory, setActiveCategory] = useState<ToolCategory>('maintenance');

    const quickActions = [
        { label: 'Run Health Check', icon: '🩺' },
        { label: 'Purge Cache', icon: '🧹' },
        { label: 'Restart Workers', icon: '♻️' },
        { label: 'Sync Permissions', icon: '🔄' }
    ];

    const renderCategory = () => {
        switch (activeCategory) {
            case 'automation':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[{ title: 'Scheduled Jobs', description: 'Overview of cron jobs and queue automation.', status: '12 active' }, { title: 'Webhooks Monitor', description: 'Track webhook deliveries and retries.', status: '98% success' }, { title: 'Data Pipelines', description: 'Nightly data sync to analytics warehouse.', status: 'On schedule' }, { title: 'AI Automations', description: 'Autonomous tasks orchestrated by Copilot.', status: '5 workflows' }].map(card => (
                            <div key={card.title} className="p-5 bg-white border border-slate-200 rounded-xl">
                                <h4 className="text-sm font-semibold text-slate-900">{card.title}</h4>
                                <p className="text-sm text-slate-500 mt-2">{card.description}</p>
                                <p className="text-xs font-semibold text-blue-600 mt-4">{card.status}</p>
                            </div>
                        ))}
                    </div>
                );
            case 'debug':
                return (
                    <div className="space-y-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Live Logs</h4>
                            <div className="h-40 bg-slate-900 text-slate-200 font-mono text-xs p-4 rounded-lg overflow-y-auto">
                                <p>[07:10:14] api: request completed · 204ms · /v1/reports</p>
                                <p>[07:10:12] worker: payment reconciliation job queued</p>
                                <p>[07:09:56] ai-engine: model warm start complete</p>
                                <p>[07:09:42] webhook: delivery succeeded · 201 Created</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[{ label: 'Error Rate', value: '0.23%' }, { label: 'Slow Requests', value: '8' }, { label: 'Retry Queue', value: '3 jobs' }, { label: 'Feature Flags', value: '17 enabled' }].map(item => (
                                <div key={item.label} className="p-4 bg-white border border-slate-200 rounded-xl">
                                    <p className="text-xs text-slate-500 uppercase">{item.label}</p>
                                    <p className="text-xl font-semibold text-slate-900 mt-2">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'maintenance':
            default:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[{ title: 'Database Maintenance', description: 'Vacuum, analyze and index optimization routines.', status: 'Scheduled nightly' }, { title: 'File Storage Cleanup', description: 'Lifecycle policies for archived documents.', status: 'Auto-managed' }, { title: 'Security Hardening', description: 'Latest patches applied Jan 18, 2025.', status: 'Compliant' }].map(item => (
                                <div key={item.title} className="p-5 bg-white border border-slate-200 rounded-xl">
                                    <h4 className="text-sm font-semibold text-slate-900">{item.title}</h4>
                                    <p className="text-sm text-slate-500 mt-2">{item.description}</p>
                                    <p className="text-xs font-semibold text-emerald-600 mt-4">{item.status}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-6">
                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Maintenance Window</h4>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">Saturday · 2:00 AM - 4:00 AM WAT</p>
                                    <p className="text-sm text-slate-500">Automated failover ensures no downtime for parent portals.</p>
                                </div>
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    ✏️ Edit Window
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    const categories: { id: ToolCategory; label: string; icon: string }[] = [
        { id: 'maintenance', label: 'Maintenance', icon: '🛠️' },
        { id: 'automation', label: 'Automation', icon: '🤖' },
        { id: 'debug', label: 'Debugging', icon: '🧪' }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">System Tools</h1>
                        <p className="text-sm text-slate-500 mt-1">Run maintenance utilities, automation workflows, and diagnostic tools.</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        ⚙️ Launch Terminal
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                                activeCategory === category.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {quickActions.map(action => (
                    <button
                        key={action.label}
                        className="p-4 bg-slate-900 text-white rounded-xl flex flex-col items-start space-y-3 hover:bg-slate-800 transition-colors"
                    >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="text-sm font-semibold">{action.label}</span>
                    </button>
                ))}
            </div>

            {renderCategory()}
        </div>
    );
};

export default SystemTools;

