import React, { useState, useEffect, useRef, FC } from 'react';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';

const AIAcademicTutor: FC = () => {
    const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        setMessages([
            { sender: 'ai', text: "Hello! I'm your AI Academic Tutor. How can I help you learn today?" }
        ]);
    }, []);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const prompt = `You are a friendly and helpful AI Academic Tutor for a Nigerian secondary school student. Keep your explanations clear, concise, and encouraging.
            
            Student's question: "${input}"
            
            Your response:`;

            const aiResponse = await generateText(prompt);
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        } catch (error) {
            console.error("Error sending message to AI Tutor:", error);
            const errorMessage = { text: "I seem to be having trouble connecting. Please try again in a moment.", sender: 'ai' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card h-[70vh] flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-2 text-indigo-500"/>
                    AI Academic Tutor
                </h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
                            <div className={`max-w-md p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-gray-100 dark:bg-gray-700' : 'bg-indigo-500 text-white'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="w-5 h-5"/></div>}
                        </div>
                    ))}
                    {loading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>
                            <div className="max-w-md p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                                <p className="text-sm animate-pulse">Thinking...</p>
                            </div>
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
                        placeholder="Ask a question..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && !loading && handleSend()}
                        disabled={loading}
                    />
                    <button onClick={handleSend} className="btn btn-primary" disabled={loading}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAcademicTutor;