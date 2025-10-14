

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { apiGetSchoolSettings, apiSaveSchoolSettings, apiGetPlatformSettings, apiUpdateTenant } from '../services/api';
import { Tenant, Plan } from '../types';

interface SubscriptionManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenant: Tenant;
}

const SubscriptionManagementModal: React.FC<SubscriptionManagementModalProps> = ({ isOpen, onClose, tenant }) => {
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState(tenant.planId || '');
    const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState(
        tenant.subscriptionExpiryDate ? tenant.subscriptionExpiryDate.split('T')[0] : 
        tenant.trialEndDate ? tenant.trialEndDate.split('T')[0] : ''
    );
    const [status, setStatus] = useState(tenant.subscriptionStatus);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPlans = async () => {
            const settings = await apiGetPlatformSettings();
            setAllPlans(settings.plans || []);
            setLoading(false);
        };
        fetchPlans();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updatedTenant: Tenant = {
                ...tenant,
                planId: selectedPlanId || undefined,
                subscriptionStatus: status,
                subscriptionExpiryDate: subscriptionExpiryDate || undefined,
                trialEndDate: status === 'trial' ? (subscriptionExpiryDate || tenant.trialEndDate) : undefined,
            };
            await apiUpdateTenant(updatedTenant);
            
        } catch (error) {
            console.error("Failed to update subscription", error);
            alert("Error: Could not update subscription.");
        } finally {
            setSaving(false);
            onClose(); // This will trigger a refetch in the parent component
        }
    };

    if (loading) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} title={`Manage Subscription for ${tenant.name}`}>
                <div className="p-6">Loading plans...</div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Manage Subscription for ${tenant.name}`}>
            <div className="p-6 space-y-4">
                <div>
                    <label className="label">Subscription Plan</label>
                    <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} className="input-field">
                        <option value="">-- Unsubscribed --</option>
                        {allPlans.map(plan => (
                            <option key={plan.id} value={plan.id}>{plan.name}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label className="label">Subscription Status</label>
                    <select value={status} onChange={e => setStatus(e.target.value as any)} className="input-field">
                        <option value="trial">Trial</option>
                        <option value="active">Active</option>
                        <option value="expired">Expired</option>
                        <option value="unsubscribed">Unsubscribed</option>
                    </select>
                </div>
                 <div>
                    <label className="label">Subscription Expiry Date</label>
                    <input type="date" value={subscriptionExpiryDate} onChange={e => setSubscriptionExpiryDate(e.target.value)} className="input-field" />
                     <p className="text-xs text-gray-500 mt-1">Set this to confirm a manual payment or extend a trial.</p>
                </div>
                <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SubscriptionManagementModal;