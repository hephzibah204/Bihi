import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetParents, getCurrentUser, apiGetAbsenceReports, apiUpsertAbsenceReport } from '../services/api';
import { Student, Parent, AbsenceReport } from '../types';
import { formatDate } from '../utils/dateHelpers';
import SpinnerIcon from './icons/SpinnerIcon';

const ParentAbsenceReport = ({ demoUserId }) => {
    const [student, setStudent] = useState<Student | null>(null);
    const [parent, setParent] = useState<Parent | null>(null);
    const [reports, setReports] = useState<AbsenceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [reason, setReason] = useState<'Sickness' | 'Family Emergency' | 'Other'>('Sickness');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        if (!demoUserId) {
            setError("Student profile not selected.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const [students, currentUser, absenceReports] = await Promise.all([
                apiGetStudents(),
                getCurrentUser(),
                apiGetAbsenceReports()
            ]);
            const currentStudent = students.find(s => s.id === demoUserId);
            if (!currentStudent) throw new Error("Student not found.");
            
            setStudent(currentStudent);
            setParent(currentUser);
            setReports(absenceReports.filter(r => r.studentId === demoUserId)
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (err) {
            setError("Could not load data. " + err.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [demoUserId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student || !parent) {
            setError("Cannot submit report without student or parent information.");
            return;
        }
        setIsSubmitting(true);
        try {
            const newReport: Partial<AbsenceReport> = {
                studentId: student.id,
                reportedByParentId: parent.id,
                date,
                reason,
                details,
                status: 'Pending',
            };
            await apiUpsertAbsenceReport(newReport);
            // Refetch data to show the new report
            await fetchData();
            // Reset form
            setDate(new Date().toISOString().split('T')[0]);
            setReason('Sickness');
            setDetails('');
        } catch (err) {
            setError("Failed to submit report: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="card p-6 text-center"><SpinnerIcon className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
                <div className="card">
                    <div className="p-6">
                        <h2 className="text-xl font-semibold">Report Absence for {student?.name}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div>
                                <label className="label">Date of Absence</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" required/>
                            </div>
                            <div>
                                <label className="label">Reason</label>
                                <select value={reason} onChange={e => setReason(e.target.value as any)} className="input-field">
                                    <option>Sickness</option>
                                    <option>Family Emergency</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Details (Optional)</label>
                                <textarea value={details} onChange={e => setDetails(e.target.value)} className="input-field" rows={3}></textarea>
                            </div>
                            <div className="text-right">
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? <SpinnerIcon className="w-5 h-5 animate-spin"/> : 'Submit Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                 <div className="card">
                    <div className="p-6">
                         <h2 className="text-xl font-semibold">Absence History</h2>
                         <div className="table-container mt-4">
                            <table className="table">
                                <thead><tr><th className="th">Date</th><th className="th">Reason</th><th className="th">Status</th></tr></thead>
                                <tbody>
                                    {reports.length > 0 ? reports.map(report => (
                                        <tr key={report.id}>
                                            <td className="td">{formatDate(report.date)}</td>
                                            <td className="td">{report.reason}</td>
                                            <td className="td"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.status === 'Acknowledged' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{report.status}</span></td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={3} className="td text-center text-gray-500">No absence reports submitted.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentAbsenceReport;