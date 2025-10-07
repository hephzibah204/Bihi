
import React, { useState, useRef, useEffect } from 'react';
import SpinnerIcon from './icons/SpinnerIcon';
import { generateText } from '../services/geminiService';
import { getFallbackChatResponse, getFallbackParentChatResponse } from '../services/fallbackAiService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { USER_ROLES } from '../utils/constants';

interface ChatbotPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: string;
    demoUserId?: string;
}

const ChatbotPanel: React.FC<ChatbotPanelProps> = ({ isOpen, onClose, userRole }) => {
    const [messages, setMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
     useEffect(() => {
        if (isOpen) {
             let welcomeMessage = "Hello! How can I help you today?";
             if(userRole === USER_ROLES.STUDENT) welcomeMessage = "Hello! I'm your AI academic tutor. Ask me anything about your schoolwork.";
             if(userRole === USER_ROLES.PARENT) welcomeMessage = "Hello! I'm your AI parent assistant. How can I help you understand your child's progress today?";
            // Fix: Use `as const` to prevent TypeScript from widening the literal 'ai' to a generic string, ensuring type compatibility with the state.
            setMessages([{ sender: 'ai' as const, text: welcomeMessage }]);
        } else {
            setMessages([]);
        }
    }, [isOpen, userRole]);

    const handleSend = async () => {
        if (!input.trim()) return;

        // Fix: Use `as const` on the sender property to maintain its literal type ('user'), satisfying the state's stricter type requirements.
        const newMessages = [...messages, { sender: 'user' as const, text: input }];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);

        try {
            let aiResponse;
            if (isOnline) {
                const prompt = `User Role: ${userRole}. User Query: "${input}"`;
                aiResponse = await generateText(prompt);
            } else {
                 if (userRole === USER_ROLES.PARENT) {
                    aiResponse = getFallbackParentChatResponse(input);
                 } else {
                    aiResponse = getFallbackChatResponse(input);
                 }
            }
            // Fix: Use `as const` on the sender property to maintain its literal type ('ai'), ensuring the new message object conforms to the state's type.
            setMessages([...newMessages, { sender: 'ai' as const, text: aiResponse }]);
        } catch (error) {
            // Fix: Use `as const` for the sender property to ensure the error message object matches the required state type.
            setMessages([...newMessages, { sender: 'ai' as const, text: `Sorry, an error occurred: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`fixed bottom-40 md:bottom-24 right-4 w-[calc(100vw-2rem)] max-w-sm h-[60vh] bg-white rounded-lg shadow-xl flex flex-col transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <header className="p-4 border-b flex justify-between items-center">
                <h2 className="font-semibold">AI Assistant</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">&times;</button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-indigo-500 text-white' : 'bg-gray-200'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
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
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} className="btn btn-primary ml-2" disabled={isLoading}>Send</button>
                </div>
            </footer>
        </div>
    );
};

export default ChatbotPanel;