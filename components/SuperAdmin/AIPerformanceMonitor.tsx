import React, { useState, useEffect } from 'react';
import { getAIResponseCache } from '../../services/aiResponseCache';

const AIPerformanceMonitor = () => {
    const [stats, setStats] = useState<any>(null);
    const [cachedResponses, setCachedResponses] = useState<any[]>([]);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'cache' | 'quality'>('overview');
    const [selectedType, setSelectedType] = useState<string>('all');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const cache = getAIResponseCache();
        const cacheStats = cache.getStats();
        const responses = cache.exportCache();
        
        setStats(cacheStats);
        setCachedResponses(responses);
    };

    const clearCache = () => {
        if (confirm('Are you sure you want to clear all cached responses?')) {
            const cache = getAIResponseCache();
            cache.clearCache();
            loadData();
            alert('Cache cleared successfully!');
        }
    };

    const exportCache = () => {
        const cache = getAIResponseCache();
        const responses = cache.exportCache();
        
        const dataStr = JSON.stringify(responses, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-cache-export-${Date.now()}.json`;
        link.click();
    };

    const filteredResponses = selectedType === 'all' 
        ? cachedResponses 
        : cachedResponses.filter(r => r.metadata.promptType === selectedType);

    const cacheHitRate = stats ? (stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">AI Performance Monitor</h1>
                <p className="text-indigo-100">Monitor AI service performance, cache efficiency, and response quality</p>
            </div>

            {/* Tabs */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex space-x-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: '📊' },
                        { id: 'cache', label: 'Cache Management', icon: '💾' },
                        { id: 'quality', label: 'Quality Metrics', icon: '⭐' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                                selectedTab === tab.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {selectedTab === 'overview' && stats && (
                <div className="space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Total Cached</span>
                                <span className="text-2xl">💾</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{stats.totalCached}</div>
                            <div className="text-sm text-slate-500 mt-2">
                                {stats.geminiResponses} Gemini / {stats.fallbackResponses} Fallback
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Cache Hit Rate</span>
                                <span className="text-2xl">🎯</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{cacheHitRate}%</div>
                            <div className="text-sm text-green-600 mt-2">
                                {stats.cacheHits} hits / {stats.cacheMisses} misses
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Avg Confidence</span>
                                <span className="text-2xl">📈</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">
                                {(stats.avgConfidence * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-slate-500 mt-2">Response quality score</div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Gemini Responses</span>
                                <span className="text-2xl">✨</span>
                            </div>
                            <div className="text-3xl font-bold text-slate-900">{stats.geminiResponses}</div>
                            <div className="text-sm text-purple-600 mt-2">
                                High-quality cached
                            </div>
                        </div>
                    </div>

                    {/* Top Prompt Types */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Request Types</h3>
                        <div className="space-y-4">
                            {stats.topPromptTypes.map((item: any, index: number) => {
                                const percentage = (item.count / stats.totalCached * 100).toFixed(1);
                                return (
                                    <div key={index}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-slate-900 capitalize">
                                                {item.type.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                            <span className="text-sm text-slate-600">{item.count} requests ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Performance Insights */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="font-semibold text-blue-900 mb-3">💡 Performance Insights</h3>
                        <div className="space-y-2 text-sm text-blue-800">
                            {parseFloat(cacheHitRate) > 50 && (
                                <div className="flex items-start space-x-2">
                                    <span>✅</span>
                                    <p>Excellent cache hit rate! Your system is efficiently reusing responses.</p>
                                </div>
                            )}
                            {parseFloat(cacheHitRate) < 30 && (
                                <div className="flex items-start space-x-2">
                                    <span>⚠️</span>
                                    <p>Low cache hit rate. Consider reviewing common queries to improve caching.</p>
                                </div>
                            )}
                            {stats.geminiResponses < 100 && (
                                <div className="flex items-start space-x-2">
                                    <span>📚</span>
                                    <p>Building cache. More Gemini responses will improve fallback quality over time.</p>
                                </div>
                            )}
                            {stats.avgConfidence > 0.8 && (
                                <div className="flex items-start space-x-2">
                                    <span>⭐</span>
                                    <p>High average confidence indicates excellent response quality.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Cache Management Tab */}
            {selectedTab === 'cache' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Cached Responses</h3>
                            <p className="text-sm text-slate-500">Manage and review cached AI responses</p>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={exportCache}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                                📥 Export Cache
                            </button>
                            <button
                                onClick={clearCache}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                            >
                                🗑️ Clear Cache
                            </button>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Type</label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All Types ({cachedResponses.length})</option>
                            <option value="lessonPlan">Lesson Plans</option>
                            <option value="reportComment">Report Comments</option>
                            <option value="tutoring">Tutoring</option>
                            <option value="parentChat">Parent Chat</option>
                            <option value="financial">Financial Analysis</option>
                            <option value="general">General</option>
                        </select>
                    </div>

                    {/* Cached Responses List */}
                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                            {filteredResponses.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    <div className="text-4xl mb-2">📭</div>
                                    <p>No cached responses found</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50 sticky top-0">
                                        <tr>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Prompt</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Type</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Source</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Confidence</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Use Count</th>
                                            <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredResponses.map((response, index) => (
                                            <tr key={index} className="border-t border-slate-100 hover:bg-slate-50">
                                                <td className="py-3 px-4 text-sm text-slate-900">
                                                    <div className="max-w-xs truncate" title={response.prompt}>
                                                        {response.prompt}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-600 capitalize">
                                                    {response.metadata.promptType}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        response.source === 'gemini' 
                                                            ? 'bg-purple-100 text-purple-800' 
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {response.source}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-16 bg-slate-100 rounded-full h-2">
                                                            <div
                                                                className="bg-green-600 h-2 rounded-full"
                                                                style={{ width: `${response.metadata.confidence * 100}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-slate-600">
                                                            {(response.metadata.confidence * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-600">
                                                    {response.metadata.useCount}
                                                </td>
                                                <td className="py-3 px-4 text-sm text-slate-500">
                                                    {new Date(response.timestamp).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quality Metrics Tab */}
            {selectedTab === 'quality' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h4 className="font-semibold text-slate-900 mb-4">High Quality Responses</h4>
                            <div className="text-4xl font-bold text-green-600 mb-2">
                                {cachedResponses.filter(r => r.metadata.confidence >= 0.8).length}
                            </div>
                            <p className="text-sm text-slate-600">Confidence ≥ 80%</p>
                            <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ 
                                        width: `${(cachedResponses.filter(r => r.metadata.confidence >= 0.8).length / cachedResponses.length * 100).toFixed(0)}%` 
                                    }}
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h4 className="font-semibold text-slate-900 mb-4">Medium Quality</h4>
                            <div className="text-4xl font-bold text-yellow-600 mb-2">
                                {cachedResponses.filter(r => r.metadata.confidence >= 0.5 && r.metadata.confidence < 0.8).length}
                            </div>
                            <p className="text-sm text-slate-600">Confidence 50-80%</p>
                            <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className="bg-yellow-600 h-2 rounded-full"
                                    style={{ 
                                        width: `${(cachedResponses.filter(r => r.metadata.confidence >= 0.5 && r.metadata.confidence < 0.8).length / cachedResponses.length * 100).toFixed(0)}%` 
                                    }}
                                />
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-lg p-6">
                            <h4 className="font-semibold text-slate-900 mb-4">Low Quality</h4>
                            <div className="text-4xl font-bold text-red-600 mb-2">
                                {cachedResponses.filter(r => r.metadata.confidence < 0.5).length}
                            </div>
                            <p className="text-sm text-slate-600">Confidence < 50%</p>
                            <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
                                <div
                                    className="bg-red-600 h-2 rounded-full"
                                    style={{ 
                                        width: `${(cachedResponses.filter(r => r.metadata.confidence < 0.5).length / cachedResponses.length * 100).toFixed(0)}%` 
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quality Recommendations */}
                    <div className="bg-white border border-slate-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Quality Recommendations</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                                <span className="text-green-600">✓</span>
                                <p className="text-green-800">
                                    <strong>Excellent:</strong> Continue caching high-quality Gemini responses. 
                                    They improve fallback AI significantly.
                                </p>
                            </div>
                            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                                <span className="text-yellow-600">!</span>
                                <p className="text-yellow-800">
                                    <strong>Monitor:</strong> Review medium-quality responses periodically. 
                                    Consider user feedback to improve them.
                                </p>
                            </div>
                            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                                <span className="text-red-600">⚠</span>
                                <p className="text-red-800">
                                    <strong>Action Needed:</strong> Low-quality responses should be reviewed and potentially removed. 
                                    Improve templates or wait for better Gemini responses.
                                </p>
                            </div>
                            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                                <span className="text-blue-600">💡</span>
                                <p className="text-blue-800">
                                    <strong>Tip:</strong> Export cache regularly to analyze patterns and improve your fallback system. 
                                    High-use responses indicate common user needs.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIPerformanceMonitor;