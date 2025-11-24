
// services/aiRouter.ts
import { callGeminiApi } from './geminiService';
import { getHuggingFaceClient } from './huggingFaceAPI';
import { generateFallbackResponse } from './fallbackAiService';
import { callAnthropicApi } from './anthropicService';
import { callOpenRouter } from './openrouterService';
import { callOpenAI } from './openaiService';
import { logger } from '../utils/logger';
import { getHuggingFaceConfig } from '../utils/env';
import { runOfflineModel } from '../lib/ai/offline-engine/offline_llm';
import { isSensitiveFinanceQuery, needsStructuredOutput } from '../lib/ai/orchestrator/fallback_strategy';
import { detectTools } from '../lib/ai/orchestrator/tool_router';

export type AIProvider = 'gemini' | 'huggingface' | 'anthropic' | 'openrouter' | 'openai' | 'auto' | 'templates' | 'offline';
export type TaskComplexity = 'low' | 'medium' | 'high';

export interface AIRouterResponse {
    provider: AIProvider;
    content: string;
    complexity: TaskComplexity;
    fallbackUsed: boolean;
}

export interface AISettings {
    preferredProvider: AIProvider;
    autoRouting: boolean;
    fallbackBehavior: 'always' | 'offline-only' | 'never';
    huggingfaceApiKey?: string;
    complexityThreshold: TaskComplexity;
}

class AIRouter {
    private settings: AISettings;
    private usageStats: Record<AIProvider, number> = {
        gemini: 0,
        huggingface: 0,
        anthropic: 0,
        openrouter: 0,
        openai: 0,
        auto: 0,
        templates: 0,
        offline: 0,
    };

    constructor(initialSettings?: Partial<AISettings>) {
        this.settings = {
            preferredProvider: 'auto',
            autoRouting: true,
            fallbackBehavior: 'always',
            complexityThreshold: 'medium',
            ...initialSettings,
        };
    }

    public getSettings(): AISettings {
        return { ...this.settings };
    }

    public updateSettings(newSettings: Partial<AISettings>) {
        this.settings = { ...this.settings, ...newSettings };
    }

    /**
     * Normalize prompt to string - handles cases where prompt might be an object
     */
    private normalizePrompt(prompt: unknown): string {
        if (typeof prompt === 'string') {
            return prompt;
        }
        if (prompt && typeof prompt === 'object') {
            // Try to extract prompt from common object shapes
            if ('prompt' in prompt && typeof prompt.prompt === 'string') {
                return prompt.prompt;
            }
            if ('input' in prompt && typeof prompt.input === 'string') {
                return prompt.input;
            }
            if ('text' in prompt && typeof prompt.text === 'string') {
                return prompt.text;
            }
            // Fallback to JSON stringification
            return JSON.stringify(prompt);
        }
        return String(prompt || '');
    }

    public analyzeComplexity(prompt: string, conversationHistory?: any): TaskComplexity {
        // Ensure prompt is a string (normalize if needed)
        const normalizedPrompt = typeof prompt === 'string' ? prompt : this.normalizePrompt(prompt);
        if (normalizedPrompt.length > 500) return 'high';
        if (normalizedPrompt.length > 200) return 'medium';
        return 'low';
    }

    public async generate(prompt: string | unknown, conversationId?: string, metadata?: any): Promise<AIRouterResponse> {
        // Normalize prompt to ensure it's always a string
        const normalizedPrompt = this.normalizePrompt(prompt);
        
        // Extract context from metadata
        const context = metadata?.context as string | undefined;
        const isLessonContext =
            context === 'lesson-plan-generation' ||
            context === 'topic-suggestions' ||
            context === 'lesson_plan' ||
            context === 'topic_suggestions';

        const complexity = this.analyzeComplexity(normalizedPrompt);
        let targetProvider = this.settings.preferredProvider;

        if (this.settings.autoRouting) {
            targetProvider = this.selectProvider(normalizedPrompt, complexity, metadata);
        }
        
        const tools = detectTools(normalizedPrompt);
        if (tools.length > 0) {
            logger.info('Detected tools:', { tools });
        }

        // Determine if we should force offline
        const toolsNeeded = tools.length > 0;
        const structured = needsStructuredOutput(normalizedPrompt);
        const sensitiveFinance = isSensitiveFinanceQuery(normalizedPrompt);
        
        // Only force offline for sensitive finance or tool-heavy queries,
        // and NOT for lesson-plan or topic-suggestion contexts
        const forceOffline = !isLessonContext && (sensitiveFinance || toolsNeeded);

        // Override provider if forceOffline is true
        if (forceOffline) {
            targetProvider = 'offline';
        }

        // Fallback chain: try providers in order (online first, then offline)
        const onlineChain: AIProvider[] = ['gemini', 'huggingface', 'anthropic', 'openrouter', 'openai'];
        
        // If targetProvider is 'auto', start with Gemini, otherwise use targetProvider
        const startProvider = targetProvider === 'auto' ? 'gemini' : targetProvider;
        
        // Build the actual chain starting from startProvider
        const providerChain: AIProvider[] = [];
        
        // Add startProvider if it's an online provider
        if (startProvider !== 'offline' && startProvider !== 'templates' && startProvider !== 'auto') {
            providerChain.push(startProvider);
        }
        
        // Add other online providers in order (skip if already added)
        for (const p of onlineChain) {
            if (p !== startProvider && p !== 'offline' && p !== 'templates' && p !== 'auto') {
                providerChain.push(p);
            }
        }
        
        // Add offline and templates as final fallbacks
        if (this.settings.fallbackBehavior !== 'never') {
            providerChain.push('offline', 'templates');
        }

        let lastError: Error | null = null;
        let fallbackUsed = false;

        // Try each provider in the chain
        for (let i = 0; i < providerChain.length; i++) {
            const provider = providerChain[i];
            
            try {
                const content = await this.callProvider(provider, normalizedPrompt);
                this.usageStats[provider]++;
                
                return {
                    provider,
                    content,
                    complexity,
                    fallbackUsed: i > 0 || fallbackUsed,
                };
            } catch (error) {
                lastError = error as Error;
                logger.warn(`Provider ${provider} failed, trying next in chain`, { provider, error });
                
                // If this was the last provider, break
                if (i === providerChain.length - 1) {
                    break;
                }
                
                // Mark that we're using fallback
                if (i === 0) {
                    fallbackUsed = true;
                }
            }
        }

        // All providers failed
        logger.error('All AI providers failed', { lastError, providerChain });
        
        if (this.settings.fallbackBehavior !== 'never') {
            // Final fallback to templates
            try {
                const fallbackContent = await this.useFallback(normalizedPrompt, this.settings.fallbackBehavior);
                return {
                    provider: 'templates',
                    content: fallbackContent,
                    complexity,
                    fallbackUsed: true,
                };
            } catch (fallbackError) {
                logger.error('Even fallback failed', { fallbackError });
            }
        }
        
        throw lastError || new Error('All AI providers failed');
    }

    private async callProvider(provider: AIProvider, prompt: string): Promise<string> {
        switch (provider) {
            case 'gemini':
                return callGeminiApi(prompt);
            case 'huggingface':
                const hfClient = getHuggingFaceClient();
                const response = await hfClient.textGeneration({
                    model: 'google/gemma-7b',
                    inputs: prompt,
                });
                return response.generated_text;
            case 'anthropic':
                return callAnthropicApi(prompt);
            case 'openrouter':
                return callOpenRouter(prompt);
            case 'openai':
                return callOpenAI(prompt);
            case 'offline':
                return runOfflineModel(prompt);
            default:
                // Default to Gemini for 'auto' or unknown providers
                return callGeminiApi(prompt);
        }
    }
    
    private selectProvider(prompt: string, complexity: TaskComplexity, metadata?: any): AIProvider {
        const context = metadata?.context as string | undefined;
        const isLessonContext =
            context === 'lesson-plan-generation' ||
            context === 'topic-suggestions' ||
            context === 'lesson_plan' ||
            context === 'topic_suggestions';

        // For lesson contexts, prefer online providers
        if (isLessonContext) {
            // Prefer Gemini for lesson plans (good for structured, educational content)
            if (context === 'lesson-plan-generation' || context === 'lesson_plan') {
                return 'gemini';
            }
            // For topic suggestions, use HuggingFace (cost-effective)
            return 'huggingface';
        }

        // For non-lesson contexts, apply standard logic
        if (isSensitiveFinanceQuery(prompt)) {
            return 'offline'; // Ensure privacy for financial queries
        }

        if (needsStructuredOutput(prompt)) {
            return 'gemini'; // Gemini is good for structured data
        }

        switch (complexity) {
            case 'high':
                return 'anthropic'; // Claude 3 is good for high complexity
            case 'medium':
                return 'gemini';
            case 'low':
                return 'huggingface'; // Use HuggingFace for low complexity (cost-effective)
            default:
                return 'gemini';
        }
    }

    private async useFallback(prompt: string, fallbackBehavior: 'always' | 'offline-only'): Promise<string> {
        this.usageStats.offline++;
        if (fallbackBehavior === 'always') {
            // First try online fallback, then offline
            try {
                return await generateFallbackResponse(prompt);
            } catch (onlineFallbackError) {
                logger.warn('Online fallback failed, trying offline model.', { onlineFallbackError });
                return runOfflineModel(prompt);
            }
        } else { // offline-only
            return runOfflineModel(prompt);
        }
    }

    public getUsageStats() {
        return { ...this.usageStats };
    }
}

// Singleton instance of the AIRouter
let aiRouterInstance: AIRouter | null = null;

export const getAIRouter = (settings?: Partial<AISettings>): AIRouter => {
    if (!aiRouterInstance) {
        aiRouterInstance = new AIRouter(settings);
    }
    return aiRouterInstance;
};

