import React, { useState, useEffect } from 'react';
// Fix: Replaced non-existent apiGetStudentsForClasses with apiGetStudents.
import { apiGetFees, apiGetStudents, apiGetSubjects } from '../services/api';
import { Subject } from '../types';
import { formatDate } from '../utils/dateHelpers';

const BursaryInvoice = () => {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [fees, setFees] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            const [feeData, allSubjects]: [any[], Subject[]] = await Promise.all([apiGetFees(), apiGetSubjects()]);
            setFees(feeData || []);
            const allClasses = [...new Set(allSubjects.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            if (allClasses.length > 0) {
                setSelectedClass(allClasses[0]);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedClass) return;
        const fetchStudents = async () => {
            // Fix: Updated function call to use a filter object as expected by apiGetStudents.
            const classStudents = await apiGetStudents({ classFilter: selectedClass });
            setStudents(classStudents);
            setSelectedStudent(classStudents.length > 0 ? classStudents[0] : null);
        };
        fetchStudents();
    }, [selectedClass]);

    const handleGenerateInvoice = () => {
        if (!selectedStudent) return;
        const studentFees = fees.filter(fee => fee.classes.includes(selectedStudent.class));
        const total = studentFees.reduce((sum, fee) => sum + Number(fee.amount), 0);
        setInvoiceData({
            student: selectedStudent,
            items: studentFees,
            total: total,
            date: formatDate(new Date().toISOString()),
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="card">
            <div className="p-6 no-print">
                <h2 className="text-xl font-semibold">Generate Student Invoice</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="label">Class</label>
                        <select className="input-field" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="label">Student</label>
                        <select className="input-field" value={selectedStudent?.id || ''} onChange={e => setSelectedStudent(students.find(s => s.id === e.target.value))}>
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleGenerateInvoice} className="btn btn-primary" disabled={!selectedStudent}>
                        Generate Invoice
                    </button>
                </div>
            </div>

            {invoiceData && (
                <div className="p-6 border-t dark:border-gray-700">
                    <div id="invoice-print-area" className="bg-white dark:bg-gray-800 p-8 shadow-lg print-container">
                        <h3 className="text-2xl font-bold text-center">INVOICE</h3>
                        <div className="flex justify-between mt-4">
                            <div>
                                <p><strong>Bill To:</strong> {invoiceData.student.name}</p>
                                <p><strong>Class:</strong> {invoiceData.student.class}</p>
                                <p><strong>Admission No:</strong> {invoiceData.student.admissionNo}</p>
                            </div>
                             <div>
                                <p><strong>Date:</strong> {invoiceData.date}</p>
                            </div>
                        </div>
                        <table className="w-full mt-6">
                            <thead className="bg-gray-100 dark:bg-gray-700">
                                <tr><th className="th text-left">Description</th><th className="th text-right">Amount (₦)</th></tr>
                            </thead>
                            <tbody>
                                {invoiceData.items.map(item => (
                                    <tr key={item.id} className="border-b dark:border-gray-700">
                                        <td className="td">{item.description}</td>
                                        <td className="td text-right">{Number(item.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="td text-right font-bold text-lg">Total:</td>
                                    <td className="td text-right font-bold text-lg">₦{invoiceData.total.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    <div className="text-center mt-6 no-print">
                        <button onClick={handlePrint} className="btn btn-primary">Print Invoice</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BursaryInvoice;
