import React, { useState, useEffect } from 'react';
import { apiGetTeachers, apiUpsertTeacher, apiDeleteTeacher, apiGetSubjects } from '../services/api';
import { Teacher, UserRole, Subject } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TeacherAssignments from './TeacherAssignments';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import { USER_ROLES } from '../utils/constants';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';

const Teachers = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Partial<Teacher> | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [isAssignmentsOpen, setAssignmentsOpen] = useState(false);

    const fetchTeachers = async () => {
        setLoading(true);
        const data = await apiGetTeachers();
        setTeachers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleOpenModal = (teacher: Teacher | null = null) => {
        setEditingTeacher(teacher);
        setModalOpen(true);
    };

    const handleSaveTeacher = async (teacherData: Partial<Teacher>) => {
        await apiUpsertTeacher(teacherData);
        fetchTeachers();
        setModalOpen(false);
    };

    const openDeleteModal = (teacher: Teacher) => {
        setTeacherToDelete(teacher);
        setDeleteModalOpen(true);
    };

    const handleDeleteTeacher = async () => {
        if (!teacherToDelete) return;
        await apiDeleteTeacher(teacherToDelete.id);
        fetchTeachers();
        setDeleteModalOpen(false);
        setTeacherToDelete(null);
    };

    const renderContent = () => {
        if (loading) return <TableSkeleton cols={3} />;

        if (teachers.length === 0) {
            return <EmptyState message="No staff have been added yet." actionText="Add Your First Staff Member" onAction={() => handleOpenModal()} />;
        }

        return (
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Name</th>
                            <th className="th">Email</th>
                            <th className="th">Role</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y">
                        {teachers.map(teacher => (
                            <tr key={teacher.id}>
                                <td className="td font-medium">{teacher.name}</td>
                                <td className="td">{teacher.email}</td>
                                <td className="td">{teacher.role}</td>
                                <td className="td text-right space-x-1">
                                    <button onClick={() => handleOpenModal(teacher)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => openDeleteModal(teacher)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => setAssignmentsOpen(true)} className="btn btn-secondary">Manage Assignments</button>
                <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Add Teacher/Staff</button>
            </div>
            {renderContent()}
            {isModalOpen && <TeacherFormModal teacher={editingTeacher} onSave={handleSaveTeacher} onClose={() => setModalOpen(false)} />}
            {isAssignmentsOpen && <TeacherAssignments onClose={() => setAssignmentsOpen(false)} />}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteTeacher}
                title="Delete Teacher"
                message={`Are you sure you want to delete ${teacherToDelete?.name}? This will remove their access.`}
            />
        </div>
    );
};

const TeacherFormModal = ({ teacher, onSave, onClose }) => {
    const [formData, setFormData] = useState({ name: '', email: '', role: USER_ROLES.TEACHER, baseSalary: 0, classTeacherOf: '', subjects: [], ...teacher });
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<string[]>([]);

    useEffect(() => {
        const load = async () => {
            const subs = await apiGetSubjects();
            setSubjects(subs);
            setClasses([...new Set<string>(subs.flatMap(s => s.classes))].sort());
        };
        load();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubjectsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions).map(o => o.value);
        setFormData(prev => ({ ...prev, subjects: selected }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={teacher ? 'Edit Staff' : 'Add Staff'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Full Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required /></div>
                <div>
                    <label className="label">Role</label>
                    <select name="role" value={formData.role} onChange={handleChange} className="input-field">
                        <option value={USER_ROLES.TEACHER}>Teacher</option>
                        <option value={USER_ROLES.ADMIN}>Admin</option>
                        <option value={USER_ROLES.BURSAR}>Bursar</option>
                        <option value={USER_ROLES.SUPER_ADMIN}>Other Staff</option>
                    </select>
                </div>
                <div>
                    <label className="label">Class Teacher Of</label>
                    <select name="classTeacherOf" value={formData.classTeacherOf || ''} onChange={handleChange} className="input-field">
                        <option value="">-- None --</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Assigned Subjects</label>
                    <select multiple value={(formData.subjects as string[]) || []} onChange={handleSubjectsChange} className="input-field h-32">
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                </div>
                 <div><label className="label">Base Salary (Monthly)</label><input type="number" name="baseSalary" value={formData.baseSalary || ''} onChange={handleChange} className="input-field" /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save</button></div>
            </form>
        </Modal>
    );
};

export default Teachers;