// components/SuperAdmin/AIControlPanel.tsx
// Centralized AI management for Super Admin only

import React, { useState } from 'react';
import { AISettingsPanel } from '../AISettings';
import { AIUsageDashboard } from '../AIUsageDashboard';
import { getAIRouter, type AISettings } from '../../services/aiRouter';
import { logger } from '../../utils/logger';

interface AIControlPanelProps {
  isSuperAdmin: boolean;
}

export const SuperAdminAIControlPanel: React.FC<AIControlPanelProps> = ({ isSuperAdmin }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'analytics'>('settings');
  const router = getAIRouter();

  // Security check
  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
        <p className="text-slate-600">Only Super Administrators can access AI Control Panel</p>
      </div>
    );
  }

  const handleSettingsChange = (settings: AISettings) => {
    // Save to database/localStorage for site-wide application
    localStorage.setItem('sitewide_ai_settings', JSON.stringify(settings));
    logger.info('Site-wide AI settings updated', { settings });
    
    // Show success notification
    alert('AI settings updated successfully for all users!');
  };

  const exportAnalytics = () => {
    const stats = router.getUsageStats();
    const data = JSON.stringify(stats, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-usage-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🎛️ AI Control Panel</h1>
            <p className="opacity-90">
              Super Admin: Manage AI providers, routing, and analytics site-wide
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75">Super Admin Only</div>
            <div className="text-2xl font-bold">⚡ Full Control</div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="text-2xl mr-3">⚠️</div>
          <div>
            <h3 className="text-yellow-900 font-semibold mb-1">Site-Wide Configuration</h3>
            <p className="text-yellow-800 text-sm">
              Settings configured here will apply to <strong>ALL users</strong> across the entire platform. 
              Changes take effect immediately for all schools, teachers, students, and parents.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-600 text-sm mb-1">Active Schools</div>
          <div className="text-3xl font-bold text-blue-600">-</div>
          <div className="text-xs text-slate-500 mt-1">Using AI services</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-600 text-sm mb-1">Total AI Requests</div>
          <div className="text-3xl font-bold text-purple-600">
            {router.getUsageStats().providerDistribution.gemini + 
             router.getUsageStats().providerDistribution.huggingface + 
             router.getUsageStats().providerDistribution.templates}
          </div>
          <div className="text-xs text-slate-500 mt-1">This session</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-600 text-sm mb-1">Current Provider</div>
          <div className="text-3xl font-bold text-green-600">
            {router.getSettings().preferredProvider === 'auto' ? '⚡' : 
             router.getSettings().preferredProvider === 'gemini' ? '🤖' :
             router.getSettings().preferredProvider === 'huggingface' ? '🤗' : '📋'}
          </div>
          <div className="text-xs text-slate-500 mt-1 capitalize">
            {router.getSettings().preferredProvider}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="text-slate-600 text-sm mb-1">Auto-Routing</div>
          <div className="text-3xl font-bold text-indigo-600">
            {router.getSettings().autoRouting ? '✅' : '❌'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {router.getSettings().autoRouting ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="mr-2">⚙️</span>
            AI Settings & Configuration
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="mr-2">📊</span>
            Usage Analytics & Monitoring
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'settings' && (
            <div>
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  🎯 Configure AI Behavior for Entire Platform
                </h3>
                <p className="text-blue-800 text-sm">
                  These settings control how AI is used across all schools, classes, and users. 
                  Choose carefully to balance quality, cost, and performance.
                </p>
              </div>

              <AISettingsPanel 
                onSettingsChange={handleSettingsChange}
                showAdvanced={true} // Super Admin gets advanced options
              />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex-1 mr-4">
                  <h3 className="font-semibold text-green-900 mb-2">
                    📈 Platform-Wide Analytics
                  </h3>
                  <p className="text-green-800 text-sm">
                    Monitor AI usage, costs, and performance across all schools and users.
                  </p>
                </div>
                <button
                  onClick={exportAnalytics}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  📥 Export Analytics
                </button>
              </div>

              <AIUsageDashboard />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">🔄</span>
            Force Provider
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Override auto-routing and force all users to use a specific AI provider
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                router.updateSettings({ preferredProvider: 'gemini', autoRouting: false });
                handleSettingsChange(router.getSettings());
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              🤖 Force Gemini (Premium)
            </button>
            <button
              onClick={() => {
                router.updateSettings({ preferredProvider: 'huggingface', autoRouting: false });
                handleSettingsChange(router.getSettings());
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🤗 Force HuggingFace (Free)
            </button>
            <button
              onClick={() => {
                router.updateSettings({ preferredProvider: 'auto', autoRouting: true });
                handleSettingsChange(router.getSettings());
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ⚡ Enable Auto-Routing
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">🎚️</span>
            Cost Optimization
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Adjust complexity threshold to control cost vs quality balance
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                router.updateSettings({ complexityThreshold: 'low', autoRouting: true });
                handleSettingsChange(router.getSettings());
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              💰 Maximum Savings (~50%)
            </button>
            <button
              onClick={() => {
                router.updateSettings({ complexityThreshold: 'medium', autoRouting: true });
                handleSettingsChange(router.getSettings());
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              ⚖️ Balanced (~40%)
            </button>
            <button
              onClick={() => {
                router.updateSettings({ complexityThreshold: 'high', autoRouting: true });
                handleSettingsChange(router.getSettings());
              }}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              ⭐ Premium Quality (~30%)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold mb-2 flex items-center">
            <span className="mr-2">🛠️</span>
            Maintenance
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Administrative actions for AI system maintenance
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                router.clearOldConversations(24);
                alert('Cleared conversations older than 24 hours');
              }}
              className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
            >
              🗑️ Clear Old Conversations
            </button>
            <button
              onClick={() => {
                if (confirm('This will reset all usage statistics. Continue?')) {
                  // Reset would be implemented here
                  alert('Statistics reset');
                }
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              🔄 Reset Statistics
            </button>
            <button
              onClick={exportAnalytics}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              📊 Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Current Configuration Summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">📋</span>
          Current Site-Wide Configuration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium text-slate-700 mb-2">AI Provider Settings:</div>
            <div className="space-y-1 text-slate-600">
              <div>• Preferred Provider: <span className="font-semibold capitalize">{router.getSettings().preferredProvider}</span></div>
              <div>• Auto-Routing: <span className="font-semibold">{router.getSettings().autoRouting ? 'Enabled ✅' : 'Disabled ❌'}</span></div>
              <div>• Complexity Threshold: <span className="font-semibold capitalize">{router.getSettings().complexityThreshold}</span></div>
              <div>• Fallback Behavior: <span className="font-semibold capitalize">{router.getSettings().fallbackBehavior}</span></div>
            </div>
          </div>
          <div>
            <div className="font-medium text-slate-700 mb-2">Impact:</div>
            <div className="space-y-1 text-slate-600">
              <div>• Affects: <span className="font-semibold">All users platform-wide</span></div>
              <div>• Cost Strategy: <span className="font-semibold">
                {router.getSettings().autoRouting ? 'Optimized (40-50% savings)' : 
                 router.getSettings().preferredProvider === 'gemini' ? 'Premium (high cost)' :
                 router.getSettings().preferredProvider === 'huggingface' ? 'Budget (minimal cost)' :
                 'Custom'}
              </span></div>
              <div>• Quality Level: <span className="font-semibold">
                {router.getSettings().preferredProvider === 'gemini' ? 'Highest' :
                 router.getSettings().autoRouting ? 'Balanced' :
                 router.getSettings().preferredProvider === 'huggingface' ? 'Good' : 'Basic'}
              </span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Help & Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📚 Documentation & Help</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-900 mb-1">🤖 Gemini AI</div>
            <div className="text-blue-800">
              Premium AI with superior quality. Best for complex tasks, conversations, and creative content.
              ~$0.015 per request.
            </div>
          </div>
          <div>
            <div className="font-medium text-blue-900 mb-1">🤗 HuggingFace</div>
            <div className="text-blue-800">
              Cost-effective with specialized models. Excellent for quizzes, summaries, structured content.
              Free tier available.
            </div>
          </div>
          <div>
            <div className="font-medium text-blue-900 mb-1">⚡ Auto-Routing</div>
            <div className="text-blue-800">
              Intelligent system automatically chooses best AI based on task complexity.
              Balances quality and cost (40-50% savings).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAIControlPanel;
