import React, { useState, useEffect } from 'react';
import { apiGetTenants, apiAddTenant, apiDeleteTenant, apiGetPlatformSettings } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import SubscriptionManagementModal from './SubscriptionManagementModal';
import { Tenant, Plan } from '../types';
import { formatDate } from '../utils/dateHelpers';

const TenantManagement = () => {
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isSubModalOpen, setSubModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [newTenantData, setNewTenantData] = useState({ name: '', id: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [tenantData, settingsData] = await Promise.all([
            apiGetTenants(),
            apiGetPlatformSettings()
        ]);
        setTenants(tenantData);
        setPlans(settingsData.plans || []);
        setLoading(false);
    };

    const handleAddTenant = async () => {
        if (!newTenantData.name || !newTenantData.id) return;
        await apiAddTenant(newTenantData);
        fetchData();
        setAddModalOpen(false);
        setNewTenantData({ name: '', id: '' });
    };

    const handleDeleteTenant = async (tenantId: string) => {
        if (window.confirm('Are you sure? This will delete all data for this school.')) {
            await apiDeleteTenant(tenantId);
            fetchData();
        }
    };
    
    const handleManageSubscription = (tenant: Tenant) => {
        setSelectedTenant(tenant);
        setSubModalOpen(true);
    };
    
    const handleModalClose = () => {
        setSubModalOpen(false);
        fetchData(); // Refetch data when modal closes to see changes
    };

    const getPlanName = (planId?: string) => {
        if (!planId) return 'Unsubscribed';
        return plans.find(p => p.id === planId)?.name || 'Unknown Plan';
    };

    if (loading) return <p>Loading tenants...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">School (Tenant) Management</h2>
                    <button onClick={() => setAddModalOpen(true)} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add School</button>
                </div>

                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr>
                            <th className="th">School Name</th>
                            <th className="th">Subdomain (ID)</th>
                            <th className="th">Plan</th>
                            <th className="th">Status</th>
                            <th className="th">Expiry Date</th>
                            <th className="th text-right">Actions</th>
                        </tr></thead>
                        <tbody>
                            {tenants.map(tenant => (
                                <tr key={tenant.id}>
                                    <td className="td font-medium">{tenant.name}</td>
                                    <td className="td font-mono">{tenant.id}</td>
                                    <td className="td">{getPlanName(tenant.planId)}</td>
                                    <td className="td">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            tenant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 
                                            tenant.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {tenant.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="td">
                                        {tenant.subscriptionExpiryDate ? formatDate(tenant.subscriptionExpiryDate) : tenant.trialEndDate ? formatDate(tenant.trialEndDate) : 'N/A'}
                                    </td>
                                    <td className="td text-right space-x-2">
                                        <button onClick={() => handleManageSubscription(tenant)} className="text-sm text-indigo-600">Manage</button>
                                        <button onClick={() => handleDeleteTenant(tenant.id)} className="icon-button text-red-500" title="Delete"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New School">
                <div className="p-6 space-y-4">
                    <div><label className="label">School Name</label><input value={newTenantData.name} onChange={e => setNewTenantData({...newTenantData, name: e.target.value})} className="input-field" /></div>
                    <div><label className="label">Subdomain</label><input value={newTenantData.id} onChange={e => setNewTenantData({...newTenantData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="input-field" /></div>
                    <div className="flex justify-end"><button onClick={handleAddTenant} className="btn btn-primary">Save School</button></div>
                </div>
            </Modal>
            
            {isSubModalOpen && selectedTenant && (
                <SubscriptionManagementModal 
                    isOpen={isSubModalOpen}
                    onClose={handleModalClose}
                    tenant={selectedTenant}
                />
            )}
        </div>
    );
};

export default TenantManagement;