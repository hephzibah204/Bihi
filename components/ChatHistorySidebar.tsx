// components/ChatHistorySidebar.tsx
// Sidebar component for managing chat history with conversations list and viewer

import React, { useState } from 'react';
import ConversationList from './ConversationList';
import ConversationHistory from './ConversationHistory';

interface ChatHistorySidebarProps {
    userId: string;
    authToken: string;
    isOpen: boolean;
    onClose: () => void;
    onLoadConversation?: (conversationId: string) => void;
    filterType?: 'text_chat' | 'voice_tutor' | 'parent_chat' | 'all';
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    userId,
    authToken,
    isOpen,
    onClose,
    onLoadConversation,
    filterType = 'all'
}) => {
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'detail'>('list');

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversationId(conversationId);
        setView('detail');
    };

    const handleLoadConversation = () => {
        if (selectedConversationId && onLoadConversation) {
            onLoadConversation(selectedConversationId);
            onClose();
        }
    };

    const handleBack = () => {
        setView('list');
        setSelectedConversationId(null);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                role="button"
                tabIndex={0}
                aria-label="Close chat history"
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="flex items-center gap-3">
                        {view === 'detail' && (
                            <button
                                onClick={handleBack}
                                className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        )}
                        <div>
                            <h2 className="text-lg font-bold">
                                {view === 'list' ? 'Chat History' : 'Conversation'}
                            </h2>
                            {view === 'list' && (
                                <p className="text-xs text-indigo-100">Your conversation history</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 rounded-lg p-1 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {view === 'list' ? (
                        <ConversationList
                            userId={userId}
                            authToken={authToken}
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={selectedConversationId || undefined}
                            filterType={filterType}
                        />
                    ) : (
                        <>
                            {selectedConversationId ? (
                                <ConversationHistory
                                    conversationId={selectedConversationId}
                                    authToken={authToken}
                                    autoScroll={true}
                                    showSourceBadge={true}
                                />
                            ) : (
                                <div className="p-4 text-center text-gray-500">No conversation selected.</div>
                            )}
                            
                            {/* Action buttons when viewing conversation */}
                            {onLoadConversation && selectedConversationId && (
                                <div className="p-4 border-t bg-gray-50">
                                    <button
                                        onClick={handleLoadConversation}
                                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Continue this conversation
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer with stats */}
                {view === 'list' && (
                    <div className="p-3 border-t bg-gray-50 text-center text-xs text-gray-500">
                        💾 All conversations are saved automatically
                    </div>
                )}
            </div>
        </>
    );
};

export default ChatHistorySidebar;
