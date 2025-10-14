import React, { useState, useEffect } from 'react';
import { apiGetAbsenceReports, apiUpsertAbsenceReport, apiGetStudents } from '../services/api';
import { AbsenceReport, Student } from '../types';
import { formatDate } from '../utils/dateHelpers';
import SpinnerIcon from './icons/SpinnerIcon';

const AbsenceManagement = () => {
    const [reports, setReports] = useState<AbsenceReport[]>([]);
    const [studentMap, setStudentMap] = useState<Map<string, Student>>(new Map());
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reportsData, studentsData] = await Promise.all([
                apiGetAbsenceReports(),
                apiGetStudents()
            ]);
            setReports(reportsData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setStudentMap(new Map(studentsData.map(s => [s.id, s])));
        } catch (error) {
            console.error("Failed to load absence reports:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAcknowledge = async (report: AbsenceReport) => {
        await apiUpsertAbsenceReport({ ...report, status: 'Acknowledged' });
        fetchData();
    };
    
    const filteredReports = reports.filter(r => filter === 'All' || r.status === filter);

    if (loading) return <div className="card p-6 text-center"><SpinnerIcon className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>;

    return (
        <div className="card p-6">
            <h2 className="text-xl font-semibold">Absence Reports from Parents</h2>
            <div className="my-4">
                <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field w-auto">
                    <option>Pending</option>
                    <option>Acknowledged</option>
                    <option>All</option>
                </select>
            </div>
             <div className="table-container">
                <table className="table">
                    <thead><tr><th className="th">Student</th><th className="th">Date of Absence</th><th className="th">Reason</th><th className="th">Details</th><th className="th">Status</th><th className="th">Actions</th></tr></thead>
                    <tbody>
                        {filteredReports.length > 0 ? filteredReports.map(report => {
                            const student = studentMap.get(report.studentId);
                            return (
                                <tr key={report.id}>
                                    <td className="td">{student?.name || 'Unknown'} ({student?.class})</td>
                                    <td className="td">{formatDate(report.date)}</td>
                                    <td className="td">{report.reason}</td>
                                    <td className="td">{report.details}</td>
                                    <td className="td">{report.status}</td>
                                    <td className="td">
                                        {report.status === 'Pending' && <button onClick={() => handleAcknowledge(report)} className="btn btn-secondary text-sm">Acknowledge</button>}
                                    </td>
                                </tr>
                            )
                        }) : (
                            <tr><td colSpan={6} className="td text-center text-gray-500">No {filter} reports.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AbsenceManagement;
