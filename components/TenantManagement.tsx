import React, { useState, useEffect } from 'react';
import { apiGetTenants, apiSaveTenants, apiAddTenant, apiDeleteTenantData, apiGetPlatformSettings } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

const TenantManagement = () => {
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [newTenant, setNewTenant] = useState({ id: '', name: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tenantData, settingsData] = await Promise.all([
                apiGetTenants(),
                apiGetPlatformSettings()
            ]);
            setTenants(tenantData);
            setPlans(settingsData.plans || []);
        } catch (error) {
            console.error("Failed to load data:", error);
            setError("Could not load tenant and plan data.");
        }
        setLoading(false);
    };

    const handleAddTenant = async () => {
        setError('');
        if (!newTenant.id || !newTenant.name) {
            setError('Both fields are required.');
            return;
        }
        try {
            await apiAddTenant(newTenant);
            fetchData();
            setModalOpen(false);
            setNewTenant({ id: '', name: '' });
        } catch (err) {
            setError(err.message);
        }
    };
    
    const handleDeleteTenant = async (tenant) => {
        if (window.confirm(`Are you sure you want to delete "${tenant.name}"? This action is irreversible and will delete all associated school data.`)) {
            try {
                // First, remove the tenant from the list
                const updatedTenants = tenants.filter(t => t.id !== tenant.id);
                await apiSaveTenants(updatedTenants);
                // Then, delete all data associated with that tenant
                await apiDeleteTenantData(tenant);
                // Update the UI
                setTenants(updatedTenants);
            } catch (err) {
                alert("Failed to delete tenant.");
                console.error(err);
            }
        }
    };

    const handlePlanChange = async (tenantId, planId) => {
        const updatedTenants = tenants.map(t => t.id === tenantId ? { ...t, planId: planId } : t);
        setTenants(updatedTenants); // Optimistic update
        await apiSaveTenants(updatedTenants);
    };

    if (loading) return <div className="card p-6 text-center">Loading tenants...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Manage School Tenants</h2>
                    <button onClick={() => setModalOpen(true)} className="btn btn-primary">
                        <PlusIcon className="w-5 h-5 mr-2" /> 
                        Add Tenant
                    </button>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">School Name</th>
                                <th className="th">Portal ID (Subdomain)</th>
                                <th className="th">Subscription Plan</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                            {tenants.map(tenant => (
                                <tr key={tenant.id}>
                                    <td className="td font-medium">{tenant.name}</td>
                                    <td className="td font-mono">{tenant.id}</td>
                                    <td className="td">
                                        <select 
                                            value={tenant.planId || ''} 
                                            onChange={(e) => handlePlanChange(tenant.id, e.target.value)}
                                            className="input-field"
                                        >
                                            <option value="">No Plan</option>
                                            {plans.map(plan => (
                                                <option key={plan.id} value={plan.id}>{plan.name}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="td text-right">
                                        <button onClick={() => handleDeleteTenant(tenant)} className="text-red-500 hover:text-red-700">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add New Tenant">
                 <div className="p-6 space-y-4">
                    <div>
                        <label className="label">School Name</label>
                        <input value={newTenant.name} onChange={e => setNewTenant({...newTenant, name: e.target.value})} className="input-field" placeholder="e.g., Brightstar Academy" />
                    </div>
                    <div>
                        <label className="label">Portal ID (Subdomain)</label>
                        <input value={newTenant.id} onChange={e => setNewTenant({...newTenant, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="input-field" placeholder="e.g., brightstar" />
                        <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and hyphens.</p>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex justify-end pt-2">
                        <button onClick={() => setModalOpen(false)} className="btn btn-secondary mr-2">Cancel</button>
                        <button onClick={handleAddTenant} className="btn btn-primary">Add Tenant</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TenantManagement;