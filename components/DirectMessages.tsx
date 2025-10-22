import React, { useState, useEffect, useRef } from 'react';
import { apiGetConversationSummaries, apiGetMessages, apiSendDirectMessage, getCurrentUser, apiGetMessagableUsers, apiStartConversation } from '../services/api';
import { Conversation, Message, Teacher, UserRole } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import SkeletonLoader from './SkeletonLoader';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { USER_ROLES } from '../utils/constants';

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
);

const NewMessageModal = ({ isOpen, onClose, currentUser, onStartConversation }) => {
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !currentUser) return;
        const fetchRecipients = async () => {
            setLoading(true);
            try {
                const users = await apiGetMessagableUsers(currentUser);
                setRecipients(users);
            } catch (error) {
                console.error("Failed to fetch recipients:", error);
            }
            setLoading(false);
        };
        fetchRecipients();
    }, [isOpen, currentUser]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="New Message">
            <div className="p-6">
                <h3 className="font-semibold">Select a recipient</h3>
                {loading ? <div className="text-center p-4"><SpinnerIcon className="w-6 h-6 animate-spin mx-auto"/></div> : (
                    <div className="space-y-2 max-h-96 overflow-y-auto mt-4">
                        {recipients.length === 0 && <p className="text-gray-500">No users available to message.</p>}
                        {recipients.map(user => (
                            <button key={user.id} onClick={() => onStartConversation(user.id)} className="w-full text-left p-3 rounded hover:bg-gray-100 transition-colors">
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.role}</p>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </Modal>
    );
};


const DirectMessages = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isNewMessageModalOpen, setNewMessageModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const init = async () => {
        setLoadingConvos(true);
        const user = await getCurrentUser();
        setCurrentUser(user);
        if (user) {
            const userRole = (user && 'role' in user) ? (user as Teacher).role : USER_ROLES.PARENT as UserRole;
            const convos = await apiGetConversationSummaries(user.id, userRole);
            setConversations(convos);
        }
        setLoadingConvos(false);
    };

    useEffect(() => {
        init();
    }, []);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSelectConversation = async (convo: Conversation) => {
        setSelectedConversation(convo);
        setLoadingMessages(true);
        const msgs = await apiGetMessages(convo.id);
        setMessages(msgs);
        setLoadingMessages(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation || !currentUser) return;
        
        const tempId = `msg_${Date.now()}`;
        const messageData: Message = {
            id: tempId,
            conversationId: selectedConversation.id,
            senderId: currentUser.id,
            recipientId: selectedConversation.otherParticipant.id,
            content: newMessage,
            timestamp: new Date().toISOString(),
            isRead: false,
        };

        // Optimistic update
        setMessages(prev => [...prev, messageData]);
        setNewMessage('');
        
        await apiSendDirectMessage(messageData);
        // Refresh conversations to show updated last message
        await init();
    };

    const handleStartNewConversation = async (recipientId: string) => {
        const convo = await apiStartConversation(currentUser.id, recipientId);
        await init(); // Refresh convo list
        setNewMessageModalOpen(false);
        // Find the full conversation object to select it
        const fullConvo = await apiGetConversationSummaries(currentUser.id, currentUser.role);
        const newConvo = fullConvo.find(c => c.id === convo.id);
        if (newConvo) {
            handleSelectConversation(newConvo);
        }
    };

    return (
        <>
        <div className="card flex overflow-hidden" style={{ height: 'calc(100vh - 250px)'}}>
            {/* Conversation List */}
            <div className={`w-full md:w-1/3 border-r flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="font-semibold">Conversations</h2>
                    <button onClick={() => setNewMessageModalOpen(true)} className="btn btn-secondary btn-sm p-2"><PlusIcon className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loadingConvos ? (
                         [...Array(5)].map((_, i) => <ConversationSkeleton key={i} />)
                    ) : (
                        conversations.map(convo => (
                            <button key={convo.id} onClick={() => handleSelectConversation(convo)} className={`w-full text-left p-4 border-b hover:bg-gray-50 ${selectedConversation?.id === convo.id ? 'bg-indigo-50' : ''}`}>
                                <div className="flex justify-between">
                                    <span className="font-bold">{convo.otherParticipant.name}</span>
                                    <span className="text-xs text-gray-500">{timeSince(convo.lastMessage.timestamp)}</span>
                                </div>
                                <p className="text-sm text-gray-600 truncate">{convo.lastMessage.content}</p>
                            </button>
                        ))
                    )}
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
                            {loadingMessages ? <div className="text-center p-8"><SpinnerIcon className="w-6 h-6 animate-spin mx-auto"/></div> :
                                messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-lg max-w-[80%] ${msg.senderId === currentUser.id ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</p>
                                        </div>
                                    </div>
                                ))
                            }
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
                    <div className="flex items-center justify-center h-full text-gray-500 p-4 text-center">
                        <p>Select a conversation or start a new one to begin messaging.</p>
                    </div>
                )}
            </div>
        </div>
        {isNewMessageModalOpen && 
            <NewMessageModal 
                isOpen={isNewMessageModalOpen}
                onClose={() => setNewMessageModalOpen(false)}
                currentUser={currentUser}
                onStartConversation={handleStartNewConversation}
            />
        }
        </>
    );
};

export default DirectMessages;