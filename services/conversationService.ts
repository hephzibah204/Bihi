// services/conversationService.ts
// Conversation and message management for AI chat history

import { getSupabase } from './supabaseClient';

// ============================================================================
// Types
// ============================================================================

export type ConversationType = 'text_chat' | 'voice_tutor' | 'parent_chat';
export type MessageRole = 'user' | 'assistant' | 'system';
export type MessageSource = 'gemini' | 'semantic-cache' | 'huggingface' | 'templates' | 'fallback';

export interface Conversation {
    id: string;
    user_id: string;
    title: string;
    type: ConversationType;
    metadata?: Record<string, any>;
    created_at: string;
    updated_at: string;
    last_message_at: string;
}

export interface ConversationWithStats extends Conversation {
    message_count: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    role: MessageRole;
    content: string;
    source: MessageSource;
    is_fallback: boolean;
    metadata?: Record<string, any>;
    created_at: string;
}

export interface CreateConversationParams {
    userId: string;
    title?: string;
    type?: ConversationType;
    metadata?: Record<string, any>;
}

export interface CreateMessageParams {
    conversationId: string;
    role: MessageRole;
    content: string;
    source?: MessageSource;
    isFallback?: boolean;
    metadata?: Record<string, any>;
}

export interface ConversationListOptions {
    limit?: number;
    offset?: number;
    type?: ConversationType;
}

// ============================================================================
// Service Class
// ============================================================================

export class ConversationService {
    private supabase: any;

    constructor() {
        this.supabase = getSupabase();
    }

    // ========================================================================
    // Conversation Operations
    // ========================================================================

    /**
     * Create a new conversation
     */
    async createConversation(params: CreateConversationParams): Promise<Conversation> {
        try {
            const { data, error } = await this.supabase
                .from('ai_conversations')
                .insert({
                    user_id: params.userId,
                    title: params.title || 'New Conversation',
                    type: params.type || 'text_chat',
                    metadata: params.metadata || {}
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            throw new Error('Could not create conversation');
        }
    }

    /**
     * Get a specific conversation by ID
     */
    async getConversation(conversationId: string): Promise<Conversation | null> {
        try {
            const { data, error } = await this.supabase
                .from('ai_conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Failed to get conversation:', error);
            throw new Error('Could not retrieve conversation');
        }
    }

    /**
     * List conversations for a user with stats
     */
    async listConversations(
        userId: string,
        options: ConversationListOptions = {}
    ): Promise<ConversationWithStats[]> {
        try {
            const { data, error } = await this.supabase
                .rpc('get_user_conversations', {
                    p_user_id: userId,
                    p_limit: options.limit || 20,
                    p_offset: options.offset || 0
                });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Failed to list conversations:', error);
            throw new Error('Could not list conversations');
        }
    }

    /**
     * Update conversation metadata or title
     */
    async updateConversation(
        conversationId: string,
        updates: Partial<Pick<Conversation, 'title' | 'metadata'>>
    ): Promise<Conversation> {
        try {
            const { data, error } = await this.supabase
                .from('ai_conversations')
                .update(updates)
                .eq('id', conversationId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to update conversation:', error);
            throw new Error('Could not update conversation');
        }
    }

    /**
     * Delete a conversation (cascades to messages)
     */
    async deleteConversation(conversationId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('ai_conversations')
                .delete()
                .eq('id', conversationId);

            if (error) throw error;
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            throw new Error('Could not delete conversation');
        }
    }

    // ========================================================================
    // Message Operations
    // ========================================================================

    /**
     * Add a message to a conversation
     */
    async addMessage(params: CreateMessageParams): Promise<Message> {
        try {
            const { data, error } = await this.supabase
                .from('ai_messages')
                .insert({
                    conversation_id: params.conversationId,
                    role: params.role,
                    content: params.content,
                    source: params.source || 'gemini',
                    is_fallback: params.isFallback || false,
                    metadata: params.metadata || {}
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to add message:', error);
            throw new Error('Could not add message');
        }
    }

    /**
     * Get all messages for a conversation
     */
    async getMessages(conversationId: string): Promise<Message[]> {
        try {
            const { data, error } = await this.supabase
                .rpc('get_conversation_messages', {
                    p_conversation_id: conversationId
                });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Failed to get messages:', error);
            throw new Error('Could not retrieve messages');
        }
    }

    /**
     * Get recent messages (for context window)
     */
    async getRecentMessages(
        conversationId: string,
        limit: number = 20
    ): Promise<Message[]> {
        try {
            const { data, error } = await this.supabase
                .from('ai_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            
            // Reverse to get chronological order
            return (data || []).reverse();
        } catch (error) {
            console.error('Failed to get recent messages:', error);
            throw new Error('Could not retrieve recent messages');
        }
    }

    /**
     * Delete a specific message
     */
    async deleteMessage(messageId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('ai_messages')
                .delete()
                .eq('id', messageId);

            if (error) throw error;
        } catch (error) {
            console.error('Failed to delete message:', error);
            throw new Error('Could not delete message');
        }
    }

    // ========================================================================
    // Conversation + Message Combos
    // ========================================================================

    /**
     * Create conversation and add first message
     */
    async startConversation(
        params: CreateConversationParams & { initialMessage?: string }
    ): Promise<{ conversation: Conversation; message?: Message }> {
        try {
            // Create conversation
            const conversation = await this.createConversation(params);

            // Add initial message if provided
            let message: Message | undefined;
            if (params.initialMessage) {
                message = await this.addMessage({
                    conversationId: conversation.id,
                    role: 'user',
                    content: params.initialMessage
                });
            }

            return { conversation, message };
        } catch (error) {
            console.error('Failed to start conversation:', error);
            throw new Error('Could not start conversation');
        }
    }

    /**
     * Get conversation with all messages
     */
    async getConversationWithMessages(
        conversationId: string
    ): Promise<{ conversation: Conversation; messages: Message[] } | null> {
        try {
            const [conversation, messages] = await Promise.all([
                this.getConversation(conversationId),
                this.getMessages(conversationId)
            ]);

            if (!conversation) return null;

            return { conversation, messages };
        } catch (error) {
            console.error('Failed to get conversation with messages:', error);
            throw new Error('Could not retrieve conversation data');
        }
    }

    // ========================================================================
    // Conversation History for AI Context
    // ========================================================================

    /**
     * Format messages for AI context (Gemini format)
     */
    formatForGeminiContext(messages: Message[]): Array<{ role: string; parts: Array<{ text: string }> }> {
        return messages
            .filter(m => m.role !== 'system')
            .map(message => ({
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: message.content }]
            }));
    }

    /**
     * Format messages for OpenAI-style context
     */
    formatForOpenAIContext(messages: Message[]): Array<{ role: string; content: string }> {
        return messages.map(message => ({
            role: message.role,
            content: message.content
        }));
    }

    /**
     * Get context-ready messages (recent N messages)
     */
    async getContextMessages(
        conversationId: string,
        maxMessages: number = 20
    ): Promise<Message[]> {
        return this.getRecentMessages(conversationId, maxMessages);
    }

    // ========================================================================
    // Search and Stats
    // ========================================================================

    /**
     * Search conversations by title
     */
    async searchConversations(userId: string, query: string): Promise<ConversationWithStats[]> {
        try {
            const { data, error } = await this.supabase
                .from('ai_conversations')
                .select(`
                    *,
                    message_count:ai_messages(count)
                `)
                .eq('user_id', userId)
                .ilike('title', `%${query}%`)
                .order('last_message_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            return (data || []).map(conv => ({
                ...conv,
                message_count: conv.message_count?.[0]?.count || 0
            }));
        } catch (error) {
            console.error('Failed to search conversations:', error);
            throw new Error('Could not search conversations');
        }
    }

    /**
     * Get user conversation statistics
     */
    async getUserStats(userId: string): Promise<{
        totalConversations: number;
        totalMessages: number;
        conversationsByType: Record<ConversationType, number>;
    }> {
        try {
            const { data: conversations, error: convError } = await this.supabase
                .from('ai_conversations')
                .select('type')
                .eq('user_id', userId);

            if (convError) throw convError;

            const { count: messageCount, error: msgError } = await this.supabase
                .from('ai_messages')
                .select('*', { count: 'exact', head: true })
                .in(
                    'conversation_id',
                    conversations?.map(c => c.id) || []
                );

            if (msgError) throw msgError;

            const conversationsByType = (conversations || []).reduce(
                (acc, conv) => {
                    acc[conv.type] = (acc[conv.type] || 0) + 1;
                    return acc;
                },
                {} as Record<ConversationType, number>
            );

            return {
                totalConversations: conversations?.length || 0,
                totalMessages: messageCount || 0,
                conversationsByType
            };
        } catch (error) {
            console.error('Failed to get user stats:', error);
            throw new Error('Could not retrieve user statistics');
        }
    }
}

// ============================================================================
// Singleton Instance (optional)
// ============================================================================

let conversationServiceInstance: ConversationService | null = null;

export function getConversationService(): ConversationService {
    if (!conversationServiceInstance) {
        conversationServiceInstance = new ConversationService();
    }
    return conversationServiceInstance;
}

export function initConversationService(): ConversationService {
    conversationServiceInstance = new ConversationService();
    return conversationServiceInstance;
}
