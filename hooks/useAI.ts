import { useState, useCallback } from 'react';
import { callGeminiApi, callGeminiApiStream } from '../services/geminiService';
import { generateFallbackResponse } from '../services/fallbackAiService';
import { runOfflineModel } from '../lib/ai/offline-engine/offline_llm';
import { isSensitiveFinanceQuery, needsStructuredOutput } from '../lib/ai/orchestrator/fallback_strategy';
import { detectTools } from '../lib/ai/orchestrator/tool_router';
import { getTenantId } from '../services/api';
import { logger } from '../utils/logger';
import { aiGatewayService, generateViaGateway, generateStreamViaGateway, AIGatewayStreamChunk } from '../services/aiGatewayService';

// Lazy-load feature contexts to avoid hard dependency during initial render
async function safeGetFeatureContexts(): Promise<Record<string, unknown>> {
  try {
    const mod = await import('../services/aiContextRegistry');
    return typeof mod.getContextSnapshot === 'function' ? mod.getContextSnapshot() : {};
  } catch {
    return {};
  }
}

function resolveCurrentRole(): string | undefined {
  try {
    return (typeof window !== 'undefined' ? (localStorage.getItem('demoUserRole') || sessionStorage.getItem('demoUserRole')) : undefined) || undefined;
  } catch {
    return undefined;
  }
}

function filterFeatureContextsByRole(featureContexts: Record<string, unknown>, role?: string): Record<string, unknown> {
  if (!featureContexts || !Object.keys(featureContexts).length) return featureContexts;
  const r = (role || resolveCurrentRole() || '').toLowerCase();
  if (!r) return featureContexts; // unknown role: return as-is; registry scoping should handle most cases

  const denyPatterns = r === 'admin' || r === 'super admin'
    ? []
    : r === 'teacher'
      ? ['admin', 'super', 'dashboard', 'school', 'finance', 'bursar', 'bursary', 'staff', 'global']
      : ['admin', 'super', 'dashboard', 'school', 'finance', 'bursar', 'bursary', 'staff', 'global', 'teacher', 'class_overview'];

  const filtered: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(featureContexts)) {
    const k = key.toLowerCase();
    if (denyPatterns.some(p => k.includes(p))) continue;
    filtered[key] = val;
  }
  return filtered;
}

export interface AIResponse {
  content: string;
  isOnline: boolean;
  error?: string;
  fallbackReason?: string;
  notification?: {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  };
}

export interface AINotificationCallback {
  (notification: {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  }): void;
}

export const useAI = (onNotification?: AINotificationCallback) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const showNotification = useCallback((notification: {
    type: 'info' | 'warning' | 'error';
    title: string;
    message: string;
  }) => {
    if (onNotification) {
      onNotification(notification);
    }
  }, [onNotification]);

  const actualPromptForOnline = (prompt: string, context?: string, featureContexts?: Record<string, unknown>) => {
    const blocks: string[] = [];
    if (context) blocks.push(`Context:\n${context}`);
    if (featureContexts && Object.keys(featureContexts).length) blocks.push(`FeatureContexts:\n${JSON.stringify(featureContexts)}`);
    if (blocks.length) return `${blocks.join('\n\n')}\n\nUser Prompt:\n${prompt}`;
    return prompt;
  };

  const generateResponse = useCallback(async (
    prompt: string,
    context?: string,
    type?: string,
    forceOffline?: boolean
  ): Promise<AIResponse> => {
    setIsLoading(true);
    
    try {
      // Use AI Gateway service for enhanced offline flow control
      const response = await generateViaGateway(prompt, {
        context,
        role: resolveCurrentRole() || 'Teacher',
        tenantId: getTenantId() || 'demo',
        forceOffline: forceOffline || isSensitiveFinanceQuery(prompt) || detectTools(prompt).length > 0 || needsStructuredOutput(prompt)
      });

      setIsLoading(false);
      
      // Handle permission errors
      if (response.error?.includes('permission') || response.error?.includes('denied')) {
        showNotification({
          type: 'error',
          title: 'Permission denied',
          message: 'Your role is not permitted to access that information. If you believe this is a mistake, contact an administrator.'
        });
        return {
          content: 'Permission denied: you are not allowed to access that information.',
          isOnline: !response.fallbackUsed,
          error: 'permission_denied'
        };
      }

      // Handle fallback notifications
      if (response.fallbackUsed) {
        const notificationType = response.provider === 'offline' ? 'warning' : 'info';
        const title = response.provider === 'offline' ? 'Switched to Offline AI' : 'Offline AI Active';
        const message = response.error 
          ? `Using offline AI due to: ${response.error}. Responses may be more basic.`
          : 'Using in-house AI. Responses are more basic but still helpful for common tasks.';
        
        showNotification({
          type: notificationType,
          title,
          message
        });
      }

      return {
        content: response.content,
        isOnline: !response.fallbackUsed,
        fallbackReason: response.fallbackUsed ? response.error : undefined,
        notification: response.fallbackUsed ? {
          type: response.provider === 'offline' ? 'warning' : 'info',
          title: response.provider === 'offline' ? 'Offline AI Active' : 'AI Service Notice',
          message: response.error || 'Using offline AI mode'
        } : undefined
      };
    } catch (error) {
      setIsLoading(false);
      
      showNotification({
        type: 'error',
        title: 'AI Service Error',
        message: 'Both online and offline AI services encountered errors. Please try again.'
      });
      
      return {
        content: 'Sorry, I encountered an error while processing your request. Please try again or contact support if the issue persists.',
        isOnline: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        notification: {
          type: 'error',
          title: 'Service Error',
          message: 'AI services are temporarily unavailable.'
        }
      };
    }
  }, [isOnline, showNotification]);

  const generateResponseStream = useCallback(async ({
    prompt,
    context,
    type,
    onChunk,
    conversationId,
    userProfile,
    conversationHistory,
    responseMimeType,
    forceOffline
  }: {
    prompt: string;
    context?: string | Record<string, unknown>;
    type?: string;
    onChunk: (chunk: string) => void;
    conversationId?: string;
    userProfile?: Record<string, unknown>;
    conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    responseMimeType?: string;
    forceOffline?: boolean;
  }): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Use AI Gateway service for enhanced streaming with offline flow control
      const featureContexts = filterFeatureContextsByRole(await safeGetFeatureContexts(), (userProfile && typeof userProfile === 'object' ? (userProfile as any).userRole : undefined));
      
      await generateStreamViaGateway(prompt, (chunk: AIGatewayStreamChunk) => {
        if (chunk.text) {
          onChunk(chunk.text);
        } else if (chunk.error) {
          setIsLoading(false);
          let errorMessage = 'I apologize, but I\'m having trouble processing your request right now. ';
          
          if (!isOnline) {
            errorMessage += 'I\'m currently in offline mode with limited capabilities. Please check your internet connection for the full AI experience.';
          } else if (chunk.provider === 'offline' || chunk.provider === 'templates') {
            errorMessage += 'I\'m using offline mode with limited capabilities. The response may be more basic than usual.';
          } else {
            errorMessage += 'Please try rephrasing your question or try again in a moment.';
          }
          
          onChunk(errorMessage);
          showNotification({
            type: 'warning',
            title: isOnline ? 'AI Service Issue' : 'Offline Mode',
            message: isOnline ? 'AI service temporarily unavailable. Using offline mode.' : 'Limited AI capabilities in offline mode.'
          });
        } else if (chunk.done) {
          setIsLoading(false);
          if (chunk.provider === 'offline' || chunk.provider === 'templates') {
            setIsOnline(false);
            showNotification({
              type: 'warning',
              title: 'Switched to Offline AI',
              message: 'Using offline AI mode. Responses may be more basic than premium service.'
            });
          }
        }
      }, {
        context: typeof context === 'string' ? { _raw: context, featureContexts } : { ...(context || {}), featureContexts },
        conversationId,
        conversationHistory,
        userProfile,
        responseMimeType,
        role: (resolveCurrentRole() as any) || 'Teacher',
        tenantId: getTenantId() || 'demo',
        forceOffline: forceOffline || isSensitiveFinanceQuery(prompt) || detectTools(prompt).length > 0 || needsStructuredOutput(prompt)
      });

      setIsLoading(false);
    } catch (error) {
      // Permission denied: surface a friendly message and do not fallback
      if (error instanceof Error && /permission denied/i.test(error.message)) {
        setIsLoading(false);
        const msg = 'Permission denied: your role cannot access that information.';
        onChunk(msg);
        showNotification({ type: 'error', title: 'Permission denied', message: 'You do not have access to this query.' });
        return;
      }

      // Final fallback to basic offline generation
      setIsLoading(false);
      const errorMessage = isOnline 
        ? 'I\'m experiencing technical difficulties. Please try again in a moment or check your internet connection.'
        : 'I\'m in offline mode with limited capabilities. Please connect to the internet for the full AI experience.';
      onChunk(errorMessage);
      showNotification({
        type: 'error',
        title: 'AI Service Error',
        message: 'Failed to generate response. Please try again.'
      });
      logger.captureError(error as any, 'AI Streaming Error');
    }
  }, [isOnline, showNotification]);

  return {
    generateResponse,
    generateResponseStream,
    isLoading,
    isOnline,
    status: isLoading ? 'loading' : (isOnline ? 'gemini' : 'offline')
  };
};
