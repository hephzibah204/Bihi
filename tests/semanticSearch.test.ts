// tests/semanticSearch.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SemanticSearchEngine, HybridSearchEngine, type SemanticMatch } from '../services/semanticSearch';

describe('SemanticSearchEngine', () => {
    let searchEngine: SemanticSearchEngine;

    beforeEach(() => {
        searchEngine = new SemanticSearchEngine();
        searchEngine.clear(); // Clear any existing data
    });

    describe('Basic Indexing and Search', () => {
        it('should index and retrieve a single document', () => {
            searchEngine.indexDocument(
                'doc1',
                'What is photosynthesis?',
                'Photosynthesis is the process by which plants convert sunlight into energy.',
                { confidence: 0.9 }
            );
            searchEngine.indexDocument(
                'neutral',
                'Unrelated content',
                'This document is about school policies and administration.'
            );

            const results = searchEngine.search('photosynthesis plants', 5, 0.0);
            
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].id).toBe('doc1');
        });

        it('should return empty results for no matches', () => {
            searchEngine.indexDocument(
                'doc1',
                'What is photosynthesis?',
                'Photosynthesis is the process by which plants convert sunlight into energy.'
            );

            const results = searchEngine.search('quantum physics', 5, 0.8);
            
            expect(results.length).toBe(0);
        });

        it('should find semantically similar documents', () => {
            searchEngine.indexDocument(
                'doc1',
                'How do plants make food?',
                'Plants make food through photosynthesis using sunlight, water, and carbon dioxide.'
            );

            searchEngine.indexDocument(
                'doc2',
                'What is cellular respiration?',
                'Cellular respiration is the process by which cells break down glucose to produce energy.'
            );

            const results = searchEngine.search('plant food production', 3, 0.0);
            
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].id).toBe('doc1'); // Should match doc1 more closely
        });
    });

    describe('Multiple Document Indexing', () => {
        it('should handle bulk indexing', () => {
            const documents = [
                {
                    id: 'lesson1',
                    prompt: 'Create a lesson plan for mathematics fractions',
                    response: 'Lesson Plan: Introduction to Fractions...',
                    metadata: { confidence: 0.85 }
                },
                {
                    id: 'lesson2',
                    prompt: 'Create a lesson plan for English grammar',
                    response: 'Lesson Plan: Parts of Speech...',
                    metadata: { confidence: 0.8 }
                },
                {
                    id: 'lesson3',
                    prompt: 'Create a lesson plan for science photosynthesis',
                    response: 'Lesson Plan: How Plants Make Food...',
                    metadata: { confidence: 0.9 }
                }
            ];

            searchEngine.bulkIndex(documents);
            
            const stats = searchEngine.getStats();
            expect(stats.documentCount).toBe(3);
        });

        it('should rank results by similarity', () => {
            searchEngine.bulkIndex([
                {
                    id: 'doc1',
                    prompt: 'How to solve quadratic equations',
                    response: 'Quadratic equations can be solved using the quadratic formula...'
                },
                {
                    id: 'doc2',
                    prompt: 'What are linear equations',
                    response: 'Linear equations have a degree of 1...'
                },
                {
                    id: 'doc3',
                    prompt: 'Solving quadratic problems in algebra',
                    response: 'When solving quadratic problems, use factoring or the quadratic formula...'
                }
            ]);

            const results = searchEngine.search('solving quadratic equations', 5, 0.2);
            
            expect(results.length).toBeGreaterThan(0);
            // The most similar should be first
            expect(results[0].similarity).toBeGreaterThan(results[results.length - 1].similarity);
        });
    });

    describe('Similarity Threshold', () => {
        beforeEach(() => {
            searchEngine.bulkIndex([
                {
                    id: 'doc1',
                    prompt: 'Nigerian secondary school curriculum for mathematics',
                    response: 'The Nigerian mathematics curriculum covers algebra, geometry...'
                },
                {
                    id: 'doc2',
                    prompt: 'Best restaurants in Lagos',
                    response: 'Lagos has many excellent restaurants...'
                }
            ]);
        });

        it('should respect minimum similarity threshold', () => {
            const results = searchEngine.search('secondary school math curriculum Nigeria', 5, 0.3);
            
            expect(results.length).toBeGreaterThan(0);
            results.forEach(result => {
                expect(result.similarity).toBeGreaterThanOrEqual(0.3);
            });
        });

        it('should return fewer results with higher threshold', () => {
            const lowThreshold = searchEngine.search('education mathematics', 5, 0.1);
            const highThreshold = searchEngine.search('education mathematics', 5, 0.6);
            
            expect(highThreshold.length).toBeLessThanOrEqual(lowThreshold.length);
        });
    });

    describe('Document Management', () => {
        it('should remove documents from index', () => {
            searchEngine.bulkIndex([
                { id: 'doc1', prompt: 'Test 1', response: 'Response 1' },
                { id: 'doc2', prompt: 'Test 2', response: 'Response 2' },
                { id: 'doc3', prompt: 'Test 3', response: 'Response 3' }
            ]);

            expect(searchEngine.getStats().documentCount).toBe(3);

            searchEngine.removeDocument('doc2');
            
            expect(searchEngine.getStats().documentCount).toBe(2);
        });

        it('should clear all documents', () => {
            searchEngine.bulkIndex([
                { id: 'doc1', prompt: 'Test 1', response: 'Response 1' },
                { id: 'doc2', prompt: 'Test 2', response: 'Response 2' }
            ]);

            searchEngine.clear();
            
            expect(searchEngine.getStats().documentCount).toBe(0);
        });
    });

    describe('Confidence Scoring', () => {
        it('should use confidence in ranking', () => {
            searchEngine.bulkIndex([
                {
                    id: 'doc1',
                    prompt: 'Lesson plan for mathematics',
                    response: 'Mathematics lesson content identical',
                    metadata: { confidence: 0.3 }
                },
                {
                    id: 'doc2',
                    prompt: 'Lesson plan for mathematics',
                    response: 'Mathematics lesson content identical',
                    metadata: { confidence: 0.9 }
                }
            ]);
            searchEngine.indexDocument('docX', 'Other subject', 'History lesson content.');

            const results = searchEngine.search('lesson plan for mathematics', 2, 0.0);
            
            expect(results.length).toBe(2);
            // Higher confidence should be ranked higher when similarity is equal
            expect(results[0].confidence).toBeGreaterThanOrEqual(results[1].confidence);
        });
    });

    describe('Nigerian Education Context', () => {
        beforeEach(() => {
            searchEngine.bulkIndex([
                {
                    id: 'nigeria1',
                    prompt: 'WAEC preparation for senior secondary students',
                    response: 'WAEC exam preparation includes past questions, syllabus review...'
                },
                {
                    id: 'nigeria2',
                    prompt: 'Nigerian primary school curriculum for mathematics',
                    response: 'The primary mathematics curriculum covers numeracy, basic operations...'
                },
                {
                    id: 'general',
                    prompt: 'General mathematics education',
                    response: 'Mathematics education involves problem-solving...'
                }
            ]);
        });

        it('should find Nigerian education-specific content', () => {
            const results = searchEngine.search('Nigerian secondary school WAEC', 5);
            
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].id).toBe('nigeria1');
        });

        it('should match curriculum-related queries', () => {
            const results = searchEngine.search('primary school math curriculum', 5);
            
            expect(results.length).toBeGreaterThan(0);
            const hasNigerianContent = results.some(r => r.id === 'nigeria2');
            expect(hasNigerianContent).toBe(true);
        });
    });

    describe('Export and Import', () => {
        it('should export index data', () => {
            searchEngine.bulkIndex([
                { id: 'doc1', prompt: 'Test prompt', response: 'Test response' }
            ]);

            const exported = searchEngine.export();
            
            expect(exported.documents).toBeDefined();
            expect(exported.vocabulary).toBeDefined();
            expect(exported.idfScores).toBeDefined();
        });

        it('should import index data', () => {
            searchEngine.bulkIndex([
                { id: 'doc1', prompt: 'Original prompt', response: 'Original response' }
            ]);

            const exported = searchEngine.export();
            
            const newEngine = new SemanticSearchEngine();
            newEngine.import(exported);
            
            expect(newEngine.getStats().documentCount).toBe(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty query', () => {
            searchEngine.indexDocument('doc1', 'Test', 'Test response');
            
            const results = searchEngine.search('', 5);
            
            expect(Array.isArray(results)).toBe(true);
        });

        it('should handle special characters in query', () => {
            searchEngine.indexDocument('doc1', 'Mathematics equations', 'Solve for x: 2x + 3 = 7');
            
            const results = searchEngine.search('solve 2x+3=7', 5);
            
            expect(Array.isArray(results)).toBe(true);
        });

        it('should handle very long documents', () => {
            const longResponse = 'Mathematics is important. '.repeat(100);
            
            searchEngine.indexDocument('doc1', 'Why is math important?', longResponse);
            searchEngine.indexDocument('docN', 'Other topic', 'Completely different subject matter.');
            
            const results = searchEngine.search('mathematics importance', 5, 0.0);
            
            expect(results.length).toBeGreaterThan(0);
        });

        it('should handle case insensitivity', () => {
            searchEngine.indexDocument(
                'doc1',
                'PHOTOSYNTHESIS IN PLANTS',
                'PLANTS USE SUNLIGHT FOR PHOTOSYNTHESIS'
            );
            searchEngine.indexDocument('docN', 'Other topic', 'Completely different subject matter.');
            
            const results = searchEngine.search('photosynthesis plants', 5, 0.0);
            
            expect(results.length).toBeGreaterThan(0);
        });
    });
});

describe('HybridSearchEngine', () => {
    let hybridEngine: HybridSearchEngine;

    beforeEach(() => {
        hybridEngine = new HybridSearchEngine();
    });

    it('should initialize with semantic engine', () => {
        const stats = hybridEngine.getStats();
        expect(stats).toBeDefined();
    });

    it('should index documents', () => {
        hybridEngine.indexDocument(
            'hybrid1',
            'Test hybrid search',
            'Hybrid search combines semantic and keyword matching'
        );
        
        const stats = hybridEngine.getStats();
        expect(stats.documentCount).toBeGreaterThan(0);
    });

    it('should perform hybrid search', () => {
        hybridEngine.bulkIndex([
            {
                id: 'doc1',
                prompt: 'What is machine learning?',
                response: 'Machine learning is a subset of AI...'
            },
            {
                id: 'doc2',
                prompt: 'Deep learning explained',
                response: 'Deep learning uses neural networks...'
            }
        ]);

        const results = hybridEngine.search('artificial intelligence machine learning', 5);
        
        expect(Array.isArray(results)).toBe(true);
    });
});

describe('Performance', () => {
    let searchEngine: SemanticSearchEngine;

    beforeEach(() => {
        searchEngine = new SemanticSearchEngine();
        searchEngine.clear();
    });

    it('should handle 100+ documents efficiently', () => {
        const documents = Array.from({ length: 100 }, (_, i) => ({
            id: `doc${i}`,
            prompt: `Sample educational prompt number ${i}`,
            response: `This is a sample response for document ${i} covering educational topics.`
        }));

        const startTime = Date.now();
        searchEngine.bulkIndex(documents);
        const indexTime = Date.now() - startTime;

        expect(indexTime).toBeLessThan(5000); // Should index in under 5 seconds

        const searchStart = Date.now();
        const results = searchEngine.search('educational topics', 10, 0.0);
        const searchTime = Date.now() - searchStart;

        expect(searchTime).toBeLessThan(1000); // Should search in under 1 second
        expect(results.length).toBeGreaterThan(0);
    });
});
