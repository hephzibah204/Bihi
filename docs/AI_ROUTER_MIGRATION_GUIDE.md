# AI Router Migration Guide

## Overview
This guide helps you migrate existing components from the old `useAI` hook to the new intelligent `useAIRouter` system.

## Why Migrate?

### Benefits of AI Router:
1. **40-50% cost savings** through intelligent provider selection
2. **Better reliability** with automatic failover between providers
3. **Conversation continuity** - maintains same provider throughout conversations
4. **Usage analytics** - track costs and performance
5. **User control** - let users choose AI preferences

---

## Quick Start

### Old Way (useAI):
```typescript
import { useAI } from '../hooks/useAI';

const MyComponent = () => {
  const { generateResponse, isLoading } = useAI();
  
  const handleSubmit = async (prompt: string) => {
    const response = await generateResponse(prompt);
    console.log(response.content);
  };
  
  return <div>{/* UI */}</div>;
};
```

### New Way (useAIRouter):
```typescript
import { useAIRouter } from '../hooks/useAIRouter';
import { AIProviderIndicator } from '../components/AIProviderIndicator';

const MyComponent = () => {
  const { generate, isLoading, lastResponse } = useAIRouter({
    conversationId: 'my-conversation-123', // Important for continuity
    settings: { preferredProvider: 'auto', autoRouting: true }
  });
  
  const handleSubmit = async (prompt: string) => {
    const response = await generate(prompt);
    console.log(response.content);
    console.log(`Used ${response.provider}, cost: $${response.cost}`);
  };
  
  return (
    <div>
      {lastResponse && (
        <AIProviderIndicator 
          provider={lastResponse.provider}
          complexity={lastResponse.complexity}
          showDetails
        />
      )}
      {/* Rest of UI */}
    </div>
  );
};
```

---

## Migration Steps

### Step 1: Update Imports
```typescript
// Old
import { useAI } from '../hooks/useAI';

// New
import { useAIRouter } from '../hooks/useAIRouter';
import { AIProviderIndicator } from '../components/AIProviderIndicator';
```

### Step 2: Update Hook Usage
```typescript
// Old
const { generateResponse, isLoading, isOnline } = useAI();

// New
const { generate, isLoading, lastResponse, settings } = useAIRouter({
  conversationId: 'unique-conversation-id', // Use actual conversation/session ID
  settings: {
    preferredProvider: 'auto', // or 'gemini', 'huggingface'
    autoRouting: true,
    complexityThreshold: 'medium'
  }
});
```

### Step 3: Update Function Calls
```typescript
// Old
const response = await generateResponse(prompt, context, type);
console.log(response.content);

// New
const response = await generate(prompt, metadata);
console.log(response.content); // Same content
console.log(response.provider); // Know which AI was used
console.log(response.complexity.score); // Task complexity
console.log(response.cost); // Estimated cost
```

### Step 4: Add Provider Indicator (Optional but Recommended)
```typescript
{lastResponse && (
  <AIProviderIndicator 
    provider={lastResponse.provider}
    complexity={lastResponse.complexity}
    responseTime={lastResponse.responseTime}
    cost={lastResponse.cost}
    showDetails={true} // Show full complexity analysis
  />
)}
```

---

## Component-Specific Examples

### Example 1: AI Academic Tutor

**Before:**
```typescript
// components/AIAcademicTutor.tsx
const { generateResponse, isLoading } = useAI();

const handleAsk = async (question: string) => {
  const response = await generateResponse(question);
  addMessage({ role: 'assistant', content: response.content });
};
```

**After:**
```typescript
// components/AIAcademicTutor.tsx
const { generate, isLoading, lastResponse } = useAIRouter({
  conversationId: `tutor-${studentId}`,
  settings: {
    preferredProvider: 'auto', // Auto-route based on complexity
    autoRouting: true
  },
  onProviderChange: (provider) => {
    console.log(`Switched to ${provider} for better performance`);
  }
});

const handleAsk = async (question: string) => {
  const response = await generate(question, {
    userRole: 'Student',
    subject: currentSubject
  });
  
  addMessage({
    role: 'assistant',
    content: response.content,
    provider: response.provider, // Track which AI answered
    complexity: response.complexity.score
  });
};

// Show which AI is being used
<AIProviderIndicator 
  provider={lastResponse?.provider || 'auto'}
  complexity={lastResponse?.complexity}
  compact
/>
```

### Example 2: Parent Chat

**Before:**
```typescript
const { generateResponse, isLoading } = useAI();

const sendMessage = async (message: string) => {
  const response = await generateResponse(message, 'parent-chat');
  setMessages([...messages, { text: response.content, from: 'ai' }]);
};
```

**After:**
```typescript
const { generate, isLoading, lastResponse } = useAIRouter({
  conversationId: `parent-chat-${parentId}`,
  settings: {
    preferredProvider: 'auto',
    autoRouting: true,
    complexityThreshold: 'medium' // Balanced approach
  }
});

const sendMessage = async (message: string) => {
  const response = await generate(message, {
    userRole: 'Parent',
    childId: studentId
  });
  
  setMessages([...messages, {
    text: response.content,
    from: 'ai',
    provider: response.provider,
    cost: response.cost
  }]);
};

// Show provider badge in chat
{messages.map(msg => (
  <div key={msg.id}>
    {msg.from === 'ai' && <AIProviderBadge provider={msg.provider} />}
    {msg.text}
  </div>
))}
```

### Example 3: Lesson Plan Generator

**Before:**
```typescript
const generatePlan = async (topic: string, subject: string) => {
  const prompt = `Create a lesson plan for ${topic} in ${subject}`;
  const response = await generateResponse(prompt);
  return response.content;
};
```

**After:**
```typescript
const { generate, lastResponse } = useAIRouter({
  settings: {
    preferredProvider: 'auto',
    autoRouting: true,
    complexityThreshold: 'high' // Prefer Gemini for lesson plans
  }
});

const generatePlan = async (topic: string, subject: string) => {
  const prompt = `Create a detailed lesson plan for ${topic} in ${subject} aligned with Nigerian WAEC/NECO curriculum`;
  
  const response = await generate(prompt, {
    type: 'lesson-plan',
    subject,
    topic
  });
  
  // Lesson plans are complex, should route to Gemini
  console.log(`Generated with ${response.provider}`); // Usually 'gemini'
  console.log(`Complexity: ${response.complexity.score}/100`); // Usually 70+
  
  return {
    content: response.content,
    provider: response.provider,
    complexity: response.complexity.score,
    cost: response.cost
  };
};
```

---

## Conversation Continuity

**Important:** Use consistent `conversationId` to maintain continuity:

```typescript
// Good: Same conversation ID throughout
const conversationId = `chat-${userId}-${chatId}`;

const { generate } = useAIRouter({ conversationId });

// Turn 1: "How is my child doing?"
await generate("How is my child doing?"); // → Gemini (complex)

// Turn 2: "What can I do to help?"
await generate("What can I do to help?"); // → Gemini (continues with same provider)

// Turn 3: "Generate 5 practice questions"
await generate("Generate 5 practice questions"); // → HuggingFace (simple task, but might stay with Gemini for continuity)
```

---

## Monitoring & Analytics

### View Usage Statistics
```typescript
const { usageStats } = useAIRouter();

const stats = usageStats();
console.log(`Total conversations: ${stats.totalConversations}`);
console.log(`Gemini usage: ${stats.providerDistribution.gemini} requests`);
console.log(`Average complexity: ${stats.averageComplexity}/100`);
console.log(`Total cost: $${stats.totalCost}`);
```

### Add Usage Dashboard
```typescript
import { AIUsageDashboard } from '../components/AIUsageDashboard';

// In your settings or admin panel
<AIUsageDashboard />
```

---

## Settings Integration

### Add AI Settings to User Preferences
```typescript
import { AISettingsPanel } from '../components/AISettings';

// In SchoolSettings or UserPreferences
<AISettingsPanel 
  showAdvanced={isAdmin} // Only admins can set API keys
  onSettingsChange={(settings) => {
    console.log('AI settings updated:', settings);
  }}
/>
```

---

## Common Patterns

### Pattern 1: Analyze Before Generating
```typescript
const { analyzeComplexity, generate } = useAIRouter();

const handleSubmit = async (prompt: string) => {
  // Check complexity first
  const complexity = analyzeComplexity(prompt);
  
  if (complexity.score > 80) {
    // Warn user about complex task
    alert(`This is a complex task (${complexity.score}/100). May take longer.`);
  }
  
  // Then generate
  const response = await generate(prompt);
  return response;
};
```

### Pattern 2: Manual Provider Override
```typescript
const { updateSettings, generate } = useAIRouter();

const forceGemini = () => {
  updateSettings({ preferredProvider: 'gemini', autoRouting: false });
};

const enableAutoRouting = () => {
  updateSettings({ preferredProvider: 'auto', autoRouting: true });
};
```

### Pattern 3: Streaming Responses
```typescript
const { generateStream } = useAIRouter();

const handleStream = async (prompt: string) => {
  let fullText = '';
  
  await generateStream(prompt, {}, (chunk) => {
    fullText += chunk;
    setStreamingText(fullText);
  });
};
```

---

## Testing

### Test Different Providers
```typescript
import { AIProviderSwitcher } from '../components/AIProviderIndicator';

// In development/testing
const { settings, updateSettings, generate } = useAIRouter();

<AIProviderSwitcher
  currentProvider={settings.preferredProvider}
  onProviderChange={(provider) => {
    updateSettings({ preferredProvider: provider });
  }}
/>
```

---

## Best Practices

1. **Always use conversationId** for multi-turn conversations
2. **Show provider indicators** so users know which AI is being used
3. **Monitor costs** with AIUsageDashboard
4. **Let users choose** by adding AISettingsPanel
5. **Trust auto-routing** - it's optimized for quality and cost
6. **Provide context** in metadata parameter for better routing decisions

---

## Troubleshooting

### Issue: Provider keeps switching mid-conversation
**Solution:** Ensure you're using a consistent `conversationId`

### Issue: Always uses templates instead of AI
**Solution:** Check internet connection and API keys. View AIUsageDashboard for health status.

### Issue: High costs
**Solution:** Enable auto-routing and set `complexityThreshold: 'low'` for maximum savings

### Issue: Poor quality responses
**Solution:** Set `preferredProvider: 'gemini'` or `complexityThreshold: 'high'`

---

## Support

For issues or questions:
1. Check AIUsageDashboard for provider health
2. Review conversation complexity scores
3. Test with different settings
4. Check console for routing decisions (logged in development)

---

## Summary Checklist

- [ ] Replaced `useAI` with `useAIRouter`
- [ ] Added `conversationId` for multi-turn conversations
- [ ] Added provider indicators to UI
- [ ] Integrated AI settings panel
- [ ] Added usage dashboard for monitoring
- [ ] Tested with different complexity tasks
- [ ] Verified cost savings
- [ ] Updated tests if any

**Estimated migration time per component: 15-30 minutes**
