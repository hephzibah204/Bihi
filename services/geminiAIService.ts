// services/geminiAIService.ts
// Unified AI entrypoints used across the app; tolerant of varied call shapes
import { analyzeWithFallback } from '../utils/aiAdapter';
import { generateEnhancedFallbackResponse } from './enhancedFallbackAI';
import { logger } from '../utils/logger';

export function normalizePrompt(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    const candidate = obj['prompt'] ?? obj['text'] ?? obj['content'] ?? obj['message'];
    if (typeof candidate === 'string') return candidate;
    if (typeof candidate === 'number' || typeof candidate === 'boolean') return String(candidate);
    try { return JSON.stringify(input); } catch { return String(input); }
  }
  return String(input ?? '');
}

export async function generateResponse(prompt: unknown, options?: Record<string, unknown>): Promise<string> {
  const p = normalizePrompt(prompt);
  try {
    // Gemini-first via in-app service (server-backed), with graceful fallback handled by this module
    const service = getGeminiAIService();
    const res = await service.generate({ prompt: p, context: options as any });
    return String(res?.content ?? '');
  } catch (e) {
    try {
      const { generateFallbackResponse } = await import('./fallbackAiService');
      return generateFallbackResponse(p, options as any);
    } catch {
      // final sync fallback
      return generateEnhancedFallbackResponse(p, options as any);
    }
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
        [key: string]: unknown;
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
    private geminiApiVersion = this.resolveApiVersion();
    private model = this.resolveModelName();
    private geminiEndpoint = `https://generativelanguage.googleapis.com/${this.geminiApiVersion}/models/${this.model}:generateContent`;
    private status: ServiceStatus = {
        geminiAvailable: false,
        fallbackAvailable: true,
        lastGeminiCheck: 0
    };
    // Resolve AI proxy endpoint: prefer Supabase Function URL if provided
    private getAiEndpoint(): string {
        try {
            const fromClient = (typeof window !== 'undefined')
                ? ((window as any).process?.env?.VITE_SUPABASE_AI_CHAT_URL || (import.meta as any)?.env?.VITE_SUPABASE_AI_CHAT_URL)
                : undefined;
            const fromServer = process.env.VITE_SUPABASE_AI_CHAT_URL;
            return (fromClient || fromServer || '/api/ai/generate') as string;
        } catch {
            return '/api/ai/generate';
        }
    }
    private conversationService: { addMessage: (params: { conversationId: string; role: 'user' | 'assistant'; content: string; source: 'gemini' | 'semantic-cache' | 'huggingface' | 'templates'; isFallback: boolean; metadata?: Record<string, unknown> }) => Promise<unknown>; getContextMessages?: (id: string, n: number) => Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>> } | null = null;

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
            this.conversationService = getConversationService() as any;
        } catch (error) {
            logger.captureError(error, 'Conversation service not available');
        }
    }

    /**
     * Load Gemini API key from environment or storage
     */
    private loadGeminiKey(): string | null {
        // Try common env variable names (server and client)
        const fromEnv =
            process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
            process.env.VITE_GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            process.env.VITE_GOOGLE_API_KEY;
        if (fromEnv) return fromEnv;

        // Try localStorage (browser only)
        if (typeof window !== 'undefined') {
            try {
                const key = localStorage.getItem('gemini_api_key');
                if (key) return key;
            } catch { /* ignore */ }
        }

        return null;
    }

    /**
     * Resolve and cache Gemini API key at runtime.
     * Prefers the same key Live Tutor uses (/api/ai/client-key).
     */
    private async resolveRuntimeGeminiKey(): Promise<string | null> {
        if (this.geminiApiKey) return this.geminiApiKey;
        try {
            const headers: Record<string, string> = { Accept: 'application/json' };
            const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('isDemoMode') === 'true';
            if (isDemo) {
                headers['X-Demo-Mode'] = 'true';
            } else if (typeof window !== 'undefined') {
                // Best-effort: try to attach Supabase auth token if available at runtime
                try {
                    const mod = await import('./supabaseClient');
                    const supabase: any = (mod as any).supabase || (mod as any).getSupabase?.();
                    if (supabase?.auth?.getSession) {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
                    }
                } catch { /* ignore */ }
            }
            const resp = await fetch('/api/ai/client-key', { headers });
            if (resp.ok) {
                const ct = resp.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    const data = await resp.json().catch(() => ({}));
                    if (data?.key) {
                        this.geminiApiKey = String(data.key);
                        return this.geminiApiKey;
                    }
                } else {
                    await resp.text().catch(() => '');
                }
            }
        } catch { /* ignore */ }
        // Fallback to existing env/local resolution
        this.geminiApiKey = this.loadGeminiKey();
        return this.geminiApiKey;
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
                logger.captureError(error as unknown, 'Failed to save Gemini API key');
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

        // Ensure we have a key (prefer Live Tutor's key via server endpoint)
        await this.resolveRuntimeGeminiKey();

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
                        logger.warn('Failed to save conversation history', { error });
                    }
                }

                return {
                    content: geminiContent,
                    source: 'gemini',
                    isFallback: false,
                    timestamp: Date.now(),
                    metadata: {
                        model: this.model,
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
                return await this.useFallback(request, error.message);
            }
        } else {
            // No Gemini key configured, use fallback directly
            logger.info('Gemini not configured, using fallback system');
            return await this.useFallback(request, 'Gemini API key not configured');
        }
    }

    /**
     * Call Gemini API with conversation history
     */
    private async callGemini(request: AIRequest): Promise<string> {
        // Route through our server proxy so all calls use the Live Tutor key
        const timeout = request.options?.timeout || 30000; // 30s default
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            // Build contents with conversation history (for better context on server)
            const contents = await this.buildGeminiContents(request);

            // Prefer HTML output; server supports JSON too when requested
            const effectiveMime = 'text/html';

            // Attach auth/demo headers similar to other services
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            try {
                const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('isDemoMode') === 'true';
                if (isDemo) headers['X-Demo-Mode'] = 'true';
                else {
                    const mod = await import('./supabaseClient');
                    const supabase: any = (mod as any).supabase || (mod as any).getSupabase?.();
                    if (supabase?.auth?.getSession) {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
                    }
                }
            } catch { /* ignore auth header errors */ }

            // Resolve endpoint and attach headers
            const endpoint = this.getAiEndpoint();

            // If calling Supabase Function without Authorization, attach anon key for public access
            try {
                const isSupabaseFn = typeof endpoint === 'string' && endpoint.includes('.supabase.co/functions/v1');
                const anonKey = (typeof window !== 'undefined' ? (window as any).process?.env?.VITE_SUPABASE_ANON_KEY : undefined) || (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY;
                if (isSupabaseFn && !('Authorization' in headers) && anonKey) {
                    (headers as any)['Authorization'] = `Bearer ${anonKey}`;
                }
            } catch { /* noop */ }

            const resp = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    prompt: request.prompt,
                    tenantId: undefined,
                    conversationId: request.conversationId,
                    context: request.context,
                    conversationHistory: request.conversationHistory,
                    userProfile: undefined,
                    responseMimeType: effectiveMime,
                    expectedSchema: undefined,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                try {
                    const json = JSON.parse(errText);
                    throw new Error(json.error || errText || `Server responded ${resp.status}`);
                } catch {
                    throw new Error(errText || `Server responded ${resp.status}`);
                }
            }

            const contentType = resp.headers.get('Content-Type') || '';
            if (contentType.includes('text/event-stream') && resp.body) {
                const reader = resp.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let fullText = '';
                // eslint-disable-next-line no-constant-condition
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
                            } catch { /* ignore */ }
                        }
                    }
                }
                return fullText;
            }

            // Non-stream JSON
            try {
                const data = await resp.json();
                return data.text || data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } catch {
                return await resp.text();
            }
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') throw new Error('Gemini request timed out');
            throw error;
        }
    }

    /**
     * Build contents array with conversation history for Gemini
     */
    private async buildGeminiContents(request: AIRequest): Promise<Array<{ role: string; parts?: Array<{ text: string }>; content?: string }>> {
        const contents: Array<{ role: string; parts?: Array<{ text: string }>; content?: string }> = [];

        // Load conversation history if conversationId provided
        let history = request.conversationHistory || [];
        if (request.conversationId && this.conversationService) {
            try {
                const messages = await this.conversationService.getContextMessages(
                    request.conversationId,
                    20 // Last 20 messages for context
                );
                history = messages.map((msg: { role: 'user' | 'assistant' | 'system'; content: string }) => ({
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
     * Resolve supported model name with back-compat mapping
     */
    private resolveModelName(): string {
        // Prefer env-configured model; support both server and client envs
        const rawModel =
            (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_MODEL) ||
            process.env.NEXT_PUBLIC_GEMINI_MODEL ||
            process.env.VITE_GEMINI_MODEL ||
            process.env.GEMINI_MODEL ||
            (typeof window !== 'undefined' ? window.localStorage?.getItem('gemini_model') || undefined : undefined);

        const candidate = (rawModel || '').toLowerCase().trim();

        const map: Record<string, string> = {
            'gemini-pro': 'gemini-1.5-pro',
            'gemini-pro-vision': 'gemini-1.5-pro',
            'gemini-1.0-pro': 'gemini-1.5-pro',
            'gemini-1.0-pro-vision': 'gemini-1.5-pro',
            'gemini-flash': 'gemini-1.5-flash',
            'gemini-1.5-pro': 'gemini-1.5-pro',
            'gemini-1.5-flash': 'gemini-1.5-flash',
            'gemini-2.5-flash': 'gemini-2.5-flash',
            'gemini': 'gemini-1.5-pro'
        };

        return map[candidate] || 'gemini-1.5-pro';
    }

    /**
     * Resolve API version with sensible defaults
     */
    private resolveApiVersion(): string {
        const rawVersion =
            (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_VERSION) ||
            process.env.NEXT_PUBLIC_GEMINI_API_VERSION ||
            process.env.VITE_GEMINI_API_VERSION ||
            process.env.GEMINI_API_VERSION;

        const v = (rawVersion || '').toLowerCase().trim();
        if (v === 'v1' || v === 'v1beta' || v === 'v1beta2') {
            // Normalize beta variants
            return v === 'v1beta2' ? 'v1beta' : v;
        }
        // Default to stable v1
        return 'v1';
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
        prompt += '- Be culturally relevant to Nigerian context\\n';
        prompt += '- Maintain conversation continuity and context\\n';
        prompt += '- Do not include generic disclaimers like "As an AI..."\\n';
        prompt += '- Use only provided context; if data is missing, write "Not available in current context" and suggest one specific next data point.\\n';
        prompt += '- When Teacher/Admin and metrics are present, summarize with concrete numbers and 3–5 concise insights.\\n';
        prompt += '\nOutput Format (HTML):\n';
        prompt += '- Return valid semantic HTML only (no Markdown).\n';
        prompt += '- Use <h1> for title, <h2>/<h3> for sections, <p>, <ul>/<ol>, and <table> where helpful.\n';
        prompt += '- Bold key labels with <strong>.\n';
        prompt += '- For lesson notes include: Title, Objectives, Materials, Prerequisites, Lesson Outline (timed if useful), Activities, Assessment, Homework/Extension, References.\n';
        prompt += '- Avoid emojis and slang; use clear standard Nigerian English (no pidgin).';

        return prompt;
    }

    /**
     * Use fallback AI system (semantic cache → HF → templates)
     */
    private async useFallback(request: AIRequest, reason: string): Promise<AIResponse> {
        logger.info('Activating fallback AI system...');
        
        try {
            const startTime = Date.now();

            let fallbackContent: string = '';
            try {
                const { generateFallbackResponseAsync } = await import('./fallbackAiService');
                fallbackContent = await generateFallbackResponseAsync({
                    prompt: request.prompt,
                    context: request.context
                } as any);
            } catch {
                fallbackContent = generateFallbackResponse({
                    prompt: request.prompt,
                    context: request.context
                } as any);
            }

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