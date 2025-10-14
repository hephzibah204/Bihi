import React, { useState, useEffect } from 'react';
import { apiGetSchoolSettings, apiSaveSchoolSettings, apiGetExpenses } from '../services/api';
import { SchoolSettings, Expense } from '../types';
import SpinnerIcon from './icons/SpinnerIcon';

const EXPENSE_CATEGORIES = ['Operational', 'Maintenance', 'Supplies', 'Utilities', 'Other'];

const BursaryBudgeting = () => {
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [settingsData, expensesData] = await Promise.all([
                    apiGetSchoolSettings(),
                    apiGetExpenses()
                ]);
                setSettings(settingsData);
                setExpenses(expensesData);
            } catch (e) {
                console.error("Failed to load budgeting data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleBudgetChange = (category: string, value: number) => {
        if (!settings) return;
        const currentBudget = settings.budgetSettings?.session === settings.session && settings.budgetSettings?.term === settings.term
            ? settings.budgetSettings
            : { session: settings.session, term: settings.term, categories: {} };
        
        const newCategories = { ...currentBudget.categories, [category]: value };
        setSettings({ ...settings, budgetSettings: { ...currentBudget, categories: newCategories } });
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        await apiSaveSchoolSettings(settings);
        setSaving(false);
        alert("Budget saved!");
    };
    
    if (loading || !settings) return <div className="card p-6 text-center">Loading budgeting tools...</div>;

    const currentBudgetSettings = settings.budgetSettings?.session === settings.session && settings.budgetSettings?.term === settings.term
        ? settings.budgetSettings.categories
        : {};
        
    const expensesForTerm = expenses.filter(e => {
        // This is a simple filter; a real app might need to compare date ranges more accurately
        return true; 
    });
    
    const spentByCategory = expensesForTerm.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Budgeting for {settings.term}, {settings.session}</h2>
                    <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                        {saving ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Save Budget'}
                    </button>
                </div>
                <div className="mt-4 space-y-6">
                    {EXPENSE_CATEGORIES.map(category => {
                        const budgeted = currentBudgetSettings[category] || 0;
                        const spent = spentByCategory[category] || 0;
                        const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
                        const progressBarColor = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

                        return (
                            <div key={category}>
                                <div className="flex justify-between items-center">
                                    <label className="font-semibold">{category}</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">Budget: ₦</span>
                                        <input 
                                            type="number" 
                                            value={budgeted}
                                            onChange={e => handleBudgetChange(category, Number(e.target.value))}
                                            className="input-field w-32 text-right"
                                        />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${Math.min(100, percentage)}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Spent: ₦{spent.toLocaleString()}</span>
                                        <span>Remaining: ₦{(budgeted - spent).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BursaryBudgeting;
