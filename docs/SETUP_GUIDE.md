# Dossier.NG AI System - Complete Setup Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [UI Integration](#ui-integration)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

Get the AI system running in 5 minutes:

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Initialize semantic cache
# Add to your app initialization (e.g., _app.tsx or main.tsx)
import { initializeSemanticCache } from '@/services/semanticSearchUtils';
initializeSemanticCache();

# 3. Run tests
npm test tests/semanticSearch.test.ts

# 4. Start development server
npm run dev

# 5. Access AI Dashboard
# Navigate to: http://localhost:3000/admin/ai-dashboard
```

---

## Installation

### Prerequisites

- Node.js 16+ and npm/yarn
- TypeScript project
- React 18+ (for UI components)
- Tailwind CSS (for styling)

### Step 1: Verify Files

Ensure all files are in place:

```
services/
├── semanticSearch.ts ✓
├── semanticSearchUtils.ts ✓
├── huggingFaceAPI.ts ✓
├── trainingDataExport.ts ✓
├── fallbackAiService.ts ✓
└── enhancedFallbackAI.ts ✓

components/ai/
├── SemanticCacheWidget.tsx ✓
└── HuggingFaceConfigPanel.tsx ✓

pages/admin/
└── ai-dashboard.tsx ✓

tests/
└── semanticSearch.test.ts ✓

docs/
├── SEMANTIC_SEARCH.md ✓
├── PHASE_2_COMPLETE.md ✓
└── SETUP_GUIDE.md ✓ (this file)
```

### Step 2: Install Additional Dependencies (if needed)

```bash
# Jest for testing (if not installed)
npm install --save-dev jest @types/jest @jest/globals

# If using TypeScript path aliases
npm install --save-dev tsconfig-paths
```

### Step 3: Update tsconfig.json

Ensure path aliases are configured:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/services/*": ["services/*"],
      "@/components/*": ["components/*"]
    }
  }
}
```

---

## Configuration

### 1. Initialize Semantic Cache

Add to your app initialization file (`pages/_app.tsx` or `app/layout.tsx`):

```typescript
import { useEffect } from 'react';
import { initializeSemanticCache } from '@/services/semanticSearchUtils';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Initialize semantic cache with pre-loaded templates
    initializeSemanticCache();
    console.log('✓ Semantic cache initialized');
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

### 2. Configure Hugging Face API (Optional)

Get a free API key:

1. Visit https://huggingface.co/settings/tokens
2. Create a new token (read access is sufficient)
3. Add to your app via the AI Dashboard or programmatically:

```typescript
import { getHuggingFaceClient } from '@/services/huggingFaceAPI';

// In your admin panel or settings
const client = getHuggingFaceClient();
client.setApiKey('hf_your_api_key_here');
```

### 3. Environment Variables (Optional)

Create `.env.local` for API keys:

```env
# Optional: Hugging Face API key
NEXT_PUBLIC_HUGGINGFACE_API_KEY=hf_your_key_here
```

Then load it in your config:

```typescript
const client = getHuggingFaceClient();
if (process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY) {
  client.setApiKey(process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY);
}
```

---

## UI Integration

### 1. Add AI Dashboard to Admin Panel

Add link to your admin navigation:

```typescript
// In your admin layout or navigation component
<Link href="/admin/ai-dashboard">
  <a className="nav-link">
    AI System
  </a>
</Link>
```

### 2. Use Fallback AI Service

Replace your existing AI calls:

```typescript
// Before
const response = await fetch('/api/openai', { ... });

// After (with fallback)
import { generateFallbackResponse } from '@/services/fallbackAiService';

const response = generateFallbackResponse({
  prompt: 'Create a lesson plan for fractions',
  context: { userRole: 'Teacher' }
});
```

### 3. Add Cache Widget to Dashboard

```typescript
import { SemanticCacheWidget } from '@/components/ai/SemanticCacheWidget';

export default function DashboardPage() {
  return (
    <div>
      {/* Other dashboard content */}
      <SemanticCacheWidget />
    </div>
  );
}
```

### 4. Integrate HF Configuration

```typescript
import { HuggingFaceConfigPanel } from '@/components/ai/HuggingFaceConfigPanel';

export default function SettingsPage() {
  return (
    <div>
      <h1>AI Settings</h1>
      <HuggingFaceConfigPanel />
    </div>
  );
}
```

---

## Testing

### Run All Tests

```bash
# Semantic search tests
npm test tests/semanticSearch.test.ts

# All tests
npm test

# Watch mode
npm test -- --watch
```

### Manual Testing

Test the semantic cache:

```typescript
import { 
  initializeSemanticCache, 
  findSimilarResponses,
  getCacheStats
} from '@/services/semanticSearchUtils';

// Initialize
initializeSemanticCache();

// Check stats
const stats = getCacheStats();
console.log(`Cache has ${stats.documentCount} documents`);

// Test search
const results = findSimilarResponses('lesson plan fractions', 0.5, 5);
console.log(`Found ${results.length} similar responses`);
```

### Test Hugging Face API

```typescript
import { 
  getHuggingFaceClient, 
  testHuggingFaceAPIKey 
} from '@/services/huggingFaceAPI';

// Test API key
const isValid = await testHuggingFaceAPIKey('hf_your_key');
console.log('API key valid:', isValid);

// Generate content
const client = getHuggingFaceClient();
const response = await client.generateEducationalContent(
  'Explain photosynthesis',
  'Nigerian JSS2 student'
);
console.log(response);
```

---

## Deployment

### Production Checklist

- [ ] All tests passing
- [ ] Semantic cache initialized on app start
- [ ] localStorage available (browser environment)
- [ ] Hugging Face API key configured (optional)
- [ ] Admin dashboard accessible only to admins
- [ ] Error handling for API failures
- [ ] Monitoring/logging enabled

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_HUGGINGFACE_API_KEY
```

### Environment-Specific Configuration

```typescript
// config/ai.ts
export const AI_CONFIG = {
  development: {
    enableHuggingFace: true,
    cacheThreshold: 0.6, // Lower threshold for testing
    logLevel: 'debug'
  },
  production: {
    enableHuggingFace: true,
    cacheThreshold: 0.7, // Stricter for prod
    logLevel: 'error'
  }
};

const config = AI_CONFIG[process.env.NODE_ENV || 'development'];
```

### Database Integration (Optional)

If you want to persist cache to database:

```typescript
// services/cacheSync.ts
import { getSemanticSearchEngine } from './semanticSearch';

export async function syncCacheToDatabase() {
  const searchEngine = getSemanticSearchEngine();
  const data = searchEngine.export();
  
  // Save to your database
  await db.aiCache.upsert({
    where: { id: 'main' },
    data: { cacheData: JSON.stringify(data) }
  });
}

export async function loadCacheFromDatabase() {
  const cached = await db.aiCache.findUnique({ where: { id: 'main' } });
  
  if (cached) {
    const searchEngine = getSemanticSearchEngine();
    searchEngine.import(JSON.parse(cached.cacheData));
  }
}
```

---

## Monitoring & Maintenance

### Track Cache Performance

```typescript
import { getCacheStats } from '@/services/semanticSearchUtils';

// Add to your analytics/monitoring
function logCacheMetrics() {
  const stats = getCacheStats();
  
  // Send to your analytics service
  analytics.track('ai_cache_stats', {
    documentCount: stats.documentCount,
    vocabularySize: stats.vocabularySize
  });
}

// Run daily
setInterval(logCacheMetrics, 24 * 60 * 60 * 1000);
```

### Monitor API Usage

```typescript
import { getHuggingFaceClient } from '@/services/huggingFaceAPI';

function checkAPIUsage() {
  const client = getHuggingFaceClient();
  const stats = client.getCacheStats();
  
  console.log(`HF API - Requests: ${stats.requestCount}, Remaining: ${stats.remainingRequests}`);
  
  // Alert if approaching limit
  if (stats.remainingRequests < 5) {
    console.warn('⚠️  Approaching Hugging Face rate limit!');
  }
}
```

### Quality Monitoring

```typescript
import { getTrainingDataExporter } from '@/services/trainingDataExport';

async function weeklyQualityReport() {
  const exporter = getTrainingDataExporter();
  const analysis = exporter.analyzeQuality();
  
  // Email or log report
  console.log('Quality Distribution:', analysis.qualityDistribution);
  console.log('Recommendations:', analysis.recommendations);
}
```

### Cache Maintenance

```typescript
// Clean low-quality cache entries monthly
function cleanCache() {
  const searchEngine = getSemanticSearchEngine();
  const data = searchEngine.export();
  
  // Filter out low-quality entries
  const cleaned = data.documents.filter(([id, doc]) => {
    const quality = scoreResponseQuality(doc.response);
    return quality > 0.5;
  });
  
  // Reimport cleaned data
  searchEngine.clear();
  searchEngine.import({ ...data, documents: cleaned });
  
  console.log(`Cleaned ${data.documents.length - cleaned.length} low-quality entries`);
}
```

---

## Troubleshooting

### Issue: Semantic cache not working

**Symptoms:** Always generating new responses, no cache hits

**Solutions:**

```typescript
// Check if cache is initialized
import { getCacheStats } from '@/services/semanticSearchUtils';
const stats = getCacheStats();
console.log('Document count:', stats.documentCount);

// If 0, reinitialize
import { initializeSemanticCache } from '@/services/semanticSearchUtils';
initializeSemanticCache();

// Check localStorage
try {
  const test = localStorage.getItem('semantic_search_index');
  console.log('Cache storage OK:', !!test);
} catch (error) {
  console.error('localStorage not available:', error);
}
```

### Issue: Hugging Face API errors

**Symptoms:** API calls failing, rate limit errors

**Solutions:**

```typescript
// Verify API key
import { testHuggingFaceAPIKey } from '@/services/huggingFaceAPI';
const isValid = await testHuggingFaceAPIKey('your_key');

// Check rate limit
const client = getHuggingFaceClient();
const stats = client.getCacheStats();
console.log('Remaining requests:', stats.remainingRequests);

// Clear HF cache if needed
client.clearCache();
```

### Issue: Export not working

**Symptoms:** Download fails, empty files

**Solutions:**

```typescript
// Check if data exists
import { getTrainingDataExporter } from '@/services/trainingDataExport';
const exporter = getTrainingDataExporter();

// Preview data
const preview = exporter.preview({ format: 'jsonl' }, 3);
console.log('Sample data:', preview);

// Check quality
const analysis = exporter.analyzeQuality();
console.log('Quality analysis:', analysis);
```

### Issue: Performance degradation

**Symptoms:** Slow search, high memory usage

**Solutions:**

```typescript
// Check cache size
const stats = getCacheStats();
if (stats.documentCount > 1000) {
  console.warn('Cache is large, consider cleaning');
  // Run cleanCache() function
}

// Profile search performance
console.time('search');
const results = searchEngine.search(query, 5);
console.timeEnd('search');

// If slow, rebuild index
searchEngine.clear();
initializeSemanticCache();
```

---

## Best Practices

### 1. Initialize Early

Always initialize semantic cache during app startup:

```typescript
// pages/_app.tsx
useEffect(() => {
  initializeSemanticCache();
}, []);
```

### 2. Monitor Cache Growth

Set up weekly checks:

```typescript
// Check cache size weekly
const stats = getCacheStats();
if (stats.documentCount > 500) {
  // Export for backup
  const backup = exportSemanticCache();
  // Save to cloud storage
}
```

### 3. Use Quality Thresholds

Filter exports by quality:

```typescript
// Only export high-quality data
const { data } = exporter.export({
  format: 'jsonl',
  minQualityScore: 0.8,
  maxExamples: 100
});
```

### 4. Handle Fallbacks Gracefully

Always have fallback options:

```typescript
try {
  // Try HF API
  const response = await hfClient.generate(prompt);
} catch (error) {
  // Fall back to templates
  return generateEnhancedFallbackResponse(prompt);
}
```

### 5. Regular Maintenance

Schedule monthly tasks:

```typescript
// Monthly maintenance script
async function monthlyMaintenance() {
  // 1. Clean cache
  cleanCache();
  
  // 2. Export training data
  const exporter = getTrainingDataExporter();
  exporter.exportToFile({ format: 'jsonl', minQualityScore: 0.7 });
  
  // 3. Generate quality report
  const report = generateTrainingDataReport();
  // Email to admin
}
```

---

## Next Steps

After setup is complete:

1. **Week 1:** Monitor cache performance, check logs
2. **Month 1:** Review quality metrics, adjust thresholds
3. **Month 3:** Export training data, analyze patterns
4. **Month 6:** Consider Phase 3 (custom model training)

---

## Support & Resources

- **Documentation:** See `docs/` folder
- **Tests:** `tests/semanticSearch.test.ts`
- **Examples:** `docs/PHASE_2_COMPLETE.md`
- **API Reference:** Inline JSDoc comments

## Summary

✅ **Installation:** Files in place, dependencies installed
✅ **Configuration:** Cache initialized, API keys configured
✅ **Integration:** UI components added, services integrated
✅ **Testing:** All tests passing, manual testing complete
✅ **Deployment:** Production checklist complete
✅ **Monitoring:** Metrics tracked, alerts configured

Your AI system is now fully operational! 🚀