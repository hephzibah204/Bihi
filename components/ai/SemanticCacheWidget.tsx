// components/ai/SemanticCacheWidget.tsx
import React, { useState, useEffect } from 'react';
import { getCacheStats, clearSemanticCache } from '@/services/semanticSearchUtils';

interface CacheStats {
    documentCount: number;
    vocabularySize: number;
    avgVectorDimensions: number;
    indexedTerms: string[];
}

export const SemanticCacheWidget: React.FC = () => {
    const [stats, setStats] = useState<CacheStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = () => {
        try {
            setLoading(true);
            const cacheStats = getCacheStats();
            setStats(cacheStats);
        } catch (error) {
            console.error('Failed to load cache stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = () => {
        try {
            clearSemanticCache();
            setShowConfirmClear(false);
            loadStats();
        } catch (error) {
            console.error('Failed to clear cache:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <p className="text-red-600">Failed to load cache statistics</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Semantic Cache
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                </span>
            </div>

            <div className="space-y-4">
                {/* Cache Statistics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Cached Responses</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.documentCount}
                        </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Vocabulary Size</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {stats.vocabularySize}
                        </div>
                    </div>
                </div>

                {/* Performance Indicator */}
                <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">
                        {stats.documentCount > 0 
                            ? '70%+ faster responses on cache hits' 
                            : 'No cached responses yet'}
                    </span>
                </div>

                {/* Indexed Terms Preview */}
                {stats.indexedTerms.length > 0 && (
                    <div>
                        <div className="text-xs text-gray-600 mb-2">Indexed Terms (sample)</div>
                        <div className="flex flex-wrap gap-2">
                            {stats.indexedTerms.slice(0, 10).map((term, idx) => (
                                <span 
                                    key={idx}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                                >
                                    {term}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                    <button
                        onClick={loadStats}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowConfirmClear(true)}
                        disabled={stats.documentCount === 0}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Clear Cache
                    </button>
                </div>
            </div>

            {/* Confirm Clear Dialog */}
            {showConfirmClear && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md">
                        <h4 className="text-lg font-semibold mb-4">Clear Semantic Cache?</h4>
                        <p className="text-gray-600 mb-6">
                            This will remove all {stats.documentCount} cached responses. 
                            The cache will rebuild automatically as you use the system.
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowConfirmClear(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearCache}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Clear Cache
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};