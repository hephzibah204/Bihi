import { useState, useCallback } from 'react';
import { callGeminiApi, callGeminiApiStream } from '../services/geminiService';
import { generateFallbackResponse } from '../services/fallbackAiService';
import { logger } from '../utils/logger';

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
    type?: string
  ): Promise<AIResponse> => {
    setIsLoading(true);
    
    try {
      // Try Gemini API first if online
      if (isOnline) {
        try {
          // Attach context to the prompt to ensure online API receives it
          const promptWithContext = context
            ? `Context:\n${context}\n\nUser Prompt:\n${prompt}`
            : prompt;
          // Merge global feature/KPI contexts (optional)
          const featureContexts = filterFeatureContextsByRole(await safeGetFeatureContexts(), resolveCurrentRole());
          const response = await callGeminiApi(actualPromptForOnline(prompt, context, featureContexts), undefined);
          setIsLoading(false);
          return {
            content: response,
            isOnline: true
          };
        } catch (error) {
          logger.captureError(error as any, 'Gemini API failed, checking for permission error');

          // Permission denied: surface to user and DO NOT fallback
          if (error instanceof Error && /permission denied/i.test(error.message)) {
            setIsLoading(false);
            showNotification({
              type: 'error',
              title: 'Permission denied',
              message: 'Your role is not permitted to access that information. If you believe this is a mistake, contact an administrator.'
            });
            return {
              content: 'Permission denied: you are not allowed to access that information.',
              isOnline: true,
              error: 'permission_denied'
            };
          }
          
          // Determine fallback reason
          let fallbackReason = 'API service unavailable';
          let notificationMessage = 'The AI service is temporarily unavailable. Using offline AI with limited capabilities.';
          
          if (error instanceof Error) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
              fallbackReason = 'Network connectivity issues';
              notificationMessage = 'Network connection issues detected. Switching to offline AI mode.';
            } else if (error.message.includes('quota') || error.message.includes('limit')) {
              fallbackReason = 'API quota exceeded';
              notificationMessage = 'AI service quota exceeded. Using offline AI until quota resets.';
            } else if (error.message.includes('auth') || error.message.includes('key')) {
              fallbackReason = 'Authentication error';
              notificationMessage = 'AI service authentication failed. Using offline AI mode.';
            }
          }
          
          // Show notification about fallback
          showNotification({
            type: 'warning',
            title: 'Switched to Offline AI',
            message: `${notificationMessage} Results may be less comprehensive than our premium AI service.`
          });
          
          // Fall through to fallback with reason; prefer HuggingFace if online
          const ctxObj = { ...(context ? { context } : {}), ...(type ? { type } : {}) } as Record<string, unknown> | undefined;
          let fallbackResponse: string;
          try {
            const { generateFallbackResponseAsync } = await import('../services/fallbackAiService');
            fallbackResponse = await generateFallbackResponseAsync(prompt, ctxObj, type);
          } catch {
            const { generateFallbackResponse } = await import('../services/fallbackAiService');
            fallbackResponse = generateFallbackResponse(prompt, ctxObj, type);
          }
          setIsLoading(false);
          setIsOnline(false);
          
          return {
            content: fallbackResponse,
            isOnline: false,
            fallbackReason,
            notification: {
              type: 'warning',
              title: 'Offline AI Active',
              message: `Using in-house AI due to: ${fallbackReason}. Responses may be more basic.`
            }
          };
        }
      } else {
        // Offline mode notification
        showNotification({
          type: 'info',
          title: 'Offline Mode',
          message: 'No internet connection detected. Using offline AI with basic responses.'
        });
      }
      
      // Use fallback AI service (prefer HF if online)
      const featureContexts = filterFeatureContextsByRole(await safeGetFeatureContexts(), resolveCurrentRole());
      const ctxObj = { ...(context ? { context } : {}), ...(type ? { type } : {}) , featureContexts } as Record<string, unknown> | undefined;
      let fallbackResponse: string;
      try {
        if (isOnline) {
          const { generateFallbackResponseAsync } = await import('../services/fallbackAiService');
          fallbackResponse = await generateFallbackResponseAsync(prompt, ctxObj, type);
        } else {
          const { generateFallbackResponse } = await import('../services/fallbackAiService');
          fallbackResponse = generateFallbackResponse(prompt, ctxObj, type);
        }
      } catch {
        const { generateFallbackResponse } = await import('../services/fallbackAiService');
        fallbackResponse = generateFallbackResponse(prompt, ctxObj, type);
      }
      setIsLoading(false);
      setIsOnline(false);
      
      return {
        content: fallbackResponse,
        isOnline: false,
        fallbackReason: isOnline ? 'API service failed' : 'No internet connection',
        notification: {
          type: 'info',
          title: 'Offline AI Active',
          message: 'Using in-house AI. Responses are more basic but still helpful for common tasks.'
        }
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
    responseMimeType
  }: {
    prompt: string;
    context?: string | Record<string, unknown>;
    type?: string;
    onChunk: (chunk: string) => void;
    conversationId?: string;
    userProfile?: Record<string, unknown>;
    conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    responseMimeType?: string;
  }): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Try real streaming via server when online
      if (isOnline) {
        const featureContexts = filterFeatureContextsByRole(await safeGetFeatureContexts(), (userProfile && typeof userProfile === 'object' ? (userProfile as any).userRole : undefined));
        await callGeminiApiStream(
          prompt,
          onChunk,
          {
            context: typeof context === 'string' ? { _raw: context, featureContexts } : { ...(context || {}), featureContexts },
            conversationId,
            conversationHistory,
            userProfile,
            responseMimeType
          }
        );
        setIsLoading(false);
        return;
      }

      // Fallback to offline generation if offline
      const response = await generateResponse(prompt, typeof context === 'string' ? context : JSON.stringify(context), type);
      
      if (response.error || response.content.includes('Sorry, I encountered an error')) {
        setIsLoading(false);
        let errorMessage = 'I apologize, but I\'m having trouble processing your request right now. ';
        if (!isOnline) {
          errorMessage += 'I\'m currently in offline mode with limited capabilities. Please check your internet connection for the full AI experience.';
        } else if (response.fallbackReason) {
          errorMessage += `I'm using offline mode because: ${response.fallbackReason}. The response may be more basic than usual.`;
        } else {
          errorMessage += 'Please try rephrasing your question or try again in a moment.';
        }
        onChunk(errorMessage);
        showNotification({
          type: 'warning',
          title: isOnline ? 'AI Service Issue' : 'Offline Mode',
          message: isOnline ? 'AI service temporarily unavailable. Using offline mode.' : 'Limited AI capabilities in offline mode.'
        });
        return;
      }
      
      // Simulate streaming by sending chunks of the offline response
      const text = response.content;
      const chunkSize = 10;
      for (let i = 0; i < text.length; i += chunkSize) {
        const chunk = text.slice(i, i + chunkSize);
        onChunk(chunk);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
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

      // Streaming failed: try non-stream Gemini once with merged contexts
      if (isOnline) {
        try {
          const featureContexts = filterFeatureContextsByRole(await safeGetFeatureContexts(), resolveCurrentRole());
          const mergedContext = typeof context === 'string' ? context : JSON.stringify(context || {});
          const full = await callGeminiApi(actualPromptForOnline(prompt, mergedContext, featureContexts), undefined);
          const CHUNK = 256;
          for (let i = 0; i < full.length; i += CHUNK) {
            onChunk(full.slice(i, i + CHUNK));
            await new Promise(r => setTimeout(r, 25));
          }
          setIsLoading(false);
          return;
        } catch (e) {
          // fall through to offline fallback generation
        }
      }

      // Attempt offline fallback generation even if online attempts failed
      try {
        const resp = await generateResponse(
          prompt,
          typeof context === 'string' ? context : JSON.stringify(context || {}),
          type
        );

        if (!resp.error && resp.content && !resp.content.includes('Sorry, I encountered an error')) {
          const CHUNK = 256;
          for (let i = 0; i < resp.content.length; i += CHUNK) {
            onChunk(resp.content.slice(i, i + CHUNK));
            await new Promise(r => setTimeout(r, 25));
          }
          // Switch mode indicator to offline if we had to fallback
          setIsOnline(false);
          setIsLoading(false);
          showNotification({
            type: 'warning',
            title: 'Switched to Offline AI',
            message: resp.fallbackReason
              ? `Using offline AI due to: ${resp.fallbackReason}. Responses may be more basic.`
              : 'Using offline AI mode. Responses may be more basic than premium service.'
          });
          return;
        }
      } catch (fallbackErr) {
        // continue to final error messaging
        logger.captureError(fallbackErr as any, 'Offline fallback generation failed');
      }

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
  }, [isOnline, showNotification, generateResponse]);

  return {
    generateResponse,
    generateResponseStream,
    isLoading,
    isOnline,
    status: isLoading ? 'loading' : (isOnline ? 'gemini' : 'offline')
  };
};
