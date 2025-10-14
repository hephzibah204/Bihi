import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student } from '../types';
import { apiGetStudents, apiUpsertStudent, apiDeleteStudent, apiInviteParent } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import TableSkeleton from './skeletons/TableSkeleton';
import FaceIdIcon from './icons/FaceIdIcon';
import FaceEnrollmentModal from './FaceEnrollmentModal';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import { ADMIN_VIEWS } from '../utils/constants';
import UpgradePrompt from './UpgradePrompt';
import ImportStudentsModal from './ImportStudentsModal';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';
import EmptyState from './EmptyState';
import RetryIcon from './icons/RetryIcon';

const Students = ({ onViewProfile }: { onViewProfile: (studentId: string) => void }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [isEnrollModalOpen, setEnrollModalOpen] = useState(false);
    const [studentToEnroll, setStudentToEnroll] = useState<Student | null>(null);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const { settings } = useTenant();
    const classNames = useMemo(() => generateClassNames(settings), [settings]);
    const [classFilter, setClassFilter] = useState('');

    const { hasFeature, isSubscribed, isLoading: isPlanLoading } = usePlanFeatures();
    
    useEffect(() => {
        if(classNames.length > 0 && !classFilter) {
            setClassFilter(classNames[0]);
        }
    }, [classNames, classFilter]);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const studentsData = await apiGetStudents();
            setStudents(studentsData);
        } catch (error) {
            setError('Failed to load students. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleSaveStudent = async (studentData: Partial<Student>) => {
        try {
            await apiUpsertStudent(studentData);
            fetchStudents();
            setModalOpen(false);
            window.dispatchEvent(new CustomEvent('show-global-success', { detail: { message: 'Student saved successfully!' } }));
        } catch (error) {
            setError("Failed to save student. Please try again.");
        }
    };

    const openDeleteModal = (student: Student) => {
        setStudentToDelete(student);
        setDeleteModalOpen(true);
    };

    const handleDeleteStudent = async () => {
        if (studentToDelete) {
            await apiDeleteStudent(studentToDelete.id);
            fetchStudents();
            setDeleteModalOpen(false);
        }
    };
    
    const handleInviteParent = async (studentId: string) => {
        try {
            // The apiInviteParent function now handles showing the success notification
            await apiInviteParent(studentId);
        } catch (error) {
            setError(`Error inviting parent: ${error.message}`);
        }
    };

    const filteredStudents = useMemo(() => {
        return classFilter === 'all' ? students : students.filter(s => s.class === classFilter);
    }, [students, classFilter]);

    if (isPlanLoading) {
        return <TableSkeleton />;
    }

    if (!isSubscribed) {
        return <UpgradePrompt featureName="Student Management" onUpgradeClick={() => { /* Navigate to billing */ }} />;
    }

    const renderContent = () => {
        if (loading) {
            return <TableSkeleton cols={3} hasCheckbox={false} />;
        }
        if (error) {
            return (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <p className="text-red-500">{error}</p>
                    <button onClick={fetchStudents} className="mt-4 btn btn-primary"><RetryIcon className="w-5 h-5 mr-2" /> Retry</button>
                </div>
            );
        }
        if (students.length > 0 && filteredStudents.length === 0 && classFilter !== 'all') {
            return <EmptyState message={`No students found in ${classFilter}.`} actionText="Add Student" onAction={() => { setEditingStudent(null); setModalOpen(true); }} />;
        }
        if (filteredStudents.length === 0) {
             return <EmptyState message="No students have been added yet." actionText="Add Your First Student" onAction={() => { setEditingStudent(null); setModalOpen(true); }} />;
        }
        return (
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Name</th>
                            <th className="th">Admission No.</th>
                            <th className="th">Class</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td className="td"><button onClick={() => onViewProfile(student.id)} className="font-medium text-indigo-600 hover:underline">{student.name}</button></td>
                                <td className="td">{student.admissionNo}</td>
                                <td className="td">{student.class}</td>
                                <td className="td text-right space-x-1">
                                    <button onClick={() => { setStudentToEnroll(student); setEnrollModalOpen(true); }} className="icon-button" aria-label="Enroll Face ID"><FaceIdIcon className="w-5 h-5" /></button>
                                    <button onClick={() => { setEditingStudent(student); setModalOpen(true); }} className="icon-button" aria-label="Edit student"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => openDeleteModal(student)} className="icon-button text-red-500" aria-label="Delete student"><TrashIcon className="w-5 h-5" /></button>
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
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="input-field w-full md:w-auto">
                    <option value="all">All Students</option>
                    {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                    <button onClick={() => setImportModalOpen(true)} className="btn btn-secondary"><ArrowUpTrayIcon className="w-5 h-5 mr-2" /> Import</button>
                    <button onClick={() => { setEditingStudent(null); setModalOpen(true); }} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Add Student</button>
                </div>
            </div>

            {renderContent()}

            {isModalOpen && <StudentFormModal student={editingStudent} onSave={handleSaveStudent} onClose={() => setModalOpen(false)} classNames={classNames} onInviteParent={handleInviteParent} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteStudent} title="Delete Student" message={`Are you sure you want to delete ${studentToDelete?.name}? This action cannot be undone.`} />
            {isEnrollModalOpen && studentToEnroll && <FaceEnrollmentModal isOpen={isEnrollModalOpen} onClose={() => setEnrollModalOpen(false)} student={studentToEnroll} />}
            {isImportModalOpen && <ImportStudentsModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onSuccess={fetchStudents} />}
        </div>
    );
};

// ... (StudentFormModal remains the same as previous correct versions)
const StudentFormModal = ({ student, onSave, onClose, classNames, onInviteParent }) => {
    const [formData, setFormData] = useState({ name: '', admissionNo: '', class: classNames[0] || '', parentEmail: '', ...student });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={student ? 'Edit Student' : 'Add Student'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Full Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="label">Admission No.</label><input name="admissionNo" value={formData.admissionNo} onChange={handleChange} className="input-field" required /></div>
                    <div><label className="label">Class</label><select name="class" value={formData.class} onChange={handleChange} className="input-field" required><option value="">-- Select Class --</option>{classNames.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                </div>
                <div><label className="label">Parent's Email</label><input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="input-field" /></div>
                <div className="flex justify-between items-center pt-2">
                     <button type="button" onClick={() => onInviteParent(formData.id)} className="btn btn-secondary" disabled={!formData.id || !formData.parentEmail}>Invite Parent</button>
                    <button type="submit" className="btn btn-primary">Save Student</button>
                </div>
            </form>
        </Modal>
    );
};


export default Students;