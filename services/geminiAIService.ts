// services/geminiAIService.ts
// Unified AI entrypoints used across the app; tolerant of varied call shapes
import { analyzeWithFallback } from '../utils/aiAdapter';
import { generateEnhancedFallbackResponse } from './enhancedFallbackAI';
import { logger } from '../utils/logger';

export function normalizePrompt(input: any): string {
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object') {
    return (
      input.prompt ?? input.text ?? input.content ?? input.message ?? JSON.stringify(input)
    );
  }
  return String(input ?? '');
}

export async function generateResponse(prompt: any, options?: any): Promise<string> {
  const p = normalizePrompt(prompt);
  try {
    const res = await analyzeWithFallback(p, options);
    return (res?.text ?? '').toString();
  } catch {
    // final sync fallback
    return generateEnhancedFallbackResponse(p, options);
  }
}

// Convenience wrappers (legacy names used around the app)
export const generateReport = generateResponse;
export const generateAnnouncement = generateResponse;
export const generateLessonPlan = generateResponse;

// services/geminiAIService.ts
// Gemini-first AI service with graceful fallback and user notifications

import { generateFallbackResponse } from './fallbackAiService';

export interface AIResponse {
    content: string;
    source: 'gemini' | 'semantic-cache' | 'huggingface' | 'templates';
    isFallback: boolean;
    fallbackReason?: string;
    timestamp: number;
    metadata?: {
        model?: string;
        tokensUsed?: number;
        responseTime?: number;
    };
}

export interface AIRequest {
    prompt: string;
    context?: {
        userRole?: 'Teacher' | 'Student' | 'Parent' | 'Admin';
        subject?: string;
        grade?: string;
        [key: string]: any;
    };
    options?: {
        timeout?: number;
        retries?: number;
    };
    conversationId?: string;
    conversationHistory?: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
    }>;
}

export interface ServiceStatus {
    geminiAvailable: boolean;
    fallbackAvailable: boolean;
    lastGeminiCheck: number;
    lastGeminiError?: string;
}

/**
 * Gemini AI Service with Fallback
 * 
 * Priority Order:
 * 1. Gemini API (primary)
 * 2. Fallback AI System (semantic cache → HF → templates)
 * 
 * Always notifies users of the source being used
 */
export class GeminiAIService {
    private geminiApiKey: string | null = null;
    private geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    private status: ServiceStatus = {
        geminiAvailable: false,
        fallbackAvailable: true,
        lastGeminiCheck: 0
    };
    private conversationService: any = null;

    constructor(apiKey?: string) {
        this.geminiApiKey = apiKey || this.loadGeminiKey();
        this.initConversationService();
    }

    /**
     * Initialize conversation service for history management
     */
    private async initConversationService() {
        try {
            const { getConversationService } = await import('./conversationService');
            this.conversationService = getConversationService();
        } catch (error) {
            logger.captureError(error, 'Conversation service not available');
        }
    }

    /**
     * Load Gemini API key from environment or storage
     */
    private loadGeminiKey(): string | null {
        // Try environment variable first
        if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
            return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        }

        // Try localStorage (browser only)
        if (typeof window !== 'undefined') {
            try {
                return localStorage.getItem('gemini_api_key');
            } catch {
                return null;
            }
        }

        return null;
    }

    /**
     * Set Gemini API key
     */
    public setGeminiKey(apiKey: string): void {
        this.geminiApiKey = apiKey;
        
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('gemini_api_key', apiKey);
            } catch (error) {
                logger.captureError(error as any, 'Failed to save Gemini API key');
            }
        }
    }

    /**
     * Check if Gemini is configured
     */
    public hasGeminiKey(): boolean {
        return !!this.geminiApiKey;
    }

    /**
     * Main generate method - Gemini first, fallback on error
     * Now with conversation history support
     */
    public async generate(request: AIRequest): Promise<AIResponse> {
        const startTime = Date.now();

        // STEP 1: Try Gemini API (if configured)
        if (this.hasGeminiKey()) {
            try {
                logger.info('Attempting Gemini API...');
                const geminiContent = await this.callGemini(request);
                
                const responseTime = Date.now() - startTime;
                logger.info(`Gemini successful (${responseTime}ms)`);

                // Update status
                this.status.geminiAvailable = true;
                this.status.lastGeminiCheck = Date.now();
                this.status.lastGeminiError = undefined;

                // Save to conversation history if conversationId provided
                if (request.conversationId && this.conversationService) {
                    try {
                        await this.conversationService.addMessage({
                            conversationId: request.conversationId,
                            role: 'user',
                            content: request.prompt,
                            source: 'gemini',
                            isFallback: false
                        });
                        await this.conversationService.addMessage({
                            conversationId: request.conversationId,
                            role: 'assistant',
                            content: geminiContent,
                            source: 'gemini',
                            isFallback: false
                        });
                    } catch (error) {
                        console.warn('Failed to save conversation history:', error);
                    }
                }

                return {
                    content: geminiContent,
                    source: 'gemini',
                    isFallback: false,
                    timestamp: Date.now(),
                    metadata: {
                        model: 'gemini-pro',
                        tokensUsed: this.estimateTokens(geminiContent),
                        responseTime
                    }
                };
            } catch (error: any) {
                logger.warn('Gemini failed, switching to fallback');
                logger.error('Gemini error', { error: error as any });

                // Update status
                this.status.geminiAvailable = false;
                this.status.lastGeminiCheck = Date.now();
                this.status.lastGeminiError = error.message;

                // STEP 2: Use fallback system
                return this.useFallback(request, error.message);
            }
        } else {
            // No Gemini key configured, use fallback directly
            logger.info('Gemini not configured, using fallback system');
            return this.useFallback(request, 'Gemini API key not configured');
        }
    }

    /**
     * Call Gemini API with conversation history
     */
    private async callGemini(request: AIRequest): Promise<string> {
        if (!this.geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

        const timeout = request.options?.timeout || 30000; // 30s default
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Build contents with conversation history
            const contents = await this.buildGeminiContents(request);

            const response = await fetch(
                `${this.geminiEndpoint}?key=${this.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents,
                        generationConfig: {
                            temperature: 0.7,
                            topK: 40,
                            topP: 0.95,
                            maxOutputTokens: 2048,
                        },
                        safetySettings: [
                            {
                                category: 'HARM_CATEGORY_HARASSMENT',
                                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                            },
                            {
                                category: 'HARM_CATEGORY_HATE_SPEECH',
                                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                            },
                            {
                                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                            },
                            {
                                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                            }
                        ]
                    }),
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message || 
                    `Gemini API error: ${response.status} ${response.statusText}`
                );
            }

            const data = await response.json();
            
            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response format from Gemini');
            }

            return data.candidates[0].content.parts[0].text;
            
        } catch (error: any) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Gemini request timed out');
            }
            
            throw error;
        }
    }

    /**
     * Build contents array with conversation history for Gemini
     */
    private async buildGeminiContents(request: AIRequest): Promise<Array<any>> {
        const contents: Array<any> = [];

        // Load conversation history if conversationId provided
        let history = request.conversationHistory || [];
        if (request.conversationId && this.conversationService) {
            try {
                const messages = await this.conversationService.getContextMessages(
                    request.conversationId,
                    20 // Last 20 messages for context
                );
                history = messages.map((msg: any) => ({
                    role: msg.role,
                    content: msg.content
                }));
        } catch (error) {
                logger.captureError(error, 'Failed to load conversation history');
            }
        }

        // Add system message if first message
        if (history.length === 0) {
            contents.push({
                role: 'user',
                parts: [{ text: this.buildSystemPrompt(request.context) }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: 'Understood. I\'m ready to assist with Nigerian educational content.' }]
            });
        }

        // Add conversation history
        for (const msg of history) {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }

        // Add current user message
        contents.push({
            role: 'user',
            parts: [{ text: request.prompt }]
        });

        return contents;
    }

    /**
     * Build system prompt with Nigerian context
     */
    private buildSystemPrompt(context?: any): string {
        let prompt = 'You are an educational AI assistant for the Nigerian school system.\n\n';

        if (context) {
            prompt += 'Context:\n';
            if (context.userRole) {
                prompt += `- User: ${context.userRole}\n`;
            }
            if (context.subject) {
                prompt += `- Subject: ${context.subject}\n`;
            }
            if (context.grade) {
                prompt += `- Grade: ${context.grade}\n`;
            }
            prompt += '- Education System: Nigerian curriculum\n\n';
        }

        prompt += 'Instructions:\n';
        prompt += '- Align responses with Nigerian education standards\n';
        prompt += '- Use clear, accessible language\n';
        prompt += '- Include practical examples where appropriate\n';
        prompt += '- Be culturally relevant to Nigerian context\n';
        prompt += '- Maintain conversation continuity and context';

        return prompt;
    }

    /**
     * Use fallback AI system (semantic cache → HF → templates)
     */
    private useFallback(request: AIRequest, reason: string): AIResponse {
        logger.info('Activating fallback AI system...');
        
        try {
            const startTime = Date.now();

            // Call our enhanced fallback system
            const fallbackContent = generateFallbackResponse({
                prompt: request.prompt,
                context: request.context
            });

            const responseTime = Date.now() - startTime;

            // Detect which fallback layer was used
            const source = this.detectFallbackSource(fallbackContent);
            
            logger.info(`Fallback successful using ${source} (${responseTime}ms)`);

            return {
                content: fallbackContent,
                source,
                isFallback: true,
                fallbackReason: reason,
                timestamp: Date.now(),
                metadata: {
                    responseTime
                }
            };
        } catch (error: any) {
            logger.captureError(error, 'Fallback system also failed');
            
            // Last resort - error message
            return {
                content: this.getEmergencyMessage(reason),
                source: 'templates',
                isFallback: true,
                fallbackReason: `All AI systems failed: ${reason}`,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Detect which fallback source was used
     */
    private detectFallbackSource(content: string): 'semantic-cache' | 'huggingface' | 'templates' {
        const contentLower = content.toLowerCase();
        
        // Semantic cache usually has specific formatting
        if (content.includes('**') && content.length > 300) {
            return 'semantic-cache';
        }
        
        // HF generated content has certain patterns
        if (!contentLower.includes('offline mode') && content.length > 200) {
            return 'huggingface';
        }
        
        // Default to templates
        return 'templates';
    }

    /**
     * Estimate token count (rough approximation)
     */
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4);
    }

    /**
     * Get emergency message when all systems fail
     */
    private getEmergencyMessage(reason: string): string {
        return `**System Temporarily Unavailable**

We apologize, but our AI systems are currently experiencing issues.

**Issue:** ${reason}

**What you can do:**
1. Try again in a few moments
2. Check your internet connection
3. Contact support if the issue persists

Thank you for your patience.`;
    }

    /**
     * Test Gemini API key validity
     */
    public async testGeminiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
        const tempKey = this.geminiApiKey;
        this.geminiApiKey = apiKey;

        try {
            await this.callGemini({
                prompt: 'Test: Respond with OK',
                options: { timeout: 10000 }
            });
            
            return { valid: true };
        } catch (error: any) {
            return { valid: false, error: error.message };
        } finally {
            this.geminiApiKey = tempKey;
        }
    }

    /**
     * Get current service status
     */
    public getStatus(): ServiceStatus {
        return { ...this.status };
    }

    /**
     * Check if Gemini is currently available
     */
    public async checkGeminiAvailability(): Promise<boolean> {
        if (!this.hasGeminiKey()) {
            return false;
        }

        try {
            await this.callGemini({
                prompt: 'Health check',
                options: { timeout: 5000 }
            });
            
            this.status.geminiAvailable = true;
            this.status.lastGeminiCheck = Date.now();
            return true;
        } catch (error) {
            this.status.geminiAvailable = false;
            this.status.lastGeminiCheck = Date.now();
            return false;
        }
    }
}

// Singleton instance
let geminiServiceInstance: GeminiAIService | null = null;

export function getGeminiAIService(): GeminiAIService {
    if (!geminiServiceInstance) {
        geminiServiceInstance = new GeminiAIService();
    }
    return geminiServiceInstance;
}

/**
 * Convenience method for generating content
 */
export async function generateAIContent(
    prompt: string,
    context?: any
): Promise<AIResponse> {
    const service = getGeminiAIService();
    return service.generate({ prompt, context });
}

/**
 * Format AI response with user-friendly notification
 */
export interface FormattedResponse {
    content: string;
    notification: {
        message: string;
        type: 'success' | 'info' | 'warning' | 'error';
        icon: string;
        showFallbackInfo: boolean;
    } | null;
}

export function formatAIResponse(response: AIResponse): FormattedResponse {
    let notification = null;

    if (!response.isFallback) {
        // Gemini success - subtle success indicator
        notification = {
            message: `✓ Response generated by Gemini AI`,
            type: 'success' as const,
            icon: '✓',
            showFallbackInfo: false
        };
    } else {
        // Fallback used - show appropriate message
        const messages = {
            'semantic-cache': {
                message: '⚡ Using cached response (faster, reliable)',
                type: 'info' as const,
                icon: '⚡'
            },
            'huggingface': {
                message: '🤖 Generated using alternative AI model',
                type: 'info' as const,
                icon: '🤖'
            },
            'templates': {
                message: `⚠️ Using offline templates (Gemini temporarily unavailable)`,
                type: 'warning' as const,
                icon: '⚠️'
            }
        };

        const sourceInfo = messages[response.source] || messages.templates;

        notification = {
            message: sourceInfo.message,
            type: sourceInfo.type,
            icon: sourceInfo.icon,
            showFallbackInfo: true
        };

        // Add reason if available
        if (response.fallbackReason) {
            notification.message += `\nReason: ${response.fallbackReason}`;
        }
    }

    return {
        content: response.content,
        notification
    };
}