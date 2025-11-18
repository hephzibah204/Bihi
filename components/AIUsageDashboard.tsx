// components/AIUsageDashboard.tsx
// Monitoring dashboard for AI usage, costs, and performance metrics

import React, { useState, useEffect } from 'react';
import { getAIRouter, type AIProvider } from '../services/aiRouter';

interface UsageStats {
  totalConversations: number;
  providerDistribution: Record<AIProvider, number>;
  averageComplexity: number;
  totalCost: number;
}

export const AIUsageDashboard: React.FC = () => {
  const router = getAIRouter();
  const [stats, setStats] = useState<UsageStats>(router.getUsageStats());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Refresh stats every 5 seconds
    const interval = setInterval(() => {
      setStats(router.getUsageStats());
      setRefreshKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const handleRefresh = () => {
    setStats(router.getUsageStats());
    setRefreshKey(prev => prev + 1);
  };

  const handleClearOldConversations = () => {
    const cleared = router.clearOldConversations(24);
    alert(`Cleared ${cleared} conversations older than 24 hours`);
    handleRefresh();
  };

  // Calculate total requests
  const totalRequests = Object.values(stats.providerDistribution).reduce((a, b) => a + b, 0);

  // Calculate percentages
  const getPercentage = (provider: AIProvider) => {
    if (totalRequests === 0) return '0';
    return ((stats.providerDistribution[provider] / totalRequests) * 100).toFixed(1);
  };

  // Get provider color
  const getProviderColor = (provider: AIProvider) => {
    switch (provider) {
      case 'gemini': return 'bg-purple-500';
      case 'huggingface': return 'bg-blue-500';
      case 'offline': return 'bg-orange-500';
      case 'templates': return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  // Estimate monthly cost based on current usage
  const estimateMonthlyCost = () => {
    const requestsPerDay = totalRequests / Math.max(stats.totalConversations, 1);
    const monthlyRequests = requestsPerDay * 30;
    const geminiPercentage = parseFloat(getPercentage('gemini')) / 100;
    return (monthlyRequests * geminiPercentage * 0.015).toFixed(2);
  };

  // Calculate savings compared to pure Gemini
  const calculateSavings = () => {
    const pureGeminiCost = (totalRequests * 0.015);
    const actualCost = stats.totalCost || parseFloat(estimateMonthlyCost());
    return (pureGeminiCost - actualCost).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">AI Usage Analytics</h2>
            <p className="opacity-90">
              Monitor AI provider usage, costs, and performance metrics
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-600 text-sm mb-1">Total Conversations</div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalConversations}</div>
          <div className="text-xs text-slate-500 mt-1">Active sessions</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-600 text-sm mb-1">Total Requests</div>
          <div className="text-3xl font-bold text-slate-900">{totalRequests}</div>
          <div className="text-xs text-slate-500 mt-1">AI generations</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-600 text-sm mb-1">Avg Complexity</div>
          <div className="text-3xl font-bold text-slate-900">
            {stats.averageComplexity.toFixed(0)}/100
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {stats.averageComplexity < 35 ? 'Simple tasks' : 
             stats.averageComplexity < 60 ? 'Medium tasks' : 
             'Complex tasks'}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-600 text-sm mb-1">Estimated Monthly</div>
          <div className="text-3xl font-bold text-green-600">
            ${estimateMonthlyCost()}
          </div>
          <div className="text-xs text-green-500 mt-1">
            💰 Save ${calculateSavings()} vs pure Gemini
          </div>
        </div>
      </div>

      {/* Provider Distribution */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Provider Distribution
        </h3>

        {/* Visual Distribution Bar */}
        <div className="mb-6">
          <div className="h-8 flex rounded-lg overflow-hidden">
            {(['gemini', 'huggingface', 'anthropic', 'openrouter', 'openai', 'offline', 'templates'] as AIProvider[]).map((provider) => {
              const percentage = parseFloat(getPercentage(provider));
              if (percentage === 0) return null;
              return (
                <div
                  key={provider}
                  className={`${getProviderColor(provider)} flex items-center justify-center text-white text-xs font-medium`}
                  style={{ width: `${percentage}%` }}
                  title={`${provider}: ${percentage}%`}
                >
                  {percentage > 10 && `${percentage}%`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="space-y-3">
          {(['gemini', 'huggingface', 'anthropic', 'openrouter', 'openai', 'offline', 'templates'] as AIProvider[]).map((provider) => {
            const count = stats.providerDistribution[provider];
            const percentage = getPercentage(provider);
            
            return (
              <div key={provider} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getProviderColor(provider)} mr-3`}></div>
                  <div>
                    <div className="font-medium capitalize">
                      {provider === 'huggingface' ? 'HuggingFace' : provider}
                    </div>
                    <div className="text-xs text-slate-500">
                      {provider === 'gemini' && 'Premium AI - Complex tasks'}
                      {provider === 'huggingface' && 'Free tier - Simple tasks'}
                      {provider === 'offline' && 'Local engine (tools + RAG)'}
                      {provider === 'templates' && 'Template fallback'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{count} requests</div>
                  <div className="text-sm text-slate-600">{percentage}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Period */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">💰</span>
            Cost Analysis
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600">Gemini Usage</span>
              <span className="font-semibold">
                {stats.providerDistribution.gemini} requests
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600">HuggingFace Usage</span>
              <span className="font-semibold text-green-600">
                {stats.providerDistribution.huggingface} requests (Free)
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-slate-600">Cost per request (avg)</span>
              <span className="font-semibold">
                ${totalRequests > 0 ? (stats.totalCost / totalRequests).toFixed(4) : '0.0000'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 bg-green-50 p-3 rounded-lg">
              <span className="font-semibold text-green-800">Total Savings</span>
              <span className="font-bold text-green-600">
                ${calculateSavings()}
              </span>
            </div>
          </div>
        </div>

        {/* Projections */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Monthly Projections
          </h3>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-slate-600 mb-2">Current Strategy (Hybrid)</div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-blue-600">
                  ${estimateMonthlyCost()}
                </span>
                <span className="text-slate-500 ml-2">/month</span>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">If Pure Gemini:</span>
                <span className="font-semibold text-slate-900">$150.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">If Pure HuggingFace:</span>
                <span className="font-semibold text-green-600">$9.00</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t">
                <span className="text-green-700">Your Savings:</span>
                <span className="text-green-600">
                  {((150 - parseFloat(estimateMonthlyCost())) / 150 * 100).toFixed(0)}% 
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="text-xs text-blue-900">
                💡 <strong>Optimization Tip:</strong> Your current usage pattern is 
                {parseFloat(getPercentage('gemini')) > 70 ? ' Gemini-heavy. Consider enabling auto-routing.' :
                 parseFloat(getPercentage('huggingface')) > 50 ? ' cost-optimized! Great job.' :
                 ' well-balanced.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">⚡</span>
          Performance Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-purple-900 font-semibold mb-2">🤖 Gemini</div>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {getPercentage('gemini')}%
            </div>
            <div className="text-xs text-purple-700">
              Used for high-complexity tasks and conversations
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-blue-900 font-semibold mb-2">🤗 HuggingFace</div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {getPercentage('huggingface')}%
            </div>
            <div className="text-xs text-blue-700">
              Used for simple, structured tasks (quizzes, lists)
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="text-slate-900 font-semibold mb-2">📋 Templates</div>
            <div className="text-2xl font-bold text-slate-600 mb-1">
              {getPercentage('templates')}%
            </div>
            <div className="text-xs text-slate-700">
              Offline fallback when APIs unavailable
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🛠️</span>
          Maintenance
        </h3>

        <div className="flex gap-3">
          <button
            onClick={handleClearOldConversations}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Clear Old Conversations (24h+)
          </button>
          <button
            onClick={() => {
              setStats({
                totalConversations: 0,
                providerDistribution: { gemini: 0, huggingface: 0, auto: 0, offline: 0, templates: 0 },
                averageComplexity: 0,
                totalCost: 0
              });
            }}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Reset Statistics (Dev Only)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIUsageDashboard;
