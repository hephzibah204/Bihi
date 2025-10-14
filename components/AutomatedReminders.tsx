import React, { useState, useEffect } from 'react';
import { apiGetScheduledReminders, apiUpsertScheduledReminder, apiDeleteScheduledReminder, apiGetMessageTemplates } from '../services/api';
import { ScheduledReminder, MessageTemplate } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

const AutomatedReminders = () => {
    const [reminders, setReminders] = useState<ScheduledReminder[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingReminder, setEditingReminder] = useState<ScheduledReminder | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [reminderToDelete, setReminderToDelete] = useState<ScheduledReminder | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const [remindersData, templatesData] = await Promise.all([
            apiGetScheduledReminders(),
            apiGetMessageTemplates()
        ]);
        setReminders(remindersData);
        setTemplates(templatesData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (reminderData: Partial<ScheduledReminder>) => {
        await apiUpsertScheduledReminder(reminderData);
        fetchData();
        setModalOpen(false);
    };

    const handleDelete = async () => {
        if (!reminderToDelete) return;
        await apiDeleteScheduledReminder(reminderToDelete.id);
        fetchData();
        setDeleteModalOpen(false);
    };
    
    const handleToggle = async (reminder: ScheduledReminder) => {
        await apiUpsertScheduledReminder({ ...reminder, enabled: !reminder.enabled });
        fetchData();
    };

    const getTemplateName = (id: string) => templates.find(t => t.id === id)?.name || 'Unknown Template';

    if (loading) return <div>Loading reminders...</div>;

    return (
        <div className="card">
            <div className="p-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Automated Reminders</h2>
                    <button onClick={() => { setEditingReminder(null); setModalOpen(true); }} className="btn btn-primary">
                        <PlusIcon className="w-5 h-5 mr-2" /> New Reminder
                    </button>
                </div>
                 <p className="text-sm text-gray-500 mt-1">Set up automated messages to be sent based on triggers.</p>
                 <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded-md mt-2">Note: Reminder execution is handled by the server on a schedule and is simulated in this demo environment.</p>

                <div className="table-container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">Name</th>
                                <th className="th">Trigger</th>
                                <th className="th">Template</th>
                                <th className="th">Status</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reminders.map(reminder => (
                                <tr key={reminder.id}>
                                    <td className="td font-medium">{reminder.name}</td>
                                    <td className="td">Overdue Fees: {reminder.days_after_due} day(s) after due date</td>
                                    <td className="td">{getTemplateName(reminder.templateId)}</td>
                                    <td className="td">
                                        <input
                                            type="checkbox"
                                            className="toggle-switch"
                                            checked={reminder.enabled}
                                            onChange={() => handleToggle(reminder)}
                                        />
                                    </td>
                                    <td className="td text-right">
                                        <button onClick={() => { setReminderToDelete(reminder); setDeleteModalOpen(true); }} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <ReminderFormModal reminder={editingReminder} templates={templates} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} title="Delete Reminder" message={`Are you sure you want to delete the reminder "${reminderToDelete?.name}"?`} />
        </div>
    );
};

const ReminderFormModal = ({ reminder, templates, onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: '', type: 'overdue_fees', templateId: '', days_after_due: 3, enabled: true, ...reminder });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal isOpen={true} onClose={onClose} title={reminder ? 'Edit Reminder' : 'New Reminder'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Reminder Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" placeholder="e.g., 3-Day Fee Reminder" required /></div>
                <div><label className="label">Reminder Type</label><select name="type" value={formData.type} onChange={handleChange} className="input-field"><option value="overdue_fees">Overdue School Fees</option></select></div>
                <div><label className="label">Message Template</label><select name="templateId" value={formData.templateId} onChange={handleChange} className="input-field" required><option value="">-- Select a Template --</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}</select></div>
                <div><label className="label">Send After</label><input type="number" name="days_after_due" value={formData.days_after_due} onChange={handleChange} className="input-field" required min="1" /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Reminder</button></div>
            </form>
        </Modal>
    );
};

export default AutomatedReminders;
