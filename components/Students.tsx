import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student } from '../types';
import { apiGetStudents, apiUpsertStudent, apiDeleteStudent, apiInviteParent, apiGetFeeStructures } from '../services/api';
import { supabase } from '../services/supabaseClient';
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

// Enhanced StudentFormModal with comprehensive fields
const StudentFormModal = ({ student, onSave, onClose, classNames, onInviteParent }) => {
    const [formData, setFormData] = useState({ 
        name: '', 
        admissionNo: '', 
        class: classNames[0] || '', 
        dob: '',
        gender: '',
        address: '',
        parentName: '',
        parentEmail: '', 
        parentPhone: '',
        siblings: [],
        photo: '',
        ...student 
    });
    const [profileImage, setProfileImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [feeStructures, setFeeStructures] = useState([]);
    const [selectedFeeStructure, setSelectedFeeStructure] = useState(null);

    useEffect(() => {
        // Load fee structures when component mounts
        const loadFeeStructures = async () => {
            try {
                const structures = await apiGetFeeStructures();
                setFeeStructures(structures);
            } catch (error) {
                // Non-fatal: fee structures optional
            }
        };
        loadFeeStructures();
    }, []);

    useEffect(() => {
        // Auto-select fee structure when class changes
        if (formData.class && feeStructures.length > 0) {
            const matchingStructure = feeStructures.find(structure => 
                structure.applicableClasses.includes(formData.class)
            );
            setSelectedFeeStructure(matchingStructure);
        }
    }, [formData.class, feeStructures]);

    useEffect(() => {
        // Set image preview if student has existing photo
        if (student?.photo) {
            setImagePreview(student.photo);
        }
    }, [student]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfileImage(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSiblingsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const siblings = e.target.value.split('\n').filter(s => s.trim() !== '');
        setFormData({ ...formData, siblings });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let photoUrl = formData.photo;
        
        // Upload profile image if a new one was selected
        if (profileImage) {
            try {
                const tenantId = localStorage.getItem('tenantId');
                if (!tenantId) throw new Error("Could not determine tenant ID for file upload.");
                
                const fileExt = profileImage.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${tenantId}/student-photos/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(filePath, profileImage);
                
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
                photoUrl = data.publicUrl;
            } catch (error) {
                alert('Error uploading profile picture. Please try again.');
                return;
            }
        }
        
        const studentData = {
            ...formData,
            photo: photoUrl,
            feeStructureId: selectedFeeStructure?.id
        };
        
        onSave(studentData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={student ? 'Edit Student' : 'Add Student'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Profile Picture Section */}
                <div className="text-center">
                    <div className="mb-4">
                        {imagePreview ? (
                            <img src={imagePreview} alt="Profile Preview" className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-gray-200" />
                        ) : (
                            <div className="w-24 h-24 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">No Photo</span>
                            </div>
                        )}
                    </div>
                    <label className="btn btn-secondary cursor-pointer">
                        Upload Profile Picture
                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                </div>

                {/* Basic Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                    <div>
                        <label className="label">Full Name *</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="input-field" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Admission No. *</label>
                            <input name="admissionNo" value={formData.admissionNo} onChange={handleChange} className="input-field" required />
                        </div>
                        <div>
                            <label className="label">Date of Birth</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-field" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                                <option value="">-- Select Gender --</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Class *</label>
                            <select name="class" value={formData.class} onChange={handleChange} className="input-field" required>
                                <option value="">-- Select Class --</option>
                                {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Address</label>
                        <textarea name="address" value={formData.address} onChange={handleChange} className="input-field" rows={3} placeholder="Enter student's home address"></textarea>
                    </div>
                </div>

                {/* Parent Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Parent/Guardian Information</h3>
                    <div>
                        <label className="label">Parent/Guardian Name</label>
                        <input name="parentName" value={formData.parentName} onChange={handleChange} className="input-field" placeholder="Enter parent or guardian's full name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Parent's Email</label>
                            <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="input-field" placeholder="parent@example.com" />
                        </div>
                        <div>
                            <label className="label">Parent's Phone Number</label>
                            <input type="tel" name="parentPhone" value={formData.parentPhone} onChange={handleChange} className="input-field" placeholder="+234 xxx xxx xxxx" />
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Information</h3>
                    <div>
                        <label className="label">Siblings (one per line)</label>
                        <textarea 
                            value={formData.siblings?.join('\n') || ''} 
                            onChange={handleSiblingsChange} 
                            className="input-field" 
                            rows={3} 
                            placeholder="Enter sibling names, one per line"
                        ></textarea>
                    </div>
                </div>

                {/* Fee Structure Information */}
                {selectedFeeStructure && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Fee Structure</h3>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-800">
                                <strong>Selected Fee Structure:</strong> {selectedFeeStructure.name}
                            </p>
                            <p className="text-sm text-green-700">
                                <strong>Total Amount:</strong> ₦{selectedFeeStructure.totalAmount?.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-700">
                                <strong>Session:</strong> {selectedFeeStructure.session} - {selectedFeeStructure.term}
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <button type="button" onClick={() => onInviteParent(formData.id)} className="btn btn-secondary" disabled={!formData.id || !formData.parentEmail}>
                        Invite Parent
                    </button>
                    <div className="space-x-3">
                        <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Student</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};


export default Students;