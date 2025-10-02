import React, { useState, useEffect, useRef, FC } from 'react';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getFallbackTutorResponse } from '../services/fallbackAiService';
import WifiSlashIcon from './icons/WifiSlashIcon';


const AIAcademicTutor: FC = () => {
    const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showQuickPrompts, setShowQuickPrompts] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isOnline = useOnlineStatus();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, loading]);
    
    useEffect(() => {
        setMessages([
            { sender: 'ai', text: "Hello! I'm your AI Academic Tutor. Ask me anything about your subjects, and I'll do my best to help you understand." }
        ]);
    }, []);

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim()) return;

        setShowQuickPrompts(false);

        const userMessage = { sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMessage]);
        
        if (!messageText) {
            setInput('');
        }
        setLoading(true);

        if (!isOnline) {
            const fallbackResponse = getFallbackTutorResponse(textToSend);
            setTimeout(() => { // Simulate delay
                setMessages(prev => [...prev, { sender: 'ai', text: fallbackResponse }]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            const prompt = `You are a friendly and helpful AI Academic Tutor for a Nigerian secondary school student. Your goal is to provide clear, concise, and encouraging explanations.
            After explaining the concept, if applicable, suggest 1-2 relevant practice exercises or related concepts the student should review to solidify their understanding.
            
            Student's question: "${textToSend}"
            
            Your response:`;

            const aiResponse = await generateText(prompt);
            if (aiResponse.startsWith("Sorry,")) throw new Error(aiResponse);
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        } catch (error) {
            console.error("Error sending message to AI Tutor:", error);
            const errorMessage = { text: getFallbackTutorResponse(textToSend), sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    
    const quickPrompts = [
        "Explain photosynthesis",
        "What is an algebraic equation?",
        "Summarize the causes of World War 1"
    ];

    return (
        <div className="card h-[70vh] flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-2 text-indigo-500"/>
                    AI Academic Tutor
                </h2>
            </div>
            {!isOnline && (
                <div className="p-2 bg-yellow-100 text-yellow-800 text-xs text-center flex items-center justify-center">
                    <WifiSlashIcon className="w-4 h-4 mr-1" />
                    You are currently offline. Responses are limited.
                </div>
            )}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-500 text-white'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="w-5 h-5"/></div>}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>
                            <div className="max-w-md p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                                <SpinnerIcon className="w-5 h-5 animate-spin text-indigo-500" />
                            </div>
                        </div>
                    )}
                    {showQuickPrompts && !loading && (
                        <div className="pt-4 space-y-2">
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400">Or try one of these:</p>
                            {quickPrompts.map(prompt => (
                                <button key={prompt} onClick={() => handleSend(prompt)} className="w-full text-left text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t dark:border-gray-700">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        className="input-field flex-1" 
                        placeholder="Ask a question about your subjects..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && !loading && handleSend()}
                        disabled={loading}
                    />
                    <button onClick={() => handleSend()} className="btn btn-primary" disabled={loading}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAcademicTutor;
