import React, { useState, useEffect } from 'react';
import { apiGetPayments, apiGetExpenses } from '../services/api';

const BursaryReports = () => {
    const [reportData, setReportData] = useState({ income: 0, expenses: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateReport = async () => {
            setLoading(true);
            try {
                const [payments, expenses] = await Promise.all([
                    apiGetPayments(),
                    apiGetExpenses()
                ]);

                // Simple report for all time
                const income = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0);
                const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

                setReportData({ income, expenses: totalExpenses });
            } catch (error) {
                console.error("Failed to generate report:", error);
            } finally {
                setLoading(false);
            }
        };

        generateReport();
    }, []);

    if (loading) {
        return <div className="card p-6 text-center">Generating reports...</div>;
    }

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Financial Summary (All-Time)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div className="p-4 bg-green-100 text-green-800 rounded-lg">
                        <p className="text-sm font-semibold">Total Income</p>
                        <p className="text-2xl font-bold">₦{reportData.income.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-red-100 text-red-800 rounded-lg">
                        <p className="text-sm font-semibold">Total Expenses</p>
                        <p className="text-2xl font-bold">₦{reportData.expenses.toLocaleString()}</p>
                    </div>
                    <div className="p-4 bg-blue-100 text-blue-800 rounded-lg">
                        <p className="text-sm font-semibold">Net Balance</p>
                        <p className="text-2xl font-bold">₦{(reportData.income - reportData.expenses).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BursaryReports;
