import React, { useState, useEffect } from 'react';
import { apiGetCommunicationLogs, apiGetStudents } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { formatDate } from '../utils/dateHelpers';
import { logger } from '../utils/logger';

const NotificationViewer = ({ demoUserId }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [allAnnouncements, allStudents] = await Promise.all([
                apiGetCommunicationLogs(),
                apiGetStudents()
            ]);

            let studentProfile = null;
            if (demoUserId) {
                studentProfile = allStudents.find(s => s.id === demoUserId);
                setStudent(studentProfile);
            }

            const filterAndSetNotifications = (announcements) => {
                 if (studentProfile) {
                    const relevantAnnouncements = announcements.filter(ann => 
                        ann.type === 'announcement' && (ann.recipients?.includes('all') || ann.recipients?.includes(studentProfile.class))
                    );
                    setNotifications(relevantAnnouncements);
                } else {
                    setNotifications(allAnnouncements.filter(ann => ann.type === 'announcement'));
                }
            };
            
            filterAndSetNotifications(allAnnouncements);

        } catch (error) {
            logger.error('Failed to load notifications', { error: error as unknown });
        } finally {
            setLoading(false);
        }
    }, [demoUserId]);

    useEffect(() => {
        fetchData();

        // If Supabase is not initialized or realtime is unavailable, skip subscription
        if (!supabase || (supabase as any)._offline || typeof (supabase as any).channel !== 'function') {
            logger.warn('[Notifications] Realtime unavailable; using fetch-only mode');
            return;
        }

        interface MinimalAnnouncement { id: string; recipients?: string[]; channel: string; content: string; sentAt: string }
        const handleNewAnnouncement = (payload: { new: MinimalAnnouncement }) => {
             const newAnn = payload.new;
             setNotifications(prev => {
                // Avoid duplicates
                if (prev.some(ann => ann.id === newAnn.id)) return prev;

                const updatedList = [newAnn, ...prev];
                // Now, filter based on the student profile
                if (student) {
                     return updatedList.filter(ann => 
                        ann.recipients?.includes('all') || ann.recipients?.includes(student.class)
                    );
                }
                return updatedList;
            });
        };

        const channel = (supabase as any).channel('communication-logs-viewer-channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'communication_logs', filter: 'type=eq.announcement' },
                handleNewAnnouncement
            )
            .subscribe();

        return () => {
            try {
                if (typeof (supabase as any).removeChannel === 'function') {
                    (supabase as any).removeChannel(channel);
                }
            } catch { /* noop */ }
        };
    }, [demoUserId, student, fetchData]); // Re-run effect if student context changes
    
    if (loading) return <div className="card p-6 text-center">Loading notifications...</div>;

    return (
        <div>
             <h1 className="text-2xl font-semibold text-gray-700">Notifications</h1>
             <div className="space-y-4 mt-6">
                {notifications.length > 0 ? (
                    notifications.map(ann => (
                        <div key={ann.id} className="card p-4">
                            <div className="flex justify-between items-start">
                                <h2 className="font-bold text-lg">{`${ann.channel.toUpperCase()} Announcement`}</h2>
                                <p className="text-sm text-gray-500">{formatDate(ann.sentAt)}</p>
                            </div>
                             <p className="mt-2 text-gray-600 whitespace-pre-wrap">{ann.content}</p>
                        </div>
                    ))
                ) : (
                    <div className="card p-6 text-center">
                        <p className="text-gray-500">You have no new notifications.</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export default NotificationViewer;