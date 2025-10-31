// components/AISettings.tsx
// Comprehensive AI settings panel for provider selection and configuration

import React, { useState, useEffect } from 'react';
import { getAIRouter, type AISettings, type AIProvider } from '../services/aiRouter';
import { getSupabaseEnv } from '../utils/env';

interface AISettingsProps {
  onSettingsChange?: (settings: AISettings) => void;
  showAdvanced?: boolean;
}

export const AISettingsPanel: React.FC<AISettingsProps> = ({ 
  onSettingsChange,
  showAdvanced = false 
}) => {
  const router = getAIRouter();
  const [settings, setSettings] = useState<AISettings>(router.getSettings());
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettings(router.getSettings());
  }, [router]);

  const handleSettingsUpdate = (updates: Partial<AISettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    router.updateSettings(updates);
    
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }

    // Show saved indicator
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleApiKeySave = () => {
    if (tempApiKey.trim()) {
      handleSettingsUpdate({ huggingfaceApiKey: tempApiKey });
      localStorage.setItem('huggingface_api_key', tempApiKey);
      setTempApiKey('');
      setShowApiKeyInput(false);
    }
  };

  const getProviderIcon = (provider: AIProvider) => {
    switch (provider) {
      case 'gemini': return '🤖';
      case 'huggingface': return '🤗';
      case 'auto': return '⚡';
      case 'templates': return '📋';
      default: return '🔄';
    }
  };

  const getProviderDescription = (provider: AIProvider) => {
    switch (provider) {
      case 'gemini': 
        return 'Premium AI with superior quality, context understanding, and conversation flow. Best for complex tasks.';
      case 'huggingface': 
        return 'Cost-effective AI with specialized models. Excellent for quizzes, summaries, and structured content.';
      case 'auto': 
        return 'Recommended: System automatically chooses the best AI based on task complexity and conversation context.';
      case 'templates': 
        return 'Offline mode with 500+ Nigerian curriculum templates. No internet required.';
      default: 
        return '';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-2">AI Configuration</h2>
        <p className="opacity-90">
          Configure how the system uses AI services for optimal performance and cost efficiency
        </p>
      </div>

      {/* Saved Indicator */}
      {saved && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <span className="mr-2">✓</span>
          <span>Settings saved successfully</span>
        </div>
      )}

      {/* AI Provider Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🎯</span>
          AI Provider Selection
        </h3>

        <div className="space-y-3">
          {(['auto', 'gemini', 'huggingface', 'templates'] as AIProvider[]).map((provider) => (
            <label
              key={provider}
              htmlFor={`provider-${provider}`}
              aria-label={`Select ${provider} provider`}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                settings.preferredProvider === provider
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <input
                id={`provider-${provider}`}
                type="radio"
                name="provider"
                value={provider}
                checked={settings.preferredProvider === provider}
                onChange={(e) => handleSettingsUpdate({ preferredProvider: e.target.value as AIProvider })}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-2xl mr-2">{getProviderIcon(provider)}</span>
                  <span className="font-semibold capitalize">
                    {provider === 'auto' ? 'Auto (Recommended)' : 
                     provider === 'huggingface' ? 'HuggingFace' : 
                     provider}
                  </span>
                  {provider === 'auto' && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Smart
                    </span>
                  )}
                  {provider === 'gemini' && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Premium
                    </span>
                  )}
                  {provider === 'huggingface' && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Free Tier
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  {getProviderDescription(provider)}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Auto-Routing Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <span className="mr-2">🔀</span>
              Intelligent Auto-Routing
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              When enabled, the system analyzes each request and automatically routes to the most 
              appropriate AI provider based on complexity, context, and conversation history.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="text-blue-900">
                <strong>💡 How it works:</strong> Simple tasks (quizzes, lists) use HuggingFace to save costs. 
                Complex tasks (lesson plans, tutoring) use Gemini for quality. Conversations stay with the same 
                provider for consistency.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4" htmlFor="autoRoutingToggle">
            <input
              id="autoRoutingToggle"
              type="checkbox"
              role="switch"
              aria-label="Toggle intelligent auto-routing"
              checked={settings.autoRouting}
              onChange={(e) => handleSettingsUpdate({ autoRouting: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Complexity Threshold */}
      {settings.autoRouting && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Complexity Threshold
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Adjust how aggressively the system routes to HuggingFace for cost savings.
          </p>

          <div className="space-y-3">
            {(['low', 'medium', 'high'] as const).map((threshold) => (
              <label
                key={threshold}
                htmlFor={`threshold-${threshold}`}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                  settings.complexityThreshold === threshold
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <input
                  id={`threshold-${threshold}`}
                  type="radio"
                  name="threshold"
                  value={threshold}
                  checked={settings.complexityThreshold === threshold}
                  onChange={(e) => handleSettingsUpdate({ 
                    complexityThreshold: e.target.value as 'low' | 'medium' | 'high' 
                  })}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium capitalize">{threshold} Threshold</div>
                  <div className="text-xs text-slate-600 mt-1">
                    {threshold === 'low' && 'More tasks use HuggingFace (Maximum cost savings, ~50%)'}
                    {threshold === 'medium' && 'Balanced approach (Recommended, ~40% savings)'}
                    {threshold === 'high' && 'More tasks use Gemini (Best quality, ~30% savings)'}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Behavior */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <span className="mr-2">🛡️</span>
          Fallback Behavior
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          What should happen when AI services are unavailable?
        </p>

        <div className="space-y-2">
          {(['always', 'offline-only', 'never'] as const).map((behavior) => (
            <label
              key={behavior}
              htmlFor={`fallback-${behavior}`}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                settings.fallbackBehavior === behavior
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <input
                id={`fallback-${behavior}`}
                type="radio"
                name="fallback"
                value={behavior}
                checked={settings.fallbackBehavior === behavior}
                onChange={(e) => handleSettingsUpdate({ 
                  fallbackBehavior: e.target.value as 'always' | 'offline-only' | 'never' 
                })}
                className="mr-3"
              />
              <div>
                <div className="font-medium capitalize">{behavior.replace('-', ' ')}</div>
                <div className="text-xs text-slate-600">
                  {behavior === 'always' && 'Use offline templates when AI services fail (Recommended)'}
                  {behavior === 'offline-only' && 'Only use templates when completely offline'}
                  {behavior === 'never' && 'Show error instead of using templates'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* HuggingFace API Key (Optional) */}
      {showAdvanced && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">🔑</span>
            HuggingFace API Key (Optional)
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            Add your own HuggingFace API key for unlimited inference and better models. 
            <a 
              href="https://huggingface.co/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              Get free API key →
            </a>
          </p>

          {!showApiKeyInput ? (
            <button
              onClick={() => setShowApiKeyInput(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add API Key
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="hf_xxxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleApiKeySave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save Key
                </button>
                <button
                  onClick={() => {
                    setShowApiKeyInput(false);
                    setTempApiKey('');
                  }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <span className="mr-2">💰</span>
          Cost Estimates
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-blue-900">Always Gemini</div>
            <div className="text-blue-700">~$150/month</div>
            <div className="text-xs text-blue-600">Best quality</div>
          </div>
          <div>
            <div className="font-medium text-blue-900">Auto (Recommended)</div>
            <div className="text-blue-700">~$99/month</div>
            <div className="text-xs text-blue-600">Save $51/month</div>
          </div>
          <div>
            <div className="font-medium text-blue-900">Always HuggingFace</div>
            <div className="text-blue-700">$0-9/month</div>
            <div className="text-xs text-blue-600">Maximum savings</div>
          </div>
        </div>
      </div>

      {/* E-Laboratory Sync */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <span className="mr-2">🧪</span>
          E‑Laboratory Data
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Keep PhET simulations in sync with the latest metadata from the source. Run a manual update now or rely on nightly refresh.
        </p>

        <div className="flex items-center gap-3">
          <button
            disabled={isSyncing}
            onClick={async () => {
              setIsSyncing(true);
              setSyncMessage(null);
              try {
                const { VITE_SUPABASE_URL } = getSupabaseEnv();
                const url = `${VITE_SUPABASE_URL}/functions/v1/sync-ai-simulations`;
                const res = await fetch(url, { method: 'POST' });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || 'Sync failed');
                const count = json?.upserted ?? 'OK';
                setSyncMessage(`Synced successfully (${count} updated).`);
              } catch (e: any) {
                setSyncMessage(`Sync failed: ${e?.message || 'Unknown error'}`);
              } finally {
                setIsSyncing(false);
              }
            }}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              isSyncing ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSyncing ? 'Syncing…' : 'Sync Simulations'}
          </button>
          {syncMessage && (
            <span aria-live="polite" className="text-sm text-slate-700">{syncMessage}</span>
          )}
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Nightly refresh can be scheduled to call this endpoint automatically.
        </div>
      </div>
    </div>
  );
};

export default AISettingsPanel;
