import React, { useState, useEffect, useMemo } from 'react';
import { apiGetInvoices, apiGetPayments, apiGetStudents } from '../services/api';
import { useAI } from '../hooks/useAI';
import { Invoice, Payment, Student } from '../types';
import { formatDate } from '../utils/dateHelpers';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import TableSkeleton from './skeletons/TableSkeleton';
import AIDebtReminderModal from './AIDebtReminderModal';

const getRiskChip = (riskProfile: string) => {
    switch (riskProfile) {
        case 'High':
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">High</span>;
        case 'Medium':
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Medium</span>;
        case 'Low':
            return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Low</span>;
        default:
            return null;
    }
};

const BursaryDebtManagement = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [studentMap, setStudentMap] = useState<Map<string, Student>>(new Map());
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [riskProfiles, setRiskProfiles] = useState<Record<string, { riskProfile: string, justification: string }>>({});
    const [error, setError] = useState('');
    const { generateResponse } = useAI();
    const [reminderModalData, setReminderModalData] = useState<{ student: Student, invoice: Invoice } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invoicesData, paymentsData, studentsData] = await Promise.all([
                apiGetInvoices(),
                apiGetPayments(),
                apiGetStudents()
            ]);
            setInvoices(invoicesData);
            setPayments(paymentsData);
            setStudentMap(new Map(studentsData.map(s => [s.id, s])));
        } catch (err) {
            setError("Failed to load financial data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const debtors = useMemo(() => {
        return invoices
            .filter(inv => inv.status !== 'paid')
            .map(inv => ({
                invoice: inv,
                student: studentMap.get(inv.studentId),
                outstanding: inv.totalAmount - inv.amountPaid,
            }))
            .filter(item => item.student) // Ensure student exists
            .sort((a, b) => b.outstanding - a.outstanding);
    }, [invoices, studentMap]);

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        setError('');
        try {
            const studentsWithDebt = debtors.map(({ student, invoice }) => {
                const allInvoicesForStudent = invoices
                    .filter(i => i.studentId === student.id)
                    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

                let latePayments = 0;
                const recentInvoices = allInvoicesForStudent.slice(1, 4); // Look at previous 3 invoices

                recentInvoices.forEach(pastInv => {
                    const paymentsForInvoice = payments.filter(p => p.invoiceId === pastInv.id);
                    if (paymentsForInvoice.length > 0) {
                        const lastPaymentDate = paymentsForInvoice.sort((a,b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0].paymentDate;
                        if (new Date(lastPaymentDate) > new Date(pastInv.dueDate)) latePayments++;
                    } else if (new Date() > new Date(pastInv.dueDate) && pastInv.status !== 'paid') {
                        latePayments++;
                    }
                });
                
                const paymentHistorySummary = `Paid ${recentInvoices.length - latePayments} of the last ${recentInvoices.length} invoices on time.`;
                const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)));

                return {
                    studentId: student.id,
                    studentName: student.name,
                    outstandingAmount: invoice.totalAmount - invoice.amountPaid,
                    daysOverdue: daysOverdue,
                    paymentHistorySummary: paymentHistorySummary,
                };
            });
            
            if (studentsWithDebt.length === 0) {
                setIsAnalyzing(false);
                return;
            }

            const prompt = `
                You are an expert financial risk analyst for a Nigerian school. Your task is to analyze student data with outstanding fees. For each student, classify their default risk as 'Low', 'Medium', or 'High' and provide a brief justification.
                Factors to consider: A large outstanding amount or high number of days overdue increases risk. A history of late payments is a strong indicator of high risk.

                Student Data:
                ${JSON.stringify(studentsWithDebt, null, 2)}

                Return a single, valid JSON object with a key "risk_profiles" which holds an array of objects. Do not include any text outside the JSON object.
                The JSON schema for each object must be: { "studentId": "string", "riskProfile": "string (one of 'Low', 'Medium', 'High')", "justification": "string" }
            `;

            const response = await generateResponse({ prompt });
            const jsonString = response.match(/\{[\s\S]*\}/)?.[0] || '{}';
            const jsonResponse = JSON.parse(jsonString);
            
            if (jsonResponse.risk_profiles && Array.isArray(jsonResponse.risk_profiles)) {
                const profilesMap = jsonResponse.risk_profiles.reduce((acc, profile) => {
                    acc[profile.studentId] = profile;
                    return acc;
                }, {});
                setRiskProfiles(profilesMap);
            } else {
                throw new Error("AI returned data in an unexpected format.");
            }

        } catch (err) {
            setError(`AI Analysis Error: ${err.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    if (loading) return <TableSkeleton cols={5} />;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Debt Management</h2>
                    <button onClick={handleRunAnalysis} className="btn btn-primary" disabled={isAnalyzing}>
                        {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2"/> : <BrainCircuitIcon className="w-5 h-5 mr-2" />}
                        {isAnalyzing ? 'Analyzing...' : 'Run Debt Risk Analysis'}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                
                <div className="table-container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">Student</th>
                                <th className="th">Class</th>
                                <th className="th text-right">Outstanding (₦)</th>
                                <th className="th">Due Date</th>
                                <th className="th">Risk Profile</th>
                                <th className="th text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debtors.map(({ invoice, student, outstanding }) => (
                                <tr key={invoice.id}>
                                    <td className="td font-medium">{student.name}</td>
                                    <td className="td">{student.class}</td>
                                    <td className="td text-right font-mono">{outstanding.toLocaleString()}</td>
                                    <td className="td">{formatDate(invoice.dueDate)}</td>
                                    <td className="td">
                                        {isAnalyzing && !riskProfiles[student.id] ? <SpinnerIcon className="w-4 h-4 animate-spin"/> :
                                            riskProfiles[student.id] ? (
                                                <div className="flex items-center space-x-2">
                                                    {getRiskChip(riskProfiles[student.id].riskProfile)}
                                                    <div className="relative group">
                                                        <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400 cursor-pointer"/>
                                                        <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                                            {riskProfiles[student.id].justification}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                    </td>
                                    <td className="td text-right">
                                        <button 
                                            onClick={() => setReminderModalData({ student, invoice })}
                                            className="btn btn-secondary text-xs"
                                        >
                                            Send Reminder
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             {reminderModalData && (
                <AIDebtReminderModal
                    isOpen={!!reminderModalData}
                    onClose={() => setReminderModalData(null)}
                    student={reminderModalData.student}
                    invoice={reminderModalData.invoice}
                />
            )}
        </div>
    );
};

export default BursaryDebtManagement;