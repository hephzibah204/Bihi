-- Migration: Chat History System
-- Created: 2025-01-21
-- Description: Tables for storing AI conversation history and voice sessions

-- ============================================================================
-- AI Conversations Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text_chat' CHECK (type IN ('text_chat', 'voice_tutor', 'parent_chat')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversations
CREATE INDEX idx_conversations_user_id ON ai_conversations(user_id, last_message_at DESC);
CREATE INDEX idx_conversations_type ON ai_conversations(type);
CREATE INDEX idx_conversations_created_at ON ai_conversations(created_at DESC);

-- ============================================================================
-- AI Messages Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    source TEXT DEFAULT 'gemini' CHECK (source IN ('gemini', 'semantic-cache', 'huggingface', 'templates', 'fallback')),
    is_fallback BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX idx_messages_conversation_id ON ai_messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_role ON ai_messages(role);
CREATE INDEX idx_messages_created_at ON ai_messages(created_at DESC);

-- ============================================================================
-- Voice Sessions Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
    session_type TEXT NOT NULL DEFAULT 'gemini_live' CHECK (session_type IN ('gemini_live', 'web_speech_fallback')),
    transcripts JSONB NOT NULL DEFAULT '[]'::jsonb,
    duration_seconds INTEGER DEFAULT 0,
    fallback_used BOOLEAN DEFAULT FALSE,
    fallback_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for voice sessions
CREATE INDEX idx_voice_sessions_user_id ON voice_sessions(user_id, created_at DESC);
CREATE INDEX idx_voice_sessions_conversation_id ON voice_sessions(conversation_id);
CREATE INDEX idx_voice_sessions_type ON voice_sessions(session_type);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
    ON ai_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
    ON ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
    ON ai_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
            AND ai_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations"
    ON ai_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
            AND ai_conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete messages in their conversations"
    ON ai_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
            AND ai_conversations.user_id = auth.uid()
        )
    );

-- Voice sessions policies
CREATE POLICY "Users can view their own voice sessions"
    ON voice_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voice sessions"
    ON voice_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice sessions"
    ON voice_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voice sessions"
    ON voice_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Trigger Functions
-- ============================================================================

-- Update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_conversations
    SET updated_at = NOW(),
        last_message_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for message insert
CREATE TRIGGER update_conversation_on_message_insert
    AFTER INSERT ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Auto-generate conversation title from first message
CREATE OR REPLACE FUNCTION generate_conversation_title()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'user' AND EXISTS (
        SELECT 1 FROM ai_conversations 
        WHERE id = NEW.conversation_id 
        AND title = 'New Conversation'
    ) THEN
        UPDATE ai_conversations
        SET title = CASE
            WHEN LENGTH(NEW.content) > 50 
            THEN SUBSTRING(NEW.content FROM 1 FOR 50) || '...'
            ELSE NEW.content
        END
        WHERE id = NEW.conversation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-title generation
CREATE TRIGGER generate_title_on_first_message
    AFTER INSERT ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION generate_conversation_title();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get conversation with message count
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID, p_limit INT DEFAULT 20, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id UUID,
    title TEXT,
    type TEXT,
    message_count BIGINT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.type,
        COUNT(m.id) as message_count,
        c.last_message_at,
        c.created_at
    FROM ai_conversations c
    LEFT JOIN ai_messages m ON m.conversation_id = c.id
    WHERE c.user_id = p_user_id
    GROUP BY c.id, c.title, c.type, c.last_message_at, c.created_at
    ORDER BY c.last_message_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get conversation messages with source info
CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id UUID)
RETURNS TABLE (
    id UUID,
    role TEXT,
    content TEXT,
    source TEXT,
    is_fallback BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.role,
        m.content,
        m.source,
        m.is_fallback,
        m.created_at
    FROM ai_messages m
    INNER JOIN ai_conversations c ON c.id = m.conversation_id
    WHERE m.conversation_id = p_conversation_id
    AND c.user_id = auth.uid()
    ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Cleanup Function (Optional)
-- ============================================================================

-- Delete conversations older than N days
CREATE OR REPLACE FUNCTION cleanup_old_conversations(p_days INT DEFAULT 90)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM ai_conversations
    WHERE last_message_at < NOW() - (p_days || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Sample Data (Optional - Remove in production)
-- ============================================================================

-- Uncomment to create sample conversation for testing
-- INSERT INTO ai_conversations (user_id, title, type) VALUES
-- (auth.uid(), 'Sample Conversation', 'text_chat');

COMMENT ON TABLE ai_conversations IS 'Stores AI conversation metadata';
COMMENT ON TABLE ai_messages IS 'Stores individual messages in conversations';
COMMENT ON TABLE voice_sessions IS 'Stores voice tutoring session data';
COMMENT ON FUNCTION get_user_conversations IS 'Helper function to get user conversations with stats';
COMMENT ON FUNCTION get_conversation_messages IS 'Helper function to get messages for a conversation';
COMMENT ON FUNCTION cleanup_old_conversations IS 'Cleanup function for old conversations';