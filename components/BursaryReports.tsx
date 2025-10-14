import React, { useState, useEffect } from 'react';
import { apiGetInvoices, apiGetExpenses, apiGetPayrollRuns, apiGetIncome } from '../services/api';

const BursaryReports = () => {
    const [reportData, setReportData] = useState({ income: 0, expenses: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const generateReport = async () => {
            setLoading(true);
            try {
                // Fetch all relevant financial data
                const [invoices, manualExpenses, payrollRuns, otherIncomeData] = await Promise.all([
                    apiGetInvoices(),
                    apiGetExpenses(),
                    apiGetPayrollRuns(),
                    apiGetIncome(),
                ]);

                // Calculate total income from all paid amounts on invoices and other income sources
                const feeIncome = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
                const otherIncome = otherIncomeData.reduce((sum, inc) => sum + inc.amount, 0);
                const totalIncome = feeIncome + otherIncome;
                
                // Calculate total expenses from both manual entries and payroll runs
                const totalManualExpenses = manualExpenses
                    .filter(exp => exp.category !== 'payroll') // Avoid double-counting if an old payroll was manually entered
                    .reduce((sum, e) => sum + e.amount, 0);
                
                const totalPayrollExpenses = payrollRuns.reduce((sum, run) => sum + run.totalNet, 0);
                
                const totalExpenses = totalManualExpenses + totalPayrollExpenses;

                setReportData({ income: totalIncome, expenses: totalExpenses });
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