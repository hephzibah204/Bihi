import React, { useState, useEffect } from 'react';
import { apiGetFees, apiSaveFees } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

const BursaryFees = () => {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingFee, setEditingFee] = useState(null);
    const [feeData, setFeeData] = useState({ description: '', amount: '', classes: [] });

    useEffect(() => {
        const fetchFees = async () => {
            const feeData = await apiGetFees();
            setFees(feeData || []);
            setLoading(false);
        };
        fetchFees();
    }, []);

    const handleSaveFees = async (updatedFees) => {
        await apiSaveFees(updatedFees);
        setFees(updatedFees);
    };

    const handleOpenModal = (fee = null) => {
        if (fee) {
            setEditingFee(fee);
            setFeeData(fee);
        } else {
            setEditingFee(null);
            setFeeData({ description: '', amount: '', classes: [] });
        }
        setModalOpen(true);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFeeData(prev => ({ ...prev, [name]: value }));
    };

    const handleClassChange = (className) => {
        setFeeData(prev => {
            const newClasses = prev.classes.includes(className)
                ? prev.classes.filter(c => c !== className)
                : [...prev.classes, className];
            return { ...prev, classes: newClasses };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let updatedFees;
        if (editingFee) {
            updatedFees = fees.map(f => f.id === editingFee.id ? { ...feeData, id: f.id } : f);
        } else {
            updatedFees = [...fees, { ...feeData, id: `fee_${Date.now()}` }];
        }
        await handleSaveFees(updatedFees);
        setModalOpen(false);
    };

    const handleDelete = async (feeId) => {
        if (window.confirm('Are you sure you want to delete this fee item?')) {
            const updatedFees = fees.filter(f => f.id !== feeId);
            await handleSaveFees(updatedFees);
        }
    };
    
    // In a real app, classes would be fetched from the subjects data
    const availableClasses = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

    if (loading) return <div className="card p-6 text-center">Loading fees...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Manage School Fees</h2>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Fee Item
                    </button>
                </div>
                {fees.length === 0 ? (
                    <div className="mt-6 p-6 border-2 border-dashed rounded-lg text-center">
                        <p className="text-gray-500">No fee items have been created yet.</p>
                    </div>
                ) : (
                    <div className="table-container mt-6">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="th">Description</th>
                                    <th className="th">Amount (₦)</th>
                                    <th className="th">Applicable Classes</th>
                                    <th className="th text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                                {fees.map(fee => (
                                    <tr key={fee.id}>
                                        <td className="td font-medium">{fee.description}</td>
                                        <td className="td">{Number(fee.amount).toLocaleString()}</td>
                                        <td className="td">{fee.classes.join(', ')}</td>
                                        <td className="td text-right">
                                            <button onClick={() => handleOpenModal(fee)} className="text-indigo-600 hover:text-indigo-800 mr-4"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(fee.id)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingFee ? 'Edit Fee Item' : 'Add Fee Item'}>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Description</label>
                        <input name="description" value={feeData.description} onChange={handleFormChange} className="input-field" required/>
                    </div>
                    <div>
                        <label className="label">Amount (₦)</label>
                        <input name="amount" type="number" value={feeData.amount} onChange={handleFormChange} className="input-field" required/>
                    </div>
                    <div>
                        <label className="label">Applicable Classes</label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {availableClasses.map(c => (
                                <label key={c} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={feeData.classes.includes(c)} onChange={() => handleClassChange(c)} className="rounded"/>
                                    <span>{c}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="btn btn-primary">{editingFee ? 'Save Changes' : 'Add Fee'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BursaryFees;