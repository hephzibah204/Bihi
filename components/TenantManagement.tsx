import React, { useState, useEffect } from 'react';
import { apiGetTenants, apiAddTenant, apiSaveTenants, apiDeleteTenantData } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';

const TenantManagement = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [newTenant, setNewTenant] = useState({ name: '', id: '' });
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [tenantToDelete, setTenantToDelete] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTenants();
    }, []);

    const fetchTenants = async () => {
        setLoading(true);
        const data = await apiGetTenants();
        setTenants(data);
        setLoading(false);
    };

    const handleAddTenant = async () => {
        setError('');
        try {
            await apiAddTenant(newTenant);
            fetchTenants();
            setModalOpen(false);
            setNewTenant({ name: '', id: '' });
        } catch (err) {
            setError(err.message);
        }
    };
    
    const openDeleteModal = (tenant) => {
        setTenantToDelete(tenant);
        setDeleteModalOpen(true);
    };

    const handleDeleteTenant = async () => {
        if (!tenantToDelete) return;
        
        const updatedTenants = tenants.filter(t => t.id !== tenantToDelete.id);
        await apiSaveTenants(updatedTenants);
        await apiDeleteTenantData(tenantToDelete);

        setTenants(updatedTenants);
        setDeleteModalOpen(false);
        setTenantToDelete(null);
    };

    if (loading) return <p>Loading tenants...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Tenant Management</h2>
                    <button onClick={() => setModalOpen(true)} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Add School</button>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">School Name</th><th className="th">Portal ID</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {tenants.map(tenant => (
                                <tr key={tenant.id}>
                                    <td className="td">{tenant.name}</td>
                                    <td className="td font-mono">{tenant.id}</td>
                                    <td className="td text-right">
                                        <button onClick={() => openDeleteModal(tenant)} className="text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add New School Tenant">
                <div className="p-6 space-y-4">
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div>
                        <label className="label">School Name</label>
                        <input value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Portal ID (Subdomain)</label>
                        <input value={newTenant.id} onChange={e => setNewTenant({...newTenant, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="input-field" />
                    </div>
                    <button onClick={handleAddTenant} className="btn btn-primary">Save Tenant</button>
                </div>
            </Modal>
             <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDeleteTenant}
                title="Delete Tenant"
                message={`Are you sure you want to delete ${tenantToDelete?.name}? This will permanently delete all associated data (students, scores, etc.) and cannot be undone.`}
            />
        </div>
    );
};

export default TenantManagement;