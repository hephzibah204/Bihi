import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

const PlanManager = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planData, setPlanData] = useState({ name: '', price: '' });

    useEffect(() => {
        const fetchPlans = async () => {
            const settings = await apiGetPlatformSettings();
            setPlans(settings.plans || []);
            setLoading(false);
        };
        fetchPlans();
    }, []);

    const handleSave = async (updatedPlans) => {
        const settings = await apiGetPlatformSettings();
        await apiSavePlatformSettings({ ...settings, plans: updatedPlans });
        setPlans(updatedPlans);
    };

    const handleOpenModal = (plan = null) => {
        setEditingPlan(plan);
        setPlanData(plan ? { name: plan.name, price: plan.price } : { name: '', price: '' });
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        let updatedPlans;
        if (editingPlan) {
            updatedPlans = plans.map(p => p.id === editingPlan.id ? { ...p, ...planData } : p);
        } else {
            updatedPlans = [...plans, { ...planData, id: `plan_${Date.now()}` }];
        }
        await handleSave(updatedPlans);
        setModalOpen(false);
    };
    
    const handleDelete = async (planId) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        const updatedPlans = plans.filter(p => p.id !== planId);
        await handleSave(updatedPlans);
    }

    if (loading) return <p>Loading plans...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Subscription Plan Management</h2>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add Plan</button>
                </div>
                 <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">Plan Name</th><th className="th">Price</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {plans.map(plan => (
                                <tr key={plan.id}>
                                    <td className="td">{plan.name}</td>
                                    <td className="td">{plan.price}</td>
                                    <td className="td text-right">
                                        <button onClick={() => handleOpenModal(plan)} className="text-indigo-600 mr-4"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(plan.id)} className="text-red-500"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? 'Edit Plan' : 'New Plan'}>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="label">Plan Name</label>
                        <input value={planData.name} onChange={e => setPlanData({...planData, name: e.target.value})} className="input-field" />
                    </div>
                    <div>
                        <label className="label">Price (e.g., ₦2,500/mo)</label>
                        <input value={planData.price} onChange={e => setPlanData({...planData, price: e.target.value})} className="input-field" />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleSubmit} className="btn btn-primary">Save Plan</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PlanManager;