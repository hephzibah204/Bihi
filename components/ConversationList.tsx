// components/ConversationList.tsx
// Display list of user's conversations with search and filtering

import React, { useState, useEffect } from 'react';

interface Conversation {
    id: string;
    title: string;
    type: 'text_chat' | 'voice_tutor' | 'parent_chat';
    message_count: number;
    last_message_at: string;
    created_at: string;
}

interface ConversationListProps {
    userId: string;
    authToken: string;
    onSelectConversation: (conversationId: string) => void;
    selectedConversationId?: string;
    filterType?: 'text_chat' | 'voice_tutor' | 'parent_chat' | 'all';
}

const ConversationList: React.FC<ConversationListProps> = ({
    userId,
    authToken,
    onSelectConversation,
    selectedConversationId,
    filterType = 'all'
}) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadConversations();
    }, [userId, filterType]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams({
                limit: '50',
                offset: '0'
            });

            if (filterType !== 'all') {
                queryParams.append('type', filterType);
            }

            const response = await fetch(
                `/api/conversations?${queryParams.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to load conversations');
            }

            const data = await response.json();
            setConversations(data.conversations || []);
        } catch (err: any) {
            setError(err.message);
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteConversation = async (conversationId: string) => {
        if (!confirm('Delete this conversation? This cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/conversations/${conversationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete conversation');
            }

            // Remove from local state
            setConversations(prev => prev.filter(c => c.id !== conversationId));
        } catch (err: any) {
            alert(`Error: ${err.message}`);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'text_chat':
                return '💬';
            case 'voice_tutor':
                return '🎙️';
            case 'parent_chat':
                return '👨‍👩‍👧';
            default:
                return '💭';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'text_chat':
                return 'Text Chat';
            case 'voice_tutor':
                return 'Voice Tutor';
            case 'parent_chat':
                return 'Parent Chat';
            default:
                return 'Chat';
        }
    };

    const filteredConversations = conversations.filter(conv =>
        searchQuery.trim() === '' || 
        conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">Error loading conversations</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                    onClick={loadConversations}
                    className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Search bar */}
            <div className="p-3 border-b">
                <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-lg font-medium">No conversations yet</p>
                        <p className="text-sm mt-1">Start chatting to see your history here</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredConversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                                    selectedConversationId === conv.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{getTypeIcon(conv.type)}</span>
                                            <h3 className="font-medium text-gray-900 truncate">
                                                {conv.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">
                                                {getTypeLabel(conv.type)}
                                            </span>
                                            <span>{conv.message_count} messages</span>
                                            <span>{formatDate(conv.last_message_at)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConversation(conv.id);
                                        }}
                                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete conversation"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Refresh button */}
            <div className="p-3 border-t">
                <button
                    onClick={loadConversations}
                    className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                    ↻ Refresh
                </button>
            </div>
        </div>
    );
};

export default ConversationList;
