// services/aiResponseCache.ts
// Intelligent caching system for AI responses to improve fallback quality

import { logger } from '../utils/logger';

interface CachedResponse {
    id: string;
    prompt: string;
    response: string;
    source: 'gemini' | 'fallback';
    timestamp: number;
    context?: any;
    metadata: {
        promptType: string;
        subject?: string;
        confidence: number;
        useCount: number;
        lastUsed: number;
        rating?: number;
        feedback?: string;
    };
}

interface CacheStats {
    totalCached: number;
    geminiResponses: number;
    fallbackResponses: number;
    cacheHits: number;
    cacheMisses: number;
    avgConfidence: number;
    topPromptTypes: { type: string; count: number }[];
}

class AIResponseCache {
    private cache: Map<string, CachedResponse> = new Map();
    private readonly maxCacheSize: number = 1000; // Maximum number of cached responses
    private readonly similarityThreshold: number = 0.55; // Lowered to allow broader reuse offline
    private stats: CacheStats = {
        totalCached: 0,
        geminiResponses: 0,
        fallbackResponses: 0,
        cacheHits: 0,
        cacheMisses: 0,
        avgConfidence: 0,
        topPromptTypes: []
    };

    constructor(maxSize?: number) {
        if (maxSize) this.maxCacheSize = maxSize;
        this.loadFromStorage();
    }

    /**
     * Generate a cache key from prompt
     */
    private generateKey(prompt: string, context?: any): string {
        const normalizedPrompt = this.normalizePrompt(prompt);
        const contextStr = context ? JSON.stringify(context) : '';
        return `${normalizedPrompt}_${contextStr}`;
    }

    /**
     * Normalize prompt for better matching
     */
    private normalizePrompt(prompt: string): string {
        return prompt
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s]/g, '')
            .trim();
    }

    /**
     * Calculate similarity between two prompts
     */
    private calculateSimilarity(prompt1: string, prompt2: string): number {
        const words1 = this.normalizePrompt(prompt1).split(' ');
        const words2 = this.normalizePrompt(prompt2).split(' ');
        
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }

    /**
     * Cache a response
     */
    public cacheResponse(
        prompt: string,
        response: string,
        source: 'gemini' | 'fallback',
        context?: any,
        metadata?: Partial<CachedResponse['metadata']>
    ): void {
        const key = this.generateKey(prompt, context);
        
        const cached: CachedResponse = {
            id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            prompt,
            response,
            source,
            timestamp: Date.now(),
            context,
            metadata: {
                promptType: this.detectPromptType(prompt),
                subject: this.detectSubject(prompt),
                confidence: source === 'gemini' ? 1.0 : (metadata?.confidence || 0.5),
                useCount: 1,
                lastUsed: Date.now(),
                ...metadata
            }
        };

        // Check cache size limit
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldest();
        }

        this.cache.set(key, cached);
        
        // Update stats
        this.stats.totalCached = this.cache.size;
        if (source === 'gemini') {
            this.stats.geminiResponses++;
        } else {
            this.stats.fallbackResponses++;
        }

        this.saveToStorage();
    }

    /**
     * Get cached response
     */
    public getCachedResponse(prompt: string, context?: any): CachedResponse | null {
        const key = this.generateKey(prompt, context);
        
        // Exact match
        const exact = this.cache.get(key);
        if (exact) {
            exact.metadata.useCount++;
            exact.metadata.lastUsed = Date.now();
            this.stats.cacheHits++;
            this.saveToStorage();
            return exact;
        }

        // Similarity match
        const similar = this.findSimilarResponse(prompt);
        if (similar && similar.metadata.confidence >= this.similarityThreshold) {
            similar.metadata.useCount++;
            similar.metadata.lastUsed = Date.now();
            this.stats.cacheHits++;
            this.saveToStorage();
            return similar;
        }

        this.stats.cacheMisses++;
        return null;
    }

    /**
     * Find similar cached response
     */
    private findSimilarResponse(prompt: string): CachedResponse | null {
        let bestMatch: CachedResponse | null = null;
        let bestSimilarity = 0;

        for (const cached of this.cache.values()) {
            const similarity = this.calculateSimilarity(prompt, cached.prompt);
            
            if (similarity > bestSimilarity && similarity >= this.similarityThreshold) {
                bestSimilarity = similarity;
                bestMatch = cached;
            }
        }

        return bestMatch;
    }

    /**
     * Detect prompt type
     */
    private detectPromptType(prompt: string): string {
        const promptLower = prompt.toLowerCase();
        
        if (promptLower.includes('lesson plan')) return 'lessonPlan';
        if (promptLower.includes('report card') || promptLower.includes('comment')) return 'reportComment';
        if (promptLower.includes('help') || promptLower.includes('explain')) return 'tutoring';
        if (promptLower.includes('my child') || promptLower.includes('parent')) return 'parentChat';
        if (promptLower.includes('financial') || promptLower.includes('revenue')) return 'financial';
        if (promptLower.includes('announcement')) return 'announcement';
        
        return 'general';
    }

    /**
     * Detect subject
     */
    private detectSubject(prompt: string): string | undefined {
        const promptLower = prompt.toLowerCase();
        
        const subjects = {
            mathematics: ['math', 'algebra', 'geometry', 'calculation'],
            english: ['english', 'essay', 'grammar', 'writing'],
            science: ['science', 'biology', 'chemistry', 'physics'],
            history: ['history', 'historical'],
            geography: ['geography', 'geographical']
        };

        for (const [subject, keywords] of Object.entries(subjects)) {
            if (keywords.some(keyword => promptLower.includes(keyword))) {
                return subject;
            }
        }

        return undefined;
    }

    /**
     * Rate a cached response
     */
    public rateResponse(responseId: string, rating: number, feedback?: string): void {
        for (const cached of this.cache.values()) {
            if (cached.id === responseId) {
                cached.metadata.rating = rating;
                cached.metadata.feedback = feedback;
                
                // Adjust confidence based on rating
                if (rating >= 4) {
                    cached.metadata.confidence = Math.min(1.0, cached.metadata.confidence + 0.1);
                } else if (rating <= 2) {
                    cached.metadata.confidence = Math.max(0.3, cached.metadata.confidence - 0.1);
                }
                
                this.saveToStorage();
                break;
            }
        }
    }

    /**
     * Get high-quality cached responses for training
     */
    public getHighQualityResponses(minConfidence: number = 0.8, limit: number = 100): CachedResponse[] {
        return Array.from(this.cache.values())
            .filter(cached => 
                cached.source === 'gemini' && 
                cached.metadata.confidence >= minConfidence &&
                (!cached.metadata.rating || cached.metadata.rating >= 4)
            )
            .sort((a, b) => b.metadata.useCount - a.metadata.useCount)
            .slice(0, limit);
    }

    /**
     * Evict oldest/least used responses
     */
    private evictOldest(): void {
        let oldest: string | null = null;
        let oldestTime = Date.now();
        let leastUsed = Infinity;

        for (const [key, cached] of this.cache.entries()) {
            // Prioritize evicting low-confidence or rarely used responses
            const score = cached.metadata.lastUsed / cached.metadata.useCount;
            
            if (cached.metadata.confidence < 0.5 || (score < oldestTime && cached.metadata.useCount < leastUsed)) {
                oldest = key;
                oldestTime = score;
                leastUsed = cached.metadata.useCount;
            }
        }

        if (oldest) {
            this.cache.delete(oldest);
        }
    }

    /**
     * Get cache statistics
     */
    public getStats(): CacheStats {
        // Update top prompt types
        const typeCounts = new Map<string, number>();
        
        for (const cached of this.cache.values()) {
            const type = cached.metadata.promptType;
            typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        }

        this.stats.topPromptTypes = Array.from(typeCounts.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Calculate average confidence
        let totalConfidence = 0;
        for (const cached of this.cache.values()) {
            totalConfidence += cached.metadata.confidence;
        }
        this.stats.avgConfidence = this.cache.size > 0 ? totalConfidence / this.cache.size : 0;

        return { ...this.stats };
    }

    /**
     * Export cache for analysis
     */
    public exportCache(): CachedResponse[] {
        return Array.from(this.cache.values());
    }

    /**
     * Import cache data
     */
    public importCache(responses: CachedResponse[]): void {
        for (const response of responses) {
            const key = this.generateKey(response.prompt, response.context);
            this.cache.set(key, response);
        }
        this.stats.totalCached = this.cache.size;
        this.saveToStorage();
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        this.cache.clear();
        this.stats = {
            totalCached: 0,
            geminiResponses: 0,
            fallbackResponses: 0,
            cacheHits: 0,
            cacheMisses: 0,
            avgConfidence: 0,
            topPromptTypes: []
        };
        this.saveToStorage();
    }

    /**
     * Save cache to localStorage
     */
    private saveToStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const cacheData = {
                cache: Array.from(this.cache.entries()),
                stats: this.stats,
                timestamp: Date.now()
            };

            localStorage.setItem('ai_response_cache', JSON.stringify(cacheData));
        } catch (error) {
            logger.captureError(error as any, 'Failed to save cache to storage');
        }
    }

    /**
     * Load cache from localStorage
     */
    private loadFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem('ai_response_cache');
            if (!stored) return;

            const cacheData = JSON.parse(stored);
            
            // Load cache entries
            this.cache = new Map(cacheData.cache);
            
            // Load stats
            if (cacheData.stats) {
                this.stats = cacheData.stats;
            }

            // Clean old entries (older than 30 days)
            const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
            for (const [key, cached] of this.cache.entries()) {
                if (cached.timestamp < thirtyDaysAgo) {
                    this.cache.delete(key);
                }
            }

            this.stats.totalCached = this.cache.size;
        } catch (error) {
            logger.captureError(error as any, 'Failed to load cache from storage');
        }
    }

    /**
     * Get cache hit rate
     */
    public getCacheHitRate(): number {
        const total = this.stats.cacheHits + this.stats.cacheMisses;
        return total > 0 ? this.stats.cacheHits / total : 0;
    }

    /**
     * Get responses by prompt type
     */
    public getResponsesByType(promptType: string): CachedResponse[] {
        return Array.from(this.cache.values())
            .filter(cached => cached.metadata.promptType === promptType);
    }

    /**
     * Search cache by keywords
     */
    public searchCache(keywords: string[]): CachedResponse[] {
        return Array.from(this.cache.values())
            .filter(cached => {
                const promptLower = cached.prompt.toLowerCase();
                return keywords.some(keyword => promptLower.includes(keyword.toLowerCase()));
            })
            .sort((a, b) => b.metadata.confidence - a.metadata.confidence);
    }
}

// Singleton instance
let cacheInstance: AIResponseCache | null = null;

export function getAIResponseCache(): AIResponseCache {
    if (!cacheInstance) {
        cacheInstance = new AIResponseCache();
    }
    return cacheInstance;
}

export { AIResponseCache, type CachedResponse, type CacheStats };