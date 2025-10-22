// components/AIServiceTester.tsx
// Comprehensive AI service testing component

import React, { useState } from 'react';
import { getGeminiAIService } from '../services/geminiAIService';
import { getHuggingFaceClient } from '../services/huggingFaceAPI';
import { generateFallbackResponse } from '../services/fallbackAiService';
import { initializeSemanticCache, findSimilarResponses } from '../utils/semanticSearchUtils';

interface TestResult {
  service: string;
  status: 'success' | 'error' | 'testing';
  response?: string;
  error?: string;
  responseTime?: number;
}

export const AIServiceTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testPrompt, setTestPrompt] = useState('What is 2 + 2?');

  const updateTestResult = (service: string, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.service === service);
      if (existing) {
        return prev.map(r => r.service === service ? { ...r, ...result } : r);
      } else {
        return [...prev, { service, status: 'testing', ...result }];
      }
    });
  };

  const testGeminiService = async () => {
    const startTime = Date.now();
    updateTestResult('Gemini AI', { status: 'testing' });

    try {
      const geminiService = getGeminiAIService();
      const response = await geminiService.generate({
        prompt: testPrompt,
        context: { userRole: 'Teacher' as const }
      });

      const responseTime = Date.now() - startTime;

      updateTestResult('Gemini AI', {
        status: 'success',
        response: response.content,
        responseTime
      });

      return true;
    } catch (error) {
      updateTestResult('Gemini AI', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });
      return false;
    }
  };

  const testHuggingFaceService = async () => {
    const startTime = Date.now();
    updateTestResult('HuggingFace', { status: 'testing' });

    try {
      const hfClient = getHuggingFaceClient();
      
      if (!hfClient.hasApiKey()) {
        updateTestResult('HuggingFace', {
          status: 'error',
          error: 'API key not configured',
          responseTime: Date.now() - startTime
        });
        return false;
      }

      const response = await hfClient.generateText(testPrompt);
      const responseTime = Date.now() - startTime;

      updateTestResult('HuggingFace', {
        status: 'success',
        response: response.generated_text || response.toString(),
        responseTime
      });

      return true;
    } catch (error) {
      updateTestResult('HuggingFace', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });
      return false;
    }
  };

  const testFallbackService = async () => {
    const startTime = Date.now();
    updateTestResult('Fallback AI', { status: 'testing' });

    try {
      const response = generateFallbackResponse({
        prompt: testPrompt,
        context: { userRole: 'Teacher' }
      });

      const responseTime = Date.now() - startTime;

      updateTestResult('Fallback AI', {
        status: 'success',
        response,
        responseTime
      });

      return true;
    } catch (error) {
      updateTestResult('Fallback AI', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });
      return false;
    }
  };

  const testSemanticCache = async () => {
    const startTime = Date.now();
    updateTestResult('Semantic Cache', { status: 'testing' });

    try {
      // Initialize semantic cache if not already done
      await initializeSemanticCache();
      
      // Test finding similar responses
      const similarResponses = await findSimilarResponses(testPrompt, 0.7);
      const responseTime = Date.now() - startTime;

      updateTestResult('Semantic Cache', {
        status: 'success',
        response: `Found ${similarResponses.length} similar cached responses`,
        responseTime
      });

      return true;
    } catch (error) {
      updateTestResult('Semantic Cache', {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      });
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    console.log('🧪 Starting AI Services Test Suite...');

    // Test all services
    await Promise.all([
      testSemanticCache(),
      testFallbackService(),
      testHuggingFaceService(),
      testGeminiService()
    ]);

    setIsRunning(false);
    console.log('✅ AI Services Test Suite Complete');
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'testing': return '🔄';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'testing': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">AI Services Test Suite</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Test Prompt:
        </label>
        <input
          type="text"
          value={testPrompt}
          onChange={(e) => setTestPrompt(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter a test prompt..."
        />
      </div>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
        >
          {isRunning ? '🔄 Testing...' : '🧪 Run All Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {testResults.map((result) => (
          <div key={result.service} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">
                {getStatusIcon(result.status)} {result.service}
              </h3>
              <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                {result.status.toUpperCase()}
                {result.responseTime && ` (${result.responseTime}ms)`}
              </span>
            </div>
            
            {result.response && (
              <div className="mb-2">
                <p className="text-sm text-gray-600 mb-1">Response:</p>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-800 max-h-32 overflow-y-auto">
                  {result.response}
                </div>
              </div>
            )}
            
            {result.error && (
              <div className="mb-2">
                <p className="text-sm text-red-600 mb-1">Error:</p>
                <div className="bg-red-50 p-3 rounded text-sm text-red-800">
                  {result.error}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {testResults.length === 0 && !isRunning && (
        <div className="text-center py-8 text-gray-500">
          Click "Run All Tests" to test AI services
        </div>
      )}
    </div>
  );
};

export default AIServiceTester;