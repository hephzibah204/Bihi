// services/aiRouter.ts
// Intelligent AI routing between Gemini and HuggingFace based on task complexity

import { callGeminiApi } from './geminiService';
import { getHuggingFaceClient } from './huggingFaceAPI';
import { generateFallbackResponse } from './fallbackAiService';
import { callAnthropicApi } from './anthropicService';
import { callOpenRouter } from './openrouterService';
import { callOpenAI } from './openaiService';
import { logger } from '../utils/logger';
import { runOfflineModel } from '../lib/ai/offline-engine/offline_llm';
import { isSensitiveFinanceQuery, needsStructuredOutput } from '../lib/ai/orchestrator/fallback_strategy';
import { detectTools } from '../lib/ai/orchestrator/tool_router';

export type AIProvider = 'gemini' | 'huggingface' | 'anthropic' | 'openrouter' | 'openai' | 'auto' | 'templates' | 'offline';

export interface AISettings {
  preferredProvider: AIProvider;
  autoRouting: boolean;
  fallbackBehavior: 'always' | 'offline-only' | 'never';
  huggingfaceApiKey?: string;
  complexityThreshold: 'low' | 'medium' | 'high';
}

export interface TaskComplexity {
  score: number; // 0-100
  factors: {
    promptLength: number;
    conversationDepth: number;
    requiresContext: boolean;
    needsNigerianAlignment: boolean;
    isCreative: boolean;
    structuredOutput: boolean;
    hasConversationHistory: boolean;
  };
  recommendedProvider: AIProvider;
  reasoning: string;
}

export interface ConversationContext {
  id: string;
  provider: AIProvider;
  messages: Array<{ role: 'user' | 'assistant'; content: string; provider: AIProvider }>;
  complexityTrend: number[];
  startedAt: Date;
  lastUsedProvider: AIProvider;
}

export interface AIRouterResponse {
  content: string;
  provider: AIProvider;
  fallbackUsed: boolean;
  complexity: TaskComplexity;
  responseTime: number;
  cost: number; // Estimated cost in USD
}

/**
 * AI Router Service
 * Intelligently routes requests between Gemini and HuggingFace
 */
export class AIRouterService {
  private settings: AISettings;
  private conversations: Map<string, ConversationContext> = new Map();
  private providerHealth: Map<AIProvider, { available: boolean; lastCheck: Date }> = new Map();

  constructor(settings?: Partial<AISettings>) {
    // Load site-wide settings set by Super Admin
    const sitewideSettings = this.loadSitewideSettings();
    
    this.settings = {
      preferredProvider: 'auto',
      autoRouting: true,
      fallbackBehavior: 'always',
      complexityThreshold: 'medium',
      ...sitewideSettings, // Site-wide settings from Super Admin take precedence
      ...settings // Allow per-instance overrides
    };

    // Initialize provider health
    this.providerHealth.set('gemini', { available: true, lastCheck: new Date() });
    this.providerHealth.set('huggingface', { available: true, lastCheck: new Date() });
    this.providerHealth.set('anthropic', { available: true, lastCheck: new Date() });
    this.providerHealth.set('openrouter', { available: true, lastCheck: new Date() });
    this.providerHealth.set('openai', { available: true, lastCheck: new Date() });
    this.providerHealth.set('templates', { available: true, lastCheck: new Date() });
    this.providerHealth.set('offline', { available: true, lastCheck: new Date() });
    
    logger.info('AIRouter initialized with site-wide settings');
  }

  /**
   * Load site-wide settings configured by Super Admin
   */
  private loadSitewideSettings(): Partial<AISettings> {
    try {
      if (typeof window === 'undefined') return {};
      
      const stored = localStorage.getItem('sitewide_ai_settings');
      if (stored) {
        const settings = JSON.parse(stored) as Partial<AISettings>;
        logger.info('Loaded site-wide AI settings from Super Admin');
        return settings;
      }
    } catch (error) {
      logger.warn('Failed to load site-wide AI settings');
    }
    return {};
  }

  /**
   * Update AI settings
   */
  public updateSettings(settings: Partial<AISettings>): void {
    this.settings = { ...this.settings, ...settings };
    logger.info('AI router settings updated');
  }

  /**
   * Get current AI settings
   */
  public getSettings(): AISettings {
    return { ...this.settings };
  }

  /**
   * Analyze task complexity
   */
  public analyzeComplexity(
    prompt: string,
    conversationId?: string,
    metadata?: any
  ): TaskComplexity {
    const promptLength = prompt.length;
    const words = prompt.split(/\s+/).length;
    
    // Get conversation context if available
    const conversation = conversationId ? this.conversations.get(conversationId) : undefined;
    const conversationDepth = conversation?.messages.length || 0;
    
    // Analyze factors
    const factors = {
      promptLength,
      conversationDepth,
      requiresContext: this.detectContextRequirement(prompt, conversation),
      needsNigerianAlignment: this.detectNigerianContext(prompt),
      isCreative: this.detectCreativeTask(prompt),
      structuredOutput: this.detectStructuredOutput(prompt),
      hasConversationHistory: conversationDepth > 0
    };

    // Calculate complexity score (0-100)
    let score = 0;
    
    // Length factor (0-25 points)
    if (words < 20) score += 5;
    else if (words < 50) score += 10;
    else if (words < 100) score += 20;
    else score += 25;

    // Conversation depth (0-20 points)
    score += Math.min(conversationDepth * 5, 20);

    // Context requirement (0-20 points)
    if (factors.requiresContext) score += 20;

    // Nigerian alignment (0-15 points)
    if (factors.needsNigerianAlignment) score += 15;

    // Creative task (0-15 points)
    if (factors.isCreative) score += 15;

    // Structured output reduces complexity (-10 points, good for HF)
    if (factors.structuredOutput) score -= 10;

    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine recommended provider
    const recommendedProvider = this.selectProvider(score, factors);
    const reasoning = this.explainProviderSelection(score, factors, recommendedProvider);

    return {
      score,
      factors,
      recommendedProvider,
      reasoning
    };
  }

  /**
   * Select best provider based on complexity and settings
   */
  private selectProvider(score: number, factors: TaskComplexity['factors']): AIProvider {
    // Override with user preference if auto-routing is disabled
    if (!this.settings.autoRouting) {
      return this.settings.preferredProvider === 'auto' ? 'gemini' : this.settings.preferredProvider;
    }

    // Adjust thresholds based on user preference
    const thresholds = {
      low: { simple: 30, medium: 50 },
      medium: { simple: 35, medium: 60 },
      high: { simple: 40, medium: 70 }
    }[this.settings.complexityThreshold];

    // Simple tasks → HuggingFace
    if (score < thresholds.simple && factors.structuredOutput && !factors.hasConversationHistory) {
      return 'huggingface';
    }

    // Medium tasks → User preference or HuggingFace
    if (score < thresholds.medium && !factors.requiresContext) {
      if (this.settings.preferredProvider === 'huggingface') return 'huggingface';
      if (this.settings.preferredProvider === 'gemini') return 'gemini';
      return 'huggingface'; // Default to cost-effective option
    }

    // Complex tasks or conversations → Gemini
    if (score >= thresholds.medium || factors.conversationDepth > 2 || factors.requiresContext) {
      return 'gemini';
    }

    // Default
    return this.settings.preferredProvider === 'huggingface' ? 'huggingface' : 'gemini';
  }

  /**
   * Generate AI response with intelligent routing
   */
  public async generate(
    prompt: string,
    conversationId?: string,
    metadata?: any
  ): Promise<AIRouterResponse> {
    const startTime = Date.now();
    
    const complexity = this.analyzeComplexity(prompt, conversationId, metadata);
    const toolsNeeded = detectTools(prompt).length > 0;
    const forceOffline = isSensitiveFinanceQuery(prompt) || toolsNeeded || needsStructuredOutput(prompt);
    
    // Get or create conversation context
    let conversation = conversationId ? this.conversations.get(conversationId) : undefined;
    
    if (!conversation && conversationId) {
      conversation = {
        id: conversationId,
        provider: complexity.recommendedProvider,
        messages: [],
        complexityTrend: [],
        startedAt: new Date(),
        lastUsedProvider: complexity.recommendedProvider
      };
      this.conversations.set(conversationId, conversation);
    }

    // Maintain conversation continuity (use same provider unless complexity changes significantly)
    let targetProvider = forceOffline ? 'offline' : complexity.recommendedProvider;
    if (conversation && conversation.messages.length > 0) {
      const avgComplexity = conversation.complexityTrend.reduce((a, b) => a + b, 0) / conversation.complexityTrend.length;
      const complexityChange = Math.abs(complexity.score - avgComplexity);
      
      // Only switch providers if complexity changes dramatically (>30 points)
      if (complexityChange < 30) {
        targetProvider = conversation.lastUsedProvider;
        logger.info(`Maintaining conversation continuity with ${targetProvider}`);
      } else {
        logger.info(`Switching provider due to complexity change: ${complexityChange.toFixed(0)} points`);
      }
    }

    // Try to generate response
    let response: AIRouterResponse;
    try {
      response = await this.generateWithProvider(
        prompt,
        targetProvider,
        complexity,
        conversation,
        startTime
      );
    } catch (error) {
      logger.warn(`Primary provider ${targetProvider} failed, trying fallback`);
      
      // Try chain in order: HuggingFace → Anthropic → OpenRouter → OpenAI → Offline → Templates
      const chain: AIProvider[] = ['huggingface','anthropic','openrouter','openai','offline','templates'];
      let lastErr: any = null;
      for (const p of chain) {
        if (p === targetProvider) continue;
        try {
          response = await this.generateWithProvider(
            prompt,
            p,
            complexity,
            conversation,
            startTime
          );
          response.fallbackUsed = true;
          lastErr = null;
          break;
        } catch (fallbackError) {
          lastErr = fallbackError;
          continue;
        }
      }
      if (!response) {
        const templateResponse = generateFallbackResponse(prompt, metadata);
        response = {
          content: templateResponse,
          provider: 'templates',
          fallbackUsed: true,
          complexity,
          responseTime: Date.now() - startTime,
          cost: 0
        };
      }
    }

    // Update conversation context
    if (conversation) {
      conversation.messages.push(
        { role: 'user', content: prompt, provider: response.provider },
        { role: 'assistant', content: response.content, provider: response.provider }
      );
      conversation.complexityTrend.push(complexity.score);
      conversation.lastUsedProvider = response.provider;
    }

    return response;
  }

  /**
   * Generate response with specific provider
   */
  private async generateWithProvider(
    prompt: string,
    provider: AIProvider,
    complexity: TaskComplexity,
    conversation?: ConversationContext,
    startTime?: number
  ): Promise<AIRouterResponse> {
    startTime = startTime || Date.now();

    try {
      if (provider === 'gemini') {
        const content = await callGeminiApi(prompt);
        return {
          content,
          provider: 'gemini',
          fallbackUsed: false,
          complexity,
          responseTime: Date.now() - startTime,
          cost: this.estimateCost(prompt, content, 'gemini')
        };
      } else if (provider === 'huggingface') {
        const hfClient = getHuggingFaceClient();
        
        // Select appropriate model based on task
        const model = this.selectHuggingFaceModel(prompt, complexity);
        
        // Build context-aware prompt
        const enhancedPrompt = this.buildHuggingFacePrompt(prompt, conversation);
        
        const response = await hfClient.generateEducationalContent(
          enhancedPrompt,
          undefined,
          model
        );
        
        return {
          content: response,
          provider: 'huggingface',
          fallbackUsed: false,
          complexity,
          responseTime: Date.now() - startTime,
          cost: 0 // Free tier
        };
      } else if (provider === 'anthropic') {
        const content = await callAnthropicApi(prompt);
        return {
          content,
          provider: 'anthropic',
          fallbackUsed: false,
          complexity,
          responseTime: Date.now() - startTime,
          cost: 0
        };
      } else if (provider === 'openrouter') {
        const content = await callOpenRouter(prompt);
        return {
          content,
          provider: 'openrouter',
          fallbackUsed: false,
          complexity,
          responseTime: Date.now() - startTime,
          cost: 0
        };
      } else if (provider === 'openai') {
        const content = await callOpenAI(prompt);
        return {
          content,
          provider: 'openai',
          fallbackUsed: false,
          complexity,
          responseTime: Date.now() - startTime,
          cost: 0
        };
      } else if (provider === 'offline') {
        const role = (typeof window !== 'undefined' ? localStorage.getItem('demoUserRole') : null) as any;
        const content = await runOfflineModel({ prompt, role: (role || 'Teacher') as any, tenantId: (typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || 'demo') : 'demo'), conversationHistory: conversation ? conversation.messages.map(m => `${m.role}: ${m.content}`) : [] });
        return {
          content,
          provider: 'offline',
          fallbackUsed: false,
          complexity,
          responseTime: Date.now() - startTime,
          cost: 0
        };
      } else {
        // Templates
        const content = generateFallbackResponse(prompt);
        return {
          content,
          provider: 'templates',
          fallbackUsed: true,
          complexity,
          responseTime: Date.now() - startTime,
          cost: 0
        };
      }
    } catch (error) {
      logger.error(`Provider ${provider} generation failed`);
      throw error;
    }
  }

  /**
   * Select appropriate HuggingFace model based on task
   */
  private selectHuggingFaceModel(prompt: string, complexity: TaskComplexity): string {
    const promptLower = prompt.toLowerCase();
    
    // Quiz/Q&A tasks
    if (promptLower.includes('quiz') || 
        promptLower.includes('question') || 
        promptLower.includes('test') ||
        complexity.factors.structuredOutput) {
      return 'google/flan-t5-large';
    }
    
    // Summarization tasks
    if (promptLower.includes('summarize') || 
        promptLower.includes('summary') ||
        promptLower.includes('brief')) {
      return 'facebook/bart-large-cnn';
    }
    
    // Translation tasks
    if (promptLower.includes('translate') || 
        promptLower.includes('language')) {
      return 'facebook/mbart-large-50-many-to-many-mmt';
    }
    
    // Default: General educational model
    return 'google/flan-t5-base';
  }

  /**
   * Build enhanced prompt for HuggingFace with context
   */
  private buildHuggingFacePrompt(prompt: string, conversation?: ConversationContext): string {
    let enhancedPrompt = prompt;
    
    // Add Nigerian educational context
    enhancedPrompt = `Context: Nigerian educational system (WAEC/NECO curriculum)\n\n${enhancedPrompt}`;
    
    // Add conversation history if available (last 2 messages for context)
    if (conversation && conversation.messages.length > 0) {
      const recentMessages = conversation.messages.slice(-4); // Last 2 exchanges
      const context = recentMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');
      enhancedPrompt = `Previous conversation:\n${context}\n\nCurrent request: ${enhancedPrompt}`;
    }
    
    return enhancedPrompt;
  }

  /**
   * Estimate cost of API call
   */
  private estimateCost(prompt: string, response: string, provider: AIProvider): number {
    if (provider === 'huggingface' || provider === 'templates') return 0;
    
    // Gemini pricing: ~$0.001 per 1K characters
    const totalChars = prompt.length + response.length;
    return (totalChars / 1000) * 0.001;
  }

  /**
   * Helper methods for complexity analysis
   */
  
  private detectContextRequirement(prompt: string, conversation?: ConversationContext): boolean {
    const contextKeywords = ['continue', 'more', 'also', 'additionally', 'furthermore', 'my child', 'their', 'his', 'her'];
    const promptLower = prompt.toLowerCase();
    
    if (conversation && conversation.messages.length > 0) return true;
    return contextKeywords.some(keyword => promptLower.includes(keyword));
  }

  private detectNigerianContext(prompt: string): boolean {
    const nigerianKeywords = [
      'nigerian', 'nigeria', 'waec', 'neco', 'jamb', 'nabteb',
      'ss1', 'ss2', 'ss3', 'jss', 'naira', 'lagos', 'abuja',
      'yoruba', 'hausa', 'igbo'
    ];
    const promptLower = prompt.toLowerCase();
    return nigerianKeywords.some(keyword => promptLower.includes(keyword));
  }

  private detectCreativeTask(prompt: string): boolean {
    const creativeKeywords = [
      'create', 'write', 'compose', 'draft', 'design', 'develop',
      'essay', 'story', 'letter', 'announcement', 'creative'
    ];
    const promptLower = prompt.toLowerCase();
    return creativeKeywords.some(keyword => promptLower.includes(keyword));
  }

  private detectStructuredOutput(prompt: string): boolean {
    const structuredKeywords = [
      'list', 'quiz', 'questions', 'multiple choice', 'fill in',
      'true or false', 'matching', 'vocabulary', 'terms', 'definitions'
    ];
    const promptLower = prompt.toLowerCase();
    return structuredKeywords.some(keyword => promptLower.includes(keyword));
  }

  private explainProviderSelection(
    score: number,
    factors: TaskComplexity['factors'],
    provider: AIProvider
  ): string {
    const reasons: string[] = [];
    
    if (provider === 'huggingface') {
      reasons.push('Task is simple and structured');
      if (factors.structuredOutput) reasons.push('Structured output detected');
      if (score < 30) reasons.push('Low complexity score');
      reasons.push('Using HuggingFace for cost efficiency');
    } else if (provider === 'gemini') {
      if (factors.requiresContext) reasons.push('Requires contextual understanding');
      if (factors.isCreative) reasons.push('Creative task detected');
      if (factors.conversationDepth > 0) reasons.push('Part of ongoing conversation');
      if (factors.needsNigerianAlignment) reasons.push('Nigerian curriculum alignment needed');
      if (score >= 50) reasons.push('High complexity task');
      reasons.push('Using Gemini for superior quality');
    } else {
      reasons.push('Offline fallback mode');
    }
    
    return reasons.join('; ');
  }

  /**
   * Get conversation history
   */
  public getConversation(conversationId: string): ConversationContext | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Clear old conversations (cleanup)
   */
  public clearOldConversations(maxAgeHours: number = 24): number {
    const now = Date.now();
    let cleared = 0;
    
    for (const [id, conversation] of this.conversations) {
      const age = (now - conversation.startedAt.getTime()) / (1000 * 60 * 60);
      if (age > maxAgeHours) {
        this.conversations.delete(id);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      logger.info(`Cleared ${cleared} old conversations`);
    }
    
    return cleared;
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): {
    totalConversations: number;
    providerDistribution: Record<AIProvider, number>;
    averageComplexity: number;
    totalCost: number;
  } {
    const stats = {
      totalConversations: this.conversations.size,
      providerDistribution: {
        gemini: 0,
        huggingface: 0,
        anthropic: 0,
        openrouter: 0,
        openai: 0,
        auto: 0,
        templates: 0,
        offline: 0
      } as Record<AIProvider, number>,
      averageComplexity: 0,
      totalCost: 0
    };

    let totalComplexity = 0;
    let complexityCount = 0;

    for (const conversation of this.conversations.values()) {
      // Count provider usage
      for (const message of conversation.messages) {
        if (message.role === 'assistant') {
          stats.providerDistribution[message.provider]++;
        }
      }
      
      // Average complexity
      if (conversation.complexityTrend.length > 0) {
        totalComplexity += conversation.complexityTrend.reduce((a, b) => a + b, 0);
        complexityCount += conversation.complexityTrend.length;
      }
    }

    if (complexityCount > 0) {
      stats.averageComplexity = totalComplexity / complexityCount;
    }

    return stats;
  }
}

// Singleton instance
let aiRouterInstance: AIRouterService | null = null;

export function getAIRouter(settings?: Partial<AISettings>): AIRouterService {
  if (!aiRouterInstance) {
    aiRouterInstance = new AIRouterService(settings);
  }
  return aiRouterInstance;
}

export { AIRouterService as default };
