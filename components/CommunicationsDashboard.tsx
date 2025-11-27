import React, { useState, useEffect, PropsWithChildren } from 'react';
import { apiGetStudents, apiGetSubjects, apiSendMessage, apiGetMessageTemplates, apiGetInvoices } from '../services/api';
import { Student, MessageTemplate, Invoice } from '../types';
// import AIAnnouncementGenerator from '../AIAnnouncementGenerator'; // Temporarily commented out
import MessageTemplates from './MessageTemplates';
import AutomatedReminders from './AutomatedReminders';
import ScheduledCampaigns from './ScheduledCampaigns';
import CommunicationHistory from './CommunicationHistory';
import DirectMessages from './DirectMessages';
import SetupPromptModal from './SetupPromptModal';
import { ADMIN_VIEWS, USER_ROLES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import SpinnerIcon from './icons/SpinnerIcon';

const CommunicationsDashboard = ({ setActiveView }) => {
    const [activeTab, setActiveTab] = useState('compose');
    const [setupModalInfo, setSetupModalInfo] = useState({ isOpen: false, serviceName: '' });
    const [sharedMessage, setSharedMessage] = useState('');

    const TabButton = ({ view, children }: PropsWithChildren<{ view: string }>) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-3 py-2 text-sm font-medium rounded-md ${activeTab === view ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
        >
            {children}
        </button>
    );

    const goToSettings = () => {
        setSetupModalInfo({ isOpen: false, serviceName: '' });
        setActiveView(ADMIN_VIEWS.SETTINGS);
    };

    const handleUseMessage = (message: string) => {
        setSharedMessage(message);
        setActiveTab('compose');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'compose': return <ComposeAnnouncement setSetupModalInfo={setSetupModalInfo} sharedMessage={sharedMessage} setSharedMessage={setSharedMessage} />;
            case 'ai-generator': return <div className="p-4 text-center text-gray-500">AI Generator temporarily unavailable</div>;
            case 'templates': return <MessageTemplates />;
            case 'reminders': return <AutomatedReminders />;
            case 'campaigns': return <ScheduledCampaigns />;
            case 'history': return <CommunicationHistory />;
            case 'dms': return <DirectMessages />;
            default: return <ComposeAnnouncement setSetupModalInfo={setSetupModalInfo} sharedMessage={sharedMessage} setSharedMessage={setSharedMessage} />;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 border-b pb-2">
                <TabButton view="compose">Compose Announcement</TabButton>
                <TabButton view="ai-generator">AI Generator</TabButton>
                <TabButton view="templates">Templates</TabButton>
                <TabButton view="reminders">Automated Reminders</TabButton>
                <TabButton view="campaigns">Scheduled Campaigns</TabButton>
                <TabButton view="history">Sent History</TabButton>
                <TabButton view="dms">Direct Messages</TabButton>
            </div>
            {renderContent()}
            <SetupPromptModal
                isOpen={setupModalInfo.isOpen}
                onClose={() => setSetupModalInfo({ isOpen: false, serviceName: '' })}
                serviceName={setupModalInfo.serviceName}
                onGoToSettings={goToSettings}
            />
        </div>
    );
};


const ComposeAnnouncement = ({ setSetupModalInfo, sharedMessage, setSharedMessage }) => {
    const { role, isSmsConfigured } = useAuth();
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('all');
    const [classes, setClasses] = useState<string[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [sending, setSending] = useState(false);
    const [channel, setChannel] = useState<'sms' | 'email'>('sms');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [personalize, setPersonalize] = useState(false);
    const [previewStudentId, setPreviewStudentId] = useState<string>('');

    useEffect(() => {
        const fetchData = async () => {
            const [subjectsData, studentsData, templatesData, invoicesData] = await Promise.all([apiGetSubjects(), apiGetStudents(), apiGetMessageTemplates(), apiGetInvoices()]);
            const allClasses = [...new Set<string>(subjectsData.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            setStudents(studentsData);
            setTemplates(templatesData);
            setInvoices(invoicesData);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (sharedMessage) {
            setMessage(sharedMessage);
            setSharedMessage(''); // Clear after use
        }
    }, [sharedMessage, setSharedMessage]);

    const handleUseTemplate = (templateId: string) => {
        if (!templateId) {
            setMessage('');
            return;
        }
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setMessage(template.content);
        }
    };

    const computeOutstanding = (studentId: string) => {
        const invs = invoices.filter(i => i.studentId === studentId);
        const total = invs.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
        const paid = invs.reduce((sum, i) => sum + (i.amountPaid || 0), 0);
        return Math.max(0, total - paid);
    };

    const applyTemplateForStudent = (tmpl: string, student: Student) => {
        const outstanding = computeOutstanding(student.id);
        return tmpl
            .replace(/\{\{\s*student_name\s*\}\}/gi, student.name || '')
            .replace(/\{\{\s*class\s*\}\}/gi, student.class || '')
            .replace(/\{\{\s*admission_no\s*\}\}/gi, student.admissionNo || '')
            .replace(/\{\{\s*outstanding\s*\}\}/gi, `₦${outstanding.toLocaleString()}`);
    };

    const handleSend = async () => {
        if (channel === 'sms' && !isSmsConfigured) {
            if (role === USER_ROLES.ADMIN) {
                setSetupModalInfo({ isOpen: true, serviceName: 'SMS Gateway' });
            } else {
                window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: "SMS is not configured. Please contact your administrator." } }));
            }
            return;
        }

        setSending(true);
        try {
            const studentsInScope = target === 'all' ? students : students.filter(s => s.class === target);
            if (personalize) {
                // Send individualized messages with template substitution per student
                let sent = 0;
                for (const s of studentsInScope) {
                    const recipient = channel === 'sms' ? s.parentId : s.parentEmail;
                    if (!recipient) continue;
                    const content = applyTemplateForStudent(message, s);
                    await apiSendMessage({ channel, content, recipients: [recipient] });
                    sent++;
                }
                window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `Personalized messages sent to ${sent} recipients.` } }));
            } else {
                // Broadcast one message without per-student substitution
                const recipients = [...new Set<string>(studentsInScope.map(s => channel === 'sms' ? s.parentId : s.parentEmail).filter(Boolean))];
                await apiSendMessage({ channel, content: message, recipients });
                window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: `Message sent to ${recipients.length} recipients.` } }));
            }
            setMessage('');
        } catch (error) {
             window.dispatchEvent(new CustomEvent('show-global-error', { detail: { message: `Error sending message: ${error.message}` } }));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6 space-y-4">
                <div>
                    <span id="channel-label" className="label">Channel</span>
                    <div role="group" aria-labelledby="channel-label" className="flex gap-4 p-1 bg-gray-100 rounded-lg">
                        <button onClick={() => setChannel('sms')} className={`flex-1 p-2 rounded-md font-semibold text-sm ${channel === 'sms' ? 'bg-white shadow' : ''}`}>SMS</button>
                        <button onClick={() => setChannel('email')} className={`flex-1 p-2 rounded-md font-semibold text-sm ${channel === 'email' ? 'bg-white shadow' : ''}`}>Email</button>
                    </div>
                </div>
                <div>
                    <label className="label" htmlFor="template-select">Use Template</label>
                    <select id="template-select" onChange={e => handleUseTemplate(e.target.value)} className="input-field">
                        <option value="">-- Start from scratch --</option>
                        {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                    </select>
                </div>
                <div>
                    <label className="label" htmlFor="compose-message">Message</label>
                    <textarea id="compose-message" value={message} onChange={e => setMessage(e.target.value)} rows={5} className="input-field"></textarea>
                    <div className="text-xs text-gray-500 mt-2">
                        Available variables: <code>{`{{student_name}}`}</code>, <code>{`{{class}}`}</code>, <code>{`{{admission_no}}`}</code>, <code>{`{{outstanding}}`}</code>
                    </div>
                </div>
                <div>
                    <label className="label" htmlFor="sendto-select">Send To</label>
                    <select id="sendto-select" value={target} onChange={e => setTarget(e.target.value)} className="input-field">
                        <option value="all">All Parents</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={personalize} onChange={e => setPersonalize(e.target.checked)} /> Personalize per student
                    </label>
                    <select value={previewStudentId} onChange={e => setPreviewStudentId(e.target.value)} className="input-field text-sm max-w-xs">
                        <option value="">Preview with...</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                    </select>
                </div>
                {previewStudentId && (
                    <div className="card mt-2">
                        <div className="p-3">
                            <div className="text-xs font-semibold text-gray-500">Preview</div>
                            <p className="text-sm mt-1">
                                {(() => {
                                    const s = students.find(stu => stu.id === previewStudentId);
                                    return s ? applyTemplateForStudent(message, s) : message;
                                })()}
                            </p>
                        </div>
                    </div>
                )}
                <div className="text-right">
                    <button onClick={handleSend} disabled={sending || !message} className="btn btn-primary">
                        {sending ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : null}
                        {sending ? 'Sending...' : 'Send Announcement'}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default CommunicationsDashboard;