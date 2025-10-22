// components/ai/HuggingFaceConfigPanel.tsx
import React, { useState, useEffect } from 'react';
import { 
    getHuggingFaceClient, 
    testHuggingFaceAPIKey, 
    RECOMMENDED_MODELS,
    estimateUsage 
} from '@/services/huggingFaceAPI';

export const HuggingFaceConfigPanel: React.FC = () => {
    const [apiKey, setApiKey] = useState('');
    const [isConfigured, setIsConfigured] = useState(false);
    const [isTestingKey, setIsTestingKey] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [selectedModel, setSelectedModel] = useState(RECOMMENDED_MODELS.educational);
    const [estimatedRequests, setEstimatedRequests] = useState(50);

    useEffect(() => {
        const client = getHuggingFaceClient();
        setIsConfigured(client.hasApiKey());
    }, []);

    const handleTestKey = async () => {
        if (!apiKey.trim()) {
            setTestResult({ success: false, message: 'Please enter an API key' });
            return;
        }

        setIsTestingKey(true);
        setTestResult(null);

        try {
            const isValid = await testHuggingFaceAPIKey(apiKey);
            
            if (isValid) {
                const client = getHuggingFaceClient();
                client.setApiKey(apiKey);
                setIsConfigured(true);
                setTestResult({ 
                    success: true, 
                    message: 'API key is valid and configured successfully!' 
                });
            } else {
                setTestResult({ 
                    success: false, 
                    message: 'Invalid API key. Please check and try again.' 
                });
            }
        } catch (error) {
            setTestResult({ 
                success: false, 
                message: 'Failed to test API key. Please check your connection.' 
            });
        } finally {
            setIsTestingKey(false);
        }
    };

    const handleRemoveKey = () => {
        const client = getHuggingFaceClient();
        client.setApiKey('');
        setApiKey('');
        setIsConfigured(false);
        setTestResult(null);
    };

    const usage = estimateUsage(estimatedRequests);

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    Hugging Face API
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isConfigured 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {isConfigured ? 'Configured' : 'Not Configured'}
                </span>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                    <svg className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Optional Enhancement</p>
                        <p>
                            Add your Hugging Face API key to enable dynamic content generation. 
                            Get a free key at{' '}
                            <a 
                                href="https://huggingface.co/settings/tokens" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline hover:text-blue-900"
                            >
                                huggingface.co/settings/tokens
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {!isConfigured ? (
                <div className="space-y-4">
                    {/* API Key Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="hf_..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                            >
                                {showKey ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`p-3 rounded-lg ${
                            testResult.success 
                                ? 'bg-green-50 text-green-800 border border-green-200' 
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                            {testResult.message}
                        </div>
                    )}

                    {/* Test Button */}
                    <button
                        onClick={handleTestKey}
                        disabled={isTestingKey || !apiKey.trim()}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                    >
                        {isTestingKey ? 'Testing...' : 'Test & Save API Key'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Configured Status */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-green-800 font-medium">
                                API key configured successfully
                            </span>
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Model
                        </label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value={RECOMMENDED_MODELS.lightweight}>
                                Flan-T5 Small (Fast, 80M params)
                            </option>
                            <option value={RECOMMENDED_MODELS.educational}>
                                Flan-T5 Base (Balanced, 250M params) - Recommended
                            </option>
                            <option value={RECOMMENDED_MODELS.generalLarge}>
                                Flan-T5 Large (High Quality, 780M params)
                            </option>
                        </select>
                    </div>

                    {/* Usage Estimator */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expected Daily Requests: {estimatedRequests}
                        </label>
                        <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={estimatedRequests}
                            onChange={(e) => setEstimatedRequests(Number(e.target.value))}
                            className="w-full"
                        />
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-gray-600">Monthly:</span>
                                    <span className="ml-2 font-medium">{usage.monthlyRequests.toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Status:</span>
                                    <span className={`ml-2 font-medium ${
                                        usage.withinFreeQuota ? 'text-green-600' : 'text-orange-600'
                                    }`}>
                                        {usage.withinFreeQuota ? 'Within Free Tier' : 'Over Free Tier'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Usage:</span>
                                    <span className="ml-2 font-medium">{usage.percentageUsed.toFixed(0)}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Cost:</span>
                                    <span className="ml-2 font-medium">{usage.estimatedCost}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={handleRemoveKey}
                        className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                        Remove API Key
                    </button>
                </div>
            )}

            {/* Features Info */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">With Hugging Face Enabled:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Dynamic content generation for unique queries</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Better responses for complex educational questions</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Automatic fallback to templates if API fails</span>
                    </li>
                    <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>~30,000 free requests per month</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};