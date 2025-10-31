import React, { useState, useEffect, useRef } from 'react';
import { useAI } from '../hooks/useAI';
import SpinnerIcon from './icons/SpinnerIcon';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import { apiGetStudents, apiGetScores, apiGetSubjects, apiGetTeachers, apiGetTimetableData, apiGetAttendance, apiGetInvoices, apiGetSchoolSettings, apiGetActivityLog } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { buildQuestionFocusContext } from '../services/aiQuestionContext';
import HtmlContent from './HtmlContent';
import { getBananaImageService } from '../services/bananaImageService';
import { getConversationService } from '../services/conversationService';
import { searchSimulations } from '../services/aiSimulations';
import Modal from './Modal';

interface ChatbotPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: string;
    demoUserId?: string;
    activeView: string;
    title?: string;
}

const ChatbotPanel = ({ isOpen, onClose, userRole, demoUserId, activeView, title }: ChatbotPanelProps) => {
    const [messages, setMessages] = useState<{ id: string; sender: string; text: string; imageUrl?: string; metadata?: Record<string, any> }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [performanceContext, setPerformanceContext] = useState('');
    const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; message: string; }[]>([]);
    const [dashboardContext, setDashboardContext] = useState('');
    
    const { user, role } = useAuth();
    
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
    const [conversationId, setConversationId] = useState(() => {
        try {
            const existing = localStorage.getItem('chatpanel_conversation_id');
            if (existing) return existing;
            const id = `chat-${Date.now()}`;
            localStorage.setItem('chatpanel_conversation_id', id);
            return id;
        } catch { return `chat-${Date.now()}`; }
    });

    // Simulation modal state
    const [isSimModalOpen, setIsSimModalOpen] = useState(false);
    const [simModalTitle, setSimModalTitle] = useState('');
    const [simModalUrl, setSimModalUrl] = useState('');

    const [simModal, setSimModal] = useState<{ url: string; title: string } | null>(null);

    // Ensure we have a real server-side conversation ID when online
    const ensureServerConversation = async () => {
        try {
            const svc = getConversationService();
            // Quick heuristic: if id starts with 'chat-' assume not server ID
            const looksLocal = typeof conversationId === 'string' && conversationId.startsWith('chat-');
            if (!looksLocal) {
                return conversationId;
            }
            // Create a new conversation with current user
            const uid = (user as any)?.id || 'anonymous';
            const created = await svc.createConversation({
                userId: uid,
                title: title && title.trim().length ? title : 'Chatbot',
                type: 'text_chat',
                metadata: { source: 'chatbot_panel', userRole, activeView }
            });
            localStorage.setItem('chatpanel_conversation_id', created.id);
            setConversationId(created.id);
            return created.id;
        } catch (e) {
            logger.warn('Failed to ensure server conversation; continuing locally');
            return conversationId;
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!isOpen) return;
        
        const fetchContext = async () => {
            try {
                // Handle Student/Parent context (existing logic)
                if ((userRole === 'Student' || userRole === 'Parent') && demoUserId) {
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
                }
                
                // Handle Teacher context (new logic)
                else if (userRole === 'Teacher' && user) {
                    const teacher = user as any; // Teacher type from auth context
                    const [students, subjects, timetableData] = await Promise.all([
                        apiGetStudents(),
                        apiGetSubjects(),
                        apiGetTimetableData()
                    ]);
                    
                    // Get students from teacher's assigned class
                    const classStudents = students.filter(s => s.class === teacher.classTeacherOf);
                    
                    // Get students from subjects the teacher teaches (from timetable)
                    const teacherSubjects = timetableData.filter(t => t.teacherId === teacher.id);
                    const teacherSubjectIds = [...new Set(teacherSubjects.map(t => t.subjectId))];
                    const subjectStudents = students.filter(s => 
                        teacherSubjects.some(ts => ts.class === s.class)
                    );
                    
                    // Combine and deduplicate students
                    const allTeacherStudents = [...new Map(
                        [...classStudents, ...subjectStudents].map(s => [s.id, s])
                    ).values()];
                    
                    if (allTeacherStudents.length > 0) {
                        // Get scores for all teacher's students
                        const studentIds = allTeacherStudents.map(s => s.id);
                        const scores = await apiGetScores({ studentIds });
                        
                        // Build subject map
                        const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
                        
                        // Group scores by class and subject
                        const classPerformance = {};
                        allTeacherStudents.forEach(student => {
                            if (!classPerformance[student.class]) {
                                classPerformance[student.class] = {
                                    studentCount: 0,
                                    subjects: {}
                                };
                            }
                            classPerformance[student.class].studentCount++;
                        });
                        
                        scores.forEach(score => {
                            const student = allTeacherStudents.find(s => s.id === score.studentId);
                            if (!student) return;
                            
                            const subjectName = subjectMap.get(score.subjectId) || 'Unknown Subject';
                            const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                            
                            if (!classPerformance[student.class].subjects[subjectName]) {
                                classPerformance[student.class].subjects[subjectName] = {
                                    scores: [],
                                    average: 0
                                };
                            }
                            
                            classPerformance[student.class].subjects[subjectName].scores.push(total);
                        });
                        
                        // Calculate averages
                        Object.keys(classPerformance).forEach(className => {
                            Object.keys(classPerformance[className].subjects).forEach(subjectName => {
                                const subjectScores = classPerformance[className].subjects[subjectName].scores;
                                const average = subjectScores.length > 0 
                                    ? subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length 
                                    : 0;
                                classPerformance[className].subjects[subjectName].average = Math.round(average * 100) / 100;
                            });
                        });
                        
                        const subjectNames: string = teacherSubjectIds
                            .map((id: any) => subjectMap.get(id) ?? '')
                            .filter((s: string) => s.length > 0)
                            .join(', ');
                        const contextString = `Teacher: ${teacher.name}, Class Teacher of: ${teacher.classTeacherOf || 'None'}, Teaching subjects: ${subjectNames}. Class performance overview: ${JSON.stringify(classPerformance, null, 2)}`;
                        setPerformanceContext(contextString);
                    }
                }

                // Build general dashboard overview ONLY for Admin/Super Admin
                if (userRole === 'Admin' || userRole === 'Super Admin') {
                    try {
                        const [settings, students, attendance, scores, invoices, activities] = await Promise.all([
                            apiGetSchoolSettings(),
                            apiGetStudents(),
                            apiGetAttendance(),
                            apiGetScores(),
                            apiGetInvoices(),
                            apiGetActivityLog(),
                        ]);

                        const currentTerm = (settings as any)?.currentTerm || settings?.term || 'Current Term';
                        const currentSession = (settings as any)?.currentSession || settings?.session || '';
                        const label = [currentSession, currentTerm].filter(Boolean).join(' • ');

                        // Total students and recent adds
                        const totalStudents = Array.isArray(students) ? students.length : 0;
                        const cutoff = new Date();
                        cutoff.setDate(cutoff.getDate() - 30);
                        const recentActivities = (activities || []).filter(a => new Date(a.timestamp).getTime() >= cutoff.getTime());
                        const adds = recentActivities.filter(a => typeof a.type === 'string' && a.type.startsWith('STUDENT_ADD')).length;
                        const deletes = recentActivities.filter(a => typeof a.type === 'string' && a.type.startsWith('STUDENT_DELETE')).length;
                        const studentsDelta = adds - deletes;

                        // Attendance percentage (present or late)
                        const todayStr = new Date().toDateString();
                        const todayRecords = (attendance || []).filter(rec => new Date(rec.date).toDateString() === todayStr);
                        let presentUnits = 0;
                        let totalUnits = 0;
                        todayRecords.forEach(rec => {
                            const statuses = rec.statuses || {};
                            Object.keys(statuses).forEach(id => {
                                const s = statuses[id];
                                presentUnits += s === 'present' ? 1 : (s === 'late' ? 0.5 : 0);
                                totalUnits += 1;
                            });
                        });
                        const todayAttendancePct = totalUnits > 0 ? +(100 * (presentUnits / totalUnits)).toFixed(1) : 0;

                        // Current term average (normalized)
                        const maxCa1 = settings?.maxCa1 ?? 0;
                        const maxCa2 = settings?.maxCa2 ?? 0;
                        const maxExam = settings?.maxExam ?? 0;
                        const maxTotal = (maxCa1 + maxCa2 + maxExam) || 100;
                        const termScores = (scores || []).filter(s => (!s.term || !currentTerm ? true : s.term === currentTerm) && (!s.session || !currentSession ? true : s.session === currentSession));
                        let normalizedSum = 0;
                        termScores.forEach(s => {
                            const total = (s?.ca1 || 0) + (s?.ca2 || 0) + (s?.exam || 0);
                            normalizedSum += 100 * (total / maxTotal);
                        });
                        const termAveragePct = termScores.length > 0 ? +(normalizedSum / termScores.length).toFixed(1) : 0;

                        // Outstanding fees for current session/term
                        const filteredInvoices = (invoices || []).filter(inv => {
                            if (inv.session && currentSession && inv.session !== currentSession) return false;
                            if (inv.term && currentTerm && inv.term !== currentTerm) return false;
                            return true;
                        });
                        const outstandingFees = filteredInvoices.reduce((sum, i) => {
                            const totalAmt = (i.totalAmount ?? i.amount ?? 0);
                            const paidAmt = (i.amountPaid ?? 0);
                            const balance = (i.balanceRemaining ?? Math.max(0, totalAmt - paidAmt));
                            return sum + balance;
                        }, 0);

                        const overview = {
                            label,
                            totals: { totalStudents, studentsDelta },
                            attendance: { todayAttendancePct },
                            academics: { termAveragePct },
                            finance: { outstandingFees }
                        };
                        setDashboardContext(`Dashboard Overview (${label}): ${JSON.stringify(overview)}`);
                    } catch (e) {
                        // Non-fatal: dashboard context is optional
                        logger.captureError(e as unknown, 'Failed to build dashboard overview context');
                    }
                } else {
                    // Ensure non-admin roles do not carry school-wide dashboard context
                    setDashboardContext('');
                }
            } catch (error) {
                logger.captureError(error as unknown, 'Failed to build chatbot context');
            }
        };
        
        fetchContext();
    }, [isOpen, demoUserId, userRole, user, activeView]);

    // Unified send logic so chips can submit directly
    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage = { id: `user_${Date.now()}`, sender: 'user', text };
        const tryParse = (s: any) => {
            if (!s || typeof s !== 'string') return undefined;
            const idx = s.indexOf('{');
            if (idx >= 0) {
                try { return JSON.parse(s.slice(idx)); } catch { return undefined; }
            }
            return undefined;
        };

        const baseContext = { 
            userRole, 
            userName: (user && (user as any).name) || undefined,
            activeView,
            history: [...messages, userMessage],
            performanceContext: (userRole === 'Student' || userRole === 'Parent' || userRole === 'Teacher') ? performanceContext : undefined,
            dashboardContext: (userRole === 'Admin' || userRole === 'Super Admin') ? (dashboardContext || undefined) : undefined
        };

        // Build query-aware focus context based on current role and available local context
        const focusContext = buildQuestionFocusContext(
            input,
            userRole,
            baseContext.dashboardContext || '',
            baseContext.performanceContext || ''
        );

const context = { ...baseContext, questionFocusContext: focusContext };
        const userProfile = { userRole, activeView, performanceContext: baseContext.performanceContext, userName: baseContext.userName };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const aiMessageId = `ai_${Date.now()}`;
        setMessages(prev => [...prev, { id: aiMessageId, sender: 'ai', text: '' }]);

        try {
            const contextString = JSON.stringify(context);
await generateResponseStream({
                prompt: text,
                context: contextString,
                conversationId,
                userProfile,
                responseMimeType: 'text/html',
                conversationHistory: [...messages, userMessage].map(m => ({
                    role: m.sender === 'ai' ? 'assistant' : 'user',
                    content: m.text
                })),
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

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const current = input;
        setInput('');
        await sendMessage(current);
    };

    const resolvedTitle = (() => {
        if (title && title.trim().length > 0) return title;
        switch (userRole) {
            case 'Parent':
                return "Parent's Coach";
            case 'Student':
                return 'Student Assistant';
            case 'Teacher':
                return 'Teacher Assistant';
            case 'Admin':
                return 'Admin Assistant';
            case 'Super Admin':
                return 'Platform Assistant';
            case 'Bursar':
                return 'Finance Assistant';
            default:
                return 'AI Assistant';
        }
    })();
    
    return (
        <div className={`relative z-[60] w-[90vw] sm:w-96 md:w-[32rem] max-w-[95vw] h-[65vh] sm:h-[70vh] max-h-[80vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            {/* Notification container */}
            <div className="absolute -top-20 right-0 z-[70] space-y-2">
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
            
            <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                <h3 className="font-semibold">{resolvedTitle}</h3>
                <div className="text-xs text-gray-500 flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    {status === 'gemini' ? 'Online' : 'Offline'}
                </div>
            </header>
            <main className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4">
                 {messages.map((msg, i) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0"><SparklesIcon className="w-5 h-5" /></div>}
                        <div className={`max-w-[80%] p-3 rounded-2xl ${msg.sender === 'ai' ? 'bg-gray-100 rounded-bl-lg' : 'bg-indigo-500 text-white rounded-br-lg'}`}>
                            {msg.metadata?.simulation ? (
                                <div className="space-y-2">
                                    {msg.metadata.simulation.image_url && (
                                        <img src={msg.metadata.simulation.image_url} alt={msg.metadata.simulation.title} className="rounded-lg max-w-full h-auto" />
                                    )}
                                    <div className="text-sm">
                                        <div className="font-semibold">{msg.metadata.simulation.title}</div>
                                        <div className="text-gray-600">{msg.metadata.simulation.description}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-secondary" onClick={() => {
                                            setSimModalTitle(msg.metadata!.simulation.title);
                                            setSimModalUrl(msg.metadata!.simulation.url);
                                            setIsSimModalOpen(true);
                                        }}>Open Simulation</button>
                                        <a href={msg.metadata.simulation.url} target="_blank" rel="noreferrer" className="btn">Open in new tab</a>
                                    </div>
                                </div>
                            ) : msg.imageUrl ? (
                                <div className="space-y-2">
                                    <img src={msg.imageUrl} alt="Generated" className="rounded-lg max-w-full h-auto" />
                                    {msg.text && (
                                        <div className="text-xs text-gray-600">
                                            <HtmlContent html={msg.text} />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-sm whitespace-pre-wrap break-words prose prose-sm max-w-none" aria-live={msg.sender === 'ai' ? 'polite' : undefined}>
                                    {msg.sender === 'ai' && !msg.text && isLoading ? (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <SpinnerIcon className="w-4 h-4 animate-spin" />
                                            <span>Thinking…</span>
                                        </div>
                                    ) : msg.sender === 'ai' ? (
                                        <HtmlContent html={msg.text} aria-live={msg.sender === 'ai' ? 'polite' : undefined} />
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            )}
                        </div>
                        {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><UserCircleIcon className="w-6 h-6" /></div>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t space-y-3 bg-white flex-shrink-0">
                {/* Role-based sample prompts */}
                <div className="text-xs text-gray-500">Try these:</div>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pr-1">
                    {([ 
                        ...(userRole === 'Admin' || userRole === 'Super Admin' ? [
                            'What are this term’s attendance trends?',
                            'Show outstanding fees by class.',
                            'Summarize school-wide academic performance.',
                            'List top 5 subjects needing improvement.'
                        ] : []),
                        ...(userRole === 'Teacher' ? [
                            'How are my students doing in Mathematics this term?',
                            'Which assignments need grading?',
                            'Generate feedback for class 9A.',
                            'Suggest interventions for low performers.'
                        ] : []),
                        ...(userRole === 'Parent' ? [
                            'How is my child’s attendance this month?',
                            'Show recent test scores.',
                            'What areas should my child focus on?',
                            'Upcoming events for my child’s class?'
                        ] : []),
                        ...(userRole === 'Student' ? [
                            'Help me plan study schedule for exams.',
                            'Show my recent scores and weak topics.',
                            'What assignments are due next?',
                            'Explain algebra topics I’m struggling with.'
                        ] : []),
                        ...(userRole === 'Bursar' ? [
                            'What are current outstanding fees and collection rate?',
                            'List overdue invoices.',
                            'Show payments received in the last 7 days.',
                            'Which classes have highest fee balances?'
                        ] : [])
                    ] as string[]).map((prompt, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className="px-2 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 whitespace-nowrap"
                            onClick={() => { setInput(prompt); sendMessage(prompt); }}
                            aria-label={`Use sample prompt: ${prompt}`}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSend} className="flex items-start">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        className="input-field flex-1 h-24 resize-y"
                        placeholder="Type your question or paste multiple paragraphs..."
                        rows={5}
                    />
                    <div className="flex flex-col ml-2 gap-2">
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>Send</button>
                        <button type="button" className="btn btn-secondary" disabled={isLoading || !input.trim()} onClick={async () => {
                            const prompt = input.trim();
                            if (!prompt) return;
                            setInput('');
                            // Add user message
                            const userMsgId = `user_${Date.now()}`;
                            const userMessage = { id: userMsgId, sender: 'user', text: prompt, metadata: { intent: 'image_generation' } };
                            setMessages(prev => [...prev, userMessage]);

                            // Placeholder AI message while generating
                            const aiMsgId = `ai_${Date.now()}`;
                            setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: 'Generating image…' }]);

                            try {
                                const convId = await ensureServerConversation();
                                const imageSvc = getBananaImageService();
                                const result = await imageSvc.generateImage(prompt, { size: '512x512' });
                                // Update message with image
                                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `Prompt: ${prompt}`, imageUrl: result.imageUrl, metadata: { provider: result.provider, model: result.model } } : m));
                                // Persist messages to history
                                try {
                                    const hist = getConversationService();
                                    await hist.addMessage({ conversationId: convId, role: 'user', content: prompt, source: 'templates', metadata: { intent: 'image_generation' } });
                                    await hist.addMessage({ conversationId: convId, role: 'assistant', content: `Image generated for: ${prompt}`, source: result.provider === 'banana' ? 'huggingface' : 'huggingface', metadata: { imageUrl: result.imageUrl, model: result.model, provider: result.provider } });
                                } catch (persistErr) {
                                    logger.warn('Failed to persist image messages', { error: (persistErr as any)?.message });
                                }
                            } catch (genErr) {
                                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `Sorry, could not generate image: ${(genErr as any)?.message || 'Unknown error'}` } : m));
                            }
                        }}>Generate Image</button>
                        <button type="button" className="btn" disabled={isLoading || !input.trim()} onClick={async () => {
                            const query = input.trim();
                            if (!query) return;
                            setInput('');
                            const userMsgId = `user_${Date.now()}`;
                            const userMessage = { id: userMsgId, sender: 'user', text: query, metadata: { intent: 'simulation_search' } };
                            setMessages(prev => [...prev, userMessage]);
                            const aiMsgId = `ai_${Date.now()}`;
                            setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: 'Searching for an interactive simulation…' }]);
                            try {
                                const convId = await ensureServerConversation();
                                const results = await searchSimulations(query, { limit: 1 });
                                if (results.length === 0) {
                                    setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: 'No relevant simulation found.' } : m));
                                    return;
                                }
                                const sim = results[0];
                                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: '', metadata: { simulation: sim } } : m));
                                try {
                                    const hist = getConversationService();
                                    await hist.addMessage({ conversationId: convId, role: 'user', content: query, source: 'templates', metadata: { intent: 'simulation_search' } });
                                    await hist.addMessage({ conversationId: convId, role: 'assistant', content: `Recommended simulation: ${sim.title}`, source: 'knowledge_base', metadata: { simulation: sim } });
                                } catch (persistErr) {
                                    logger.warn('Failed to persist simulation messages', { error: (persistErr as any)?.message });
                                }
                            } catch (err) {
                                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: `Search error: ${(err as any)?.message || 'Unknown error'}` } : m));
                            }
                        }}>Find Simulation</button>
                    </div>
                </form>
            </footer>
            <Modal isOpen={isSimModalOpen} onClose={() => setIsSimModalOpen(false)} title={simModalTitle} size="full">
                <div className="p-4">
                    {simModalUrl ? (
                        <iframe src={simModalUrl} className="w-full h-[70vh] rounded-xl border-0" title={simModalTitle} />
                    ) : (
                        <div className="text-gray-600">No simulation URL available.</div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ChatbotPanel;