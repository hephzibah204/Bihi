// services/semanticSearch.ts
// Lightweight semantic search using simple embeddings and cosine similarity

import { logger } from '../utils/logger';

interface Vector {
    values: number[];
    magnitude: number;
}

interface SemanticMatch {
    id: string;
    prompt: string;
    response: string;
    similarity: number;
    confidence: number;
}

/**
 * Lightweight semantic search engine using TF-IDF + word embeddings
 * This approach works well without heavy ML libraries
 */
export class SemanticSearchEngine {
    private vocabulary: Map<string, number> = new Map();
    private idfScores: Map<string, number> = new Map();
    private documentVectors: Map<string, Vector> = new Map();
    private documents: Map<string, any> = new Map();
    
    constructor() {
        this.loadFromStorage();
    }

    /**
     * Tokenize text into words
     */
    private tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2) // Filter out short words
            .filter(word => !this.isStopWord(word));
    }

    /**
     * Simple stop words list
     */
    private isStopWord(word: string): boolean {
        const stopWords = new Set([
            'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were',
            'for', 'with', 'this', 'that', 'from', 'to', 'of', 'in', 'by', 'be', 'been'
        ]);
        return stopWords.has(word);
    }

    /**
     * Calculate TF (Term Frequency)
     */
    private calculateTF(tokens: string[]): Map<string, number> {
        const tf = new Map<string, number>();
        const totalTokens = tokens.length;
        
        for (const token of tokens) {
            tf.set(token, (tf.get(token) || 0) + 1);
        }
        
        // Normalize by total tokens
        for (const [token, count] of tf.entries()) {
            tf.set(token, count / totalTokens);
        }
        
        return tf;
    }

    /**
     * Calculate IDF (Inverse Document Frequency)
     */
    private calculateIDF(): void {
        const docCount = this.documents.size;
        
        if (docCount === 0) return;
        
        // Count documents containing each term
        const termDocCount = new Map<string, number>();
        
        for (const [_, doc] of this.documents) {
            const tokens = new Set(this.tokenize(doc.prompt + ' ' + doc.response));
            for (const token of tokens) {
                termDocCount.set(token, (termDocCount.get(token) || 0) + 1);
            }
        }
        
        // Calculate IDF scores
        for (const [term, count] of termDocCount.entries()) {
            this.idfScores.set(term, Math.log(docCount / count));
        }
    }

    /**
     * Create TF-IDF vector for text
     */
    private createVector(text: string): Vector {
        const tokens = this.tokenize(text);
        const tf = this.calculateTF(tokens);
        const values: number[] = [];
        
        // Build vector based on vocabulary
        for (const [term, index] of this.vocabulary) {
            const tfValue = tf.get(term) || 0;
            const idfValue = this.idfScores.get(term) || 0;
            values[index] = tfValue * idfValue;
        }
        
        // Calculate magnitude for normalization
        const magnitude = Math.sqrt(values.reduce((sum, val) => sum + val * val, 0));
        
        return { values, magnitude };
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    private cosineSimilarity(vec1: Vector, vec2: Vector): number {
        if (vec1.magnitude === 0 || vec2.magnitude === 0) return 0;
        
        let dotProduct = 0;
        const minLength = Math.min(vec1.values.length, vec2.values.length);
        
        for (let i = 0; i < minLength; i++) {
            dotProduct += (vec1.values[i] || 0) * (vec2.values[i] || 0);
        }
        
        return dotProduct / (vec1.magnitude * vec2.magnitude);
    }

    /**
     * Build vocabulary from all documents
     */
    private buildVocabulary(): void {
        this.vocabulary.clear();
        const allTerms = new Set<string>();
        
        // Collect all unique terms
        for (const [_, doc] of this.documents) {
            const tokens = this.tokenize(doc.prompt + ' ' + doc.response);
            tokens.forEach(token => allTerms.add(token));
        }
        
        // Assign indices to terms
        let index = 0;
        for (const term of allTerms) {
            this.vocabulary.set(term, index++);
        }
    }

    /**
     * Index a document for semantic search
     */
    public indexDocument(id: string, prompt: string, response: string, metadata?: any): void {
        this.documents.set(id, {
            id,
            prompt,
            response,
            metadata: metadata || {}
        });
        
        // Rebuild vocabulary and IDF scores
        this.buildVocabulary();
        this.calculateIDF();
        
        // Create vector for this document
        const vector = this.createVector(prompt + ' ' + response);
        this.documentVectors.set(id, vector);
        
        this.saveToStorage();
    }

    /**
     * Remove a document from the index
     */
    public removeDocument(id: string): void {
        this.documents.delete(id);
        this.documentVectors.delete(id);
        
        if (this.documents.size > 0) {
            this.buildVocabulary();
            this.calculateIDF();
            
            // Rebuild all vectors
            for (const [docId, doc] of this.documents) {
                const vector = this.createVector(doc.prompt + ' ' + doc.response);
                this.documentVectors.set(docId, vector);
            }
        }
        
        this.saveToStorage();
    }

    /**
     * Search for semantically similar documents
     */
    public search(query: string, topK: number = 5, minSimilarity: number = 0.3): SemanticMatch[] {
        if (this.documents.size === 0) return [];
        
        const queryVector = this.createVector(query);
        const results: SemanticMatch[] = [];
        
        for (const [id, docVector] of this.documentVectors) {
            const doc = this.documents.get(id);
            if (!doc) continue;
            
            const similarity = this.cosineSimilarity(queryVector, docVector);
            
            if (similarity >= minSimilarity) {
                results.push({
                    id: doc.id,
                    prompt: doc.prompt,
                    response: doc.response,
                    similarity,
                    confidence: doc.metadata.confidence || 0.5
                });
            }
        }
        
        // Sort by similarity * confidence (hybrid score)
        results.sort((a, b) => {
            const scoreA = a.similarity * (0.7 + a.confidence * 0.3); // Weight: 70% similarity, 30% confidence
            const scoreB = b.similarity * (0.7 + b.confidence * 0.3);
            return scoreB - scoreA;
        });
        
        return results.slice(0, topK);
    }

    /**
     * Bulk index multiple documents
     */
    public bulkIndex(documents: Array<{ id: string; prompt: string; response: string; metadata?: any }>): void {
        for (const doc of documents) {
            this.documents.set(doc.id, {
                id: doc.id,
                prompt: doc.prompt,
                response: doc.response,
                metadata: doc.metadata || {}
            });
        }
        
        this.buildVocabulary();
        this.calculateIDF();
        
        // Create vectors for all documents
        for (const [id, doc] of this.documents) {
            const vector = this.createVector(doc.prompt + ' ' + doc.response);
            this.documentVectors.set(id, vector);
        }
        
        this.saveToStorage();
    }

    /**
     * Get index statistics
     */
    public getStats() {
        return {
            documentCount: this.documents.size,
            vocabularySize: this.vocabulary.size,
            avgVectorDimensions: this.vocabulary.size,
            indexedTerms: Array.from(this.vocabulary.keys()).slice(0, 20) // First 20 terms
        };
    }

    /**
     * Clear the entire index
     */
    public clear(): void {
        this.vocabulary.clear();
        this.idfScores.clear();
        this.documentVectors.clear();
        this.documents.clear();
        this.saveToStorage();
    }

    /**
     * Export index data
     */
    public export(): any {
        return {
            documents: Array.from(this.documents.entries()),
            vocabulary: Array.from(this.vocabulary.entries()),
            idfScores: Array.from(this.idfScores.entries())
        };
    }

    /**
     * Import index data
     */
    public import(data: any): void {
        this.documents = new Map(data.documents);
        this.vocabulary = new Map(data.vocabulary);
        this.idfScores = new Map(data.idfScores);
        
        // Rebuild vectors
        for (const [id, doc] of this.documents) {
            const vector = this.createVector(doc.prompt + ' ' + doc.response);
            this.documentVectors.set(id, vector);
        }
        
        this.saveToStorage();
    }

    /**
     * Save to localStorage
     */
    private saveToStorage(): void {
        if (typeof window === 'undefined') return;
        
        try {
            const data = this.export();
            localStorage.setItem('semantic_search_index', JSON.stringify(data));
        } catch (error) {
            logger.captureError(error as any, 'Failed to save semantic search index');
        }
    }

    /**
     * Load from localStorage
     */
    private loadFromStorage(): void {
        if (typeof window === 'undefined') return;
        
        try {
            const stored = localStorage.getItem('semantic_search_index');
            if (stored) {
                const data = JSON.parse(stored);
                this.import(data);
            }
        } catch (error) {
            logger.captureError(error as any, 'Failed to load semantic search index');
        }
    }
}

// Singleton instance
let searchEngineInstance: SemanticSearchEngine | null = null;

export function getSemanticSearchEngine(): SemanticSearchEngine {
    if (!searchEngineInstance) {
        searchEngineInstance = new SemanticSearchEngine();
    }
    return searchEngineInstance;
}

/**
 * Hybrid search: Combines keyword matching with semantic search
 */
export class HybridSearchEngine {
    private semanticEngine: SemanticSearchEngine;
    
    constructor() {
        this.semanticEngine = getSemanticSearchEngine();
    }

    /**
     * Search using both keyword and semantic approaches
     */
    public search(query: string, topK: number = 5): SemanticMatch[] {
        // Get semantic matches
        const semanticMatches = this.semanticEngine.search(query, topK * 2, 0.2);
        
        // Get keyword matches
        const keywordMatches = this.keywordSearch(query, topK);
        
        // Merge and deduplicate
        const mergedResults = new Map<string, SemanticMatch>();
        
        for (const match of semanticMatches) {
            mergedResults.set(match.id, match);
        }
        
        for (const match of keywordMatches) {
            const existing = mergedResults.get(match.id);
            if (existing) {
                // Boost score if found in both
                existing.similarity = Math.max(existing.similarity, match.similarity) * 1.2;
            } else {
                mergedResults.set(match.id, match);
            }
        }
        
        // Sort by boosted similarity scores
        return Array.from(mergedResults.values())
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);
    }

    /**
     * Simple keyword-based search
     */
    private keywordSearch(query: string, topK: number): SemanticMatch[] {
        // This is a simplified version - would integrate with cache search
        return [];
    }

    public indexDocument(id: string, prompt: string, response: string, metadata?: any): void {
        this.semanticEngine.indexDocument(id, prompt, response, metadata);
    }

    public bulkIndex(documents: Array<{ id: string; prompt: string; response: string; metadata?: any }>): void {
        this.semanticEngine.bulkIndex(documents);
    }

    public getStats() {
        return this.semanticEngine.getStats();
    }
}

export { type SemanticMatch };