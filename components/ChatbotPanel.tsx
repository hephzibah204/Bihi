import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';
import SpinnerIcon from './icons/SpinnerIcon';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import { apiGetStudents, apiGetScores, apiGetSubjects } from '../services/api';
import { logger } from '../utils/logger';

const ChatbotPanel = ({ isOpen, onClose, userRole, demoUserId, activeView }) => {
    const [messages, setMessages] = useState<{ id: string; sender: string; text: string; }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [performanceContext, setPerformanceContext] = useState('');
    const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; message: string; }[]>([]);
    
    const handleNotification = (notification: { type: 'info' | 'warning' | 'error'; title: string; message: string }) => {
        const id = `notification_${Date.now()}`;
        setNotifications(prev => [...prev, { id, ...notification }]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };
    
    const { generateResponseStream, status } = useAI(handleNotification);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!isOpen || !demoUserId) return;
        const fetchContext = async () => {
            try {
                const students = await apiGetStudents();
                const student = students.find(s => s.id === demoUserId);
                if (!student) return;

                const [scores, subjects] = await Promise.all([
                    apiGetScores({ studentIds: [demoUserId] }),
                    apiGetSubjects()
                ]);
                
                const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
                const scoreSummary = scores.map(s => ({
                    subject: subjectMap.get(s.subjectId),
                    total: (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0),
                    term: `${s.term} ${s.session}`
                }));

                const contextString = `Current student: ${student.name}, Class: ${student.class}. Recent performance: ${JSON.stringify(scoreSummary, null, 2)}`;
                setPerformanceContext(contextString);
            } catch (error) {
                logger.captureError(error as unknown, 'Failed to build chatbot context');
            }
        };
        fetchContext();
    }, [isOpen, demoUserId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { id: `user_${Date.now()}`, sender: 'user', text: input };
        const context = { 
            userRole, 
            history: [...messages, userMessage],
            performanceContext: (userRole === 'Student' || userRole === 'Parent') ? performanceContext : undefined
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const aiMessageId = `ai_${Date.now()}`;
        setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);

        try {
            const contextString = JSON.stringify(context);
            await generateResponseStream({
                prompt: input,
                context: contextString,
                onChunk: (chunk) => {
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMessageId 
                            ? { ...msg, text: msg.text + chunk } 
                            : msg
                    ));
                }
            });
        } catch (error) {
            setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                    ? { ...msg, text: `Sorry, I ran into an error: ${error.message}` } 
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className={`fixed bottom-24 right-4 w-80 md:w-96 h-96 md:h-[500px] bg-white rounded-lg shadow-xl flex flex-col transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            {/* Notification container */}
            <div className="absolute -top-20 right-0 z-50 space-y-2">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`p-3 rounded-lg shadow-lg max-w-xs text-sm ${
                            notification.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
                            notification.type === 'warning' ? 'bg-yellow-100 border border-yellow-300 text-yellow-800' :
                            'bg-blue-100 border border-blue-300 text-blue-800'
                        }`}
                    >
                        <div className="font-semibold">{notification.title}</div>
                        <div>{notification.message}</div>
                    </div>
                ))}
            </div>
            
            <header className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">AI Assistant</h3>
                <div className="text-xs text-gray-500 flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {status === 'gemini' ? 'Online' : 'Offline'}
                </div>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                 {messages.map((msg, i) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0"><SparklesIcon className="w-5 h-5" /></div>}
                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'ai' ? 'bg-gray-100 rounded-bl-lg' : 'bg-indigo-500 text-white rounded-br-lg'}`}>
                            <p className="text-sm">
                                {msg.text}
                                {isLoading && msg.id === messages[messages.length - 1].id && msg.sender === 'ai' && <span className="inline-block w-2 h-4 bg-gray-600 animate-pulse ml-1"></span>}
                            </p>
                        </div>
                        {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><UserCircleIcon className="w-6 h-6" /></div>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t">
                <form onSubmit={handleSend} className="flex">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} className="input-field" placeholder="Ask anything..."/>
                    <button type="submit" className="btn btn-primary ml-2" disabled={isLoading}>Send</button>
                </form>
            </footer>
        </div>
    );
};

export default ChatbotPanel;