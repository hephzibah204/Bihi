import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SpinnerIcon from './icons/SpinnerIcon';

let ai;
if (process.env.API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.warn("API_KEY not set, AI Chatbot will be disabled.");
}

const ChatbotPanel = ({ isOpen, onClose }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<{ text: string; sender: 'ai' | 'user' }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chat && ai) {
            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are a friendly and knowledgeable assistant for 'ReportSheet', a school management application. Your goal is to help teachers and administrators with their tasks. You can answer questions about how to use the app (e.g., adding students, generating reports, entering scores), provide tips on managing student data, and help draft communications. Keep your answers concise, helpful, and easy to understand.`,
                },
            });
            setChat(newChat);
            setMessages([{ text: "Hello! I'm your AI assistant for ReportSheet. How can I help you today?", sender: 'ai' }]);
        }
    }, [isOpen, chat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (prompt?: string) => {
        const messageToSend = prompt || input;
        if (!messageToSend.trim() || !chat || loading) return;

        const userMessage = { text: messageToSend, sender: 'user' as const };
        setMessages(prev => [...prev, userMessage]);
        if (!prompt) setInput('');
        setLoading(true);

        try {
            const response = await chat.sendMessage({ message: messageToSend });
            setMessages(prev => [...prev, { text: response.text, sender: 'ai' }]);
        } catch (error) {
            console.error("Chatbot error:", error);
            setMessages(prev => [...prev, { text: "Sorry, I encountered an error. Please try again.", sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };
    
    const quickPrompts = [
        "How do I add a new student?",
        "Help me write a report card comment.",
        "How does the promotion feature work?",
    ];

    if (!isOpen) return null;
    
    if (!ai) {
         return (
            <div className="absolute bottom-20 right-0 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col">
                <header className="p-4 bg-red-600 text-white rounded-t-lg flex justify-between items-center">
                    <h3 className="font-semibold">ReportSheet Assistant</h3>
                </header>
                <div className="flex-1 p-4 flex items-center justify-center text-center">
                    <p className="text-gray-600 dark:text-gray-400">AI Assistant is unavailable. The API key is not configured.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute bottom-20 right-0 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col">
            <header className="p-4 bg-indigo-600 text-white rounded-t-lg flex justify-between items-center">
                <h3 className="font-semibold">ReportSheet Assistant</h3>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-500 text-white'}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                        {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="w-5 h-5"/></div>}
                    </div>
                ))}
                {loading && (
                     <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>
                        <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <SpinnerIcon className="w-5 h-5 animate-spin text-indigo-500" />
                        </div>
                    </div>
                )}
                {messages.length <= 1 && !loading && (
                    <div className="pt-4 space-y-2">
                        {quickPrompts.map(prompt => (
                            <button key={prompt} onClick={() => handleSend(prompt)} className="w-full text-left text-sm p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-2 border-t dark:border-gray-700">
                <div className="flex items-center">
                    <input
                        type="text"
                        className="input-field !rounded-r-none"
                        placeholder="Ask a question..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleSend()}
                        disabled={loading}
                    />
                    <button onClick={() => handleSend()} className="btn btn-primary !rounded-l-none" disabled={loading}>
                        Send
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default ChatbotPanel;