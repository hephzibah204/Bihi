

import React, { useState, useEffect, useRef, useMemo } from 'react';
import PlusIcon from './icons/PlusIcon';
import { apiGetSubjects, apiLogActivity } from '../services/api';
import ImportStudentsModal from './ImportStudentsModal';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import Modal from './Modal';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import FaceIdIcon from './icons/FaceIdIcon';
import FaceEnrollmentModal from './FaceEnrollmentModal';
import useSyncedLocalStorage from '../hooks/useSyncedLocalStorage';
import { Student } from '../types';
import SearchIcon from './icons/SearchIcon';

const PAGE_SIZE = 50;

const Students = () => {
    const [students, setStudents] = useSyncedLocalStorage<Student[]>('students', []);
    const [classes, setClasses] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    
    // State for Add/Edit Modal
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState<Partial<Student>>({ name: '', admissionNo: '', class: '', gender: 'Male', dob: '', parentEmail: '' });

    // State for Delete Confirmation Modal
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

    // State for Face Enrollment Modal
    const [enrollmentStudent, setEnrollmentStudent] = useState<Student | null>(null);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [genderFilter, setGenderFilter] = useState('');

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = student.name.toLowerCase().includes(searchLower);
            const admissionNoMatch = student.admissionNo.toLowerCase().includes(searchLower);
            const classMatch = !classFilter || student.class === classFilter;
            const genderMatch = !genderFilter || student.gender === genderFilter;
            return (nameMatch || admissionNoMatch) && classMatch && genderMatch;
        });
    }, [students, searchTerm, classFilter, genderFilter]);

    // State for virtualization/infinite scroll
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);
    
    const [isPermissionModalOpen, setPermissionModalOpen] = useState(false);

    // Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredStudents.length));
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
    }, [loaderRef, filteredStudents.length]);
    
    // Reset visible count if the underlying data changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [filteredStudents]);

    const visibleStudents = filteredStudents.slice(0, visibleCount);

    const fetchClasses = async () => {
        try {
            const fetchedSubjects = await apiGetSubjects();
            const allClasses = [...new Set(fetchedSubjects.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            if (!formData.class && allClasses.length > 0) {
                setFormData(prev => ({ ...prev, class: allClasses[0] }));
            }
        } catch (err) {
            console.error("Failed to fetch classes:", err);
            setError("Could not load class data. Please try again.");
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchClasses();
        setLoading(false);
    }, []);

    const handleImportSuccess = () => {
        setImportModalOpen(false);
        // The useSyncedLocalStorage hook will automatically update the student list.
    };
    
    const handleCameraFeatureClick = () => {
        setPermissionModalOpen(true);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setClassFilter('');
        setGenderFilter('');
    };

    // --- CRUD Handlers ---

    const handleOpenAddModal = () => {
        setEditingStudent(null);
        setFormData({ name: '', admissionNo: '', class: classes[0] || '', gender: 'Male', dob: '', parentEmail: '' });
        setModalOpen(true);
    };

    const handleOpenEditModal = (student: Student) => {
        setEditingStudent(student);
        setFormData(student);
        setModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingStudent(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSaveStudent = (e: React.FormEvent) => {
        e.preventDefault();
        
        setStudents(allStudents => {
            if (editingStudent) {
                apiLogActivity({ type: 'STUDENT_UPDATE', description: `Updated details for ${formData.name}.` });
                return allStudents.map(s => s.id === editingStudent.id ? { ...s, ...formData } as Student : s);
            } else {
                const newStudent = {
                    id: `std_${Date.now()}`,
                    ...formData
                } as Student;
                apiLogActivity({ type: 'STUDENT_ADD', description: `Added a new student: ${newStudent.name}.` });
                return [...allStudents, newStudent];
            }
        });

        handleCloseModal();
    };

    const handleOpenDeleteModal = (student: Student) => {
        setStudentToDelete(student);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (!studentToDelete) return;
        
        apiLogActivity({ type: 'STUDENT_DELETE', description: `Deleted student: ${studentToDelete.name}.` });
        
        setStudents(allStudents => allStudents.filter(s => s.id !== studentToDelete.id));

        setDeleteModalOpen(false);
        setStudentToDelete(null);
    };

    const handleEnrollmentClose = () => {
        setEnrollmentStudent(null);
        // Data will be updated by the hook after FaceEnrollmentModal saves.
    }

    const renderContent = () => {
        if (loading) {
            return (
                <div className="card">
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        Loading students...
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

        if (students.length === 0) {
            return (
                <div className="card">
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No students found. Click "Add Student" to get started.
                    </div>
                </div>
            );
        }

        if (filteredStudents.length === 0) {
            return (
                <div className="card">
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No students match the current filters.
                    </div>
                </div>
            );
        }

        return (
             <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Photo</th>
                            <th className="th">Name</th>
                            <th className="th">Admission No.</th>
                            <th className="th">Class</th>
                            <th className="th">Gender</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {visibleStudents.map((student) => (
                            <tr key={student.id}>
                                <td className="td">
                                    <img 
                                      src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} 
                                      alt={student.name} 
                                      className="h-10 w-10 rounded-full object-cover" 
                                    />
                                </td>
                                <td className="td font-medium text-gray-900 dark:text-white">{student.name}</td>
                                <td className="td text-gray-500 dark:text-gray-400">{student.admissionNo}</td>
                                <td className="td text-gray-500 dark:text-gray-400">{student.class}</td>
                                <td className="td text-gray-500 dark:text-gray-400">{student.gender}</td>
                                <td className="td text-right">
                                    <div className="flex justify-end space-x-4">
                                        <button onClick={handleCameraFeatureClick} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200" title="Enroll Face ID">
                                            <FaceIdIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleOpenEditModal(student)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200" title="Edit Student">
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                        <button onClick={() => handleOpenDeleteModal(student)} className="text-red-500 hover:text-red-700" title="Delete Student">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                         {visibleCount < filteredStudents.length && (
                            <tr ref={loaderRef}>
                                <td colSpan={6} className="text-center p-4 text-gray-500">
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
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Students</h1>
                <div className="flex space-x-2">
                     <button onClick={() => setImportModalOpen(true)} className="btn btn-secondary">
                        <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                        Import Students
                    </button>
                    <button onClick={handleOpenAddModal} className="btn btn-primary">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Student
                    </button>
                </div>
            </div>
            
            <div className="card mb-6">
                <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="label">Search by Name or Admission No.</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="input-field pl-10"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="label">Filter by Class</label>
                        <select className="input-field" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Filter by Gender</label>
                        <select className="input-field" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>
                {(searchTerm || classFilter || genderFilter) && (
                    <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Found {filteredStudents.length} student(s) matching your criteria.
                        </p>
                        <button onClick={handleClearFilters} className="btn btn-secondary text-sm">Clear Filters</button>
                    </div>
                )}
            </div>

            {renderContent()}
            <ImportStudentsModal 
                isOpen={isImportModalOpen}
                onClose={() => setImportModalOpen(false)}
                onSuccess={handleImportSuccess}
            />
             <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingStudent ? 'Edit Student' : 'Add New Student'}>
                <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                    <div>
                        <label className="label">Full Name</label>
                        <input name="name" value={formData.name || ''} onChange={handleFormChange} className="input-field" required />
                    </div>
                    <div>
                        <label className="label">Admission No.</label>
                        <input name="admissionNo" value={formData.admissionNo || ''} onChange={handleFormChange} className="input-field" required />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Class</label>
                            <select name="class" value={formData.class || ''} onChange={handleFormChange} className="input-field" required>
                                {classes.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Gender</label>
                            <select name="gender" value={formData.gender || ''} onChange={handleFormChange} className="input-field" required>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                     <div>
                        <label className="label">Date of Birth</label>
                        <input name="dob" type="date" value={formData.dob || ''} onChange={handleFormChange} className="input-field" />
                    </div>
                     <div>
                        <label className="label">Parent's Email</label>
                        <input name="parentEmail" type="email" value={formData.parentEmail || ''} onChange={handleFormChange} className="input-field" placeholder="parent@example.com" />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary mr-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingStudent ? 'Save Changes' : 'Add Student'}</button>
                    </div>
                </form>
            </Modal>
             <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Student"
                message={`Are you sure you want to permanently delete ${studentToDelete?.name}? This action cannot be undone.`}
            />
            {enrollmentStudent && (
                 <FaceEnrollmentModal 
                    isOpen={!!enrollmentStudent}
                    onClose={handleEnrollmentClose}
                    student={enrollmentStudent}
                />
            )}
             <Modal isOpen={isPermissionModalOpen} onClose={() => setPermissionModalOpen(false)} title="Camera Permission Required">
                <div className="p-6 text-center space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">This feature requires camera access to function.</p>
                    <p className="text-gray-600 dark:text-gray-300">The app has not been configured to request camera permissions. If you need this feature, please contact the administrator.</p>
                    <div className="mt-2">
                        <button onClick={() => setPermissionModalOpen(false)} className="btn btn-primary">
                            OK
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Students;