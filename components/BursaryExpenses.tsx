import React, { useState, useEffect } from 'react';
import { apiGetExpenses, apiSaveExpenses } from '../services/api';
import { Expense } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import { formatDate } from '../utils/dateHelpers';
import SpinnerIcon from './icons/SpinnerIcon';

const BursaryExpenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [newExpense, setNewExpense] = useState<Partial<Expense>>({ category: 'other', date: new Date().toISOString().split('T')[0] });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        setLoading(true);
        const data = await apiGetExpenses();
        setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setLoading(false);
    };

    const handleAddExpense = async () => {
        if (!newExpense.description || !newExpense.amount) {
            alert("Description and amount are required.");
            return;
        }
        setSaving(true);
        const expenseToAdd = {
            ...newExpense,
            id: `exp_${Date.now()}`
        } as Expense;
        
        const currentExpenses = await apiGetExpenses();
        const updatedExpenses = [expenseToAdd, ...currentExpenses];

        await apiSaveExpenses(updatedExpenses);
        setExpenses(updatedExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setModalOpen(false);
        setNewExpense({ category: 'other', date: new Date().toISOString().split('T')[0] });
        setSaving(false);
    };

    if (loading) return <div className="card p-6 text-center">Loading expenses...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Expense Records</h2>
                    <button onClick={() => setModalOpen(true)} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2" /> Add Expense</button>
                </div>

                <div className="table-container mt-6">
                    <table className="table">
                        <thead><tr><th className="th">Date</th><th className="th">Description</th><th className="th">Category</th><th className="th text-right">Amount (₦)</th></tr></thead>
                        <tbody>
                            {expenses.map(expense => (
                                <tr key={expense.id}>
                                    <td className="td">{formatDate(expense.date)}</td>
                                    <td className="td font-medium">{expense.description}</td>
                                    <td className="td"><span className="px-2 capitalize inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">{expense.category}</span></td>
                                    <td className="td text-right font-mono">{Number(expense.amount).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Add New Expense">
                <div className="p-6 space-y-4">
                    <div><label className="label">Date</label><input type="date" value={newExpense.date || ''} onChange={e => setNewExpense({...newExpense, date: e.target.value})} className="input-field" /></div>
                    <div><label className="label">Description</label><input value={newExpense.description || ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="input-field" required /></div>
                    <div><label className="label">Amount (₦)</label><input type="number" value={newExpense.amount || ''} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="input-field" required /></div>
                    <div>
                        <label className="label">Category</label>
                        <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})} className="input-field">
                            <option value="utilities">Utilities</option>
                            <option value="supplies">Supplies</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button onClick={handleAddExpense} className="btn btn-primary" disabled={saving}>
                            {saving && <SpinnerIcon className="w-5 h-5 mr-2 animate-spin"/>}
                            {saving ? 'Saving...' : 'Save Expense'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BursaryExpenses;