import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';
import SpinnerIcon from './icons/SpinnerIcon';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import { apiGetStudents, apiGetScores, apiGetSubjects } from '../services/api';

const ChatbotPanel = ({ isOpen, onClose, userRole, demoUserId, activeView }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { generateResponse, status } = useAI();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setMessages([{ sender: 'ai', text: `Hello! As your AI assistant, how can I help you today? I have context about the '${activeView}' page.` }]);
        }
    }, [isOpen, activeView]);
    
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        
        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Fetch relevant context based on user role
            let performanceContext = '';
            if (userRole === 'Parent' || userRole === 'Student') {
                const [students, scores, subjects] = await Promise.all([apiGetStudents(), apiGetScores(), apiGetSubjects()]);
                const student = students.find(s => s.id === demoUserId);
                if (student) {
                    const studentScores = scores.filter(s => s.studentId === demoUserId);
                    const scoreSummary = studentScores.map(score => {
                         const subject = subjects.find(s => s.id === score.subjectId);
                         const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                         return `- ${subject?.name}: ${total}%`;
                    }).join('\n');
                    performanceContext = `Student: ${student.name}\nClass: ${student.class}\nScores:\n${scoreSummary}`;
                }
            }

            const response = await generateResponse({ 
                prompt: input, 
                context: {
                    userRole,
                    activeView,
                    history: messages,
                    performanceContext: performanceContext || undefined
                } 
            });
            const aiMessage = { sender: 'ai', text: response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { sender: 'ai', text: `Sorry, I encountered an error: ${error.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-20 right-0 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col">
            <header className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">AI Assistant</h3>
                <button onClick={onClose}>&times;</button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                 {messages.map((msg, i) => (
                    <div key={i} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0"><SparklesIcon className="w-4 h-4"/></div>}
                        <div className={`max-w-[80%] p-2 rounded-lg text-sm ${msg.sender === 'ai' ? 'bg-gray-100' : 'bg-indigo-500 text-white'}`}>
                            {msg.text}
                        </div>
                         {msg.sender === 'user' && <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><UserCircleIcon className="w-5 h-5"/></div>}
                    </div>
                 ))}
                 {isLoading && <div className="flex justify-start"><SpinnerIcon className="w-5 h-5 animate-spin text-indigo-500" /></div>}
                 <div ref={messagesEndRef} />
            </main>
            <footer className="p-2 border-t">
                <form onSubmit={handleSendMessage} className="flex">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything..." className="input-field text-sm p-1.5" />
                    <button type="submit" className="btn btn-primary ml-2 text-sm p-1.5">Send</button>
                </form>
            </footer>
        </div>
    );
};
export default ChatbotPanel;
