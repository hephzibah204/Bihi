import React, { useState, useEffect } from 'react';
import { apiGetAnnouncements, apiSendAnnouncement, apiGetSubjects } from '../services/api';
import { supabase } from '../services/supabaseClient';

const CommunicationsDashboard = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // New state
    const [activeTab, setActiveTab] = useState('compose');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [recipients, setRecipients] = useState(['all']);
    const [methods, setMethods] = useState({ portal: true, email: false });
    const [sending, setSending] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [annData, subData] = await Promise.all([
                apiGetAnnouncements(),
                apiGetSubjects()
            ]);
            setAnnouncements(annData);
            setSubjects(subData);
        } catch (error) {
            console.error("Failed to fetch communications data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();

        if (!supabase) return;

        const channel = supabase.channel('announcements-channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'announcements' },
                (payload) => {
                    // Add new announcement to the top of the list
                    setAnnouncements(prev => [payload.new, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSend = async () => {
        if (!title || !content || recipients.length === 0) {
            setNotification({ message: "Title, content, and at least one recipient are required.", type: 'error'});
            return;
        }
        setSending(true);
        setNotification({ message: '', type: '' });


        const newAnnouncement = { 
            title, 
            content, 
            recipients,
            methods,
        };

        try {
            await apiSendAnnouncement(newAnnouncement);
            
            // The real-time subscription will update the UI automatically.
            // We just clear the form and switch tabs.
            setTitle('');
            setContent('');
            setRecipients(['all']);
            setMethods({ portal: true, email: false });
            setActiveTab('sent');
            setNotification({ message: "Announcement sent successfully!", type: 'success' });
            setTimeout(() => setNotification({ message: '', type: '' }), 5000);

        } catch (error) {
            console.error("Failed to send announcement:", error);
            setNotification({ message: `Error sending announcement: ${error.message}. Please check if the email service is configured.`, type: 'error' });
        } finally {
            setSending(false);
        }
    };
    
    const availableClasses = [...new Set(subjects.flatMap(s => s.classes))].sort();

    const handleRecipientChange = (value) => {
        if (value === 'all') {
            setRecipients(['all']);
            return;
        }
        setRecipients(prev => {
            const newRecipients = prev.filter(r => r !== 'all');
            if (newRecipients.includes(value)) {
                return newRecipients.filter(r => r !== value);
            } else {
                return [...newRecipients, value];
            }
        });
    };

    const renderCompose = () => (
        <div className="space-y-4">
            <div>
                <label className="label">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Mid-term Break" className="input-field"/>
            </div>
            <div>
                <label className="label">Message</label>
                {/* Fix: Changed rows from string to number. */}
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Message content..." className="input-field" rows={8}></textarea>
            </div>
             <div>
                <label className="label">Recipients</label>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleRecipientChange('all')} className={`px-3 py-1 text-sm rounded-full border ${recipients.includes('all') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700'}`}>All School</button>
                    {availableClasses.map(c => (
                        <button key={c} onClick={() => handleRecipientChange(c)} className={`px-3 py-1 text-sm rounded-full border ${recipients.includes(c) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700'}`}>{c}</button>
                    ))}
                </div>
            </div>
             <div>
                <label className="label">Delivery Method</label>
                 <div className="flex items-center gap-4">
                     <label className="flex items-center"><input type="checkbox" checked={methods.portal} onChange={e => setMethods(m => ({...m, portal: e.target.checked}))} className="rounded mr-2"/>In-Portal Notification</label>
                     <label className="flex items-center"><input type="checkbox" checked={methods.email} onChange={e => setMethods(m => ({...m, email: e.target.checked}))} className="rounded mr-2"/>Email to Parents</label>
                 </div>
                 {methods.email && <p className="text-xs text-gray-500 mt-1">Email delivery requires parent emails to be on file and a configured email service.</p>}
            </div>
            <div className="text-right">
                <button onClick={handleSend} className="btn btn-primary" disabled={sending}>
                    {sending ? 'Sending...' : 'Send Announcement'}
                </button>
            </div>
        </div>
    );

    const renderSent = () => (
         <div className="space-y-4">
            {loading ? <p>Loading...</p> : announcements.map(ann => (
                <div key={ann.id} className="p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <div className="flex justify-between items-start">
                        <div>
                             <p className="font-bold">{ann.title}</p>
                             <p className="text-xs text-gray-500 mt-1">Sent on {new Date(ann.created_at).toLocaleString()} to: {ann.recipients.join(', ')}</p>
                        </div>
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{ann.content}</p>
                </div>
            ))}
        </div>
    );
    
    return (
        <div className="card">
            <div className="p-6">
                 {notification.message && (
                    <div className={`mb-4 p-3 text-sm rounded-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {notification.message}
                    </div>
                )}
                <div className="border-b dark:border-gray-600 mb-4">
                    <nav className="flex space-x-4">
                        <button onClick={() => setActiveTab('compose')} className={`py-2 px-4 font-semibold ${activeTab === 'compose' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>Compose New</button>
                        <button onClick={() => setActiveTab('sent')} className={`py-2 px-4 font-semibold ${activeTab === 'sent' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}>Sent ({announcements.length})</button>
                    </nav>
                </div>
                {activeTab === 'compose' ? renderCompose() : renderSent()}
            </div>
        </div>
    );
};

export default CommunicationsDashboard;