// pages/admin/ai-dashboard.tsx
import React, { useState } from 'react';
import { SemanticCacheWidget } from '@/components/ai/SemanticCacheWidget';
import { HuggingFaceConfigPanel } from '@/components/ai/HuggingFaceConfigPanel';
import AIServiceTester from '@/components/AIServiceTester';
import { 
    getTrainingDataExporter, 
    generateTrainingDataReport 
} from '@/services/trainingDataExport';

export default function AISystemDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'export' | 'testing'>('testing');
    const [exportFormat, setExportFormat] = useState<'jsonl' | 'csv' | 'huggingface' | 'openai'>('jsonl');
    const [minQuality, setMinQuality] = useState(0.7);
    const [exportStatus, setExportStatus] = useState<string | null>(null);

    const handleExport = () => {
        try {
            const exporter = getTrainingDataExporter();
            exporter.exportToFile(
                { format: exportFormat, minQualityScore: minQuality },
                `dossier_training_data_${Date.now()}.${exportFormat === 'csv' ? 'csv' : 'jsonl'}`
            );
            setExportStatus('Export successful! Check your downloads.');
        } catch (error) {
            setExportStatus('Export failed. Please try again.');
        }
    };

    const handleGenerateReport = () => {
        try {
            const report = generateTrainingDataReport();
            const blob = new Blob([report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `training_data_report_${Date.now()}.md`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            setExportStatus('Report generated successfully!');
        } catch (error) {
            setExportStatus('Failed to generate report.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">AI System Dashboard</h1>
                    <p className="mt-2 text-gray-600">
                        Manage semantic search, Hugging Face integration, and training data export
                    </p>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'config'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Configuration
                        </button>
                        <button
                            onClick={() => setActiveTab('export')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'export'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Training Data Export
                        </button>
                        <button
                            onClick={() => setActiveTab('testing')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'testing'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Testing
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SemanticCacheWidget />
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                System Status
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">
                                        Enhanced Templates (500+)
                                    </span>
                                    <span className="text-green-600 font-semibold">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">
                                        Semantic Search
                                    </span>
                                    <span className="text-green-600 font-semibold">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <span className="text-sm font-medium text-gray-700">
                                        Training Data Export
                                    </span>
                                    <span className="text-blue-600 font-semibold">Available</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">
                                    Quick Stats
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="text-gray-600">Phase</div>
                                        <div className="font-semibold text-gray-900">Phase 2 Complete</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Performance</div>
                                        <div className="font-semibold text-green-600">70%+ Faster</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Templates</div>
                                        <div className="font-semibold text-gray-900">500+</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-600">Curriculum</div>
                                        <div className="font-semibold text-gray-900">Nigerian</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'config' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <HuggingFaceConfigPanel />
                        
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                System Information
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Response Generation Flow
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <ol className="text-sm space-y-2">
                                            <li className="flex items-start">
                                                <span className="text-blue-600 font-bold mr-2">1.</span>
                                                <span>Check Semantic Cache (70% similarity)</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-600 font-bold mr-2">2.</span>
                                                <span>Try Hugging Face API (if configured)</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-600 font-bold mr-2">3.</span>
                                                <span>Use Enhanced Templates (500+)</span>
                                            </li>
                                            <li className="flex items-start">
                                                <span className="text-blue-600 font-bold mr-2">4.</span>
                                                <span>Cache response for future use</span>
                                            </li>
                                        </ol>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                                        Features
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-600">
                                        <li className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Semantic search with TF-IDF</span>
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Confidence-based ranking</span>
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Nigerian curriculum alignment</span>
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Quality scoring & filtering</span>
                                        </li>
                                        <li className="flex items-center">
                                            <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>Training data export</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'export' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">
                                Export Training Data
                            </h3>

                            <div className="space-y-6">
                                {/* Format Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Export Format
                                    </label>
                                    <select
                                        value={exportFormat}
                                        onChange={(e) => setExportFormat(e.target.value as any)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="jsonl">JSONL (Standard)</option>
                                        <option value="csv">CSV (Spreadsheet)</option>
                                        <option value="huggingface">Hugging Face Format</option>
                                        <option value="openai">OpenAI Format</option>
                                    </select>
                                    <p className="mt-2 text-sm text-gray-600">
                                        {exportFormat === 'jsonl' && 'Standard format for most ML platforms'}
                                        {exportFormat === 'csv' && 'Import into Excel or Google Sheets for analysis'}
                                        {exportFormat === 'huggingface' && 'Ready for Hugging Face fine-tuning'}
                                        {exportFormat === 'openai' && 'Ready for OpenAI fine-tuning API'}
                                    </p>
                                </div>

                                {/* Quality Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Quality Score: {minQuality.toFixed(1)}
                                    </label>
                                    <input
                                        type="range"
                                        min="0.3"
                                        max="1.0"
                                        step="0.1"
                                        value={minQuality}
                                        onChange={(e) => setMinQuality(Number(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Lower (more data)</span>
                                        <span>Higher (better quality)</span>
                                    </div>
                                </div>

                                {/* Export Status */}
                                {exportStatus && (
                                    <div className={`p-3 rounded-lg ${
                                        exportStatus.includes('successful') 
                                            ? 'bg-green-50 text-green-800 border border-green-200'
                                            : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}>
                                        {exportStatus}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleExport}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Export Data
                                    </button>
                                    <button
                                        onClick={handleGenerateReport}
                                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                    >
                                        Generate Report
                                    </button>
                                </div>

                                {/* Info */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex">
                                        <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">Phase 3 Preparation</p>
                                            <p>
                                                Export training data after 3-6 months of usage. Aim for 500+ high-quality examples 
                                                for effective fine-tuning.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            {activeTab === 'testing' && (
                <div className="grid grid-cols-1 gap-6">
                    <AIServiceTester />
                </div>
            )}
            </div>
        </div>
    );
}