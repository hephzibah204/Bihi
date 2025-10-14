import React, { useState, useEffect } from 'react';
import { apiGetEvents, apiUpsertEvent, apiDeleteEvent } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import ConfirmationModal from './ConfirmationModal';
import { formatDate } from '../utils/dateHelpers';
import { Event } from '../types';

const Events = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const data = await apiGetEvents();
        setEvents(data.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (eventData: Partial<Event>) => {
        await apiUpsertEvent(eventData);
        fetchData();
        setModalOpen(false);
    };

    const handleDelete = async () => {
        if (!eventToDelete) return;
        await apiDeleteEvent(eventToDelete.id);
        fetchData();
        setDeleteModalOpen(false);
    };

    if (loading) return <div>Loading events...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">School Events Calendar</h2>
                    <button onClick={() => { setEditingEvent(null); setModalOpen(true); }} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add Event</button>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">Date</th><th className="th">Title</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {events.map(event => (
                                <tr key={event.id}>
                                    <td className="td">{formatDate(event.date)}</td>
                                    <td className="td font-medium">{event.title}</td>
                                    <td className="td text-right space-x-1">
                                        <button onClick={() => { setEditingEvent(event); setModalOpen(true); }} className="icon-button"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => { setEventToDelete(event); setDeleteModalOpen(true); }} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <EventFormModal event={editingEvent} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} title="Delete Event" message={`Are you sure you want to delete this event?`} />
        </div>
    );
};

const EventFormModal = ({ event, onSave, onClose }) => {
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], title: '', ...event });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={event ? 'Edit Event' : 'Add Event'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Title</label><input name="title" value={formData.title} onChange={handleChange} className="input-field" required /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Event</button></div>
            </form>
        </Modal>
    );
};

export default Events;
