

import React, { useState, useEffect, useMemo, ReactNode } from 'react';
// Fix: Correct import path
import { apiGetTeachers, apiGetPayrollRuns, apiSavePayrollRuns, apiGetExpenses, apiSaveExpenses } from '../services/api';
// Fix: Correct import path
import { Teacher, PayrollRun, Payslip, Expense } from '../types';
import Modal from './Modal';
import PayslipTemplate from './PayslipTemplate';
import { formatDate } from '../utils/dateHelpers';
import SpinnerIcon from './icons/SpinnerIcon';
import PrinterIcon from './icons/PrinterIcon';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const calculatePaye = (grossAnnualIncome: number, annualPension: number): number => {
    // 1. Consolidated Relief Allowance (CRA)
    const cra1 = 200000;
    const cra2 = 0.01 * grossAnnualIncome;
    const cra3 = 0.20 * grossAnnualIncome;
    const consolidatedRelief = Math.max(cra1, cra2) + cra3;

    // 2. Taxable Income
    const taxableIncome = grossAnnualIncome - consolidatedRelief - annualPension;

    if (taxableIncome <= 0) {
        return 0;
    }

    // 3. Annual Tax Calculation
    let annualTax = 0;
    let remainingIncome = taxableIncome;

    if (remainingIncome > 0) {
        const taxOnFirst300k = Math.min(remainingIncome, 300000) * 0.07;
        annualTax += taxOnFirst300k;
        remainingIncome -= 300000;
    }
    if (remainingIncome > 0) {
        const taxOnNext300k = Math.min(remainingIncome, 300000) * 0.11;
        annualTax += taxOnNext300k;
        remainingIncome -= 300000;
    }
    if (remainingIncome > 0) {
        const taxOnNext500k = Math.min(remainingIncome, 500000) * 0.15;
        annualTax += taxOnNext500k;
        remainingIncome -= 500000;
    }
    if (remainingIncome > 0) {
        const taxOnNext500k_2 = Math.min(remainingIncome, 500000) * 0.19;
        annualTax += taxOnNext500k_2;
        remainingIncome -= 500000;
    }
    if (remainingIncome > 0) {
        const taxOnNext1_6M = Math.min(remainingIncome, 1600000) * 0.21;
        annualTax += taxOnNext1_6M;
        remainingIncome -= 1600000;
    }
    if (remainingIncome > 0) {
        const taxOnRemainder = remainingIncome * 0.24;
        annualTax += taxOnRemainder;
    }

    return annualTax / 12;
};

const PayrollDashboard = () => {
    const [activeTab, setActiveTab] = useState('run');
    
    // Fix: Explicitly typed the props for the TabButton component.
    // This helps TypeScript understand that `children` is an expected prop, resolving potential type errors.
    const TabButton = ({ tab, children }: { tab: string, children: ReactNode }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold ${activeTab === tab ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500'}`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <div className="flex border-b mb-6">
                {/* Fix: Added children content to TabButton components to satisfy the 'children' prop requirement. */}
                <TabButton tab="run">Run Payroll</TabButton>
                <TabButton tab="history">Payroll History</TabButton>
                <TabButton tab="config">Configuration</TabButton>
            </div>
            
            {activeTab === 'run' && <RunPayroll />}
            {activeTab === 'history' && <PayrollHistory />}
            {activeTab === 'config' && <PayrollConfiguration />}
        </div>
    );
};


const RunPayroll = () => {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [preparedPayroll, setPreparedPayroll] = useState<PayrollRun | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [teacherData, runData] = await Promise.all([apiGetTeachers(), apiGetPayrollRuns()]);
            setTeachers(teacherData);
            setPayrollRuns(runData);
            setLoading(false);
        };
        fetchData();
    }, []);
    
    const handlePreparePayroll = () => {
        const payslips: Payslip[] = teachers.map(teacher => {
            const baseSalary = teacher.baseSalary || 0;
            const manualAllowances = teacher.allowances || [];
            const manualDeductions = teacher.deductions || [];
            
            const monthlyEmolument = baseSalary + manualAllowances.reduce((sum, item) => sum + item.amount, 0);

            let autoDeductions: { name: string; amount: number }[] = [];
            let monthlyPension = 0;

            // Pension Calculation
            if (teacher.enableAutoPension) {
                monthlyPension = monthlyEmolument * 0.08;
                autoDeductions.push({ name: 'Pension (Auto)', amount: Math.round(monthlyPension) });
            }

            // Tax Calculation
            if (teacher.enableAutoTax) {
                const grossAnnualIncome = monthlyEmolument * 12;
                const annualPension = monthlyPension * 12;
                const monthlyTax = calculatePaye(grossAnnualIncome, annualPension);
                autoDeductions.push({ name: 'PAYE Tax (Auto)', amount: Math.round(monthlyTax) });
            }
            
            const allDeductions = [...autoDeductions, ...manualDeductions];
            
            const grossPay = monthlyEmolument;
            const totalDeductions = allDeductions.reduce((sum, item) => sum + item.amount, 0);
            const netPay = grossPay - totalDeductions;
            
            return { 
                teacherId: teacher.id, 
                teacherName: teacher.name, 
                baseSalary, 
                allowances: manualAllowances, 
                deductions: allDeductions, 
                grossPay, 
                totalDeductions, 
                netPay 
            };
        });

        const totalGross = payslips.reduce((sum, p) => sum + p.grossPay, 0);
        const totalDeductions = payslips.reduce((sum, p) => sum + p.totalDeductions, 0);
        const totalNet = payslips.reduce((sum, p) => sum + p.netPay, 0);

        setPreparedPayroll({
            id: `payroll_${selectedYear}_${selectedMonth}`,
            month: selectedMonth,
            year: selectedYear,
            runDate: '', // Will be set on save
            totalGross, totalDeductions, totalNet, payslips,
        });
    };

    const handleConfirmRun = async () => {
        if (!preparedPayroll) return;
        setIsProcessing(true);
        const newRun = { ...preparedPayroll, runDate: new Date().toISOString() };
        
        // Save payroll run
        const allRuns = await apiGetPayrollRuns();
        await apiSavePayrollRuns([...allRuns, newRun]);

        // Save expense
        const newExpense: Expense = {
            id: `exp_payroll_${newRun.id}`,
            date: newRun.runDate,
            description: `Payroll for ${MONTHS[newRun.month]} ${newRun.year}`,
            amount: newRun.totalNet,
            category: 'payroll',
        };
        const allExpenses = await apiGetExpenses();
        await apiSaveExpenses([newExpense, ...allExpenses]);
        
        // Refresh and reset
        const updatedRuns = await apiGetPayrollRuns();
        setPayrollRuns(updatedRuns);
        setPreparedPayroll(null);
        setIsProcessing(false);
        alert(`Payroll for ${MONTHS[selectedMonth]} ${selectedYear} has been successfully run!`);
    };

    const hasRunForSelectedPeriod = payrollRuns.some(run => run.year === selectedYear && run.month === selectedMonth);

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Run Monthly Payroll</h2>
                 <div className="my-4 flex items-end gap-4">
                    <div>
                        <label className="label">Year</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="input-field">
                            {[...Array(5)].map((_, i) => <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Month</label>
                        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="input-field">
                            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={handlePreparePayroll} disabled={hasRunForSelectedPeriod || loading} className="btn btn-primary">
                        {loading ? 'Loading...' : 'Prepare Payroll'}
                    </button>
                </div>

                {hasRunForSelectedPeriod && <p className="text-yellow-600 font-semibold">Payroll has already been run for ${MONTHS[selectedMonth]} ${selectedYear}.</p>}
                
                {preparedPayroll && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold">Payroll Summary for ${MONTHS[selectedMonth]} ${selectedYear}</h3>
                        <div className="table-container mt-2">
                            <table className="table">
                                <thead><tr><th className="th">Staff Name</th><th className="th text-right">Gross Pay</th><th className="th text-right">Deductions</th><th className="th text-right">Net Pay</th></tr></thead>
                                <tbody>
                                    {preparedPayroll.payslips.map(p => (
                                        <tr key={p.teacherId}>
                                            <td className="td">{p.teacherName}</td>
                                            <td className="td text-right font-mono">{p.grossPay.toLocaleString()}</td>
                                            <td className="td text-right font-mono text-red-500">({p.totalDeductions.toLocaleString()})</td>
                                            <td className="td text-right font-mono font-bold">{p.netPay.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="td">Total</td>
                                        <td className="td text-right font-mono">{preparedPayroll.totalGross.toLocaleString()}</td>
                                        <td className="td text-right font-mono text-red-500">({preparedPayroll.totalDeductions.toLocaleString()})</td>
                                        <td className="td text-right font-mono">{preparedPayroll.totalNet.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={handleConfirmRun} disabled={isProcessing} className="btn btn-primary bg-green-600 hover:bg-green-700">
                                {isProcessing && <SpinnerIcon className="w-5 h-5 animate-spin mr-2"/>}
                                {isProcessing ? 'Processing...' : 'Confirm & Run Payroll'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PayrollHistory = () => {
    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingRun, setViewingRun] = useState<PayrollRun | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const data = await apiGetPayrollRuns();
            setRuns(data.sort((a,b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime()));
            setLoading(false);
        };
        fetchHistory();
    }, []);

    if (loading) return <div className="card p-6 text-center">Loading payroll history...</div>;

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Payroll History</h2>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead><tr><th className="th">Period</th><th className="th">Date Run</th><th className="th text-right">Total Net Pay (₦)</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {runs.map(run => (
                                <tr key={run.id}>
                                    <td className="td font-semibold">{MONTHS[run.month]} {run.year}</td>
                                    <td className="td">{formatDate(run.runDate)}</td>
                                    <td className="td text-right font-mono">{run.totalNet.toLocaleString()}</td>
                                    <td className="td text-right"><button onClick={() => setViewingRun(run)} className="btn btn-secondary text-sm">View Details</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {viewingRun && <PayrollRunDetailsModal run={viewingRun} onClose={() => setViewingRun(null)} />}
        </div>
    );
};

const PayrollRunDetailsModal = ({ run, onClose }) => {
    const [payslipToPrint, setPayslipToPrint] = useState(null);
    const [schoolSettings, setSchoolSettings] = useState(null); // This would be fetched for real

    const handlePrint = (payslip) => {
        setPayslipToPrint(payslip);
        setTimeout(() => {
            const printContent = document.getElementById('payslip-print-area');
            if (printContent) window.print();
        }, 100);
    };
    
    return (
        <Modal isOpen={true} onClose={onClose} title={`Payroll Details: ${MONTHS[run.month]} ${run.year}`} size="lg">
            <div className="p-6">
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th className="th">Staff Name</th><th className="th text-right">Net Pay</th><th className="th text-right">Actions</th></tr></thead>
                        <tbody>
                            {run.payslips.map(p => (
                                <tr key={p.teacherId}>
                                    <td className="td">{p.teacherName}</td>
                                    <td className="td text-right font-mono">{p.netPay.toLocaleString()}</td>
                                    <td className="td text-right">
                                        <button onClick={() => handlePrint(p)} className="icon-button" title="Print Payslip">
                                            <PrinterIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {payslipToPrint && (
                <div className="hidden print-only">
                    <div id="payslip-print-area">
                        <PayslipTemplate payslip={payslipToPrint} schoolSettings={schoolSettings || {}} payPeriod={`${MONTHS[run.month]} ${run.year}`} />
                    </div>
                </div>
            )}
        </Modal>
    );
};

const PayrollConfiguration = () => (
    <div className="card">
        <div className="p-6">
            <h2 className="text-xl font-semibold">Payroll Configuration</h2>
            <p className="mt-2 text-gray-600">
                To configure salaries, allowances, and deductions for each staff member, please go to the <strong className="text-indigo-600">Teachers</strong> management page.
            </p>
            <p className="mt-1 text-gray-600">
                This ensures all staff information, including payroll details, is managed in one central place.
            </p>
        </div>
    </div>
);


export default PayrollDashboard;