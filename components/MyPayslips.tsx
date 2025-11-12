import React, { useState, useEffect } from 'react';
import { apiGetPayrollRuns, apiGetTeachers, apiGetSchoolSettings } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { PayrollRun, Payslip, SchoolSettings, Teacher } from '../types';
import { formatDate } from '../utils/dateHelpers';
import Modal from './Modal';
import PayslipTemplate from './PayslipTemplate';
import PrinterIcon from './icons/PrinterIcon';

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const MyPayslips = () => {
    const [payslips, setPayslips] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewingPayslip, setViewingPayslip] = useState<{ run: PayrollRun, payslip: Payslip } | null>(null);
    const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);

    useEffect(() => {
        const fetchPayslips = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch teachers, payroll runs, and settings in parallel
                const [allRuns, allTeachers, settings] = await Promise.all([
                    apiGetPayrollRuns(),
                    apiGetTeachers(),
                    apiGetSchoolSettings()
                ]);

                // Try to get the authenticated user; in demo mode there may be none
                let userEmail: string | null = null;
                try {
                    if (supabase) {
                        const { data: { user } } = await supabase.auth.getUser();
                        userEmail = user?.email || null;
                    }
                } catch {
                    // Ignore auth errors and fall back to demo behavior
                    userEmail = null;
                }

                // Resolve current teacher: use auth email if present; otherwise fall back to demo teacher
                let me: Teacher | undefined = undefined;
                if (userEmail) {
                    me = allTeachers.find(t => t.email && t.email.toLowerCase() === userEmail!.toLowerCase());
                }
                if (!me) {
                    // Demo fallback: prefer known demo teacher email, else first available
                    me = allTeachers.find(t => t.email === 'teacher@demo.com') || allTeachers[0];
                }
                if (!me) throw new Error('Could not resolve teacher profile.');

                setSchoolSettings(settings);

                const mySlips = (allRuns || [])
                    .map(run => ({
                        run,
                        payslip: run.payslips.find(p => p.teacherId === me!.id)
                    }))
                    .filter(item => item.payslip)
                    .sort((a, b) => new Date(b.run.runDate).getTime() - new Date(a.run.runDate).getTime());

                setPayslips(mySlips);

            } catch (err) {
                setError((err as any)?.message || 'Failed to load payslips');
            } finally {
                setLoading(false);
            }
        };
        fetchPayslips();
    }, []);

    const handlePrint = () => {
        setTimeout(() => window.print(), 100);
    };

    if (loading) return <div className="card p-6 text-center">Loading payslips...</div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">My Payslips</h2>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">Pay Period</th>
                                <th className="th">Date Paid</th>
                                <th className="th text-right">Net Pay (₦)</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.map(({ run, payslip }) => (
                                <tr key={run.id}>
                                    <td className="td font-semibold">{MONTHS[run.month]} {run.year}</td>
                                    <td className="td">{formatDate(run.runDate)}</td>
                                    <td className="td text-right font-mono">{payslip.netPay.toLocaleString()}</td>
                                    <td className="td text-right">
                                        <button onClick={() => setViewingPayslip({ run, payslip })} className="btn btn-secondary text-sm">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {viewingPayslip && schoolSettings && (
                <Modal isOpen={!!viewingPayslip} onClose={() => setViewingPayslip(null)} title={`Payslip for ${MONTHS[viewingPayslip.run.month]} ${viewingPayslip.run.year}`} size="full">
                    <div className="bg-gray-100 p-4 md:p-8 flex flex-col items-center">
                        <div className="printable-content bg-white shadow-lg" id="payslip-print-area">
                            <PayslipTemplate
                                payslip={viewingPayslip.payslip}
                                schoolSettings={schoolSettings}
                                payPeriod={`${MONTHS[viewingPayslip.run.month]} ${viewingPayslip.run.year}`}
                            />
                        </div>
                        <div className="no-print mt-8">
                            <button onClick={handlePrint} className="btn btn-primary">
                                <PrinterIcon className="w-5 h-5 mr-2" />
                                Print Payslip
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default MyPayslips;
