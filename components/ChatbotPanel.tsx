import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getFallbackChatResponse, getFallbackTutorResponse, getFallbackParentChatResponse } from '../services/fallbackAiService';
import WifiSlashIcon from './icons/WifiSlashIcon';
import { apiGetStudents, apiGetScores, apiGetSubjects, apiGetSchoolSettings } from '../services/api';

// -----------------------------------------------------------------
// --- PASTE YOUR GEMINI API KEY HERE FOR THE CLIENT-SIDE CHATBOT ---
// WARNING: This is INSECURE for a public website. Your key will be
// visible to users. For production, use environment variables.
// -----------------------------------------------------------------
// Fix: Changed from const to let to avoid overly-strict type inference by TypeScript.
let CLIENT_SIDE_API_KEY = "AIzaSyA3EgWjAc2CPTIV_eEmmuzlh4W-sRYLdeA";

let ai;
let keyValidationError: string | null = null;

if (!CLIENT_SIDE_API_KEY || CLIENT_SIDE_API_KEY === "AIzaSyA3EgWjAc2CPTIV_eEmmuzlh4W-sRYLdeA" || CLIENT_SIDE_API_KEY === "AIzaSyA3EgWjAc2CPTIV_eEmmuzlh4W-sRYLdeA") {
  keyValidationError = "AI Assistant is unavailable. The Gemini API key has not been configured.";
} else if (CLIENT_SIDE_API_KEY.startsWith("ey")) {
  keyValidationError = "Invalid Gemini API key detected. It looks like a Supabase key. Please use a valid Gemini key in `components/ChatbotPanel.tsx`.";
} else {
  try {
    ai = new GoogleGenAI({ apiKey: CLIENT_SIDE_API_KEY });
  } catch (e) {
    keyValidationError = `Error initializing AI: ${e.message}`;
  }
}


const ChatbotPanel = ({ isOpen, onClose, userRole, demoUserId }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<{ text: string; sender: 'ai' | 'user' }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isOnline = useOnlineStatus();
    const [currentSystemInstruction, setCurrentSystemInstruction] = useState('');

    useEffect(() => {
        const initializeChatContext = async () => {
            if (!isOpen || !ai || chat) return; // Only initialize once when opened

            setLoading(true);
            let systemInstruction = '';
            let initialMessage = '';

            try {
                switch (userRole) {
                    case 'Student':
                        systemInstruction = `You are a friendly and helpful AI Academic Tutor for a Nigerian secondary school student. Your goal is to provide clear, concise, and encouraging explanations. After explaining a concept, suggest 1-2 relevant practice exercises.`;
                        initialMessage = "Hello! I'm your AI Academic Tutor. Ask me anything about your subjects.";
                        break;
                    
                    case 'Parent':
                        const [students, scores, subjects, settings] = await Promise.all([apiGetStudents(), apiGetScores(), apiGetSubjects(), apiGetSchoolSettings()]);
                        const student = students.find(s => s.id === demoUserId);
                        if (!student) throw new Error("Student data not found.");
                        const studentScores = scores.filter(s => s.studentId === student.id && s.session === settings.session && s.term === settings.term);
                        const performanceSummary = studentScores.map(score => {
                            const subject = subjects.find(sub => sub.id === score.subjectId);
                            const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                            return `${subject?.name || 'A subject'}: ${total}/100`;
                        }).join(', ');
                        
                        systemInstruction = `You are a helpful, empathetic, and professional AI assistant for a parent. You are discussing their child, ${student.name}, who is in class ${student.class}. Current Term Performance: ${performanceSummary || 'No scores yet.'}. Provide constructive advice and be encouraging.`;
                        initialMessage = `Hello! I'm your AI assistant, ready to discuss ${student.name}'s performance. How can I help?`;
                        break;
                        
                    default: // Admin, Teacher, Bursar
                        systemInstruction = `You are a friendly and knowledgeable assistant for 'ReportSheet', a school management application. Your goal is to help teachers and administrators with their tasks. You can answer questions about how to use the app, provide tips on managing student data, and help draft communications. Keep your answers concise and helpful.`;
                        initialMessage = "Hello! I'm your AI assistant for ReportSheet. How can I help you today?";
                }
                
                setCurrentSystemInstruction(systemInstruction);
                const newChat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
                setChat(newChat);
                setMessages([{ text: initialMessage, sender: 'ai' }]);

            } catch (err) {
                console.error("Failed to initialize chat context:", err);
                setMessages([{ text: "I'm sorry, I couldn't load the necessary context. My responses may be limited.", sender: 'ai' }]);
            } finally {
                setLoading(false);
            }
        };

        initializeChatContext();

        // Reset chat when panel is closed
        if (!isOpen) {
            setChat(null);
            setMessages([]);
        }
    }, [isOpen, userRole, demoUserId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (prompt?: string) => {
        const messageToSend = prompt || input;
        if (!messageToSend.trim() || loading) return;

        const userMessage = { text: messageToSend, sender: 'user' as const };
        setMessages(prev => [...prev, userMessage]);
        if (!prompt) setInput('');
        setLoading(true);

        const getFallbackResponse = () => {
            switch (userRole) {
                case 'Student': return getFallbackTutorResponse(messageToSend);
                case 'Parent': return getFallbackParentChatResponse(messageToSend);
                default: return getFallbackChatResponse(messageToSend);
            }
        };

        if (!isOnline || !chat) {
            setTimeout(() => {
                setMessages(prev => [...prev, { text: getFallbackResponse(), sender: 'ai' }]);
                setLoading(false);
            }, 500);
            return;
        }

        try {
            // Re-create chat if context is missing for some reason
            let currentChat = chat;
            if (!currentChat) {
                currentChat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: currentSystemInstruction } });
                setChat(currentChat);
            }

            const response = await currentChat.sendMessage({ message: messageToSend });
            setMessages(prev => [...prev, { text: response.text, sender: 'ai' }]);
        } catch (error) {
            console.error("Chatbot error:", error);
            let errorMessage = getFallbackResponse();
            if (error.message && (error.message.includes('API key not valid') || error.message.includes('invalid'))) {
                errorMessage = 'The Gemini API key is not valid. Please check the key in `components/ChatbotPanel.tsx`.';
            }
            setMessages(prev => [...prev, { text: errorMessage, sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };
    
    const quickPrompts = {
        Student: ["Explain photosynthesis", "What is an algebraic equation?", "Summarize the causes of World War 1"],
        Parent: ["How is my child performing overall?", "Which subjects are they strongest in?", "What can I do to help them improve?"],
        default: ["How do I add a new student?", "Help me write a report card comment.", "How does promotion work?"]
    };

    const currentPrompts = quickPrompts[userRole] || quickPrompts.default;

    if (!isOpen) return null;
    
    if (keyValidationError) {
         return (
            <div className="absolute bottom-20 right-0 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col">
                <header className="p-4 bg-red-600 text-white rounded-t-lg flex justify-between items-center">
                    <h3 className="font-semibold">AI Assistant Error</h3>
                </header>
                <div className="flex-1 p-4 flex items-center justify-center text-center">
                    <p className="text-gray-600 dark:text-gray-400">{keyValidationError}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute bottom-20 right-0 w-80 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col">
            <header className="p-4 bg-indigo-600 text-white rounded-t-lg flex justify-between items-center">
                <h3 className="font-semibold">AI Assistant</h3>
            </header>
             {!isOnline && (
                <div className="p-2 bg-yellow-100 text-yellow-800 text-xs text-center flex items-center justify-center">
                    <WifiSlashIcon className="w-4 h-4 mr-1" />
                    You are currently offline. Responses are limited.
                </div>
            )}
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
                        {currentPrompts.map(prompt => (
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