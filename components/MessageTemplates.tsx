import React, { useState, useEffect } from 'react';
import { apiGetMessageTemplates, apiUpsertMessageTemplate, apiDeleteMessageTemplate } from '../services/api';
import { MessageTemplate } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

const MessageTemplates = () => {
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<MessageTemplate | null>(null);

    const fetchData = async () => {
        setLoading(true);
        const data = await apiGetMessageTemplates();
        setTemplates(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (templateData: Partial<MessageTemplate>) => {
        await apiUpsertMessageTemplate(templateData);
        fetchData();
        setModalOpen(false);
    };

    const handleDelete = async () => {
        if (!templateToDelete) return;
        await apiDeleteMessageTemplate(templateToDelete.id);
        fetchData();
        setDeleteModalOpen(false);
    };

    if (loading) return <div>Loading templates...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Message Templates</h2>
                    <button onClick={() => { setEditingTemplate(null); setModalOpen(true); }} className="btn btn-primary">
                        <PlusIcon className="w-5 h-5 mr-2" /> New Template
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Create reusable messages for announcements and reminders.</p>

                <div className="table-container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">Name</th>
                                <th className="th">Content</th>
                                <th className="th">Type</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(template => (
                                <tr key={template.id}>
                                    <td className="td font-medium">{template.name}</td>
                                    <td className="td"><p className="truncate max-w-sm">{template.content}</p></td>
                                    <td className="td"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{template.type}</span></td>
                                    <td className="td text-right space-x-1">
                                        <button onClick={() => { setEditingTemplate(template); setModalOpen(true); }} className="icon-button"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => { setTemplateToDelete(template); setDeleteModalOpen(true); }} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <TemplateFormModal template={editingTemplate} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} title="Delete Template" message={`Are you sure you want to delete the template "${templateToDelete?.name}"?`} />
        </div>
    );
};

const TemplateFormModal = ({ template, onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: '', content: '', type: 'sms' as 'sms' | 'email', subject: template?.subject || '' , ...template });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    return (
        <Modal isOpen={true} onClose={onClose} title={template ? 'Edit Template' : 'New Template'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Template Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
                {formData.type === 'email' && (
                    <div><label className="label">Email Subject</label><input name="subject" value={formData.subject} onChange={handleChange} className="input-field" placeholder="e.g., Weekly Newsletter" required /></div>
                )}
                <div><label className="label">Content</label><textarea name="content" value={formData.content} onChange={handleChange} className="input-field" rows={5} required></textarea></div>
                <div><label className="label">Type</label><select name="type" value={formData.type} onChange={handleChange} className="input-field"><option value="sms">SMS</option><option value="email">Email</option></select></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Template</button></div>
            </form>
        </Modal>
    );
};

export default MessageTemplates;
