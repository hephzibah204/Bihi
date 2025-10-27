// components/AIFallbackDashboard.tsx
// Dashboard for monitoring AI service health and fallback usage

import React, { useState, useEffect, useCallback } from 'react';
import { getGeminiAIService } from '../services/geminiAIService';
import { getHuggingFaceClient } from '../services/huggingFaceAPI';

interface AIServiceStatus {
    name: string;
    status: 'active' | 'fallback' | 'error' | 'unknown';
    lastChecked: number;
    responseTime?: number;
    errorMessage?: string;
    usageCount: number;
    fallbackCount: number;
}

interface FallbackStats {
    gemini: { success: number; failed: number; avgResponseTime: number };
    huggingface: { success: number; failed: number; avgResponseTime: number };
    templates: { used: number };
    total: { requests: number; fallbackRate: number };
}

const AIFallbackDashboard: React.FC = () => {
    const [services, setServices] = useState<AIServiceStatus[]>([]);
    const [stats, setStats] = useState<FallbackStats>({
        gemini: { success: 0, failed: 0, avgResponseTime: 0 },
        huggingface: { success: 0, failed: 0, avgResponseTime: 0 },
        templates: { used: 0 },
        total: { requests: 0, fallbackRate: 0 }
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Stable accessor for counts stored in localStorage
    const getLocalStorageCount = useCallback((key: string): number => {
        if (typeof window === 'undefined') return 0;
        try {
            return parseInt(localStorage.getItem(key) || '0', 10);
        } catch {
            return 0;
        }
    }, []);

    const loadStats = useCallback(() => {
        // Load from localStorage (in real app, this would be from database)
        const geminiSuccess = getLocalStorageCount('gemini_success') || 0;
        const geminiFailed = getLocalStorageCount('gemini_failed') || 0;
        const hfSuccess = getLocalStorageCount('hf_success') || 0;
        const hfFailed = getLocalStorageCount('hf_failed') || 0;
        const templateUsed = getLocalStorageCount('template_usage') || 0;

        const totalRequests = geminiSuccess + geminiFailed;
        const fallbackRate = totalRequests > 0 ? (geminiFailed / totalRequests) * 100 : 0;

        setStats({
            gemini: {
                success: geminiSuccess,
                failed: geminiFailed,
                avgResponseTime: 1200
            },
            huggingface: {
                success: hfSuccess,
                failed: hfFailed,
                avgResponseTime: 2500
            },
            templates: {
                used: templateUsed
            },
            total: {
                requests: totalRequests,
                fallbackRate: Math.round(fallbackRate)
            }
        });
    }, [getLocalStorageCount]);



    const checkGeminiService = useCallback(async (): Promise<AIServiceStatus> => {
        const startTime = Date.now();
        
        try {
            const geminiService = getGeminiAIService();
            const status = geminiService.getStatus();
            
            const responseTime = Date.now() - startTime;

            return {
                name: 'Gemini AI (Primary)',
                status: status.geminiAvailable ? 'active' : 'error',
                lastChecked: status.lastGeminiCheck,
                responseTime,
                errorMessage: status.lastGeminiError,
                usageCount: getLocalStorageCount('gemini_usage') || 0,
                fallbackCount: getLocalStorageCount('gemini_fallbacks') || 0
            };
        } catch (error) {
            return {
                name: 'Gemini AI (Primary)',
                status: 'error',
                lastChecked: Date.now(),
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                usageCount: 0,
                fallbackCount: 0
            };
        }
    }, [getLocalStorageCount]);

    const checkHuggingFaceService = useCallback(async (): Promise<AIServiceStatus> => {
        try {
            const hfClient = getHuggingFaceClient();
            
            if (!hfClient.hasApiKey()) {
                return {
                    name: 'HuggingFace (Backup)',
                    status: 'unknown',
                    lastChecked: Date.now(),
                    errorMessage: 'API key not configured',
                    usageCount: 0,
                    fallbackCount: 0
                };
            }

            return {
                name: 'HuggingFace (Backup)',
                status: 'active',
                lastChecked: Date.now(),
                responseTime: 0,
                usageCount: getLocalStorageCount('hf_usage') || 0,
                fallbackCount: 0
            };
        } catch (error) {
            return {
                name: 'HuggingFace (Backup)',
                status: 'error',
                lastChecked: Date.now(),
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                usageCount: 0,
                fallbackCount: 0
            };
        }
    }, [getLocalStorageCount]);

    const checkAllServices = useCallback(async () => {
        setIsRefreshing(true);
        
        const serviceStatuses: AIServiceStatus[] = [];

        // Check Gemini
        const geminiStatus = await checkGeminiService();
        serviceStatuses.push(geminiStatus);

        // Check HuggingFace
        const hfStatus = await checkHuggingFaceService();
        serviceStatuses.push(hfStatus);

        // Template system is always available
        serviceStatuses.push({
            name: 'Template System',
            status: 'active',
            lastChecked: Date.now(),
            responseTime: 10,
            usageCount: getLocalStorageCount('template_usage') || 0,
            fallbackCount: 0
        });

        setServices(serviceStatuses);
        setIsRefreshing(false);
    }, [checkGeminiService, checkHuggingFaceService, getLocalStorageCount]);

    useEffect(() => {
        checkAllServices();
        loadStats();
        
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            checkAllServices();
            loadStats();
        }, 30000);

        return () => clearInterval(interval);
    }, [checkAllServices, loadStats]);


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'fallback': return 'bg-yellow-100 text-yellow-800';
            case 'error': return 'bg-red-100 text-red-800';
            case 'unknown': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return '✓';
            case 'fallback': return '⚠';
            case 'error': return '✗';
            case 'unknown': return '?';
            default: return '•';
        }
    };

    const formatTime = (timestamp: number) => {
        if (!timestamp) return 'Never';
        const now = Date.now();
        const diffSeconds = Math.floor((now - timestamp) / 1000);
        
        if (diffSeconds < 60) return `${diffSeconds}s ago`;
        if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
        return `${Math.floor(diffSeconds / 3600)}h ago`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Service Monitor</h2>
                    <p className="text-sm text-gray-500 mt-1">Real-time status of AI services and fallback systems</p>
                </div>
                <button
                    onClick={checkAllServices}
                    disabled={isRefreshing}
                    className="btn btn-secondary flex items-center gap-2"
                >
                    <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card p-6">
                    <div className="text-sm text-gray-500">Total Requests</div>
                    <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total.requests}</div>
                </div>
                <div className="card p-6">
                    <div className="text-sm text-gray-500">Fallback Rate</div>
                    <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.total.fallbackRate}%</div>
                </div>
                <div className="card p-6">
                    <div className="text-sm text-gray-500">Gemini Success</div>
                    <div className="text-3xl font-bold text-green-600 mt-2">{stats.gemini.success}</div>
                </div>
                <div className="card p-6">
                    <div className="text-sm text-gray-500">Template Usage</div>
                    <div className="text-3xl font-bold text-blue-600 mt-2">{stats.templates.used}</div>
                </div>
            </div>

            {/* Service Status Cards */}
            <div className="card">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Service Status</h3>
                </div>
                <div className="divide-y">
                    {services.map((service, index) => (
                        <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{getStatusIcon(service.status)}</div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{service.name}</h4>
                                            <p className="text-sm text-gray-500">
                                                Last checked: {formatTime(service.lastChecked)}
                                            </p>
                                        </div>
                                    </div>
                                    {service.errorMessage && (
                                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                            {service.errorMessage}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <div className="text-sm text-gray-500">Usage</div>
                                        <div className="text-lg font-semibold">{service.usageCount}</div>
                                    </div>
                                    {service.responseTime !== undefined && (
                                        <div className="text-right">
                                            <div className="text-sm text-gray-500">Response Time</div>
                                            <div className="text-lg font-semibold">{service.responseTime}ms</div>
                                        </div>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                                        {service.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fallback Tier Info */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Fallback Hierarchy</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                        <div>
                            <div className="font-medium">Gemini API (Primary)</div>
                            <div className="text-sm text-gray-600">Google's advanced AI model</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                        <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                        <div>
                            <div className="font-medium">Semantic Cache</div>
                            <div className="text-sm text-gray-600">Previously generated responses (70%+ similarity)</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                        <div>
                            <div className="font-medium">HuggingFace API (Optional)</div>
                            <div className="text-sm text-gray-600">Alternative AI models when configured</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                        <div>
                            <div className="font-medium">Enhanced Templates</div>
                            <div className="text-sm text-gray-600">500+ pre-written responses (Nigerian curriculum)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Chart */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Service Performance</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Gemini Success Rate</span>
                            <span className="text-sm text-gray-600">
                                {stats.gemini.success + stats.gemini.failed > 0 
                                    ? Math.round((stats.gemini.success / (stats.gemini.success + stats.gemini.failed)) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-green-500 transition-all"
                                style={{ 
                                    width: `${stats.gemini.success + stats.gemini.failed > 0 
                                        ? (stats.gemini.success / (stats.gemini.success + stats.gemini.failed)) * 100
                                        : 0}%` 
                                }}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">HuggingFace Success Rate</span>
                            <span className="text-sm text-gray-600">
                                {stats.huggingface.success + stats.huggingface.failed > 0 
                                    ? Math.round((stats.huggingface.success / (stats.huggingface.success + stats.huggingface.failed)) * 100)
                                    : 0}%
                            </span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-yellow-500 transition-all"
                                style={{ 
                                    width: `${stats.huggingface.success + stats.huggingface.failed > 0 
                                        ? (stats.huggingface.success / (stats.huggingface.success + stats.huggingface.failed)) * 100
                                        : 0}%` 
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIFallbackDashboard;
