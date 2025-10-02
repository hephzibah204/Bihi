import React, { useState, useRef, useEffect } from 'react';
import PlusIcon from './icons/PlusIcon';
import { apiLogActivity } from '../services/api';
import Modal from './Modal';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import useSyncedLocalStorage from '../hooks/useSyncedLocalStorage';
import { Subject } from '../types';

const PAGE_SIZE = 50;

const Subjects = () => {
    const [subjects, setSubjects] = useSyncedLocalStorage<Subject[]>('subjects', []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // State for Modals
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [formData, setFormData] = useState({ name: '', classes: [] as string[] });
    
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
    
    // State for virtualization/infinite scroll
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);
    
    // Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, subjects.length));
            }
        }, { threshold: 1 });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }

        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loaderRef, subjects.length]);

    // Reset visible count if the underlying data changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [subjects.length]);

    const visibleSubjects = subjects.slice(0, visibleCount);

    // Mock available classes, in a real app this might come from a different source
    const availableClasses = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

    const handleOpenAddModal = () => {
        setEditingSubject(null);
        setFormData({ name: '', classes: [] });
        setModalOpen(true);
    };

    const handleOpenEditModal = (subject: Subject) => {
        setEditingSubject(subject);
        setFormData({ name: subject.name, classes: subject.classes });
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingSubject(null);
    };
    
    const handleClassToggle = (className: string) => {
        setFormData(prev => {
            const newClasses = prev.classes.includes(className)
                ? prev.classes.filter(c => c !== className)
                : [...prev.classes, className];
            return { ...prev, classes: newClasses };
        });
    };

    const handleSaveSubject = (e: React.FormEvent) => {
        e.preventDefault();
        
        setSubjects(allSubjects => {
            if (editingSubject) {
                apiLogActivity({ type: 'SUBJECT_UPDATE', description: `Updated subject: ${formData.name}.` });
                return allSubjects.map(s => s.id === editingSubject.id ? { ...s, ...formData } : s);
            } else {
                const newSubject = { id: `subj_${Date.now()}`, ...formData };
                apiLogActivity({ type: 'SUBJECT_ADD', description: `Added a new subject: ${newSubject.name}.` });
                return [...allSubjects, newSubject];
            }
        });

        handleCloseModal();
    };
    
    const handleOpenDeleteModal = (subject: Subject) => {
        setSubjectToDelete(subject);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!subjectToDelete) return;

        apiLogActivity({ type: 'SUBJECT_DELETE', description: `Deleted subject: ${subjectToDelete.name}.` });
        
        setSubjects(allSubjects => allSubjects.filter(s => s.id !== subjectToDelete.id));

        setDeleteModalOpen(false);
        setSubjectToDelete(null);
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="card">
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        Loading subjects...
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                 <div className="card">
                    <div className="p-6 text-center text-red-500">
                        {error}
                    </div>
                </div>
            );
        }

        if (subjects.length === 0) {
            return (
                <div className="card">
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No subjects found. Click "Add Subject" to get started.
                    </div>
                </div>
            );
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
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {visibleSubjects.map((subject) => (
                            <tr key={subject.id}>
                                <td className="td font-medium text-gray-900 dark:text-white">{subject.name}</td>
                                <td className="td text-gray-500 dark:text-gray-400">{subject.classes.join(', ')}</td>
                                <td className="td text-right">
                                    <div className="flex justify-end space-x-4">
                                        <button onClick={() => handleOpenEditModal(subject)} className="text-indigo-600 hover:text-indigo-900" title="Edit Subject">
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleOpenDeleteModal(subject)} className="text-red-500 hover:text-red-700" title="Delete Subject">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {visibleCount < subjects.length && (
                            <tr ref={loaderRef}>
                                <td colSpan={3} className="text-center p-4 text-gray-500">
                                    Loading more...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <div className="hidden md:flex justify-end items-center mb-6">
                <button onClick={handleOpenAddModal} className="btn btn-primary">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Subject
                </button>
            </div>
            {renderContent()}

            <button onClick={handleOpenAddModal} className="fab md:hidden" aria-label="Add Subject">
                <PlusIcon className="h-6 w-6" />
            </button>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingSubject ? 'Edit Subject' : 'Add New Subject'}>
                 <form onSubmit={handleSaveSubject} className="p-6 space-y-4">
                    <div>
                        <label className="label">Subject Name</label>
                        <input 
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="input-field" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="label">Applicable Classes</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                            {availableClasses.map(c => (
                                <label key={c} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.classes.includes(c)} 
                                        onChange={() => handleClassToggle(c)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>{c}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary mr-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingSubject ? 'Save Changes' : 'Add Subject'}</button>
                    </div>
                </form>
            </Modal>
             <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Subject"
                message={`Are you sure you want to delete ${subjectToDelete?.name}? This may affect existing results.`}
            />
        </div>
    );
};

export default Subjects;