import React, { useState, useEffect, useMemo } from 'react';
import { Subject } from '../types';
import { apiGetSubjects, apiSaveSubjects } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';

const Subjects = () => {
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const { settings } = useTenant();
    const classNames = useMemo(() => generateClassNames(settings), [settings]);
    
    const fetchSubjects = async () => {
        setLoading(true);
        const subjectsData = await apiGetSubjects();
        setSubjects(subjectsData);
        setLoading(false);
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleSaveSubject = async (subjectData: Partial<Subject>) => {
        let updatedSubjects;
        if (editingSubject) {
            updatedSubjects = subjects.map(s => s.id === editingSubject.id ? { ...s, ...subjectData } : s);
        } else {
            updatedSubjects = [...subjects, { id: `subj_${Date.now()}`, ...subjectData }];
        }
        await apiSaveSubjects(updatedSubjects as Subject[]);
        setSubjects(updatedSubjects as Subject[]);
        setModalOpen(false);
    };

    const renderContent = () => {
        if (loading) return <TableSkeleton cols={2} />;

        if (subjects.length === 0) {
            return <EmptyState message="No subjects have been added yet." actionText="Add Your First Subject" onAction={() => { setEditingSubject(null); setModalOpen(true); }} />;
        }

        return (
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Subject Name</th>
                            <th className="th">Classes</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {subjects.map(subject => (
                            <tr key={subject.id}>
                                <td className="td font-medium">{subject.name}</td>
                                <td className="td">{subject.classes.join(', ')}</td>
                                <td className="td text-right">
                                    <button onClick={() => { setEditingSubject(subject); setModalOpen(true); }} className="icon-button" title="Edit"><EditIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-6">
                <button onClick={() => { setEditingSubject(null); setModalOpen(true); }} className="btn btn-primary">
                    <PlusIcon className="w-5 h-5 mr-2" /> Add Subject
                </button>
            </div>
            
            {renderContent()}

            {isModalOpen && <SubjectFormModal subject={editingSubject} onSave={handleSaveSubject} onClose={() => setModalOpen(false)} all_classes={classNames} />}
        </div>
    );
};

const SubjectFormModal = ({ subject, onSave, onClose, all_classes }) => {
    const [formData, setFormData] = useState({ name: '', classes: [], ...subject });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedClasses = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setFormData({ ...formData, classes: selectedClasses });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={subject ? 'Edit Subject' : 'Add Subject'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="label">Subject Name</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="input-field" required />
                </div>
                <div>
                    <label className="label">Classes (Hold Ctrl/Cmd to select multiple)</label>
                    <select multiple value={formData.classes} onChange={handleClassChange} className="input-field h-40">
                        {all_classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="btn btn-primary">Save Subject</button>
                </div>
            </form>
        </Modal>
    );
};

export default Subjects;