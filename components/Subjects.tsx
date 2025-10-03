import React, { useState, useEffect } from 'react';
import { apiGetSubjects, apiUpsertSubject, apiDeleteSubject } from '../services/api';
import { Subject } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';

const Subjects = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Partial<Subject> | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

    const fetchSubjects = async () => {
        setLoading(true);
        const data = await apiGetSubjects();
        setSubjects(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleOpenModal = (subject: Subject | null = null) => {
        setEditingSubject(subject);
        setModalOpen(true);
    };

    const handleSaveSubject = async (subjectData: Partial<Subject>) => {
        await apiUpsertSubject(subjectData);
        fetchSubjects();
        setModalOpen(false);
    };

    const openDeleteModal = (subject: Subject) => {
        setSubjectToDelete(subject);
        setDeleteModalOpen(true);
    };

    const handleDeleteSubject = async () => {
        if (!subjectToDelete) return;
        await apiDeleteSubject(subjectToDelete.id);
        fetchSubjects();
        setDeleteModalOpen(false);
        setSubjectToDelete(null);
    };
    
    if (loading) return <div>Loading subjects...</div>;

    return (
        <div>
            <div className="flex justify-end mb-6">
                <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add Subject</button>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Subject Name</th>
                            <th className="th">Classes</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                        {subjects.map(subject => (
                            <tr key={subject.id}>
                                <td className="td font-medium">{subject.name}</td>
                                <td className="td">{subject.classes.join(', ')}</td>
                                <td className="td text-right space-x-1">
                                    <button onClick={() => handleOpenModal(subject)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => openDeleteModal(subject)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <SubjectFormModal subject={editingSubject} onSave={handleSaveSubject} onClose={() => setModalOpen(false)} />}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteSubject}
                title="Delete Subject"
                message={`Are you sure you want to delete ${subjectToDelete?.name}?`}
            />
        </div>
    );
};

const SubjectFormModal = ({ subject, onSave, onClose }) => {
    // Fix: Correctly initialize state by spreading the subject and then overriding the 'classes' property to be a string, avoiding a duplicate property error.
    const [formData, setFormData] = useState({ name: '', ...subject, classes: subject?.classes?.join(', ') || '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { name, classes } = formData;
        const classesArray = classes.split(',').map(c => c.trim()).filter(Boolean);
        onSave({ id: subject?.id, name, classes: classesArray });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={subject ? 'Edit Subject' : 'Add Subject'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Subject Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Classes (comma-separated)</label><input name="classes" value={formData.classes} onChange={handleChange} className="input-field" placeholder="e.g., JSS 1, JSS 2" /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Subject</button></div>
            </form>
        </Modal>
    );
};

export default Subjects;