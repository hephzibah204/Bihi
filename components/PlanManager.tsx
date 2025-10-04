import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiSavePlatformSettings } from '../services/api';
import { Plan } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { CONTROLLABLE_FEATURES } from '../utils/constants';

const PlanManager = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [planData, setPlanData] = useState<Partial<Plan>>({
        name: '', price_monthly: 0, price_termly: 0, price_yearly: 0,
        features: { maxStudents: 500 }
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
            const defaultFeatures = { maxStudents: 500 };
            CONTROLLABLE_FEATURES.forEach(f => defaultFeatures[f.key] = false);
            setEditingPlan(null);
            setPlanData({ name: '', price_monthly: 0, price_termly: 0, price_yearly: 0, features: defaultFeatures });
        }
        setModalOpen(true);
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('features.')) {
            const featureKey = name.split('.')[1];
            setPlanData(prev => ({...prev, features: {...prev.features, [featureKey]: type === 'checkbox' ? checked : Number(value) }}));
        } else {
            setPlanData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
        }
    };

    const handleSubmit = async () => {
        let updatedPlans;
        if (editingPlan) {
            updatedPlans = plans.map(p => p.id === editingPlan.id ? { ...(planData as Plan), id: p.id } : p);
        } else {
            updatedPlans = [...plans, { ...(planData as Plan), id: `plan_${Date.now()}` }];
        }
        await handleSave(updatedPlans);
        setModalOpen(false);
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
                        <thead><tr><th className="th">Name</th><th className="th">Monthly</th><th className="th">Termly</th><th className="th">Yearly</th><th className="th">Actions</th></tr></thead>
                        <tbody>
                            {plans.map(plan => (
                                <tr key={plan.id}>
                                    <td className="td">{plan.name}</td>
                                    <td className="td">₦{plan.price_monthly.toLocaleString()}</td>
                                    <td className="td">₦{plan.price_termly.toLocaleString()}</td>
                                    <td className="td">₦{plan.price_yearly.toLocaleString()}</td>
                                    <td className="td"><button onClick={() => handleOpenModal(plan)} className="text-indigo-600">Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && 
                <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingPlan ? 'Edit Plan' : 'Add New Plan'} size="lg">
                    <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div><label className="label">Plan Name</label><input name="name" value={planData.name} onChange={handleFormChange} className="input-field" /></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div><label className="label">Monthly Price</label><input type="number" name="price_monthly" value={planData.price_monthly} onChange={handleFormChange} className="input-field" /></div>
                            <div><label className="label">Termly Price</label><input type="number" name="price_termly" value={planData.price_termly} onChange={handleFormChange} className="input-field" /></div>
                            <div><label className="label">Yearly Price</label><input type="number" name="price_yearly" value={planData.price_yearly} onChange={handleFormChange} className="input-field" /></div>
                        </div>
                        <div>
                            <h4 className="font-semibold mt-4">Features</h4>
                            <div className="space-y-2 mt-2">
                                <div><label className="label">Max Students</label><input type="number" name="features.maxStudents" value={planData.features?.maxStudents || 0} onChange={handleFormChange} className="input-field" /></div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                    {CONTROLLABLE_FEATURES.map(feature => (
                                        <label key={feature.key} className="flex items-center space-x-2">
                                            <input 
                                                type="checkbox" 
                                                name={`features.${feature.key}`} 
                                                checked={!!planData.features?.[feature.key]} 
                                                onChange={handleFormChange} 
                                            /> 
                                            <span>{feature.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={handleSubmit} className="btn btn-primary">Save Plan</button>
                        </div>
                    </div>
                </Modal>
            }
        </div>
    );
};

export default PlanManager;