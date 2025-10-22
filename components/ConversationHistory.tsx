// components/ConversationHistory.tsx
// Display and interact with conversation message history

import React, { useState, useEffect, useRef } from 'react';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    source: 'gemini' | 'semantic-cache' | 'huggingface' | 'templates' | 'fallback';
    is_fallback: boolean;
    created_at: string;
}

interface ConversationHistoryProps {
    conversationId: string;
    authToken: string;
    autoScroll?: boolean;
    showSourceBadge?: boolean;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
    conversationId,
    authToken,
    autoScroll = true,
    showSourceBadge = true
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (conversationId) {
            loadMessages();
        }
    }, [conversationId]);

    useEffect(() => {
        if (autoScroll && messages.length > 0) {
            scrollToBottom();
        }
    }, [messages, autoScroll]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(
                `/api/conversations/${conversationId}/messages`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const data = await response.json();
            setMessages(data.messages || []);
        } catch (err: any) {
            setError(err.message);
            console.error('Error loading messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getSourceBadge = (source: string, isFallback: boolean) => {
        if (!showSourceBadge) return null;

        const badges = {
            gemini: { label: 'Gemini', color: 'bg-blue-100 text-blue-800', icon: '✨' },
            'semantic-cache': { label: 'Cached', color: 'bg-purple-100 text-purple-800', icon: '⚡' },
            huggingface: { label: 'HuggingFace', color: 'bg-yellow-100 text-yellow-800', icon: '🤗' },
            templates: { label: 'Template', color: 'bg-gray-100 text-gray-800', icon: '📝' },
            fallback: { label: 'Fallback', color: 'bg-orange-100 text-orange-800', icon: '🔄' }
        };

        const badge = badges[source as keyof typeof badges] || badges.fallback;

        return (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded ${badge.color}`}>
                <span>{badge.icon}</span>
                <span>{badge.label}</span>
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading conversation...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
                    <p className="text-red-800 font-medium">Error loading messages</p>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                    <button
                        onClick={loadMessages}
                        className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-gray-500">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm mt-1">Start a conversation to see messages here</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                    const isUser = message.role === 'user';
                    const isSystem = message.role === 'system';

                    if (isSystem) {
                        return (
                            <div key={message.id} className="flex justify-center">
                                <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                                    {message.content}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                                    isUser
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                                <div className="whitespace-pre-wrap break-words">
                                    {message.content}
                                </div>
                                <div className={`flex items-center gap-2 mt-2 text-xs ${
                                    isUser ? 'text-indigo-200' : 'text-gray-500'
                                }`}>
                                    <span>{formatTime(message.created_at)}</span>
                                    {!isUser && getSourceBadge(message.source, message.is_fallback)}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default ConversationHistory;
