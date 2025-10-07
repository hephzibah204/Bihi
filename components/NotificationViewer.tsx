import React, { useState, useEffect } from 'react';
import { apiGetAnnouncements, apiGetStudents } from '../services/api';
// Fix: Corrected import path for supabase client
import { supabase } from '../services/supabaseClient';
import { formatDate } from '../utils/dateHelpers';

const NotificationViewer = ({ demoUserId }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allAnnouncements, allStudents] = await Promise.all([
                apiGetAnnouncements(),
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
                        ann.recipients?.includes('all') || ann.recipients?.includes(studentProfile.class)
                    );
                    setNotifications(relevantAnnouncements);
                } else {
                    setNotifications(allAnnouncements);
                }
            };
            
            filterAndSetNotifications(allAnnouncements);

        } catch (error) {
            console.error("Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        if (!supabase) return;

        const handleNewAnnouncement = (payload) => {
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

        const channel = supabase.channel('announcements-viewer-channel')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'announcements' },
                handleNewAnnouncement
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [demoUserId, student]); // Re-run effect if student context changes
    
    if (loading) return <div className="card p-6 text-center">Loading notifications...</div>;

    return (
        <div>
             <h1 className="text-2xl font-semibold text-gray-700">Notifications</h1>
             <div className="space-y-4 mt-6">
                {notifications.length > 0 ? (
                    notifications.map(ann => (
                        <div key={ann.id} className="card p-4">
                            <div className="flex justify-between items-start">
                                <h2 className="font-bold text-lg">{ann.title}</h2>
                                <p className="text-sm text-gray-500">{formatDate(ann.created_at)}</p>
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