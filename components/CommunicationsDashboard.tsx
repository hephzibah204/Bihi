
import React, { useState, useEffect, PropsWithChildren } from 'react';
import { apiGetAnnouncements, apiSendAnnouncement, apiGetSubjects } from '../services/api';
import { Subject } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';
import DirectMessages from './DirectMessages';

const CommunicationsDashboard = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [activeTab, setActiveTab] = useState('compose');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [recipients, setRecipients] = useState<string[]>(['all']);
    const [methods, setMethods] = useState({ portal: true, email: false });
    const [sending, setSending] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: string }>({ message: '', type: '' });
    
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [annData, subData] = await Promise.all([
                apiGetAnnouncements(),
                apiGetSubjects()
            ]);
            setAnnouncements(annData || []);
            setSubjects(subData || []);
            // Fix: Specify the generic type for `new Set` as `<string>` to prevent TypeScript from inferring `unknown[]` for `allClasses`.
            const allClasses = [...new Set<string>((subData || []).flatMap(s => s.classes))].sort();
            setClasses(allClasses);
        } catch (err) {
            console.error("Failed to load communications data", err);
            setNotification({ message: 'Failed to load data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'sent') {
            fetchInitialData();
        }
    }, [activeTab]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleSend = async () => {
        if (!title || !content) {
            setNotification({ message: "Title and content are required.", type: 'error' });
            return;
        }
        setSending(true);
        setNotification({ message: '', type: '' });
        try {
            await apiSendAnnouncement({ title, content, recipients, methods });
            setNotification({ message: "Announcement sent successfully!", type: 'success' });
            setTitle('');
            setContent('');
            setRecipients(['all']);
            setActiveTab('sent');
        } catch (err) {
            setNotification({ message: `Failed to send announcement: ${err.message}`, type: 'error' });
        } finally {
            setSending(false);
        }
    };

    interface TabButtonProps {
        view: string;
    }
    
    const TabButton = ({ view, children }: PropsWithChildren<TabButtonProps>) => (
        <button
            onClick={() => setActiveTab(view)}
            className={`px-4 py-2 font-semibold ${activeTab === view ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
        >
            {children}
        </button>
    );
    
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'messages':
                return <DirectMessages />;
            case 'sent':
                 return (
                    <div className="card">
                        <div className="p-6">
                            {loading ? <p>Loading...</p> : (
                                <ul className="space-y-4">
                                    {announcements.map(ann => (
                                        <li key={ann.id} className="p-4 border rounded-lg">
                                            <p className="font-semibold">{ann.title}</p>
                                            <p className="text-sm text-gray-600 mt-1">{ann.content}</p>
                                            <p className="text-xs text-gray-400 mt-2">{new Date(ann.created_at).toLocaleString()}</p>
                                        </li>
                                    ))}
                                    {announcements.length === 0 && <p className="text-center text-gray-500">No announcements have been sent.</p>}
                                </ul>
                            )}
                        </div>
                    </div>
                );
            case 'compose':
            default:
                return (
                    <div className="card">
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="label">Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field" />
                            </div>
                            <div>
                                <label className="label">Content</label>
                                <textarea value={content} onChange={e => setContent(e.target.value)} className="input-field" rows={6}></textarea>
                            </div>
                            <div>
                                <label className="label">Recipients</label>
                                 <select multiple value={recipients} onChange={e => setRecipients(Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value))} className="input-field h-32">
                                    <option value="all">All Students & Parents</option>
                                    {classes.map(c => <option key={c} value={c}>Class: {c}</option>)}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={handleSend} className="btn btn-primary" disabled={sending}>
                                    {sending && <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />}
                                    {sending ? 'Sending...' : 'Send Announcement'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div>
            <div className="flex border-b mb-6">
                <TabButton view="compose">Compose Announcement</TabButton>
                <TabButton view="sent">Sent Announcements</TabButton>
                <TabButton view="messages">Direct Messages</TabButton>
            </div>

            {notification.message && (
                <div className={`p-3 mb-4 text-sm rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notification.message}
                </div>
            )}
            
            {renderActiveTab()}
        </div>
    );
};

export default CommunicationsDashboard;