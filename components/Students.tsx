import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudents, apiUpsertStudent, apiDeleteStudent } from '../services/api';
import { Student } from '../types';
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

const Students = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
    const [isEnrollModalOpen, setEnrollModalOpen] = useState(false);
    const [isQRModalOpen, setQRModalOpen] = useState(false);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [studentForAction, setStudentForAction] = useState<Student | null>(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

    const qrCodeUrl = useQRCodeGenerator(studentForAction?.admissionNo || '');

    const fetchStudents = async () => {
        setLoading(true);
        const data = await apiGetStudents();
        setStudents(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const filteredStudents = useMemo(() => {
        return students.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    const handleOpenModal = (student: Student | null = null) => {
        setEditingStudent(student);
        setModalOpen(true);
    };

    const handleSaveStudent = async (studentData: Partial<Student>) => {
        await apiUpsertStudent(studentData);
        fetchStudents();
        setModalOpen(false);
    };

    const openDeleteModal = (student: Student) => {
        setStudentForAction(student);
        setDeleteModalOpen(true);
    };
    
    const handleDeleteStudent = async () => {
        if (!studentForAction) return;
        await apiDeleteStudent(studentForAction.id);
        fetchStudents();
        setDeleteModalOpen(false);
        setStudentForAction(null);
    };

    const handleEnrollFace = (student: Student) => {
        setStudentForAction(student);
        setEnrollModalOpen(true);
    };

    const handleShowQR = (student: Student) => {
        setStudentForAction(student);
        setQRModalOpen(true);
    };

    if (loading) return <div>Loading students...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <input
                    type="text"
                    placeholder="Search students..."
                    className="input-field max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex space-x-2">
                    <button onClick={() => setImportModalOpen(true)} className="btn btn-secondary"><ArrowUpTrayIcon className="w-5 h-5 mr-2"/> Import</button>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add Student</button>
                </div>
            </div>
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
                    <tbody className="bg-white divide-y">
                        {filteredStudents.map(student => (
                            <tr key={student.id}>
                                <td className="td font-medium">{student.name}</td>
                                <td className="td">{student.admissionNo}</td>
                                <td className="td">{student.class}</td>
                                <td className="td text-right space-x-2">
                                    <button onClick={() => handleEnrollFace(student)} className="icon-button" title="Enroll Face ID"><FaceIdIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleShowQR(student)} className="icon-button" title="Show QR Code"><QrCodeIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleOpenModal(student)} className="icon-button" title="Edit"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => openDeleteModal(student)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <StudentFormModal student={editingStudent} onSave={handleSaveStudent} onClose={() => setModalOpen(false)} />}
            {isEnrollModalOpen && studentForAction && <FaceEnrollmentModal isOpen={isEnrollModalOpen} onClose={() => setEnrollModalOpen(false)} student={studentForAction} />}
            {isImportModalOpen && <ImportStudentsModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onSuccess={fetchStudents} />}
            {isQRModalOpen && studentForAction && (
                <Modal isOpen={isQRModalOpen} onClose={() => setQRModalOpen(false)} title={`QR Code for ${studentForAction.name}`}>
                    <div className="p-6 text-center">
                        {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code" className="mx-auto" /> : <p>Generating QR Code...</p>}
                        <p className="mt-2 font-mono">{studentForAction.admissionNo}</p>
                    </div>
                </Modal>
            )}
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
        name: '', admissionNo: '', class: '', gender: 'Male', dob: '', parentEmail: '', ...student
    });

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