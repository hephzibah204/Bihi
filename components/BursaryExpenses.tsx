import React, { useState, useEffect } from 'react';
import { apiGetExpenses, apiUpsertExpense, apiDeleteExpense } from '../services/api';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';
import ConfirmationModal from './ConfirmationModal';
import { formatDate } from '../utils/dateHelpers';

const BursaryExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [expenseToDelete, setExpenseToDelete] = useState(null);

    const fetchExpenses = async () => {
        setLoading(true);
        const data = await apiGetExpenses();
        setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSaveExpense = async (expenseData) => {
        await apiUpsertExpense(expenseData);
        fetchExpenses();
        setModalOpen(false);
    };

    const handleDeleteExpense = async () => {
        if (!expenseToDelete) return;
        await apiDeleteExpense(expenseToDelete.id);
        fetchExpenses();
        setDeleteModalOpen(false);
    };

    if (loading) return <div>Loading expenses...</div>;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => { setEditingExpense(null); setModalOpen(true); }} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Add Expense</button>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead><tr><th className="th">Date</th><th className="th">Description</th><th className="th">Category</th><th className="th text-right">Amount (₦)</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td className="td">{formatDate(expense.date)}</td>
                                <td className="td">{expense.description}</td>
                                <td className="td">{expense.category}</td>
                                <td className="td text-right font-mono">{expense.amount.toLocaleString()}</td>
                                <td className="td text-right space-x-1">
                                    <button onClick={() => { setEditingExpense(expense); setModalOpen(true); }} className="icon-button"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => { setExpenseToDelete(expense); setDeleteModalOpen(true); }} className="icon-button text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <ExpenseFormModal expense={editingExpense} onSave={handleSaveExpense} onClose={() => setModalOpen(false)} />}
            <ConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} onConfirm={handleDeleteExpense} title="Delete Expense" message={`Are you sure you want to delete this expense record?`} />
        </div>
    );
};

const ExpenseFormModal = ({ expense, onSave, onClose }) => {
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], description: '', category: 'Operational', amount: 0, ...expense });
    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e) => { e.preventDefault(); onSave({ ...formData, amount: Number(formData.amount) }); };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'}>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div><label className="label">Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Description</label><input name="description" value={formData.description} onChange={handleChange} className="input-field" required /></div>
                <div><label className="label">Category</label><select name="category" value={formData.category} onChange={handleChange} className="input-field"><option>Operational</option><option>Maintenance</option><option>Supplies</option><option>Utilities</option><option>Other</option></select></div>
                <div><label className="label">Amount</label><input type="number" name="amount" value={formData.amount} onChange={handleChange} className="input-field" required /></div>
                <div className="flex justify-end pt-2"><button type="submit" className="btn btn-primary">Save Expense</button></div>
            </form>
        </Modal>
    );
};

export default BursaryExpenses;
