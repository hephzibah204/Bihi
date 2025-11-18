// components/AIProviderIndicator.tsx
// Visual indicator showing which AI provider is currently being used

import React from 'react';
import { type AIProvider, type TaskComplexity } from '../services/aiRouter';

interface AIProviderIndicatorProps {
  provider: AIProvider;
  complexity?: TaskComplexity;
  showDetails?: boolean;
  compact?: boolean;
  responseTime?: number;
  cost?: number;
}

export const AIProviderIndicator: React.FC<AIProviderIndicatorProps> = ({
  provider,
  complexity,
  showDetails = false,
  compact = false,
  responseTime,
  cost
}) => {
  const getProviderInfo = () => {
    switch (provider) {
      case 'gemini':
        return {
          icon: '🤖',
          name: 'Gemini',
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          badge: 'Premium',
          badgeColor: 'bg-purple-500'
        };
      case 'huggingface':
        return {
          icon: '🤗',
          name: 'HuggingFace',
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          badge: 'Cost-Effective',
          badgeColor: 'bg-blue-500'
        };
      case 'anthropic':
        return {
          icon: '🧠',
          name: 'Anthropic',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          badge: 'Claude',
          badgeColor: 'bg-amber-500'
        };
      case 'openrouter':
        return {
          icon: '🛣️',
          name: 'OpenRouter',
          color: 'bg-teal-100 text-teal-800 border-teal-300',
          badge: 'Router',
          badgeColor: 'bg-teal-500'
        };
      case 'openai':
        return {
          icon: '✨',
          name: 'OpenAI',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          badge: 'ChatGPT',
          badgeColor: 'bg-indigo-500'
        };
      case 'templates':
        return {
          icon: '📋',
          name: 'Templates',
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          badge: 'Offline',
          badgeColor: 'bg-slate-500'
        };
      case 'offline':
        return {
          icon: '🖥️',
          name: 'Offline Engine',
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          badge: 'Local',
          badgeColor: 'bg-orange-500'
        };
      case 'auto':
        return {
          icon: '⚡',
          name: 'Auto',
          color: 'bg-green-100 text-green-800 border-green-300',
          badge: 'Smart',
          badgeColor: 'bg-green-500'
        };
      default:
        return {
          icon: '🔄',
          name: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          badge: '',
          badgeColor: 'bg-gray-500'
        };
    }
  };

  const info = getProviderInfo();

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center px-2 py-1 rounded-lg border ${info.color} text-xs font-medium`}
        title={`Using ${info.name} AI`}
      >
        <span className="mr-1">{info.icon}</span>
        <span>{info.name}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start p-3 rounded-lg border ${info.color}`}>
      <div className="flex-shrink-0 text-2xl mr-3">{info.icon}</div>
      
      <div className="flex-1">
        <div className="flex items-center mb-1">
          <span className="font-semibold">{info.name} AI</span>
          {info.badge && (
            <span className={`ml-2 text-xs text-white px-2 py-0.5 rounded ${info.badgeColor}`}>
              {info.badge}
            </span>
          )}
        </div>

        {showDetails && complexity && (
          <div className="text-xs space-y-1 mt-2">
            <div className="flex items-center">
              <span className="text-slate-600 mr-2">Complexity:</span>
              <div className="flex-1 flex items-center">
                <div className="w-full bg-white rounded-full h-1.5 mr-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      complexity.score < 35 ? 'bg-green-500' :
                      complexity.score < 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${complexity.score}%` }}
                  ></div>
                </div>
                <span className="font-medium">{complexity.score}/100</span>
              </div>
            </div>

            {complexity.reasoning && (
              <div className="text-slate-600 italic">
                {complexity.reasoning}
              </div>
            )}

            {(responseTime || cost !== undefined) && (
              <div className="flex gap-3 mt-1 pt-1 border-t border-current opacity-50">
                {responseTime && (
                  <span>⏱️ {(responseTime / 1000).toFixed(2)}s</span>
                )}
                {cost !== undefined && (
                  <span>💰 ${cost.toFixed(4)}</span>
                )}
              </div>
            )}
          </div>
        )}

        {!showDetails && complexity && (
          <div className="text-xs text-slate-600 mt-0.5">
            Score: {complexity.score}/100
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simplified inline indicator for chat messages
 */
export const AIProviderBadge: React.FC<{ provider: AIProvider }> = ({ provider }) => {
  const info = {
    gemini: { icon: '🤖', color: 'bg-purple-100 text-purple-700' },
    huggingface: { icon: '🤗', color: 'bg-blue-100 text-blue-700' },
    anthropic: { icon: '🧠', color: 'bg-amber-100 text-amber-700' },
    openrouter: { icon: '🛣️', color: 'bg-teal-100 text-teal-700' },
    openai: { icon: '✨', color: 'bg-indigo-100 text-indigo-700' },
    offline: { icon: '🖥️', color: 'bg-orange-100 text-orange-700' },
    templates: { icon: '📋', color: 'bg-slate-100 text-slate-700' },
    auto: { icon: '⚡', color: 'bg-green-100 text-green-700' }
  }[provider] || { icon: '🔄', color: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs ${info.color}`}>
      {info.icon}
    </span>
  );
};

/**
 * Provider switcher for debugging/testing
 */
interface AIProviderSwitcherProps {
  currentProvider: AIProvider;
  onProviderChange: (provider: AIProvider) => void;
  disabled?: boolean;
}

export const AIProviderSwitcher: React.FC<AIProviderSwitcherProps> = ({
  currentProvider,
  onProviderChange,
  disabled = false
}) => {
  const providers: AIProvider[] = ['auto', 'gemini', 'huggingface', 'anthropic', 'openrouter', 'openai', 'offline', 'templates'];

  return (
    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
      <span className="text-xs text-slate-600 font-medium">AI:</span>
      <div className="flex gap-1">
        {providers.map((provider) => {
          const isActive = currentProvider === provider;
          const info = {
            gemini: { icon: '🤖', name: 'Gemini' },
            huggingface: { icon: '🤗', name: 'HF' },
            templates: { icon: '📋', name: 'Templates' },
            auto: { icon: '⚡', name: 'Auto' }
          }[provider];

          return (
            <button
              key={provider}
              onClick={() => !disabled && onProviderChange(provider)}
              disabled={disabled}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={info.name}
            >
              {info.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AIProviderIndicator;
