# Chat History System Documentation

## Overview

The Chat History System provides persistent memory for AI conversations across sessions. It automatically saves all user and assistant messages, maintains conversation context, and allows users to revisit past interactions.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Chat History System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React)          Backend (Cloudflare)   Database   │
│  ├─ ConversationList       ├─ /api/conversations  ├─ ai_conversations │
│  ├─ ConversationHistory    ├─ /api/.../messages   ├─ ai_messages     │
│  └─ ChatHistorySidebar     └─ Auth & CORS         └─ voice_sessions  │
│                                                               │
│  Services (TypeScript)                                        │
│  ├─ conversationService.ts (CRUD operations)                 │
│  └─ geminiAIService.ts (Context injection)                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables

#### `ai_conversations`
Stores conversation metadata.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| title | TEXT | Auto-generated from first message |
| type | TEXT | 'text_chat', 'voice_tutor', 'parent_chat' |
| metadata | JSONB | Additional context data |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |
| last_message_at | TIMESTAMP | Last message timestamp |

#### `ai_messages`
Stores individual messages.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | Foreign key to ai_conversations |
| role | TEXT | 'user', 'assistant', 'system' |
| content | TEXT | Message content |
| source | TEXT | 'gemini', 'semantic-cache', 'huggingface', 'templates', 'fallback' |
| is_fallback | BOOLEAN | Whether fallback was used |
| metadata | JSONB | Additional message metadata |
| created_at | TIMESTAMP | Message timestamp |

#### `voice_sessions`
Stores voice tutoring session data.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| conversation_id | UUID | Optional link to conversation |
| session_type | TEXT | 'gemini_live', 'web_speech_fallback' |
| transcripts | JSONB | Array of transcripts |
| duration_seconds | INTEGER | Session duration |
| fallback_used | BOOLEAN | Whether fallback was used |
| fallback_reason | TEXT | Reason for fallback |
| metadata | JSONB | Additional session data |
| created_at | TIMESTAMP | Session start time |
| ended_at | TIMESTAMP | Session end time |

### Security

Row Level Security (RLS) policies ensure users can only access their own data:

```sql
-- Example policy
CREATE POLICY "Users can view their own conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = user_id);
```

## API Endpoints

### Conversations

#### `GET /api/conversations`
List user's conversations.

**Query Parameters:**
- `limit` (number, default: 20) - Max results to return
- `offset` (number, default: 0) - Pagination offset
- `type` (string) - Filter by conversation type

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "Conversation title",
      "type": "text_chat",
      "message_count": 15,
      "last_message_at": "2025-01-21T20:00:00Z",
      "created_at": "2025-01-21T18:00:00Z"
    }
  ]
}
```

#### `POST /api/conversations`
Create a new conversation.

**Request Body:**
```json
{
  "title": "My conversation",
  "type": "text_chat",
  "metadata": {},
  "initialMessage": "Hello!"
}
```

**Response:**
```json
{
  "conversation": { /* conversation object */ },
  "message": { /* first message object */ }
}
```

#### `GET /api/conversations/:id`
Get conversation with messages.

**Response:**
```json
{
  "conversation": { /* conversation object */ },
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello!",
      "source": "gemini",
      "is_fallback": false,
      "created_at": "2025-01-21T18:00:00Z"
    }
  ]
}
```

#### `PUT /api/conversations/:id`
Update conversation title or metadata.

**Request Body:**
```json
{
  "title": "Updated title",
  "metadata": {}
}
```

#### `DELETE /api/conversations/:id`
Delete conversation and all messages.

### Messages

#### `GET /api/conversations/:id/messages`
Get messages for a conversation.

**Query Parameters:**
- `limit` (number, default: 50) - Max messages to return

**Response:**
```json
{
  "messages": [ /* array of message objects */ ]
}
```

#### `POST /api/conversations/:id/messages`
Add a message to a conversation.

**Request Body:**
```json
{
  "role": "user",
  "content": "Hello!",
  "source": "gemini",
  "is_fallback": false,
  "metadata": {}
}
```

#### `DELETE /api/conversations/:id/messages/:messageId`
Delete a specific message.

## Frontend Integration

### Basic Usage

```tsx
import ChatHistorySidebar from './components/ChatHistorySidebar';
import { useState } from 'react';

function MyComponent() {
  const [historyOpen, setHistoryOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setHistoryOpen(true)}>
        View History
      </button>
      
      <ChatHistorySidebar
        userId={currentUser.id}
        authToken={session.access_token}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadConversation={(id) => {
          // Load conversation into current chat
          console.log('Load conversation:', id);
        }}
        filterType="text_chat"
      />
    </>
  );
}
```

### Using Conversation Service

```typescript
import { getConversationService } from './services/conversationService';

const service = getConversationService();

// Create conversation
const { conversation } = await service.startConversation({
  userId: 'user-id',
  title: 'My Chat',
  type: 'text_chat',
  initialMessage: 'Hello!'
});

// Add messages
await service.addMessage({
  conversationId: conversation.id,
  role: 'assistant',
  content: 'Hi there!',
  source: 'gemini'
});

// Get conversation with messages
const data = await service.getConversationWithMessages(conversation.id);

// List conversations
const conversations = await service.listConversations('user-id', {
  limit: 20,
  offset: 0
});
```

### Integrating with Gemini AI

The Gemini AI service automatically injects conversation history:

```typescript
import { getGeminiAIService } from './services/geminiAIService';

const service = getGeminiAIService();

// Generate with conversation history
const response = await service.generate({
  prompt: "Tell me more about photosynthesis",
  conversationId: "conversation-uuid",
  context: {
    userRole: 'Student',
    subject: 'Biology',
    grade: 'SS1'
  }
});

// History is automatically loaded and sent to Gemini
// Messages are automatically saved to database
```

## React Components

### ConversationList

Displays a list of conversations with search and filtering.

**Props:**
- `userId` (string) - Current user ID
- `authToken` (string) - Authentication token
- `onSelectConversation` (function) - Callback when conversation is selected
- `selectedConversationId` (string, optional) - Currently selected conversation
- `filterType` (string, optional) - Filter by conversation type

### ConversationHistory

Displays messages in a conversation.

**Props:**
- `conversationId` (string) - Conversation to display
- `authToken` (string) - Authentication token
- `autoScroll` (boolean, optional) - Auto-scroll to bottom
- `showSourceBadge` (boolean, optional) - Show AI source badges

### ChatHistorySidebar

Slide-out sidebar combining list and history viewer.

**Props:**
- `userId` (string) - Current user ID
- `authToken` (string) - Authentication token
- `isOpen` (boolean) - Whether sidebar is visible
- `onClose` (function) - Callback to close sidebar
- `onLoadConversation` (function, optional) - Callback to load conversation
- `filterType` (string, optional) - Filter by conversation type

## Database Functions

### Helper Functions

```sql
-- Get user conversations with stats
SELECT * FROM get_user_conversations(
  'user-id'::UUID, 
  20,  -- limit
  0    -- offset
);

-- Get conversation messages
SELECT * FROM get_conversation_messages('conversation-id'::UUID);

-- Cleanup old conversations (90+ days)
SELECT cleanup_old_conversations(90);
```

## Migration

To apply the database migration:

```bash
# Using Supabase CLI
npx supabase db push

# Or apply manually
psql -d your_database -f supabase/migrations/20250121_chat_history.sql
```

## Best Practices

### 1. Always Provide conversationId

When using Gemini AI service, always include conversationId to maintain context:

```typescript
const response = await geminiService.generate({
  prompt: userInput,
  conversationId: currentConversationId,
  context: { /* ... */ }
});
```

### 2. Create Conversations Early

Create a conversation when the chat starts, not after the first message:

```typescript
// On chat component mount
useEffect(() => {
  const initConversation = async () => {
    const { conversation } = await service.createConversation({
      userId: user.id,
      type: 'text_chat'
    });
    setConversationId(conversation.id);
  };
  initConversation();
}, []);
```

### 3. Handle Errors Gracefully

Always handle conversation service errors:

```typescript
try {
  await service.addMessage({ /* ... */ });
} catch (error) {
  console.error('Failed to save message:', error);
  // Continue anyway - don't block user interaction
}
```

### 4. Limit Context Window

The system automatically limits context to the last 20 messages. If you need more:

```typescript
const messages = await service.getRecentMessages(conversationId, 50);
```

### 5. Clean Up Old Conversations

Run periodic cleanup to remove old conversations:

```sql
-- In a scheduled job or cron
SELECT cleanup_old_conversations(90); -- 90 days
```

## Performance Optimization

### Indexing

All critical queries are indexed:
- `ai_conversations(user_id, last_message_at DESC)`
- `ai_messages(conversation_id, created_at ASC)`
- `voice_sessions(user_id, created_at DESC)`

### Caching

Consider caching conversation lists:

```typescript
// Cache conversations for 5 minutes
const cachedConversations = useMemo(() => {
  return conversations;
}, [conversations]);
```

### Pagination

Always use pagination for large lists:

```typescript
const conversations = await service.listConversations(userId, {
  limit: 20,
  offset: page * 20
});
```

## Troubleshooting

### Messages Not Saving

**Issue:** Messages appear in chat but don't save to database.

**Solution:** Check that:
1. `conversationId` is provided to Gemini service
2. User is authenticated
3. RLS policies are configured correctly

```typescript
// Debug logging
console.log('Conversation ID:', conversationId);
console.log('User authenticated:', !!authToken);
```

### Conversation History Not Loading

**Issue:** Old messages don't appear in Gemini context.

**Solution:** Verify:
1. Conversation service is initialized
2. Database functions exist
3. Messages are saved with correct conversation_id

```sql
-- Check if messages exist
SELECT COUNT(*) FROM ai_messages WHERE conversation_id = 'uuid';
```

### Source Badge Not Showing

**Issue:** AI source badges not appearing in conversation history.

**Solution:** Ensure `showSourceBadge={true}` is set:

```tsx
<ConversationHistory
  conversationId={id}
  authToken={token}
  showSourceBadge={true}
/>
```

## Future Enhancements

- [ ] Export conversations to PDF/JSON
- [ ] Share conversations between users
- [ ] Advanced search (full-text search)
- [ ] Conversation tags and categories
- [ ] Analytics dashboard for conversation insights
- [ ] Voice session replay functionality
- [ ] Multi-language conversation support
- [ ] Conversation templates

## Support

For issues or questions:
1. Check this documentation
2. Review the database migration file
3. Check browser console for errors
4. Verify API endpoint responses
5. Contact development team

---

**Last Updated:** January 21, 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team
