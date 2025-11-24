// services/aiGatewayService.ts
// Enhanced AI Gateway service with direct SSE consumption and offline flow control

import { logger } from '../utils/logger';
import { getTenantId } from './api';
import { supabase } from './supabaseClient';

export interface AIGatewayRequest {
  input: string;
  conversationId?: string;
  role?: string;
  tenantId?: string;
  topK?: number;
  useOffline?: boolean;
  forceOffline?: boolean;
  stream?: boolean;
  context?: any;
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  userProfile?: any;
  responseMimeType?: string;
  expectedSchema?: any;
  forceOnlineOnly?: boolean;
}

export interface AIGatewayResponse {
  content: string;
  provider: 'gemini' | 'huggingface' | 'offline' | 'templates';
  fallbackUsed: boolean;
  responseTime: number;
  cost: number;
  error?: string;
}

export interface AIGatewayStreamChunk {
  text?: string;
  error?: string;
  done?: boolean;
  provider?: string;
}

// AI Gateway endpoints
const AI_GATEWAY_URL = '/api/ai-gateway';
const AI_GENERATE_URL = '/api/ai/generate';

/**
 * Posts to AI Gateway with SSE support and forced offline capabilities
 */
export class AIGatewayService {
  private static instance: AIGatewayService;
  private readonly abortControllers: Map<string, AbortController> = new Map();

  private constructor() {}

  public static getInstance(): AIGatewayService {
    if (!AIGatewayService.instance) {
      AIGatewayService.instance = new AIGatewayService();
    }
    return AIGatewayService.instance;
  }

  /**
   * Generate response via AI Gateway with streaming support
   */
  public async generate(
    request: AIGatewayRequest
  ): Promise<AIGatewayResponse> {
    const startTime = Date.now();
    
    try {
      // Determine if we should force offline mode
      const shouldForceOffline = this.shouldForceOffline(request);
      const useOffline = request.useOffline || shouldForceOffline;

      if (useOffline) {
        return await this.generateOffline(request, startTime);
      }

      // Try online generation first
      try {
        return await this.generateOnline(request, startTime);
      } catch (error) {
        logger.warn('Online generation failed', { error });
        if (request.forceOnlineOnly) {
          throw error;
        }
        logger.warn('Falling back to offline');
        return await this.generateOffline(request, startTime, error as Error);
      }
    } catch (error) {
      logger.error('All generation methods failed', { error });
      return {
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        provider: 'templates',
        fallbackUsed: true,
        responseTime: Date.now() - startTime,
        cost: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate streaming response via AI Gateway
   */
  public async generateStream(
    request: AIGatewayRequest,
    onChunk: (chunk: AIGatewayStreamChunk) => void
  ): Promise<void> {
    const startTime = Date.now();
    const abortController = new AbortController();
    const requestId = `${Date.now()}-${Math.random()}`;
    this.abortControllers.set(requestId, abortController);

    try {
      // Determine if we should force offline mode
      const shouldForceOffline = this.shouldForceOffline(request);
      const useOffline = request.useOffline || shouldForceOffline;

      if (useOffline) {
        await this.generateOfflineStream(request, onChunk);
        return;
      }

      // Try online streaming first
      try {
        await this.generateOnlineStream(request, onChunk, abortController.signal);
      } catch (error) {
        logger.warn('Online streaming failed', { error });
        if (request.forceOnlineOnly) {
          onChunk({ error: (error as Error)?.message || 'online_only_failed', done: true });
          return;
        }
        logger.warn('Falling back to offline');
        await this.generateOfflineStream(request, onChunk, error as Error);
      }
    } finally {
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Check if we should force offline mode for specific flows
   */
  private shouldForceOffline(request: AIGatewayRequest): boolean {
    // Force offline for sensitive queries or when explicitly requested
    if (request.forceOffline) return true;

    // Check for sensitive finance queries
    const sensitivePatterns = [
      /financial|budget|expense|income|debt|payment|fee|salary|payroll/i,
      /naira|dollar|currency|money|cost|price/i,
      /bursary|accounting|audit|tax/i
    ];

    const input = request.input.toLowerCase();
    return sensitivePatterns.some(pattern => pattern.test(input));
  }

  /**
   * Generate response using online AI services
   */
  private async generateOnline(
    request: AIGatewayRequest,
    startTime: number
  ): Promise<AIGatewayResponse> {
    const headers = await this.getHeaders();
    const tenantId = request.tenantId || getTenantId() || 'demo';

    const response = await fetch(AI_GENERATE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: request.input,
        tenantId,
        conversationId: request.conversationId,
        context: request.context,
        conversationHistory: request.conversationHistory,
        userProfile: request.userProfile,
        responseMimeType: request.responseMimeType,
        expectedSchema: request.expectedSchema,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Online generation failed: ${response.status}`);
    }

    const contentType = response.headers.get('Content-Type') || '';
    let content = '';

    if (contentType.includes('text/event-stream')) {
      // Handle SSE response
      content = await this.parseSSEResponse(response);
    } else {
      // Handle JSON response
      const data = await response.json();
      content = data.text || data.content || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    return {
      content,
      provider: 'gemini',
      fallbackUsed: false,
      responseTime: Date.now() - startTime,
      cost: this.estimateCost(request.input, content, 'gemini')
    };
  }

  /**
   * Generate streaming response using online AI services
   */
  private async generateOnlineStream(
    request: AIGatewayRequest,
    onChunk: (chunk: AIGatewayStreamChunk) => void,
    signal: AbortSignal
  ): Promise<void> {
    const headers = await this.getHeaders();
    headers['Accept'] = 'text/event-stream';
    headers['Cache-Control'] = 'no-store';

    const tenantId = request.tenantId || getTenantId() || 'demo';

    const response = await fetch(AI_GENERATE_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: request.input,
        tenantId,
        conversationId: request.conversationId,
        context: request.context,
        conversationHistory: request.conversationHistory,
        userProfile: request.userProfile,
        responseMimeType: request.responseMimeType,
        expectedSchema: request.expectedSchema,
        stream: true
      }),
      signal
    });

    if (!response.ok) {
      throw new Error(`Online streaming failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    await this.handleSSEStream(response, onChunk);
  }

  /**
   * Generate response using offline AI
   */
  private async generateOffline(
    request: AIGatewayRequest,
    startTime: number,
    error?: Error
  ): Promise<AIGatewayResponse> {
    try {
      // Import offline model dynamically to avoid circular dependencies
      const { runOfflineModel } = await import('../lib/ai/offline-engine/offline_llm');
      
      const role = request.role || 'Teacher';
      const tenantId = request.tenantId || getTenantId() || 'demo';

      const content = await runOfflineModel({
        prompt: request.input,
        role: role as any,
        tenantId,
        conversationHistory: request.conversationHistory || [],
        topK: request.topK || 5,
        context: request.context
      });

      return {
        content,
        provider: 'offline',
        fallbackUsed: true,
        responseTime: Date.now() - startTime,
        cost: 0,
        error: error?.message
      };
    } catch (offlineError) {
      logger.error('Offline generation failed', { offlineError });
      
      // Final fallback to templates
      const { generateFallbackResponse } = await import('../services/fallbackAiService');
      const content = generateFallbackResponse(request.input, request.context);

      return {
        content,
        provider: 'templates',
        fallbackUsed: true,
        responseTime: Date.now() - startTime,
        cost: 0,
        error: 'All AI services failed, using template fallback'
      };
    }
  }

  /**
   * Generate streaming response using offline AI
   */
  private async generateOfflineStream(
    request: AIGatewayRequest,
    onChunk: (chunk: AIGatewayStreamChunk) => void,
    error?: Error
  ): Promise<void> {
    try {
      // Import offline model dynamically
      const { runOfflineModel } = await import('../lib/ai/offline-engine/offline_llm');
      
      const role = request.role || 'Teacher';
      const tenantId = request.tenantId || getTenantId() || 'demo';

      const content = await runOfflineModel({
        prompt: request.input,
        role: role as any,
        tenantId,
        conversationHistory: request.conversationHistory || [],
        topK: request.topK || 5,
        context: request.context
      });

      // Simulate streaming by chunking the response
      const chunkSize = 10;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        onChunk({ text: chunk, provider: 'offline' });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      onChunk({ done: true, provider: 'offline' });
    } catch (offlineError) {
      logger.error('Offline streaming failed', { offlineError });
      
      // Final fallback to templates
      const { generateFallbackResponse } = await import('../services/fallbackAiService');
      const content = generateFallbackResponse(request.input, request.context);

      // Stream template response
      const chunkSize = 15;
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        onChunk({ text: chunk, provider: 'templates' });
        await new Promise(resolve => setTimeout(resolve, 40));
      }

      onChunk({ done: true, provider: 'templates', error: 'All AI services failed, using template fallback' });
    }
  }

  /**
   * Parse SSE response from server
   */
  private async parseSSEResponse(response: Response): Promise<string> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonString = line.substring(6);
          if (jsonString.trim() === '[DONE]') continue;
          try {
            const chunk = JSON.parse(jsonString);
            const textChunk = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) fullText += textChunk;
          } catch (e) {
            logger.captureError(e as any, 'SSE chunk parse error');
          }
        }
      }
    }

    return fullText;
  }

  /**
   * Handle SSE streaming
   */
  private async handleSSEStream(
    response: Response,
    onChunk: (chunk: AIGatewayStreamChunk) => void
  ): Promise<void> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        onChunk({ done: true });
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonString = line.substring(6);
          if (jsonString.trim() === '[DONE]') continue;
          try {
            const data = JSON.parse(jsonString);
            const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              onChunk({ text: textChunk, provider: 'gemini' });
            }
          } catch (e) {
            logger.captureError(e as any, 'SSE streaming chunk parse error');
          }
        }
      }
    }
  }

  /**
   * Get headers for API requests
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add auth headers
    if (typeof window !== 'undefined') {
      const isDemo = sessionStorage.getItem('isDemoMode') === 'true';
      if (isDemo) {
        headers['X-Demo-Mode'] = 'true';
      } else if (supabase && supabase.auth && typeof supabase.auth.getSession === 'function') {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
        } catch {}
      }
    }

    return headers;
  }

  /**
   * Estimate cost of API call
   */
  private estimateCost(prompt: string, response: string, provider: string): number {
    if (provider === 'huggingface' || provider === 'offline' || provider === 'templates') {
      return 0;
    }
    
    // Gemini pricing: ~$0.001 per 1K characters
    const totalChars = prompt.length + response.length;
    return (totalChars / 1000) * 0.001;
  }

  /**
   * Abort a specific request
   */
  public abortRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }

  /**
   * Abort all pending requests
   */
  public abortAll(): void {
    for (const controller of this.abortControllers.values()) {
      controller.abort();
    }
    this.abortControllers.clear();
  }
}

// Export singleton instance
export const aiGatewayService = AIGatewayService.getInstance();

// Convenience functions
export const generateViaGateway = async (
  prompt: string,
  options?: Partial<AIGatewayRequest>
): Promise<AIGatewayResponse> => {
  return aiGatewayService.generate({
    input: prompt,
    ...options
  });
};

export const generateStreamViaGateway = async (
  prompt: string,
  onChunk: (chunk: AIGatewayStreamChunk) => void,
  options?: Partial<AIGatewayRequest>
): Promise<void> => {
  return aiGatewayService.generateStream({
    input: prompt,
    ...options
  }, onChunk);
};