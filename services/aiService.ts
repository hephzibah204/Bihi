// services/aiService.ts
// Gemini-first AI service with graceful fallback and user notifications

import { generateFallbackResponse } from './fallbackAiService';
import { logger } from '../utils/logger';
import { withRetry } from '../utils/retry';

interface AIServiceConfig {
  geminiApiKey?: string;
  fallbackEnabled: boolean;
  healthCheckInterval: number;
  maxRetries: number;
  timeoutMs: number;
}

interface AIServiceStatus {
  service: 'gemini' | 'fallback' | 'offline';
  online: boolean;
  lastCheck: Date;
  error?: string;
  responseTime?: number;
}

interface AIResponse {
  content: string;
  source: 'gemini' | 'fallback';
  cached?: boolean;
}

class AIService {
  private config: AIServiceConfig;
  private status: AIServiceStatus;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private logger: Logger;
  private isMonitoring = false;
  private fallbackResponses: Map<string, string> = new Map();

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      geminiApiKey: this.getGeminiApiKey(),
      fallbackEnabled: true,
      healthCheckInterval: 60000, // 1 minute
      maxRetries: 3,
      timeoutMs: 30000,
      ...config
    };

    this.status = {
      service: 'offline',
      online: false,
      lastCheck: new Date()
    };

    this.logger = logger;
    this.initializeFallbackResponses();
    this.startHealthMonitoring();
  }

  private getGeminiApiKey(): string | undefined {
    if (typeof window !== 'undefined') {
      return import.meta.env?.GEMINI_API_KEY || 
             window.process?.env?.GEMINI_API_KEY;
    }
    return process.env?.GEMINI_API_KEY;
  }

  private initializeFallbackResponses() {
    // Pre-defined intelligent fallback responses for common queries
    this.fallbackResponses.set('greeting', 'Hello! I\'m currently running in offline mode. I can still help with basic queries using cached responses.');
    this.fallbackResponses.set('help', 'I\'m here to assist you. While AI services are temporarily unavailable, I can provide basic guidance and cached information.');
    this.fallbackResponses.set('status', 'AI services are currently offline. I\'m operating in fallback mode with limited functionality.');
    this.fallbackResponses.set('error', 'I\'m experiencing connectivity issues with AI services. Please try again in a few moments, or I can provide basic assistance in offline mode.');
    this.fallbackResponses.set('default', 'I\'m currently in offline mode due to AI service connectivity issues. I can provide basic assistance, but full AI features are temporarily unavailable.');
  }

  /**
   * Start monitoring AI service health
   */
  public startHealthMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.logger.info('AI service health monitoring started');
    
    // Initial health check
    this.checkServiceHealth();
    
    // Periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.checkServiceHealth();
    }, this.config.healthCheckInterval);
  }

  /**
   * Stop health monitoring
   */
  public stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.isMonitoring = false;
      this.logger.info('AI service health monitoring stopped');
    }
  }

  /**
   * Check health of AI services
   */
  private async checkServiceHealth() {
    const startTime = Date.now();
    
    try {
      if (this.config.geminiApiKey) {
        await this.testGeminiConnection();
        const responseTime = Date.now() - startTime;
        
        this.updateStatus({
          service: 'gemini',
          online: true,
          lastCheck: new Date(),
          responseTime,
          error: undefined
        });
        
        this.notifyServiceRestored('gemini');
      } else {
        throw new Error('No Gemini API key configured');
      }
    } catch (error: any) {
      this.logger.warn('AI service health check failed', { error: error.message });
      
      this.updateStatus({
        service: this.config.fallbackEnabled ? 'fallback' : 'offline',
        online: this.config.fallbackEnabled,
        lastCheck: new Date(),
        error: error.message
      });
      
      this.notifyServiceDown('gemini', error.message);
    }
  }

  /**
   * Test Gemini API connection
   */
  private async testGeminiConnection(): Promise<void> {
    if (!this.config.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        method: 'GET',
        headers: {
          'x-goog-api-key': this.config.geminiApiKey
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Gemini API responded with status ${response.status}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Update service status and notify listeners
   */
  private updateStatus(newStatus: Partial<AIServiceStatus>) {
    const previousService = this.status.service;
    const previousOnline = this.status.online;
    
    this.status = { ...this.status, ...newStatus };
    
    // Log status changes
    if (previousService !== this.status.service || previousOnline !== this.status.online) {
      this.logger.info('AI service status changed', {
        from: { service: previousService, online: previousOnline },
        to: { service: this.status.service, online: this.status.online }
      });
    }
  }

  /**
   * Notify when service is restored
   */
  private notifyServiceRestored(service: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-service-restored', {
        detail: { service, status: this.status }
      }));
    }
  }

  /**
   * Notify when service goes down
   */
  private notifyServiceDown(service: string, error: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-service-down', {
        detail: { service, error, status: this.status }
      }));
    }
  }

  /**
   * Generate AI response with fallback handling
   */
  public async generateResponse(prompt: string, context?: any): Promise<AIResponse> {
    try {
      // Try primary AI service first
      if (this.status.service === 'gemini' && this.status.online) {
        return await this.callGeminiAPI(prompt, context);
      }
      
      // Fall back to offline responses
      if (this.config.fallbackEnabled) {
        return this.generateFallbackResponse(prompt, context);
      }
      
      throw new Error('All AI services are offline and fallback is disabled');
      
    } catch (error: any) {
      this.logger.error('AI response generation failed', { error: error.message, prompt });
      
      // Try fallback even if primary service was supposed to work
      if (this.config.fallbackEnabled) {
        return this.generateFallbackResponse(prompt, context);
      }
      
      throw error;
    }
  }

  /**
   * Call Gemini API with retry logic
   */
  private async callGeminiAPI(prompt: string, context?: any): Promise<AIResponse> {
    if (!this.config.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    return await withRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

        try {
          const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.config.geminiApiKey!
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: prompt }]
              }]
            }),
            signal: controller.signal
          });

          if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

          return {
            content,
            source: 'gemini' as const
          };
        } finally {
          clearTimeout(timeoutId);
        }
      },
      {
        maxRetries: this.config.maxRetries,
        initialDelay: 1000,
        onRetry: (attempt, error) => {
          this.logger.warn(`Gemini API retry attempt ${attempt}`, { error: error.message });
        }
      }
    );
  }

  /**
   * Generate intelligent fallback response
   */
  private generateFallbackResponse(prompt: string, context?: any): AIResponse {
    const lowerPrompt = prompt.toLowerCase();
    
    // Try to match common patterns
    let response: string;
    
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi')) {
      response = this.fallbackResponses.get('greeting')!;
    } else if (lowerPrompt.includes('help') || lowerPrompt.includes('assist')) {
      response = this.fallbackResponses.get('help')!;
    } else if (lowerPrompt.includes('status') || lowerPrompt.includes('online')) {
      response = this.fallbackResponses.get('status')!;
    } else if (lowerPrompt.includes('error') || lowerPrompt.includes('problem')) {
      response = this.fallbackResponses.get('error')!;
    } else {
      response = this.fallbackResponses.get('default')!;
    }
    
    // Add context-aware information if available
    if (context?.userRole) {
      response += ` I understand you're a ${context.userRole}.`;
    }
    
    return {
      content: response,
      source: 'fallback' as const
    };
  }

  /**
   * Get current service status
   */
  public getStatus(): AIServiceStatus {
    return { ...this.status };
  }

  /**
   * Force a service health check
   */
  public async forceHealthCheck(): Promise<AIServiceStatus> {
    await this.checkServiceHealth();
    return this.getStatus();
  }

  /**
   * Test connection and attempt to restore service
   */
  public async testAndRestore(): Promise<boolean> {
    try {
      // Try to restore primary service first
      if (this.config.geminiApiKey && this.status.service === 'offline') {
        this.status.service = 'gemini';
        this.status.isOnline = true;
        this.updateStatus();
      }

      const response = await this.generateResponse('test', 'connection test');
      
      if (response.success) {
        this.status.lastSuccessfulConnection = new Date();
        this.status.consecutiveFailures = 0;
        this.updateStatus();
        return true;
      } else {
        throw new Error('Test response failed');
      }
    } catch (error) {
      this.logger.error('AI service test and restore failed', error);
      this.status.consecutiveFailures++;
      this.updateStatus();
      return false;
    }
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

export { AIService, type AIServiceConfig, type AIServiceStatus, type AIResponse };