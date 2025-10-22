// services/voiceSessionService.ts
// Service for persisting voice tutoring sessions to database

import { createClient } from '@supabase/supabase-js';

export interface VoiceTranscript {
    sender: 'user' | 'ai';
    text: string;
    isFinal: boolean;
    timestamp?: string;
}

export interface VoiceSession {
    id: string;
    user_id: string;
    conversation_id?: string;
    session_type: 'gemini_live' | 'web_speech_fallback';
    transcripts: VoiceTranscript[];
    duration_seconds: number;
    fallback_used: boolean;
    fallback_reason?: string;
    metadata?: Record<string, any>;
    created_at: string;
    ended_at?: string;
}

export interface CreateVoiceSessionParams {
    userId: string;
    conversationId?: string;
    sessionType: 'gemini_live' | 'web_speech_fallback';
    fallbackUsed?: boolean;
    fallbackReason?: string;
    metadata?: Record<string, any>;
}

export interface UpdateVoiceSessionParams {
    transcripts?: VoiceTranscript[];
    durationSeconds?: number;
    endedAt?: string;
    metadata?: Record<string, any>;
}

export class VoiceSessionService {
    private supabase: ReturnType<typeof createClient>;

    constructor(supabaseUrl?: string, supabaseKey?: string) {
        const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const key = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        
        if (!url || !key) {
            throw new Error('Supabase credentials not provided');
        }

        this.supabase = createClient(url, key);
    }

    /**
     * Create a new voice session
     */
    async createSession(params: CreateVoiceSessionParams): Promise<VoiceSession> {
        try {
            const { data, error } = await this.supabase
                .from('voice_sessions')
                .insert({
                    user_id: params.userId,
                    conversation_id: params.conversationId || null,
                    session_type: params.sessionType,
                    transcripts: [],
                    duration_seconds: 0,
                    fallback_used: params.fallbackUsed || false,
                    fallback_reason: params.fallbackReason || null,
                    metadata: params.metadata || {}
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to create voice session:', error);
            throw new Error('Could not create voice session');
        }
    }

    /**
     * Update voice session with transcripts and duration
     */
    async updateSession(
        sessionId: string,
        updates: UpdateVoiceSessionParams
    ): Promise<VoiceSession> {
        try {
            const updateData: any = {};

            if (updates.transcripts !== undefined) {
                updateData.transcripts = updates.transcripts;
            }
            if (updates.durationSeconds !== undefined) {
                updateData.duration_seconds = updates.durationSeconds;
            }
            if (updates.endedAt !== undefined) {
                updateData.ended_at = updates.endedAt;
            }
            if (updates.metadata !== undefined) {
                updateData.metadata = updates.metadata;
            }

            const { data, error } = await this.supabase
                .from('voice_sessions')
                .update(updateData)
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Failed to update voice session:', error);
            throw new Error('Could not update voice session');
        }
    }

    /**
     * End a voice session (sets ended_at timestamp)
     */
    async endSession(
        sessionId: string,
        finalTranscripts: VoiceTranscript[],
        durationSeconds: number
    ): Promise<VoiceSession> {
        return this.updateSession(sessionId, {
            transcripts: finalTranscripts,
            durationSeconds,
            endedAt: new Date().toISOString()
        });
    }

    /**
     * Get a specific voice session
     */
    async getSession(sessionId: string): Promise<VoiceSession | null> {
        try {
            const { data, error } = await this.supabase
                .from('voice_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Failed to get voice session:', error);
            throw new Error('Could not retrieve voice session');
        }
    }

    /**
     * List user's voice sessions
     */
    async listSessions(
        userId: string,
        options: { limit?: number; offset?: number } = {}
    ): Promise<VoiceSession[]> {
        try {
            let query = this.supabase
                .from('voice_sessions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (options.limit) {
                query = query.limit(options.limit);
            }
            if (options.offset) {
                query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Failed to list voice sessions:', error);
            throw new Error('Could not list voice sessions');
        }
    }

    /**
     * Get sessions for a specific conversation
     */
    async getSessionsForConversation(conversationId: string): Promise<VoiceSession[]> {
        try {
            const { data, error } = await this.supabase
                .from('voice_sessions')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Failed to get sessions for conversation:', error);
            throw new Error('Could not retrieve conversation sessions');
        }
    }

    /**
     * Delete a voice session
     */
    async deleteSession(sessionId: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('voice_sessions')
                .delete()
                .eq('id', sessionId);

            if (error) throw error;
        } catch (error) {
            console.error('Failed to delete voice session:', error);
            throw new Error('Could not delete voice session');
        }
    }

    /**
     * Get session statistics for user
     */
    async getUserStats(userId: string): Promise<{
        totalSessions: number;
        totalDuration: number;
        geminiSessions: number;
        fallbackSessions: number;
    }> {
        try {
            const { data, error } = await this.supabase
                .from('voice_sessions')
                .select('session_type, duration_seconds, fallback_used')
                .eq('user_id', userId);

            if (error) throw error;

            const stats = {
                totalSessions: data?.length || 0,
                totalDuration: 0,
                geminiSessions: 0,
                fallbackSessions: 0
            };

            if (data) {
                data.forEach(session => {
                    stats.totalDuration += session.duration_seconds || 0;
                    if (session.session_type === 'gemini_live' && !session.fallback_used) {
                        stats.geminiSessions++;
                    } else {
                        stats.fallbackSessions++;
                    }
                });
            }

            return stats;
        } catch (error) {
            console.error('Failed to get user stats:', error);
            throw new Error('Could not retrieve user statistics');
        }
    }

    /**
     * Convert transcripts to conversation messages format
     */
    transcriptsToMessages(transcripts: VoiceTranscript[]): Array<{
        role: 'user' | 'assistant';
        content: string;
    }> {
        return transcripts
            .filter(t => t.isFinal)
            .map(t => ({
                role: t.sender === 'user' ? 'user' : 'assistant',
                content: t.text
            }));
    }

    /**
     * Save transcripts to linked conversation (if exists)
     */
    async syncToConversation(sessionId: string): Promise<boolean> {
        try {
            const session = await this.getSession(sessionId);
            if (!session || !session.conversation_id) {
                return false;
            }

            // Import conversation service dynamically to avoid circular dependency
            const { getConversationService } = await import('./conversationService');
            const conversationService = getConversationService();

            const messages = this.transcriptsToMessages(session.transcripts);

            for (const message of messages) {
                await conversationService.addMessage({
                    conversationId: session.conversation_id,
                    role: message.role,
                    content: message.content,
                    source: session.session_type === 'gemini_live' ? 'gemini' : 'fallback',
                    isFallback: session.fallback_used,
                    metadata: { voiceSessionId: sessionId }
                });
            }

            return true;
        } catch (error) {
            console.error('Failed to sync to conversation:', error);
            return false;
        }
    }
}

// Singleton instance
let voiceSessionServiceInstance: VoiceSessionService | null = null;

export function getVoiceSessionService(): VoiceSessionService {
    if (!voiceSessionServiceInstance) {
        voiceSessionServiceInstance = new VoiceSessionService();
    }
    return voiceSessionServiceInstance;
}

export function initVoiceSessionService(
    supabaseUrl: string,
    supabaseKey: string
): VoiceSessionService {
    voiceSessionServiceInstance = new VoiceSessionService(supabaseUrl, supabaseKey);
    return voiceSessionServiceInstance;
}
