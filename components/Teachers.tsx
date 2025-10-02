import React, { useState, useEffect, useRef } from 'react';
import PlusIcon from './icons/PlusIcon';
import Modal from './Modal';
import { apiLogActivity, updateTeachers } from '../services/api';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';
import { supabase } from '../services/supabaseClient';
import useSyncedLocalStorage from '../hooks/useSyncedLocalStorage';

// Types for better code management
interface Teacher {
    id: string;
    name: string;
    email: string;
    role: string;
    photo?: string;
    auth_id?: string; // To link to Supabase Auth user
}

const PAGE_SIZE = 50;

const Teachers = () => {
    const [teachers, setTeachers] = useSyncedLocalStorage<Teacher[]>('teachers', []);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [modalError, setModalError] = useState<string | null>(null);
    const [isModalOpen, setModalOpen] = useState(false);
    
    // State for Add/Edit
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'Teacher', password: '' });

    // State for Delete
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    
    // State for virtualization/infinite scroll
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const loaderRef = useRef(null);
    
    // Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const first = entries[0];
            if (first.isIntersecting) {
                setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, teachers.length));
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
    }, [loaderRef, teachers.length]);
    
    // Reset visible count if the underlying data changes
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [teachers.length]);
    
    const visibleTeachers = teachers.slice(0, visibleCount);

    useEffect(() => {
        setLoading(false);
    }, [teachers]);

    const handleOpenAddModal = () => {
        setEditingTeacher(null);
        setFormData({ name: '', email: '', role: 'Teacher', password: '' });
        setModalError(null);
        setModalOpen(true);
    };

    const handleOpenEditModal = (teacher: Teacher) => {
        setEditingTeacher(teacher);
        setFormData({ name: teacher.name, email: teacher.email, role: teacher.role, password: '' });
        setModalError(null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingTeacher(null);
        setModalError(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSaveTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError(null);

        if (!editingTeacher) {
            if (!formData.password) {
                setModalError("Password is required for new teachers.");
                return;
            }
            if (!supabase) {
                setModalError("Authentication service is not available.");
                return;
            }

            let authUser;
            try {
                const { data, error: signUpError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password
                });
                
                if (signUpError) throw signUpError;
                if (!data.user) throw new Error("Sign up succeeded but no user data was returned.");
                
                authUser = data.user;
                const { password, ...teacherData } = formData;

                setTeachers(allTeachers => {
                    const newTeacher = { 
                        id: `teacher_${Date.now()}`, 
                        auth_id: authUser.id,
                        ...teacherData 
                    } as Teacher;
                    apiLogActivity({ type: 'TEACHER_ADD', description: `Added a new teacher: ${newTeacher.name}.` });
                    return [...allTeachers, newTeacher];
                });

                handleCloseModal();

            } catch (error) {
                if (authUser?.id) {
                    console.warn(`Attempting to roll back user creation for ${authUser.id}`);
                    if (supabase.auth.admin) {
                        const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
                        if (deleteError) {
                            setModalError(`CRITICAL: Failed to save teacher locally AND could not delete the auth user. Please manually delete the user with email ${formData.email}. Error: ${deleteError.message}`);
                        } else {
                            setModalError(`Failed to save teacher locally, but the authentication user was successfully rolled back. Error: ${error.message}`);
                        }
                    } else {
                         setModalError(`CRITICAL: Failed to save teacher locally. Could not roll back auth user without admin privileges. Please manually delete user with email ${formData.email}.`);
                    }
                } else {
                    setModalError(`Failed to create teacher: ${error.message}`);
                }
                return;
            }
        } else {
            const { password, ...teacherData } = formData;
            setTeachers(allTeachers => {
                apiLogActivity({ type: 'TEACHER_UPDATE', description: `Updated details for ${teacherData.name}.` });
                return allTeachers.map(t => t.id === editingTeacher.id ? { ...t, ...teacherData } : t);
            });
            handleCloseModal();
        }
    };

    const handleOpenDeleteModal = (teacher: Teacher) => {
        setTeacherToDelete(teacher);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!teacherToDelete) return;
        
        try {
            if (teacherToDelete.auth_id) {
                if (!supabase || !supabase.auth.admin) {
                    throw new Error("Authentication admin service not available. This action requires admin privileges.");
                }
                const { error: deleteError } = await supabase.auth.admin.deleteUser(teacherToDelete.auth_id);
                if (deleteError) throw deleteError;
            }
            
            apiLogActivity({ type: 'TEACHER_DELETE', description: `Deleted teacher: ${teacherToDelete.name}.` });
            setTeachers(allTeachers => allTeachers.filter(t => t.id !== teacherToDelete.id));

            setDeleteModalOpen(false);
            setTeacherToDelete(null);
        } catch (error) {
            alert(`Failed to delete teacher: ${error.message}`);
            setDeleteModalOpen(false);
        }
    };

    const renderContent = () => {
        if (loading) return <div className="card p-6 text-center">Loading teachers...</div>;
        if (pageError) return <div className="card p-6 text-center text-red-500">{pageError}</div>;
        if (teachers.length === 0) return <div className="card p-6 text-center">No teachers found. Click "Add Teacher" to begin.</div>;

        return (
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Photo</th>
                            <th className="th">Name</th>
                            <th className="th">Email</th>
                            <th className="th">Role</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {visibleTeachers.map(teacher => (
                            <tr key={teacher.id}>
                                <td className="td">
                                    <img 
                                        src={teacher.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(teacher.name)}`} 
                                        alt={teacher.name} 
                                        className="h-10 w-10 rounded-full object-cover" 
                                    />
                                </td>
                                <td className="td font-medium text-gray-900 dark:text-white">{teacher.name}</td>
                                <td className="td text-gray-500 dark:text-gray-400">{teacher.email}</td>
                                <td className="td text-gray-500 dark:text-gray-400">{teacher.role}</td>
                                <td className="td text-right">
                                    <div className="flex justify-end space-x-4">
                                        <button onClick={() => handleOpenEditModal(teacher)} className="text-indigo-600 hover:text-indigo-900" title="Edit Teacher">
                                            <EditIcon className="h-5 w-5" />
                                        </button>
                                         <button onClick={() => handleOpenDeleteModal(teacher)} className="text-red-500 hover:text-red-700" title="Delete Teacher">
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {visibleCount < teachers.length && (
                            <tr ref={loaderRef}>
                                <td colSpan={5} className="text-center p-4 text-gray-500">
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
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Manage Teachers</h1>
                <button onClick={handleOpenAddModal} className="btn btn-primary">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Teacher
                </button>
            </div>

            {renderContent()}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingTeacher ? "Edit Teacher" : "Add New Teacher"}>
                <form onSubmit={handleSaveTeacher} className="p-6 space-y-4">
                    {modalError && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">{modalError}</div>}
                    <div>
                        <label htmlFor="name" className="label">Full Name</label>
                        <input id="name" name="name" type="text" value={formData.name} onChange={handleFormChange} className="input-field" required />
                    </div>
                    <div>
                        <label htmlFor="email" className="label">Email Address</label>
                        <input id="email" name="email" type="email" value={formData.email} onChange={handleFormChange} className="input-field" required disabled={!!editingTeacher} />
                        {editingTeacher && <p className="text-xs text-gray-500 mt-1">Email address cannot be changed after creation.</p>}
                    </div>
                     {!editingTeacher && (
                        <div>
                            <label htmlFor="password" className="label">Password</label>
                            <input id="password" name="password" type="password" value={formData.password} onChange={handleFormChange} className="input-field" required minLength={6} />
                            <p className="text-xs text-gray-500 mt-1">Set an initial password for the new teacher (min. 6 characters).</p>
                        </div>
                    )}
                    <div>
                        <label htmlFor="role" className="label">Role</label>
                        <select id="role" name="role" value={formData.role} onChange={handleFormChange} className="input-field">
                            <option>Teacher</option>
                            <option>Admin</option>
                            <option>Bursar</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={handleCloseModal} className="btn btn-secondary mr-2">Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingTeacher ? 'Save Changes' : 'Add Teacher'}</button>
                    </div>
                </form>
            </Modal>
             <ConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Teacher"
                message={`Are you sure you want to delete ${teacherToDelete?.name}? This will also delete their login account and cannot be undone.`}
            />
        </div>
    );
};

export default Teachers;