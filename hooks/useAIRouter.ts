// hooks/useAIRouter.ts
// React hook for AI Router with intelligent provider selection

import { useState, useCallback, useEffect } from 'react';
import { getAIRouter, type AISettings, type AIProvider, type AIRouterResponse, type TaskComplexity } from '../services/aiRouter';

export interface UseAIRouterOptions {
  conversationId?: string;
  onProviderChange?: (provider: AIProvider) => void;
  onComplexityAnalysis?: (complexity: TaskComplexity) => void;
  settings?: Partial<AISettings>;
}

export interface UseAIRouterReturn {
  generate: (prompt: string, metadata?: any) => Promise<AIRouterResponse>;
  generateStream: (prompt: string, onChunk: (chunk: string) => void, metadata?: any) => Promise<void>;
  isLoading: boolean;
  lastResponse: AIRouterResponse | null;
  settings: AISettings;
  updateSettings: (newSettings: Partial<AISettings>) => void;
  analyzeComplexity: (prompt: string) => TaskComplexity;
  clearConversation: () => void;
  usageStats: ReturnType<typeof getAIRouter>['getUsageStats'];
}

export const useAIRouter = (options: UseAIRouterOptions = {}): UseAIRouterReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<AIRouterResponse | null>(null);
  const [router] = useState(() => getAIRouter(options.settings));
  const [settings, setSettings] = useState<AISettings>(router.getSettings());

  // Sync settings on mount
  useEffect(() => {
    if (options.settings) {
      router.updateSettings(options.settings);
      setSettings(router.getSettings());
    }
  }, [options.settings, router]);

  /**
   * Generate AI response with intelligent routing
   */
  const generate = useCallback(
    async (prompt: string, metadata?: any): Promise<AIRouterResponse> => {
      setIsLoading(true);

      try {
        const response = await router.generate(
          prompt,
          options.conversationId,
          metadata
        );

        setLastResponse(response);

        // Notify callbacks
        if (options.onProviderChange) {
          options.onProviderChange(response.provider);
        }
        if (options.onComplexityAnalysis) {
          options.onComplexityAnalysis(response.complexity);
        }

        setIsLoading(false);
        return response;
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [router, options.conversationId, options.onProviderChange, options.onComplexityAnalysis]
  );

  /**
   * Generate streaming response (simulated for now)
   */
const generateStream = useCallback(
    async (
      prompt: string,
      onChunk: (chunk: string) => void,
      metadata?: any
    ): Promise<void> => {
      setIsLoading(true);

      try {
        const response = await generate(prompt, metadata);

        // Simulate streaming by chunking the response
        const chunkSize = 10;
        for (let i = 0; i < response.content.length; i += chunkSize) {
          const chunk = response.content.slice(i, i + chunkSize);
          onChunk(chunk);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        throw error;
      }
    },
    [generate]
  );

  /**
   * Update AI settings
   */
  const updateSettings = useCallback(
    (newSettings: Partial<AISettings>) => {
      router.updateSettings(newSettings);
      setSettings(router.getSettings());
    },
    [router]
  );

  /**
   * Analyze complexity without generating response
   */
  const analyzeComplexity = useCallback(
    (prompt: string): TaskComplexity => {
      return router.analyzeComplexity(prompt, options.conversationId);
    },
    [router, options.conversationId]
  );

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    if (options.conversationId) {
      // The router will automatically handle conversation cleanup
      // This is more of a UI signal
      setLastResponse(null);
    }
  }, [options.conversationId]);

  /**
   * Get usage statistics
   */
  const usageStats = useCallback(() => {
    return router.getUsageStats();
  }, [router]);

  return {
    generate,
    generateStream,
    isLoading,
    lastResponse,
    settings,
    updateSettings,
    analyzeComplexity,
    clearConversation,
    usageStats
  };
};

/**
 * Example usage:
 * 
 * ```tsx
 * const MyComponent = () => {
 *   const { 
 *     generate, 
 *     isLoading, 
 *     lastResponse, 
 *     settings,
 *     updateSettings 
 *   } = useAIRouter({
 *     conversationId: 'parent-chat-123',
 *     settings: {
 *       preferredProvider: 'auto',
 *       autoRouting: true,
 *       complexityThreshold: 'medium'
 *     },
 *     onProviderChange: (provider) => {
 *       console.log(`Switched to ${provider}`);
 *     }
 *   });
 * 
 *   const handleSubmit = async (prompt: string) => {
 *     const response = await generate(prompt);
 *     console.log(`Used ${response.provider}, cost: $${response.cost.toFixed(4)}`);
 *     console.log(`Complexity: ${response.complexity.score}/100`);
 *     console.log(`Reasoning: ${response.complexity.reasoning}`);
 *   };
 * 
 *   return (
 *     <div>
 *       <div>Provider: {lastResponse?.provider}</div>
 *       <div>Complexity: {lastResponse?.complexity.score}/100</div>
 *       <button onClick={() => updateSettings({ preferredProvider: 'gemini' })}>
 *         Use Gemini Only
 *       </button>
 *       <button onClick={() => updateSettings({ preferredProvider: 'auto' })}>
 *         Auto Route
 *       </button>
 *     </div>
 *   );
 * };
 * ```
 */
