import React, { useState, useEffect } from 'react';
import { apiGetTenants, apiAddTenant, apiDeleteTenant, apiGetPlatformSettings } from '../../services/api';
import Modal from '../Modal';
import PlusIcon from '../icons/PlusIcon';
import TrashIcon from '../icons/TrashIcon';
import SubscriptionManagementModal from '../SubscriptionManagementModal';
import { Tenant, Plan } from '../../types';
import { formatDate } from '../../utils/dateHelpers';

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
        try {
            const [tenantData, settingsData] = await Promise.all([
                apiGetTenants(),
                apiGetPlatformSettings()
            ]);
            setTenants(tenantData);
            setPlans(settingsData.plans || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTenant = async () => {
        if (!newTenantData.name || !newTenantData.id) return;
        try {
            await apiAddTenant(newTenantData);
            fetchData();
            setAddModalOpen(false);
            setNewTenantData({ name: '', id: '' });
        } catch (error) {
            console.error('Failed to add tenant:', error);
        }
    };

    const handleDeleteTenant = async (tenantId: string) => {
        if (window.confirm('Are you sure? This will delete all data for this school.')) {
            try {
                await apiDeleteTenant(tenantId);
                fetchData();
            } catch (error) {
                console.error('Failed to delete tenant:', error);
            }
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

    if (loading) return <div className="text-center py-8">Loading tenants...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6 rounded-xl">
                <h1 className="text-2xl font-bold mb-2">Tenant Management</h1>
                <p className="text-indigo-100">Manage all school accounts and their subscriptions</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">School (Tenant) Management</h2>
                    <button 
                        onClick={() => setAddModalOpen(true)} 
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2"/> Add School
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="text-left py-3 px-4 font-medium text-slate-700">School Name</th>
                                <th className="text-left py-3 px-4 font-medium text-slate-700">Subdomain (ID)</th>
                                <th className="text-left py-3 px-4 font-medium text-slate-700">Plan</th>
                                <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-slate-700">Expiry Date</th>
                                <th className="text-right py-3 px-4 font-medium text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants.map(tenant => (
                                <tr key={tenant.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-3 px-4 font-medium">{tenant.name}</td>
                                    <td className="py-3 px-4 font-mono text-sm">{tenant.id}</td>
                                    <td className="py-3 px-4">{getPlanName(tenant.planId)}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            tenant.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 
                                            tenant.subscriptionStatus === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {tenant.subscriptionStatus}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {tenant.subscriptionExpiryDate ? formatDate(tenant.subscriptionExpiryDate) : 
                                         tenant.trialEndDate ? formatDate(tenant.trialEndDate) : 'N/A'}
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button 
                                                onClick={() => handleManageSubscription(tenant)} 
                                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Manage
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteTenant(tenant.id)} 
                                                className="p-1 text-red-500 hover:text-red-700" 
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tenants.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-500">
                                        No tenants found. Add your first school to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Tenant Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Add New School">
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="school-name" className="block text-sm font-medium text-slate-700 mb-2">School Name</label>
                        <input 
                            id="school-name"
                            type="text"
                            value={newTenantData.name} 
                            onChange={e => setNewTenantData({...newTenantData, name: e.target.value})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="Enter school name"
                        />
                    </div>
                    <div>
                        <label htmlFor="subdomain" className="block text-sm font-medium text-slate-700 mb-2">Subdomain</label>
                        <input 
                            id="subdomain"
                            type="text"
                            value={newTenantData.id} 
                            onChange={e => setNewTenantData({...newTenantData, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            placeholder="school-subdomain"
                        />
                        <p className="text-sm text-slate-500 mt-1">This will be used as the subdomain (e.g., school-name.yourdomain.com)</p>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button 
                            onClick={() => setAddModalOpen(false)}
                            className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleAddTenant} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            disabled={!newTenantData.name || !newTenantData.id}
                        >
                            Save School
                        </button>
                    </div>
                </div>
            </Modal>
            
            {/* Subscription Management Modal */}
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