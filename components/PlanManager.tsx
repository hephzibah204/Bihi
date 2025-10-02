import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../services/api';
import { Plan } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';

const PlanManager = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [planData, setPlanData] = useState({
        name: '', price_monthly: 0, price_termly: 0, price_yearly: 0,
        features: { hasAI: false, hasAnalytics: false, maxStudents: 500 }
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        const settings = await apiGetPlatformSettings();
        setPlans(settings.plans || []);
        setLoading(false);
    };

    const handleSave = async (updatedPlans: Plan[]) => {
        const settings = await apiGetPlatformSettings();
        await apiSavePlatformSettings({ ...settings, plans: updatedPlans });
        setPlans(updatedPlans);
    };

    const handleOpenModal = (plan: Plan | null = null) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanData(plan);
        } else {
            setEditingPlan(null);
            setPlanData({ name: '', price_monthly: 0, price_termly: 0, price_yearly: 0, features: { hasAI: false, hasAnalytics: false, maxStudents: 500 } });
        }
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        let updatedPlans;
        if (editingPlan) {
            updatedPlans = plans.map(p => p.id === editingPlan.id ? { ...planData, id: p.id } : p);
        } else {
            updatedPlans = [...plans, { ...planData, id: `plan_${Date.now()}` }];
        }
        await handleSave(updatedPlans);
        setModalOpen(false);
    };
    
    const handleFeatureChange = (feature, value) => {
        setPlanData(prev => ({...prev, features: {...prev.features, [feature]: value }}));
    };

    if (loading) return <p>Loading plans...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Manage Subscription Plans</h2>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Add Plan</button>
                </div>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">Name</th><th className="th">Monthly Price</th><th className="th">Features</th><th className="th">Actions</th></tr></thead>
                        <tbody>
                            {plans.map(plan => (
                                <tr key={plan.id}>
                                    <td className="td">{plan.name}</td>
                                    <td className="td">₦{plan.price_monthly.toLocaleString()}</td>
                                    <td className="td text-xs">{Object.entries(plan.features).map(([key, val]) => `${key}: ${val}`).join(', ')}</td>
                                    <td className="td"><button onClick={() => handleOpenModal(plan)} className="text-indigo-600">Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? 'Edit Plan' : 'Add New Plan'}>
                <div className="p-6 space-y-4">
                    <input value={planData.name} onChange={e => setPlanData({...planData, name: e.target.value})} placeholder="Plan Name" className="input-field" />
                    <input type="number" value={planData.price_monthly} onChange={e => setPlanData({...planData, price_monthly: Number(e.target.value)})} placeholder="Monthly Price" className="input-field" />
                    <div className="space-y-2">
                        <label className="flex items-center"><input type="checkbox" checked={planData.features.hasAI} onChange={e => handleFeatureChange('hasAI', e.target.checked)} /> Has AI Tools</label>
                        <label className="flex items-center"><input type="checkbox" checked={planData.features.hasAnalytics} onChange={e => handleFeatureChange('hasAnalytics', e.target.checked)} /> Has Analytics</label>
                        <input type="number" value={planData.features.maxStudents} onChange={e => handleFeatureChange('maxStudents', Number(e.target.value))} placeholder="Max Students" className="input-field" />
                    </div>
                    <button onClick={handleSubmit} className="btn btn-primary">Save Plan</button>
                </div>
            </Modal>
        </div>
    );
};

export default PlanManager;