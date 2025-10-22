// services/huggingFaceAPI.ts
// Integration with Hugging Face Inference API for dynamic content generation

export interface HuggingFaceConfig {
    apiKey?: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
}

export interface GenerationResponse {
    text: string;
    model: string;
    cached: boolean;
    tokensGenerated?: number;
}

/**
 * Hugging Face Inference API Client
 * Uses free tier with rate limiting
 */
export class HuggingFaceClient {
    private apiKey: string | null;
    private baseUrl = 'https://api-inference.huggingface.co/models/';
    private requestCache: Map<string, { response: string; timestamp: number }> = new Map();
    private cacheTimeout = 60 * 60 * 1000; // 1 hour
    
    // Rate limiting
    private requestCount = 0;
    private requestWindow = Date.now();
    private maxRequestsPerMinute = 30; // Conservative limit for free tier
    
    constructor(apiKey?: string) {
        this.apiKey = apiKey || this.loadApiKeyFromStorage();
    }
    
    /**
     * Load API key from environment or localStorage
     */
    private loadApiKeyFromStorage(): string | null {
        // Try environment variable first (server-side or build-time)
        if (process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY) {
            return process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
        }
        
        // Try HUGGINGFACE_API_KEY (Cloudflare Pages environment)
        if (process.env.HUGGINGFACE_API_KEY) {
            return process.env.HUGGINGFACE_API_KEY;
        }
        
        // Fallback to localStorage (browser only, for user-provided keys)
        if (typeof window === 'undefined') return null;
        
        try {
            return localStorage.getItem('huggingface_api_key');
        } catch {
            return null;
        }
    }
    
    /**
     * Save API key to localStorage
     */
    public setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
        
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('huggingface_api_key', apiKey);
            } catch (error) {
                console.error('Failed to save API key:', error);
            }
        }
    }
    
    /**
     * Check if API key is configured
     */
    public hasApiKey(): boolean {
        return !!this.apiKey;
    }
    
    /**
     * Check rate limit
     */
    private checkRateLimit(): boolean {
        const now = Date.now();
        
        // Reset counter every minute
        if (now - this.requestWindow > 60000) {
            this.requestCount = 0;
            this.requestWindow = now;
        }
        
        return this.requestCount < this.maxRequestsPerMinute;
    }
    
    /**
     * Generate text using Hugging Face model with retry logic
     */
    public async generate(
        prompt: string,
        config: HuggingFaceConfig = { model: 'google/flan-t5-base' },
        retries: number = 2
    ): Promise<GenerationResponse> {
        // Check cache first
        const cacheKey = `${config.model}:${prompt}`;
        const cached = this.requestCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return {
                text: cached.response,
                model: config.model,
                cached: true
            };
        }
        
        // Check if API key is available
        if (!this.apiKey) {
            throw new Error('Hugging Face API key not configured. Use setApiKey() to configure.');
        }
        
        // Check rate limit
        if (!this.checkRateLimit()) {
            throw new Error('Rate limit exceeded. Please wait before making more requests.');
        }
        
        try {
            this.requestCount++;
            
            const response = await fetch(`${this.baseUrl}${config.model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: config.maxTokens || 512,
                        temperature: config.temperature || 0.7,
                        top_p: config.topP || 0.9,
                        return_full_text: false
                    }
                })
            });
            
            if (!response.ok) {
                const error = await response.text();
                throw new Error(`API request failed: ${response.status} - ${error}`);
            }
            
            const data = await response.json();
            
            // Handle different response formats
            let generatedText: string;
            if (Array.isArray(data)) {
                generatedText = data[0]?.generated_text || data[0]?.translation_text || '';
            } else {
                generatedText = data.generated_text || data[0]?.generated_text || '';
            }
            
            // Cache the response
            this.requestCache.set(cacheKey, {
                response: generatedText,
                timestamp: Date.now()
            });
            
            return {
                text: generatedText,
                model: config.model,
                cached: false
            };
            
        } catch (error) {
            console.error('Hugging Face API error:', error);
            
            // Retry with exponential backoff
            if (retries > 0 && error instanceof Error && error.message.includes('503')) {
                console.log(`Model loading, retrying in 2s... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.generate(prompt, config, retries - 1);
            }
            
            throw error;
        }
    }
    
    /**
     * Generate educational content with optimized prompt
     */
    public async generateEducationalContent(
        task: string,
        context?: string,
        model: string = 'google/flan-t5-base'
    ): Promise<string> {
        const prompt = this.buildEducationalPrompt(task, context);
        const response = await this.generate(prompt, { model, maxTokens: 512 });
        return response.text;
    }
    
    /**
     * Build optimized prompt for educational content
     */
    private buildEducationalPrompt(task: string, context?: string): string {
        let prompt = '';
        
        if (context) {
            prompt += `Context: ${context}\n\n`;
        }
        
        prompt += `Task: ${task}\n\n`;
        prompt += 'Provide a clear, structured, and educational response:';
        
        return prompt;
    }
    
    /**
     * Clear request cache
     */
    public clearCache(): void {
        this.requestCache.clear();
    }
    
    /**
     * Get cache statistics
     */
    public getCacheStats() {
        return {
            cacheSize: this.requestCache.size,
            requestCount: this.requestCount,
            remainingRequests: Math.max(0, this.maxRequestsPerMinute - this.requestCount)
        };
    }
}

// Singleton instance
let huggingFaceInstance: HuggingFaceClient | null = null;

export function getHuggingFaceClient(): HuggingFaceClient {
    if (!huggingFaceInstance) {
        huggingFaceInstance = new HuggingFaceClient();
    }
    return huggingFaceInstance;
}

/**
 * Recommended models for different tasks
 */
export const RECOMMENDED_MODELS = {
    // Text generation (general)
    general: 'google/flan-t5-base', // 250M params, good balance
    generalLarge: 'google/flan-t5-large', // 780M params, better quality
    
    // Lightweight options
    lightweight: 'google/flan-t5-small', // 80M params, faster
    
    // Specialized models
    instructionFollowing: 'google/flan-t5-xxl', // Best quality but slower
    
    // Alternative models
    gpt2: 'gpt2', // 124M params, creative writing
    gpt2Medium: 'gpt2-medium', // 355M params
    
    // Educational content
    educational: 'google/flan-t5-base' // Best for Q&A and explanations
};

/**
 * Helper: Generate lesson plan using Hugging Face
 */
export async function generateLessonPlanWithHF(
    topic: string,
    grade: string,
    subject: string
): Promise<string> {
    const client = getHuggingFaceClient();
    
    if (!client.hasApiKey()) {
        throw new Error('Hugging Face API key required for dynamic generation');
    }
    
    const prompt = `Create a detailed lesson plan for teaching ${topic} to ${grade} students in ${subject}. Include learning objectives, materials, activities, and assessment.`;
    
    try {
        return await client.generateEducationalContent(
            prompt,
            `Nigerian curriculum, ${grade} level`,
            RECOMMENDED_MODELS.educational
        );
    } catch (error) {
        console.error('Failed to generate lesson plan with HF:', error);
        throw error;
    }
}

/**
 * Helper: Generate report card comment using Hugging Face
 */
export async function generateCommentWithHF(
    studentName: string,
    performance: string,
    subject?: string
): Promise<string> {
    const client = getHuggingFaceClient();
    
    if (!client.hasApiKey()) {
        throw new Error('Hugging Face API key required for dynamic generation');
    }
    
    const subjectContext = subject ? ` in ${subject}` : '';
    const prompt = `Write a professional report card comment for ${studentName}${subjectContext}. Performance summary: ${performance}. Make it constructive and encouraging.`;
    
    try {
        return await client.generateEducationalContent(
            prompt,
            'School report card comment, professional tone',
            RECOMMENDED_MODELS.educational
        );
    } catch (error) {
        console.error('Failed to generate comment with HF:', error);
        throw error;
    }
}

/**
 * Helper: Generate tutoring response using Hugging Face
 */
export async function generateTutoringResponseWithHF(
    question: string,
    gradeLevel?: string
): Promise<string> {
    const client = getHuggingFaceClient();
    
    if (!client.hasApiKey()) {
        throw new Error('Hugging Face API key required for dynamic generation');
    }
    
    const gradeLevelContext = gradeLevel ? ` for ${gradeLevel} student` : '';
    const prompt = `Explain this clearly${gradeLevelContext}: ${question}`;
    
    try {
        return await client.generateEducationalContent(
            prompt,
            'Educational tutoring, clear explanations with examples',
            RECOMMENDED_MODELS.educational
        );
    } catch (error) {
        console.error('Failed to generate tutoring response with HF:', error);
        throw error;
    }
}

/**
 * Test API key validity
 */
export async function testHuggingFaceAPIKey(apiKey: string): Promise<boolean> {
    const client = new HuggingFaceClient(apiKey);
    
    try {
        await client.generate(
            'Test: What is 2+2?',
            { model: RECOMMENDED_MODELS.lightweight, maxTokens: 10 }
        );
        return true;
    } catch (error) {
        console.error('API key test failed:', error);
        return false;
    }
}

/**
 * Estimate cost/usage for Hugging Face free tier
 * Free tier: ~30k requests/month, rate limited
 */
export function estimateUsage(requestsPerDay: number) {
    const monthlyRequests = requestsPerDay * 30;
    const freeTierLimit = 30000;
    
    return {
        dailyRequests: requestsPerDay,
        monthlyRequests,
        withinFreeQuota: monthlyRequests <= freeTierLimit,
        percentageUsed: (monthlyRequests / freeTierLimit) * 100,
        estimatedCost: monthlyRequests > freeTierLimit 
            ? `$${((monthlyRequests - freeTierLimit) * 0.0001).toFixed(2)}/month beyond free tier`
            : 'Free'
    };
}