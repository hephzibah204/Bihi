import React, { useState, useEffect } from 'react';
import { apiGetIncome, apiUpsertIncome, apiDeleteIncome } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import ConfirmationModal from './ConfirmationModal';
import { formatDate } from '../utils/dateHelpers';

const BursaryIncome = () => {
    const [income, setIncome] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        const data = await apiGetIncome();
        setIncome(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (itemData) => {
        await apiUpsertIncome(itemData);
        fetchData();
        setModalOpen(false);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        await apiDeleteIncome(itemToDelete.id);
        fetchData();
        setDeleteModalOpen(false);
    };
    
    if (loading) return <div>Loading income records...</div>;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => { setEditingItem(null); setModalOpen(true); }} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add Income</button>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead><tr><th className="th">Date</th><th className="th">Description</th><th className="th">Category</th><th className="th text-right">Amount (₦)</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody>
                        {income.map(item => (
                            <tr key={item.id}>
                                <td className="td">{formatDate(item.date)}</td>
                                <td className="td">{item.description}</td>
                                <td className="td">{item.category}</td>
                                <td className="td text-right font-mono">{item.amount.toLocaleString()}</td>
                                <td className="td text-right space-x-1">
                                    <button onClick={() => { setEditingItem(item); setModalOpen(true); }} className="icon-button"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => { setItemToDelete(item); setDeleteModalOpen(true); }} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <IncomeFormModal item={editingItem} onSave={handleSave} onClose={() => setModalOpen(false)} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDelete} title="Delete Income Record" message={`Are you sure you want to delete this record?`} />
        </div>
    );
};

const IncomeFormModal = ({ item, onSave, onClose }) => {
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], description: '', category: 'Donation', amount: 0, ...item });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave({ ...formData, amount: Number(formData.amount) }); };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={item ? 'Edit Income' : 'Add Income'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Description</label><input name="description" value={formData.description} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Category</label><select name="category" value={formData.category} onChange={handleChange} className="input-field"><option>Donation</option><option>Grant</option><option>Fundraising</option><option>Other</option></select></div>
                <div><label className="label">Amount</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} className="input-field" required /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save</button></div>
            </form>
        </Modal>
    );
};

export default BursaryIncome;
