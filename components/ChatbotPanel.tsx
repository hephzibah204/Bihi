

import React, { useState, useRef, useEffect } from 'react';
import SpinnerIcon from './icons/SpinnerIcon';
import { USER_ROLES } from '../utils/constants';
import { apiGetStudents, apiGetScores, apiGetSubjects, apiGetSchoolSettings } from '../services/api';
import { useAI } from '../hooks/useAI';

interface ChatbotPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: string;
    demoUserId?: string;
    activeView: string;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ isOpen, onClose, userRole, demoUserId, activeView }) => {
    const [messages, setMessages] = useState<{ sender: 'user' | 'ai' | 'system', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isContextLoading, setIsContextLoading] = useState(false);
    const [sessionContext, setSessionContext] = useState<any>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const { generateResponse, status, statusChange, clearStatusChange } = useAI();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!isOpen) {
            setMessages([]);
            setSessionContext({});
            return;
        }

        const initializeChat = async () => {
            setIsContextLoading(true);
            let welcomeMessage = "Hello! How can I help you navigate the app today?";
            const newSessionContext: any = { userRole, activeView };

            if ((userRole === USER_ROLES.PARENT || userRole === USER_ROLES.STUDENT) && demoUserId) {
                try {
                    const [students, scores, subjects, settings] = await Promise.all([
                        apiGetStudents(),
                        apiGetScores({ studentIds: [demoUserId] }),
                        apiGetSubjects(),
                        apiGetSchoolSettings()
                    ]);
                    const student = students.find(stud => stud.id === demoUserId);

                    if (student) {
                        newSessionContext.student = student;
                        newSessionContext.scores = scores;
                        newSessionContext.subjects = subjects;
                        newSessionContext.settings = settings;

                        const currentTermScores = scores.filter(s => s.studentId === student.id && s.session === settings.session && s.term === settings.term);
                        
                        if (userRole === USER_ROLES.PARENT) {
                             if (currentTermScores.length > 0) {
                                welcomeMessage = `Hello! I'm your AI parent assistant. How can I help you understand ${student.name.split(' ')[0]}'s progress today?`;
                            } else {
                                welcomeMessage = `Hello! I'm your AI parent assistant for ${student.name.split(' ')[0]}. No scores are recorded for this term yet, but I can still help you with other questions.`;
                            }
                        } else {
                             welcomeMessage = `Hello ${student.name.split(' ')[0]}! I'm your AI academic tutor. Ask me anything about your schoolwork or how to use your portal.`;
                        }
                    }
                } catch (e) {
                    console.error("Failed to fetch performance context", e);
                    welcomeMessage = "Hello! I can help you navigate the portal. Unfortunately, I couldn't load all data right now.";
                }
            }
            
            setSessionContext(newSessionContext);
            setMessages([{ sender: 'ai', text: welcomeMessage }]);
            setIsContextLoading(false);
        };

        initializeChat();
    }, [isOpen, userRole, demoUserId]);

    // Handle AI status change notifications
    useEffect(() => {
        if (statusChange) {
            let message = '';
            if (statusChange === 'to_fallback_network') {
                message = 'Connection lost. Using offline assistant. Responses may be limited.';
            } else if (statusChange === 'to_fallback_error') {
                message = 'Could not reach AI service. Switching to offline assistant.';
            } else if (statusChange === 'to_gemini') {
                message = 'Connection restored. You are now using the powerful Gemini AI assistant.';
            }
            if(message) {
                setMessages(prev => [...prev, { sender: 'system', text: message }]);
            }
            clearStatusChange();
        }
    }, [statusChange, clearStatusChange]);


    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const newMessages = [...messages, { sender: 'user' as const, text: input }];
        setMessages(newMessages);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        const context = {
            ...sessionContext,
            history: newMessages,
        };
        
        try {
            const aiResponse = await generateResponse({ prompt: currentInput, context });
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'ai', text: `Sorry, an error occurred: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed bottom-40 md:bottom-24 right-4 w-[calc(100vw-2rem)] max-w-sm h-[60vh] bg-white rounded-lg shadow-xl flex flex-col transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <header className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center">
                    <h2 className="font-semibold">AI Assistant</h2>
                    <span className={`ml-3 w-3 h-3 rounded-full ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`} title={status === 'gemini' ? 'Online' : 'Offline Mode'}></span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {isContextLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-gray-200"><SpinnerIcon className="w-5 h-5 animate-spin" /></div></div>}
                {messages.map((msg, index) => {
                    if (msg.sender === 'system') {
                        return <div key={index} className="text-center text-xs text-gray-500 py-2 font-semibold">{msg.text}</div>;
                    }
                    return (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                {isLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-gray-200"><SpinnerIcon className="w-5 h-5 animate-spin" /></div></div>}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t">
                <div className="flex">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask anything..."
                        className="input-field"
                        disabled={isLoading || isContextLoading}
                    />
                    <button onClick={handleSend} className="btn btn-primary ml-2" disabled={isLoading || isContextLoading}>Send</button>
                </div>
            </footer>
        </div>
    );
};

export default ChatbotPanel;
