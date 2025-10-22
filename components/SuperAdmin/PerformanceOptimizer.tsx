import React, { useState } from 'react';

type OptimizationTab = 'overview' | 'database' | 'infrastructure' | 'ai';

const PerformanceOptimizer = () => {
    const [activeTab, setActiveTab] = useState<OptimizationTab>('overview');

    const optimizationScores = [
        { label: 'Overall Health', value: 92, color: 'from-green-500 to-emerald-500' },
        { label: 'Database', value: 88, color: 'from-blue-500 to-indigo-500' },
        { label: 'API Latency', value: 94, color: 'from-purple-500 to-fuchsia-500' },
        { label: 'AI Workloads', value: 86, color: 'from-amber-500 to-orange-500' }
    ];

    const recommendations = [
        {
            title: 'Optimize Query Performance',
            description: '7 queries identified with potential for indexing or caching improvements',
            impact: 'High',
            icon: '🧠'
        },
        {
            title: 'Scale Worker Pods',
            description: 'Increase background worker pods during weekday mornings to reduce queue times',
            impact: 'Medium',
            icon: '⚙️'
        },
        {
            title: 'Enable Smart Prefetch',
            description: 'AI recommendation engine can pre-compute 12 frequently accessed reports overnight',
            impact: 'Medium',
            icon: '🤖'
        }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'database':
                return (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl">
                            <h3 className="text-xl font-semibold mb-2">Database Insights</h3>
                            <p className="text-blue-100">
                                Average query latency reduced by <span className="font-semibold">18%</span> after last optimization cycle.
                            </p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h4 className="font-semibold text-slate-900 mb-4">Top Queries</h4>
                            <div className="space-y-4">
                                {[
                                    { name: 'Fee Summary Dashboard', latency: '64ms', trend: '-12%' },
                                    { name: 'Student Analytics Report', latency: '78ms', trend: '-8%' },
                                    { name: 'AI Insights Feed', latency: '92ms', trend: '-5%' }
                                ].map(query => (
                                    <div key={query.name} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-slate-900">{query.name}</p>
                                            <p className="text-sm text-slate-500">Latency: {query.latency}</p>
                                        </div>
                                        <span className="text-sm font-semibold text-green-600">{query.trend}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'infrastructure':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[{ label: 'API Latency', value: '124ms' }, { label: 'Background Jobs', value: '92% success' }, { label: 'Edge Cache Hit', value: '87%' }].map(stat => (
                                <div key={stat.label} className="bg-white border border-slate-200 p-5 rounded-lg">
                                    <p className="text-sm text-slate-500">{stat.label}</p>
                                    <p className="text-2xl font-semibold text-slate-900 mt-2">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h4 className="font-semibold text-slate-900 mb-4">Auto-scaling Timeline</h4>
                            <div className="h-48 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                Scaling activity graph placeholder
                            </div>
                        </div>
                    </div>
                );
            case 'ai':
                return (
                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6 rounded-xl">
                            <h3 className="text-xl font-semibold mb-2">AI Performance</h3>
                            <p className="text-orange-100">Smart caching enabled for 24 conversational intents and 9 report templates.</p>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h4 className="font-semibold text-slate-900 mb-4">Model Utilization</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: 'Tutor Interactions', value: '1,240', detail: '+14% week over week' },
                                    { label: 'AI Generated Reports', value: '482', detail: '+9% week over week' },
                                    { label: 'Caching Efficiency', value: '78%', detail: 'Average token savings' },
                                    { label: 'Response SLA', value: '94%', detail: 'Under 3 seconds' }
                                ].map(item => (
                                    <div key={item.label} className="p-4 bg-slate-50 rounded-lg">
                                        <p className="text-sm text-slate-500">{item.label}</p>
                                        <p className="text-xl font-semibold text-slate-900 mt-1">{item.value}</p>
                                        <p className="text-xs text-green-600 mt-1">{item.detail}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'overview':
            default:
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {optimizationScores.map(score => (
                                <div key={score.label} className={`bg-gradient-to-r ${score.color} text-white p-5 rounded-xl`}>
                                    <p className="text-sm text-white/80">{score.label}</p>
                                    <p className="text-3xl font-semibold mt-2">{score.value}%</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h4 className="font-semibold text-slate-900 mb-4">Optimization Recommendations</h4>
                            <div className="space-y-4">
                                {recommendations.map(item => (
                                    <div key={item.title} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-lg">
                                        <div className="text-3xl">{item.icon}</div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{item.title}</p>
                                            <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                                        </div>
                                        <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">{item.impact} Impact</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
        }
    };

    const tabs: { id: OptimizationTab; label: string; icon: string }[] = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'database', label: 'Database', icon: '🗄️' },
        { id: 'infrastructure', label: 'Infrastructure', icon: '🛰️' },
        { id: 'ai', label: 'AI Workloads', icon: '🤖' }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Performance Optimizer</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Monitor real-time performance signals and apply AI-assisted optimizations across the platform.
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        ⚡ Run Optimization Cycle
                    </button>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                    {tabs.map(tab => (
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

            {renderTabContent()}
        </div>
    );
};

export default PerformanceOptimizer;

