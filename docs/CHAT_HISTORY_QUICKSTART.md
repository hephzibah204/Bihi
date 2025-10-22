# Chat History System - Quick Start Guide

## 🚀 Setup Instructions

### 1. Apply Database Migration

```bash
# Navigate to project directory
cd C:\Users\User\Downloads\Dossier.NG

# Apply migration using Supabase CLI
npx supabase db push

# Or apply manually to your database
psql -d your_database -f supabase/migrations/20250121_chat_history.sql
```

### 2. Verify Database Setup

Check that tables were created:

```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ai_conversations', 'ai_messages', 'voice_sessions');

-- Test RLS policies
SELECT * FROM ai_conversations LIMIT 1;
```

### 3. Test Voice Session Persistence

The `AIAcademicTutor` component now automatically:
- Creates a conversation when voice session starts
- Tracks transcripts in real-time
- Saves session data when ended
- Syncs transcripts to conversation history

**To test:**
1. Go to AI Academic Tutor
2. Start a voice session
3. Speak and interact with the AI
4. End the session
5. Check database: `SELECT * FROM voice_sessions ORDER BY created_at DESC LIMIT 1;`

### 4. Add Chat History to Other Components

#### Example: Adding to a text chat component

```tsx
import { useState, useEffect } from 'react';
import { getConversationService } from '../services/conversationService';
import { getGeminiAIService } from '../services/geminiAIService';
import ChatHistorySidebar from './ChatHistorySidebar';

function MyTextChat() {
  const [conversationId, setConversationId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  
  const { session } = useAuth();
  
  // Create conversation on mount
  useEffect(() => {
    const initConversation = async () => {
      const service = getConversationService();
      const { conversation } = await service.createConversation({
        userId: session.user.id,
        type: 'text_chat'
      });
      setConversationId(conversation.id);
    };
    initConversation();
  }, []);
  
  // Send message with history context
  const sendMessage = async (userInput) => {
    const aiService = getGeminiAIService();
    
    // Add user message to UI
    setMessages(prev => [...prev, { role: 'user', content: userInput }]);
    
    // Generate AI response with conversation history
    const response = await aiService.generate({
      prompt: userInput,
      conversationId: conversationId, // This loads history automatically
      context: {
        userRole: 'Student',
        subject: 'General'
      }
    });
    
    // Add AI response to UI
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: response.content,
      source: response.source,
      isFallback: response.isFallback
    }]);
  };
  
  return (
    <div>
      {/* Your chat UI */}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
      
      {/* History button */}
      <button onClick={() => setHistoryOpen(true)}>
        View History
      </button>
      
      {/* History sidebar */}
      <ChatHistorySidebar
        userId={session.user.id}
        authToken={session.access_token}
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onLoadConversation={(id) => {
          setConversationId(id);
          // Optionally load messages into current view
        }}
        filterType="text_chat"
      />
    </div>
  );
}
```

### 5. Verify Conversation History

After sending some messages:

```sql
-- Check conversations
SELECT id, title, type, message_count 
FROM get_user_conversations('user-id'::UUID, 10, 0);

-- Check messages
SELECT role, content, source, is_fallback, created_at
FROM get_conversation_messages('conversation-id'::UUID);
```

## 📊 System Components

### Backend (Already Created)
- ✅ Database migration with 3 tables
- ✅ API endpoints for conversations and messages
- ✅ Voice session service
- ✅ Conversation service with CRUD operations

### Frontend (Already Created)
- ✅ ConversationList component
- ✅ ConversationHistory component
- ✅ ChatHistorySidebar component

### Services (Already Updated)
- ✅ geminiAIService.ts - Auto-loads history, auto-saves messages
- ✅ conversationService.ts - Full CRUD operations
- ✅ voiceSessionService.ts - Voice session persistence

### Integration (Completed)
- ✅ AIAcademicTutor - Voice sessions now persist automatically

## 🔧 Configuration

### Environment Variables

Add to your `.env` or Cloudflare environment:

```bash
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Configuration

Ensure these are set in Supabase dashboard:
1. Enable Row Level Security on all tables
2. Verify RLS policies are active
3. Check that auth.users table exists

## 🧪 Testing Checklist

- [ ] Database migration applied successfully
- [ ] Voice sessions save to database
- [ ] Conversations appear in ChatHistorySidebar
- [ ] Message history loads correctly
- [ ] Gemini receives conversation context
- [ ] Source badges show correctly (Gemini, fallback, etc.)
- [ ] Delete conversation works
- [ ] Search conversations works
- [ ] API endpoints return expected data

## 📝 API Testing

Test the API endpoints using curl or Postman:

```bash
# Get conversations
curl -X GET "http://localhost:8788/api/conversations" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create conversation
curl -X POST "http://localhost:8788/api/conversations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Chat","type":"text_chat"}'

# Add message
curl -X POST "http://localhost:8788/api/conversations/CONVERSATION_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role":"user","content":"Hello!"}'

# Get messages
curl -X GET "http://localhost:8788/api/conversations/CONVERSATION_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎯 Next Steps

1. **Add history to other chat components** - Follow the example above
2. **Customize UI** - Modify components to match your design
3. **Add features** - Export conversations, share, tags, etc.
4. **Monitor usage** - Use voice session stats and conversation analytics
5. **Optimize performance** - Add caching if needed

## 📚 Documentation

Full documentation available at:
- `docs/CHAT_HISTORY_SYSTEM.md` - Complete system documentation
- Database migration: `supabase/migrations/20250121_chat_history.sql`
- Services: `services/conversationService.ts`, `services/voiceSessionService.ts`
- Components: `components/ConversationList.tsx`, etc.

## 💡 Tips

1. **Always provide conversationId** to Gemini service for context
2. **Handle errors gracefully** - Don't block user if history fails
3. **Test with demo mode** - Works without real authentication
4. **Monitor database size** - Run cleanup periodically
5. **Check browser console** - Logs show session creation/saving

## ⚠️ Troubleshooting

**Messages not saving?**
- Check conversationId is set
- Verify Supabase credentials
- Check browser console for errors

**History not loading?**
- Verify RLS policies in Supabase
- Check user is authenticated
- Test API endpoints directly

**Voice sessions not persisting?**
- Check voice_sessions table exists
- Verify cleanup() is called on session end
- Check console logs for errors

## 🎉 You're Done!

Your chat history system is now fully functional with:
- ✅ Persistent conversation memory
- ✅ Voice session tracking
- ✅ Source attribution (Gemini vs fallback)
- ✅ User-friendly history sidebar
- ✅ Automatic context injection for AI

Start testing and enjoy your new persistent memory system!
