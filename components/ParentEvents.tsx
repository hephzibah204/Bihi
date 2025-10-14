import React, { useState, useEffect } from 'react';
import { apiGetEvents } from '../services/api';
import { formatDate } from '../utils/dateHelpers';
import { Event } from '../types';

const ParentEvents = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const data = await apiGetEvents();
                setEvents(data.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            } catch (error) {
                console.error("Failed to fetch events:", error);
            }
            setLoading(false);
        };
        fetchEvents();
    }, []);

    if (loading) return <div className="card p-6 text-center">Loading events...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">School Events Calendar</h2>
                <div className="mt-4 space-y-4">
                    {events.length > 0 ? (
                        events.map(event => (
                            <div key={event.id} className="p-4 border rounded-lg">
                                <p className="font-bold">{event.title}</p>
                                <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">No upcoming events have been published.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentEvents;
