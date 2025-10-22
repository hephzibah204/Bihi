# Semantic Search Implementation

## Overview

The semantic search system provides intelligent caching and retrieval of AI-generated responses using TF-IDF vectorization and cosine similarity. This allows the fallback AI to find and reuse high-quality responses for similar queries, improving response times and consistency.

## Architecture

```
User Query
    ↓
Semantic Search Cache
    ↓
Match Found (>70% similarity)?
    ├─ YES → Return cached response
    └─ NO  → Generate new response
              ↓
         Cache for future use
```

## Components

### 1. SemanticSearchEngine (`services/semanticSearch.ts`)

Core engine implementing TF-IDF vectorization and cosine similarity matching.

**Key Features:**
- Lightweight, no external ML dependencies
- TF-IDF vectorization for text representation
- Cosine similarity for semantic matching
- Confidence-based ranking
- localStorage persistence
- Import/export capabilities

**API:**

```typescript
const searchEngine = getSemanticSearchEngine();

// Index a document
searchEngine.indexDocument(
    'doc_id',
    'prompt text',
    'response text',
    { confidence: 0.85, category: 'lesson_plan' }
);

// Search for similar documents
const results = searchEngine.search('query text', 5, 0.5);
// Returns top 5 matches with minimum 50% similarity

// Bulk indexing
searchEngine.bulkIndex([
    { id: 'doc1', prompt: '...', response: '...', metadata: {...} },
    { id: 'doc2', prompt: '...', response: '...', metadata: {...} }
]);

// Get statistics
const stats = searchEngine.getStats();
console.log(stats.documentCount, stats.vocabularySize);

// Export/import for backup
const data = searchEngine.export();
searchEngine.import(data);

// Clear cache
searchEngine.clear();
```

### 2. Integration with Fallback AI (`services/fallbackAiService.ts`)

Automatic semantic caching integrated into the main fallback AI flow:

1. **Search Phase**: Query semantic cache for similar prompts
2. **Match Phase**: If similarity > 70%, return cached response
3. **Generate Phase**: Generate new response using enhanced AI
4. **Cache Phase**: Store response with calculated confidence score

**Confidence Scoring:**
- Base: 0.5
- Length bonus: +0.15 (>500 chars), +0.1 (>300 chars)
- Structure bonus: +0.1 (headers, bullets, numbering)
- Context bonus: +0.05 (specific user role)
- Penalty: -0.2 (offline mode disclaimers), -0.15 (basic template warnings)

### 3. Utility Functions (`services/semanticSearchUtils.ts`)

Helper functions for common operations:

```typescript
// Initialize cache with pre-defined templates
initializeSemanticCache();

// Search cache
const matches = findSimilarResponses('query', 0.5, 5);

// Add to cache
cacheNewResponse('prompt', 'response', { confidence: 0.8 });

// Get stats
const stats = getCacheStats();

// Quality scoring
const quality = scoreResponseQuality(response);
```

## Pre-loaded Templates

The system comes with 9 high-quality pre-indexed templates:

1. **Lesson Plans:**
   - Mathematics (Fractions for Primary 5)
   - English (Parts of Speech for JSS1)

2. **Report Card Comments:**
   - Excellent performance
   - Good performance

3. **Tutoring:**
   - Photosynthesis explanation

4. **Parent Advice:**
   - Homework help strategies

5. **Financial Analysis:**
   - Debt and payment patterns

6. **Nigerian Education:**
   - WAEC exam preparation
   - Primary curriculum overview

## Usage Examples

### Basic Usage

```typescript
import { generateFallbackResponse } from './services/fallbackAiService';

// Automatic semantic caching
const response = generateFallbackResponse({
    prompt: 'Create a lesson plan for teaching fractions',
    context: { userRole: 'Teacher' }
});
```

### Manual Cache Management

```typescript
import { initializeSemanticCache, getCacheStats, findSimilarResponses } from './services/semanticSearchUtils';

// Initialize on app startup
initializeSemanticCache();

// Check what's in cache
const stats = getCacheStats();
console.log(`Cache has ${stats.documentCount} documents`);

// Search manually
const similar = findSimilarResponses('fractions lesson', 0.6, 3);
similar.forEach(match => {
    console.log(`${match.similarity.toFixed(2)}: ${match.prompt}`);
});
```

### Export/Import for Backup

```typescript
import { exportSemanticCache, importSemanticCache } from './services/semanticSearchUtils';

// Backup cache
const backup = exportSemanticCache();
localStorage.setItem('semantic_cache_backup', JSON.stringify(backup));

// Restore cache
const backup = JSON.parse(localStorage.getItem('semantic_cache_backup'));
importSemanticCache(backup);
```

## Performance Characteristics

- **Indexing**: ~50ms per document (bulk: ~20ms per document)
- **Search**: <100ms for 100 documents, <1s for 1000+ documents
- **Storage**: ~2-5KB per indexed document
- **Memory**: Lightweight, suitable for browser and Node.js

## Testing

Comprehensive test suite in `tests/semanticSearch.test.ts`:

```bash
npm test tests/semanticSearch.test.ts
```

**Test Coverage:**
- Basic indexing and retrieval
- Semantic similarity matching
- Bulk operations
- Confidence scoring
- Nigerian education context
- Edge cases and performance

## Configuration

### Similarity Thresholds

```typescript
// In fallbackAiService.ts
const semanticMatches = searchSemanticCache(prompt, context);
if (semanticMatches.length > 0 && semanticMatches[0].similarity > 0.7) {
    // Use cached response (70% threshold)
}
```

Adjust threshold based on needs:
- **0.5-0.6**: Broader matching, more reuse
- **0.7-0.8**: Balanced (recommended)
- **0.8-0.9**: Strict, only very similar queries

### Cache Size Management

```typescript
// Limit cache size by removing old/low-quality entries
const searchEngine = getSemanticSearchEngine();
const stats = searchEngine.getStats();

if (stats.documentCount > 1000) {
    // Implement LRU or quality-based eviction
    // Export, filter, re-import
    const data = searchEngine.export();
    const filtered = data.documents.filter(([id, doc]) => 
        doc.metadata.confidence > 0.6
    );
    searchEngine.clear();
    searchEngine.import({ ...data, documents: filtered });
}
```

## Best Practices

1. **Initialize Early**: Call `initializeSemanticCache()` during app startup
2. **Monitor Cache Size**: Check stats regularly, implement eviction if needed
3. **Quality Over Quantity**: Cache high-confidence responses only
4. **Regular Backups**: Export cache periodically for disaster recovery
5. **Adjust Thresholds**: Tune similarity thresholds based on user feedback
6. **Test Coverage**: Add test cases for your specific use cases

## Limitations

1. **Simple Embeddings**: Uses TF-IDF, not deep learning embeddings
   - Good for keyword-based similarity
   - May miss semantic nuances captured by transformers

2. **Vocabulary Growth**: Vocabulary size grows with unique terms
   - Can be mitigated by stop words and term filtering

3. **Storage**: Uses localStorage (5-10MB typical limit)
   - Consider IndexedDB for larger caches

4. **Language**: Optimized for English
   - Works with Nigerian names/terms but not multilingual

## Future Enhancements

Potential improvements for Phase 3:

1. **Advanced Embeddings**: Integrate Universal Sentence Encoder or similar
2. **Multilingual Support**: Add support for Nigerian languages
3. **Query Expansion**: Synonyms and related terms
4. **Contextual Ranking**: Use more context signals for ranking
5. **Active Learning**: Learn from user feedback to improve matching
6. **Distributed Cache**: Share cache across users/schools

## Troubleshooting

### Cache Not Persisting

```typescript
// Check localStorage availability
if (typeof window === 'undefined') {
    console.log('Not in browser environment');
}

// Check storage quota
try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
} catch (e) {
    console.error('localStorage not available:', e);
}
```

### Poor Match Quality

```typescript
// Lower threshold temporarily to see what's matching
const matches = searchEngine.search(query, 10, 0.3);
matches.forEach(m => 
    console.log(`${m.similarity.toFixed(3)}: ${m.prompt.slice(0, 50)}`)
);

// Check vocabulary and IDF scores
const stats = searchEngine.getStats();
console.log('Indexed terms:', stats.indexedTerms);
```

### Performance Issues

```typescript
// Profile indexing
console.time('bulk-index');
searchEngine.bulkIndex(documents);
console.timeEnd('bulk-index');

// Profile search
console.time('search');
const results = searchEngine.search(query, 5);
console.timeEnd('search');

// Consider clearing and rebuilding if performance degrades
searchEngine.clear();
initializeSemanticCache();
```

## License

Part of Dossier.NG school management system.