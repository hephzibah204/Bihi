import React, { useState, useEffect, useMemo } from 'react';
import { apiGetParents, apiUpsertParent, apiDeleteParent, apiGetStudents, apiBatchUpdateStudents, apiApproveParentUpdate, apiRejectParentUpdate } from '../services/api';
import { Parent, Student } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';
import { logger } from '../utils/logger';

const ReviewChangesModal = ({ parent, onApprove, onReject, onClose }) => {
    const changes = parent.pendingChanges;
    if (!changes) return null;

    return (
        <Modal isOpen={true} onClose={onClose} title={`Review Changes for ${parent.name}`}>
            <div className="p-6 space-y-4">
                <p>Please review the requested changes before approving.</p>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">Field</th>
                                <th className="th">Current Value</th>
                                <th className="th">New Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(changes).map(key => (
                                <tr key={key}>
                                    <td className="td font-medium capitalize">{key}</td>
                                    <td className="td text-gray-500">{parent[key] || 'N/A'}</td>
                                    <td className="td font-semibold text-indigo-600">{changes[key]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onReject} className="btn btn-secondary bg-red-100 text-red-700">Reject</button>
                    <button onClick={onApprove} className="btn btn-primary">Approve Changes</button>
                </div>
            </div>
        </Modal>
    );
};


const Parents = () => {
    const [parents, setParents] = useState<Parent[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingParent, setEditingParent] = useState<Partial<Parent> | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);

    const [isReviewModalOpen, setReviewModalOpen] = useState(false);
    const [parentToReview, setParentToReview] = useState<Parent | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [parentsData, studentsData] = await Promise.all([apiGetParents(), apiGetStudents()]);
            setParents(parentsData);
            setStudents(studentsData);
        } catch (error) {
            // error handled silently
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const childrenByParent = useMemo(() => {
        const map = new Map<string, Student[]>();
        students.forEach(student => {
            if (student.parentId) {
                if (!map.has(student.parentId)) {
                    map.set(student.parentId, []);
                }
                map.get(student.parentId)?.push(student);
            }
        });
        return map;
    }, [students]);

    const handleSaveParent = async (parentData: Partial<Parent>) => {
        await apiUpsertParent(parentData);
        fetchData();
        setModalOpen(false);
    };

    const openDeleteModal = (parent: Parent) => {
        setParentToDelete(parent);
        setDeleteModalOpen(true);
    };

    const handleDeleteParent = async () => {
        if (!parentToDelete) return;

        const childrenToUnlink = students.filter(s => s.parentId === parentToDelete.id);
        if (childrenToUnlink.length > 0) {
            const updatedStudents = childrenToUnlink.map(s => ({ ...s, parentId: undefined, parentEmail: '' }));
            await apiBatchUpdateStudents(updatedStudents);
        }
        
        await apiDeleteParent(parentToDelete.id);
        fetchData();
        setDeleteModalOpen(false);
    };

    const handleApprove = async () => {
        if (!parentToReview) return;
        await apiApproveParentUpdate(parentToReview.id);
        fetchData();
        setReviewModalOpen(false);
    };

    const handleReject = async () => {
        if (!parentToReview) return;
        await apiRejectParentUpdate(parentToReview.id);
        fetchData();
        setReviewModalOpen(false);
    };

    const renderContent = () => {
        if (loading) return <TableSkeleton cols={4} />;
        if (parents.length === 0) {
            return <EmptyState message="No parents have been added yet." actionText="Add Parent" onAction={() => { setEditingParent(null); setModalOpen(true); }} />;
        }
        return (
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Name</th>
                            <th className="th">Email</th>
                            <th className="th">Phone</th>
                            <th className="th">Children</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parents.map(parent => {
                            const children = childrenByParent.get(parent.id) || [];
                            return (
                                <tr key={parent.id}>
                                    <td className="td font-medium flex items-center">{parent.name} {parent.pendingChanges && <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full">Pending</span>}</td>
                                    <td className="td">{parent.email}</td>
                                    <td className="td">{parent.phone}</td>
                                    <td className="td" title={children.map(c => c.name).join(', ')}>
                                        {children.length > 0 ? `${children.length} child(ren)` : 'None'}
                                    </td>
                                    <td className="td text-right space-x-1">
                                        {parent.pendingChanges && <button onClick={() => { setParentToReview(parent); setReviewModalOpen(true); }} className="btn btn-secondary text-xs bg-yellow-100 text-yellow-800">Review</button>}
                                        <button onClick={() => { setEditingParent(parent); setModalOpen(true); }} className="icon-button" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openDeleteModal(parent)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-end mb-6">
                <button onClick={() => { setEditingParent(null); setModalOpen(true); }} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add Parent</button>
            </div>
            {renderContent()}
            {isModalOpen && <ParentFormModal parent={editingParent} onSave={handleSaveParent} onClose={() => setModalOpen(false)} />}
            {isReviewModalOpen && parentToReview && <ReviewChangesModal parent={parentToReview} onApprove={handleApprove} onReject={handleReject} onClose={() => setReviewModalOpen(false)} />}
            <ConfirmationModal 
                isOpen={isDeleteModalOpen} 
                onClose={() => setDeleteModalOpen(false)} 
                onConfirm={handleDeleteParent} 
                title="Delete Parent" 
                message={`Are you sure you want to delete ${parentToDelete?.name}? Associated children will be unlinked.`} 
            />
        </div>
    );
};

const ParentFormModal = ({ parent, onSave, onClose }) => {
    const [formData, setFormData] = useState({ id: parent?.id || `parent_${Date.now()}`, name: '', email: '', phone: '', address: '', occupation: '', childrenIds: [] as string[], ...parent });
    const [students, setLocalStudents] = useState<Student[]>([]);

    useEffect(() => { (async () => { try { const studs = await apiGetStudents(); setLocalStudents(studs); } catch (e) { logger.warn('Failed to load students in ParentFormModal', { error: e as unknown }); } })(); }, []);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleChildrenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({ ...prev, childrenIds: selected }));
    };
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => { 
        e.preventDefault(); 
        await onSave(formData); 
        if (formData.childrenIds && formData.childrenIds.length > 0) {
            const updated = students.filter(s => formData.childrenIds.includes(s.id)).map(s => ({ ...s, parentId: formData.id, parentEmail: formData.email }));
            await apiBatchUpdateStudents(updated);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={parent ? 'Edit Parent' : 'Add Parent'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label" htmlFor="parent-name">Full Name</label><input id="parent-name" name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label" htmlFor="parent-email">Email</label><input id="parent-email" type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label" htmlFor="parent-phone">Phone Number</label><input id="parent-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input-field" /></div>
                <div><label className="label" htmlFor="parent-address">Address</label><input id="parent-address" name="address" value={formData.address} onChange={handleChange} className="input-field" placeholder="Home address" /></div>
                <div><label className="label" htmlFor="parent-occupation">Occupation / Business</label><input id="parent-occupation" name="occupation" value={formData.occupation} onChange={handleChange} className="input-field" placeholder="e.g., Banker, Trader" /></div>
                <div>
                    <label className="label" htmlFor="children-select">Link Children</label>
                    <select id="children-select" multiple value={formData.childrenIds as string[]} onChange={handleChildrenChange} className="input-field h-32">
                        {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                </div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Parent</button></div>
            </form>
        </Modal>
    );
};

export default Parents;