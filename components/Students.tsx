import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudents, apiUpsertStudent, apiDeleteStudent, apiGetSubjects, apiGetParents, apiInviteParent } from '../services/api';
import { Student, Subject, Parent } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import FaceIdIcon from './icons/FaceIdIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import FaceEnrollmentModal from './FaceEnrollmentModal';
import ImportStudentsModal from './ImportStudentsModal';
import { useQRCodeGenerator } from '../hooks/useQRCodeGenerator';
import ConfirmationModal from './ConfirmationModal';
import { compressImage } from '../utils/imageCompressor';
import { exportToCSV } from '../utils/csvExporter';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import TableSkeleton from './skeletons/TableSkeleton';
import SkeletonLoader from './SkeletonLoader';
import EnvelopeIcon from './icons/EnvelopeIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import UserCircleIcon from './icons/UserCircleIcon';

const Students = ({ onViewProfile }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [parents, setParents] = useState<Parent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [allClasses, setAllClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [isEnrollModalOpen, setEnrollModalOpen] = useState(false);
    const [isQRModalOpen, setQRModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [studentForAction, setStudentForAction] = useState<Student | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [invitingStudentId, setInvitingStudentId] = useState<string | null>(null);

    const qrCodeUrl = useQRCodeGenerator(studentForAction?.admissionNo || '');

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [studentData, subjectData, parentData] = await Promise.all([
                apiGetStudents(),
                apiGetSubjects(),
                apiGetParents()
            ]);
            setStudents(studentData);
            setParents(parentData);
            const classes = [...new Set<string>(subjectData.flatMap(s => s.classes))].sort();
            setAllClasses(classes);
        } catch (error) {
            console.error("Failed to fetch student data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const searchMatch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
            const classMatch = selectedClass === 'all' || s.class === selectedClass;
            return searchMatch && classMatch;
        });
    }, [students, searchTerm, selectedClass]);

    const handleOpenModal = (student: Student | null = null) => {
        if (student) {
            setEditingStudent(student);
        } else {
            // Smart Default: If a class is filtered, pre-fill it.
            const newStudentDefaults = selectedClass !== 'all' ? { class: selectedClass } : {};
            setEditingStudent(newStudentDefaults);
        }
        setModalOpen(true);
    };

    const handleSaveStudent = async (studentData: Partial<Student>) => {
        await apiUpsertStudent(studentData);
        fetchInitialData(); // Refetch all data to get latest students and classes
        setModalOpen(false);
    };

    const openDeleteModal = (student: Student) => {
        setStudentForAction(student);
        setDeleteModalOpen(true);
    };
    
    const handleDeleteStudent = async () => {
        if (!studentForAction) return;
        await apiDeleteStudent(studentForAction.id);
        fetchInitialData(); // Refetch
        setDeleteModalOpen(false);
        setStudentForAction(null);
    };

    const handleInviteParent = async (student: Student) => {
        if (!student.parentEmail) {
            alert("This student has no parent email address set.");
            return;
        }
        if (window.confirm(`This will send an invitation to ${student.parentEmail}, allowing them to create a password and access the parent portal. Continue?`)) {
            setInvitingStudentId(student.id);
            try {
                const result = await apiInviteParent(student);
                alert(result.message || "Invitation sent! The parent can now check their email.");
                fetchInitialData(); // Refresh to update button state
            } catch (error) {
                alert(`Error: ${error.message}`);
            } finally {
                setInvitingStudentId(null);
            }
        }
    };

    const handleExport = () => {
        const dataToExport = filteredStudents.map(({ name, admissionNo, class: studentClass, gender, dob, parentEmail }) => ({
            name,
            admissionNo,
            class: studentClass,
            gender,
            dob,
            parentEmail,
        }));
        const className = selectedClass !== 'all' ? selectedClass.replace(/\s+/g, '_') : 'all_students';
        exportToCSV(dataToExport, `students_${className}.csv`);
    };

    if (loading) return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                 <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <SkeletonLoader className="h-10 w-full sm:w-auto md:max-w-xs" />
                    <SkeletonLoader className="h-10 w-full sm:w-auto md:w-48" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <SkeletonLoader className="h-10 w-full sm:w-24" />
                    <SkeletonLoader className="h-10 w-full sm:w-24" />
                    <SkeletonLoader className="h-10 w-full sm:w-32" />
                </div>
            </div>
            <TableSkeleton cols={3} />
        </div>
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                 <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="input-field w-full sm:w-auto md:max-w-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                     <select
                        className="input-field w-full sm:w-auto"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        aria-label="Filter by class"
                    >
                        <option value="all">All Classes</option>
                        {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button onClick={handleExport} className="btn btn-secondary w-full sm:w-auto"><ArrowDownTrayIcon className="w-5 h-5 mr-2"/> Export</button>
                    <button onClick={() => setImportModalOpen(true)} className="btn btn-secondary w-full sm:w-auto"><ArrowUpTrayIcon className="w-5 h-5 mr-2"/> Import</button>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary w-full sm:w-auto"><PlusIcon className="w-5 h-5 mr-2"/> Add Student</button>
                </div>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th sticky left-0 bg-slate-100 z-10">Name</th>
                            <th className="th">Admission No.</th>
                            <th className="th">Class</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {filteredStudents.map((student, index) => {
                            const parent = parents.find(p => p.email === student.parentEmail);
                            const isInvited = parent && parent.auth_id;
                            const isEvenRow = index % 2 === 1;
                            const isInviting = invitingStudentId === student.id;
                            return (
                                <tr key={student.id} className="group">
                                    <td className={`td sticky left-0 z-10 ${isEvenRow ? 'bg-slate-100' : 'bg-white'} group-hover:bg-indigo-50`}>
                                        <span className="font-medium text-gray-900">{student.name}</span>
                                    </td>
                                    <td className="td">{student.admissionNo}</td>
                                    <td className="td">{student.class}</td>
                                    <td className="td text-right space-x-1">
                                        <button onClick={() => onViewProfile(student.id)} className="icon-button" title="View Profile">
                                            <UserCircleIcon className="w-5 h-5"/>
                                        </button>
                                        {student.parentEmail ? (
                                            isInvited ? (
                                                <button className="icon-button text-green-500" title={`Parent Invited (${student.parentEmail})`} disabled>
                                                    <EnvelopeIcon className="w-5 h-5"/>
                                                </button>
                                            ) : (
                                                <button onClick={() => handleInviteParent(student)} className="icon-button" title={`Invite Parent (${student.parentEmail})`} disabled={isInviting}>
                                                    {isInviting ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : <EnvelopeIcon className="w-5 h-5"/>}
                                                </button>
                                            )
                                        ) : null}
                                        <button onClick={() => handleOpenModal(student)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => openDeleteModal(student)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <StudentFormModal student={editingStudent} onSave={handleSaveStudent} onClose={() => setModalOpen(false)} />}
            {isEnrollModalOpen && studentForAction && <FaceEnrollmentModal isOpen={isEnrollModalOpen} onClose={() => setEnrollModalOpen(false)} student={studentForAction} />}
            {isImportModalOpen && <ImportStudentsModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onSuccess={fetchInitialData} />}
             <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteStudent}
                title="Delete Student"
                message={`Are you sure you want to delete ${studentForAction?.name}? This action cannot be undone.`}
            />
        </div>
    );
};

const StudentFormModal = ({ student, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<Student>>({
        name: '', admissionNo: '', class: '', gender: 'Male', dob: '', parentEmail: '', photo: '', ...student
    });
    const [photoPreview, setPhotoPreview] = useState(formData.photo || '');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBlob = await compressImage(file, { maxWidth: 200, quality: 0.8 });
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setPhotoPreview(base64String);
                    setFormData(prev => ({ ...prev, photo: base64String }));
                };
                reader.readAsDataURL(compressedBlob);
            } catch (error) {
                console.error("Error processing image:", error);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={student?.id ? 'Edit Student' : 'Add Student'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <label className="label">Profile Photo</label>
                    <div className="flex items-center space-x-4">
                        <img 
                            src={photoPreview || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(formData.name || 'S')}`} 
                            alt="Profile" 
                            className="w-20 h-20 rounded-full object-cover bg-gray-200"
                        />
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="input-field" />
                    </div>
                </div>
                <div><label className="label">Full Name</label><input name="name" value={formData.name} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Admission No.</label><input name="admissionNo" value={formData.admissionNo} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Class</label><input name="class" value={formData.class} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Gender</label><select name="gender" value={formData.gender} onChange={handleChange} className="input-field"><option>Male</option><option>Female</option></select></div>
                <div><label className="label">Date of Birth</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-field" /></div>
                <div><label className="label">Parent's Email</label><input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="input-field" /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Student</button></div>
            </form>
        </Modal>
    );
};

export default Students;