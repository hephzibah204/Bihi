import React, { useState, useEffect, useRef, FC } from 'react';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getFallbackParentChatResponse } from '../services/fallbackAiService';
import WifiSlashIcon from './icons/WifiSlashIcon';
import { apiGetStudents, apiGetScores, apiGetSubjects, apiGetSchoolSettings } from '../services/api';

interface ParentAIChatProps {
    demoUserId: string;
}

const ParentAIChat: FC<ParentAIChatProps> = ({ demoUserId }) => {
    const [messages, setMessages] = useState<{sender: string, text: string}[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        if (!demoUserId) return;

        const buildContext = async () => {
            setLoading(true);
            try {
                const [students, scores, subjects, settings] = await Promise.all([
                    apiGetStudents(),
                    apiGetScores(),
                    apiGetSubjects(),
                    apiGetSchoolSettings()
                ]);

                const student = students.find(s => s.id === demoUserId);
                if (!student) {
                    setContext("Error: Could not find student data.");
                    return;
                }

                const studentScores = scores.filter(s => s.studentId === student.id && s.session === settings.session && s.term === settings.term);
                const performanceSummary = studentScores.map(score => {
                    const subject = subjects.find(sub => sub.id === score.subjectId);
                    const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                    return `${subject?.name || 'A subject'}: ${total}/100`;
                }).join(', ');
                
                const initialMessage = `Hello! I'm your AI assistant. I'm ready to discuss ${student.name}'s performance for the current term. How can I help you today?`;
                setMessages([{ sender: 'ai', text: initialMessage }]);

                setContext(`
                    You are a helpful, empathetic, and professional AI assistant for a parent in a Nigerian school.
                    Your goal is to help the parent understand their child's academic performance and provide constructive advice.
                    
                    Child's Name: ${student.name}
                    Child's Class: ${student.class}
                    Current Term Performance Summary: ${performanceSummary || 'No scores recorded for this term yet.'}

                    When answering, be encouraging. If performance is low, suggest supportive actions the parent can take, like creating a study schedule, talking to the teacher, or focusing on specific areas. Do not give medical or psychological advice. Keep answers concise.
                `);
            } catch (err) {
                console.error("Failed to build AI context:", err);
                setMessages([{ sender: 'ai', text: "I'm sorry, I couldn't load your child's data. Please try again later." }]);
            } finally {
                setLoading(false);
            }
        };

        buildContext();
    }, [demoUserId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input;
        if (!textToSend.trim()) return;

        const userMessage = { sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMessage]);
        if (!messageText) setInput('');
        setLoading(true);

        if (!isOnline) {
            const fallbackResponse = getFallbackParentChatResponse(textToSend);
            setTimeout(() => {
                setMessages(prev => [...prev, { sender: 'ai', text: fallbackResponse }]);
                setLoading(false);
            }, 500);
            return;
        }

        if (!context) {
            setMessages(prev => [...prev, { sender: 'ai', text: "I'm sorry, I don't have the context for your child's performance yet. Please wait a moment." }]);
            setLoading(false);
            return;
        }

        try {
            const prompt = `${context}\n\nParent's question: "${textToSend}"\n\nYour response:`;
            const aiResponse = await generateText(prompt);
            setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'ai', text: getFallbackParentChatResponse(textToSend) }]);
        } finally {
            setLoading(false);
        }
    };

    const quickPrompts = [
        "How is my child performing overall?",
        "Which subjects are they strongest in?",
        "What can I do to help them improve?",
    ];

    return (
        <div className="card h-[70vh] flex flex-col">
            <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-2 text-indigo-500"/>
                    Parent AI Assistant
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
                    {messages.length <= 1 && !loading && context && (
                         <div className="pt-4 space-y-2">
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400">Try asking one of these:</p>
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
                        placeholder="Ask about your child's performance..."
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && !loading && handleSend()}
                        disabled={loading || !context}
                    />
                    <button onClick={() => handleSend()} className="btn btn-primary" disabled={loading || !context}>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ParentAIChat;