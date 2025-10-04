import React, { useState, useEffect } from 'react';
import { apiGetPlatformUsers, apiSavePlatformUsers } from '../services/api';
import { PlatformUser } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { formatDate } from '../utils/dateHelpers';
import TrashIcon from './icons/TrashIcon';
import { PLATFORM_ROLES } from '../utils/constants';

const PlatformUserManager = () => {
    const [users, setUsers] = useState<PlatformUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await apiGetPlatformUsers();
        setUsers(data);
        setLoading(false);
    };

    const handleSave = async (updatedUsers: PlatformUser[]) => {
        await apiSavePlatformUsers(updatedUsers);
        setUsers(updatedUsers);
        setModalOpen(false);
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm("Are you sure you want to remove this user's access?")) return;
        const updatedUsers = users.filter(u => u.id !== userId);
        await apiSavePlatformUsers(updatedUsers);
        setUsers(updatedUsers);
    };
    
    if (loading) return <p>Loading users...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Platform User Management</h2>
                    <button onClick={() => setModalOpen(true)} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Invite User</button>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">Email</th>
                                <th className="th">Role</th>
                                <th className="th">Last Login</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className="td font-medium">{user.email}</td>
                                    <td className="td">{user.role}</td>
                                    <td className="td">{formatDate(user.lastLogin)}</td>
                                    <td className="td text-right">
                                        <button onClick={() => handleDelete(user.id)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <InviteUserModal allUsers={users} onSave={handleSave} onClose={() => setModalOpen(false)} />}
        </div>
    );
};


const InviteUserModal = ({ allUsers, onSave, onClose }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<string>(PLATFORM_ROLES.BLOG_AUTHOR);

    const handleSubmit = () => {
        // In a real app, this would use supabase.auth.admin.inviteUserByEmail()
        // and store the role in user_metadata or a separate table.
        // For simulation, we just add to our local storage list.
        const newUser: PlatformUser = {
            id: `user_${Date.now()}`,
            email,
            role: role as any,
            lastLogin: new Date().toISOString(),
        };
        const updatedUsers = [...allUsers, newUser];
        onSave(updatedUsers);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title="Invite New Platform User">
            <div className="p-6 space-y-4">
                <div>
                    <label className="label">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="user@example.com"/>
                </div>
                <div>
                    <label className="label">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="input-field">
                        {Object.values(PLATFORM_ROLES).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                 <div className="flex justify-end pt-2">
                    <button onClick={handleSubmit} className="btn btn-primary">Send Invitation</button>
                </div>
            </div>
        </Modal>
    );
};

export default PlatformUserManager;