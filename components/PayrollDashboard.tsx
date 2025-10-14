import React, { useState, useEffect, useMemo } from 'react';
import { apiGetTeachers, apiGetPayrollRuns, apiSavePayrollRun } from '../services/api';
import { Teacher, Payslip, PayrollRun } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { formatDate } from '../utils/dateHelpers';
import PayslipTemplate from './PayslipTemplate';
import { useTenant } from '../contexts/TenantContext';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Helper function to calculate Nigerian PAYE tax on an annual basis
const calculatePAYE = (taxableIncome: number): number => {
    let tax = 0;
    let remainingIncome = Math.max(0, taxableIncome);

    const brackets = [
        { limit: 300000, rate: 0.07 },
        { limit: 300000, rate: 0.11 },
        { limit: 500000, rate: 0.15 },
        { limit: 500000, rate: 0.19 },
        { limit: 1600000, rate: 0.21 },
        { limit: Infinity, rate: 0.24 },
    ];

    for (const bracket of brackets) {
        if (remainingIncome > 0) {
            const taxableInBracket = Math.min(remainingIncome, bracket.limit);
            tax += taxableInBracket * bracket.rate;
            remainingIncome -= taxableInBracket;
        } else {
            break;
        }
    }
    return tax;
};


const PayrollDashboard = () => {
    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRunModalOpen, setRunModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

    const { settings: schoolSettings } = useTenant();

    const fetchRuns = async () => {
        setLoading(true);
        const data = await apiGetPayrollRuns();
        setRuns(data.sort((a,b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime()));
        setLoading(false);
    };

    useEffect(() => {
        fetchRuns();
    }, []);

    const handleRunSuccess = () => {
        fetchRuns();
        setRunModalOpen(false);
    };

    const handleViewRun = (run: PayrollRun) => {
        setSelectedRun(run);
        setViewModalOpen(true);
    };

    if (loading) return <div>Loading payroll history...</div>;

    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setRunModalOpen(true)} className="btn btn-primary"><PlusIcon className="w-5 h-5 mr-2"/> Run New Payroll</button>
            </div>
            <div className="table-container">
                <table className="table">
                    <thead><tr><th className="th">Pay Period</th><th className="th">Run Date</th><th className="th text-right">Total Net Pay (₦)</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody>
                        {runs.map(run => (
                            <tr key={run.id}>
                                <td className="td font-semibold">{MONTHS[run.month]} {run.year}</td>
                                <td className="td">{formatDate(run.runDate)}</td>
                                <td className="td text-right font-mono">{run.totalNet.toLocaleString()}</td>
                                <td className="td text-right"><button onClick={() => handleViewRun(run)} className="btn btn-secondary text-sm">View Details</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isRunModalOpen && <RunPayrollModal isOpen={isRunModalOpen} onClose={() => setRunModalOpen(false)} onSuccess={handleRunSuccess} />}
            {isViewModalOpen && selectedRun && schoolSettings &&
                <Modal isOpen={isViewModalOpen} onClose={() => setViewModalOpen(false)} title={`Payslips for ${MONTHS[selectedRun.month]} ${selectedRun.year}`} size="full">
                    <div className="p-4 bg-gray-100 space-y-4 printable-content">
                        {selectedRun.payslips.map(payslip => (
                            <div key={payslip.teacherId} className="page-break">
                                <PayslipTemplate schoolSettings={schoolSettings} payslip={payslip} payPeriod={`${MONTHS[selectedRun.month]} ${selectedRun.year}`} />
                            </div>
                        ))}
                    </div>
                </Modal>
            }
        </div>
    );
};

const RunPayrollModal = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // 1: confirm, 2: processing, 3: success
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        if(isOpen) {
            apiGetTeachers().then(setTeachers);
        }
    }, [isOpen]);
    
    const generatedPayslips = useMemo(() => {
        return teachers.map(teacher => {
            const grossMonthlyPay = teacher.baseSalary || 80000; // Default gross if not set

            // Annual calculations for tax purposes
            const grossAnnualPay = grossMonthlyPay * 12;

            // Standard Nigerian payroll structure (BHT: Basic, Housing, Transport)
            const annualBasic = grossAnnualPay * 0.5;
            const annualHousing = grossAnnualPay * 0.3;
            const annualTransport = grossAnnualPay * 0.2;

            // Pensionable income is typically BHT
            const pensionableEmoluments = annualBasic + annualHousing + annualTransport;
            const employeePensionContributionAnnual = pensionableEmoluments * 0.08;
            
            // Consolidated Relief Allowance (CRA)
            const consolidatedReliefAllowance = Math.max(200000, grossAnnualPay * 0.01) + (grossAnnualPay * 0.20);
            
            // Taxable Income
            const taxableIncomeAnnual = grossAnnualPay - consolidatedReliefAllowance - employeePensionContributionAnnual;
            
            // PAYE Tax Calculation
            const payeAnnual = calculatePAYE(taxableIncomeAnnual);
            const payeMonthly = payeAnnual / 12;

            // Monthly pension contribution
            const employeePensionContributionMonthly = employeePensionContributionAnnual / 12;

            // Assemble the payslip object
            const baseSalary = annualBasic / 12; // This is the monthly basic salary
            const allowances = [
                { name: 'Housing Allowance', amount: annualHousing / 12 },
                { name: 'Transport Allowance', amount: annualTransport / 12 },
            ];
            const deductions = [
                { name: 'PAYE Tax', amount: payeMonthly },
                { name: 'Pension (8%)', amount: employeePensionContributionMonthly },
            ];

            const grossPay = grossMonthlyPay;
            const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
            const netPay = grossPay - totalDeductions;
            
            return { 
                teacherId: teacher.id, 
                teacherName: teacher.name, 
                baseSalary, 
                allowances, 
                deductions, 
                grossPay, 
                totalDeductions, 
                netPay 
            };
        });
    }, [teachers]);


    const handleRun = async () => {
        setStep(2);
        const totalNet = generatedPayslips.reduce((sum, p) => sum + p.netPay, 0);
        const runData = {
            month,
            year,
            runDate: new Date().toISOString(),
            totalNet,
            payslips: generatedPayslips,
        };
        await apiSavePayrollRun(runData);
        setStep(3);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Run New Payroll">
            <div className="p-6">
                {step === 1 && (
                    <>
                        <h3 className="font-semibold">Confirm Payroll Run</h3>
                        <p>You are about to run payroll for:</p>
                        <div className="flex items-center gap-4 my-4">
                            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="input-field">{MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                            <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="input-field w-24" />
                        </div>
                        <p>This will generate payslips for <strong>{teachers.length}</strong> teachers.</p>
                        <div className="flex justify-end mt-4"><button onClick={handleRun} className="btn btn-primary">Confirm & Run</button></div>
                    </>
                )}
                {step === 2 && <div className="text-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin mx-auto"/> <p>Processing payroll...</p></div>}
                {step === 3 && (
                     <div className="text-center p-8">
                        <h3 className="text-xl text-green-600">Payroll Run Successful!</h3>
                        <p>Payslips have been generated.</p>
                        <div className="mt-4"><button onClick={onSuccess} className="btn btn-primary">Done</button></div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default PayrollDashboard;