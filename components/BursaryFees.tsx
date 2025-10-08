import React, { useState, useEffect } from 'react';
import { apiGetFees, apiSaveFees, apiGetSubjects } from '../services/api';
import { Subject } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';

const BursaryFees = () => {
    const [fees, setFees] = useState([]);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingFee, setEditingFee] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const [feeData, subjectData] = await Promise.all([apiGetFees(), apiGetSubjects()]);
            setFees(feeData || []);
            const allClasses = [...new Set((subjectData as Subject[]).flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    const handleOpenModal = (fee = null) => {
        setEditingFee(fee);
        setModalOpen(true);
    };

    const handleSaveFee = async (feeData) => {
        let updatedFees;
        if (editingFee) {
            updatedFees = fees.map(f => f.id === editingFee.id ? { ...feeData, id: f.id } : f);
        } else {
            updatedFees = [...fees, { ...feeData, id: `fee_${Date.now()}` }];
        }
        await apiSaveFees(updatedFees);
        setFees(updatedFees);
        setModalOpen(false);
    };
    
    if (loading) return <div className="card p-6 text-center">Loading fees...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Manage School Fees</h2>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Add Fee Item</button>
                </div>

                <div className="table-container mt-6">
                    <table className="table">
                        <thead><tr><th className="th">Description</th><th className="th">Amount (₦)</th><th className="th">Applicable Classes</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {fees.map(fee => (
                                <tr key={fee.id}>
                                    <td className="td font-medium">{fee.description}</td>
                                    <td className="td">{Number(fee.amount).toLocaleString()}</td>
                                    <td className="td">{fee.classes.join(', ')}</td>
                                    <td className="td text-right"><button onClick={() => handleOpenModal(fee)} className="text-indigo-600">Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {isModalOpen && <FeeFormModal fee={editingFee} classes={classes} onSave={handleSaveFee} onClose={() => setModalOpen(false)} />}
        </div>
    );
};

const FeeFormModal = ({ fee, classes, onSave, onClose }) => {
    const [description, setDescription] = useState(fee?.description || '');
    const [amount, setAmount] = useState(fee?.amount || '');
    const [selectedClasses, setSelectedClasses] = useState<string[]>(fee?.classes || []);

    const handleClassToggle = (className: string) => {
        setSelectedClasses(prev => prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ description, amount, classes: selectedClasses });
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={fee ? 'Edit Fee Item' : 'Add Fee Item'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Description</label><input value={description} onChange={e => setDescription(e.target.value)} className="input-field" required /></div>
                <div><label className="label">Amount (₦)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="input-field" required /></div>
                <div>
                    <label className="label">Applicable Classes</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        {classes.map(c => (
                            <label key={c} className="flex items-center space-x-2 p-2 rounded-md bg-gray-100">
                                <input type="checkbox" checked={selectedClasses.includes(c)} onChange={() => handleClassToggle(c)} />
                                <span>{c}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save</button></div>
            </form>
        </Modal>
    );
};

export default BursaryFees;