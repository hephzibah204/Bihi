import React, { useState, useEffect, useRef } from 'react';
import { apiGetConversationSummaries, apiGetMessages, apiSendMessage, getCurrentUser } from '../services/api';
import { Conversation, Message } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import SkeletonLoader from './SkeletonLoader';

const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 3600;
    if (interval > 24) return date.toLocaleDateString();
    if (interval > 1) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min ago";
    return "Just now";
};

const ConversationSkeleton = () => (
    <div className="w-full text-left p-4 border-b">
        <div className="flex justify-between">
            <SkeletonLoader className="h-5 w-32" />
            <SkeletonLoader className="h-4 w-16" />
        </div>
        <SkeletonLoader className="h-4 w-full mt-2" />
    </div>
)

const DirectMessages = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            const user = await getCurrentUser();
            setCurrentUser(user);
            if (user) {
                const convos = await apiGetConversationSummaries(user.id, user.role);
                setConversations(convos);
            }
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (!selectedConversation) return;
        
        const fetchMessages = async () => {
            const msgs = await apiGetMessages(selectedConversation.id);
            setMessages(msgs);
        };
        fetchMessages();

        const interval = setInterval(fetchMessages, 5000); // Poll for new messages
        return () => clearInterval(interval);

    }, [selectedConversation]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !currentUser) return;

        const messageData = {
            conversationId: selectedConversation.id,
            senderId: currentUser.id,
            recipientId: selectedConversation.otherParticipant.id,
            content: newMessage,
        };

        const sentMessage = await apiSendMessage(messageData);
        setMessages(prev => [...prev, sentMessage]);
        setNewMessage('');
    };
    
    if (loading) return (
        <div className="card flex overflow-hidden" style={{ height: 'calc(100vh - 250px)'}}>
            <div className="w-full md:w-1/3 border-r flex flex-col">
                <div className="p-4 border-b"><h2 className="font-semibold">Conversations</h2></div>
                <div className="flex-1 overflow-y-auto">
                    {[...Array(5)].map((_, i) => <ConversationSkeleton key={i} />)}
                </div>
            </div>
            <div className="w-full md:w-2/3 hidden md:flex items-center justify-center text-gray-500">
                <SpinnerIcon className="w-8 h-8 animate-spin"/>
            </div>
        </div>
    );

    if (!currentUser) return <div className="card p-6 text-center">Could not identify user. Messaging is unavailable.</div>;

    return (
        <div className="card flex overflow-hidden" style={{ height: 'calc(100vh - 250px)'}}>
            {/* Conversation List */}
            <div className={`w-full md:w-1/3 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                    <h2 className="font-semibold">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map(convo => (
                        <button key={convo.id} onClick={() => setSelectedConversation(convo)} className={`w-full text-left p-4 border-b hover:bg-gray-50 ${selectedConversation?.id === convo.id ? 'bg-gray-100' : ''}`}>
                            <div className="flex justify-between">
                                <span className="font-bold">{convo.otherParticipant.name}</span>
                                <span className="text-xs text-gray-500">{timeSince(convo.lastMessage.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{convo.lastMessage.content}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`w-full md:w-2/3 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center">
                             <button onClick={() => setSelectedConversation(null)} className="md:hidden mr-4">&larr;</button>
                            <h2 className="font-semibold">{selectedConversation.otherParticipant.name}</h2>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-lg max-w-[80%] ${msg.senderId === currentUser.id ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>
                                        <p className="text-sm">{msg.content}</p>
                                        <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</p>
                                    </div>
                                </div>
                            ))}
                             <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 border-t">
                            <form onSubmit={handleSendMessage} className="flex">
                                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} className="input-field" placeholder="Type a message..."/>
                                <button type="submit" className="btn btn-primary ml-2">Send</button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select a conversation to start messaging.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DirectMessages;
