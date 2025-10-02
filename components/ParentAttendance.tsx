import React, { useState, useEffect } from 'react';
import { apiGetAttendance, apiGetStudents } from '../services/api';

const ParentAttendance = ({ demoUserId }) => {
    const [attendance, setAttendance] = useState([]);
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            setError("Child profile not selected.");
            return;
        }
        const fetchAttendance = async () => {
            setLoading(true);
            setError('');
            try {
                const [allAttendanceRecords, allStudents] = await Promise.all([
                    apiGetAttendance(),
                    apiGetStudents()
                ]);

                const currentChild = allStudents.find(s => s.id === demoUserId);
                if (!currentChild) {
                    throw new Error("Child's profile not found.");
                }
                setChild(currentChild);
                
                // Process the attendance records to get a list of dates and statuses for the specific child
                const childAttendance = allAttendanceRecords.map(record => {
                    const status = record.statuses[demoUserId];
                    if (status) {
                        return { date: record.date, status };
                    }
                    return null;
                }).filter(Boolean); // Filter out nulls for days the child wasn't marked

                setAttendance(childAttendance);

            } catch (err) {
                setError("Could not load attendance records.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [demoUserId]);

    if (loading) return <div className="card p-6 text-center">Loading attendance...</div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Attendance for {child?.name}</h1>
            <div className="table-container mt-6">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Date</th>
                            <th className="th">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {attendance.length > 0 ? [...attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                            <tr key={record.date}>
                                <td className="td">{new Date(record.date).toLocaleDateString()}</td>
                                <td className="td">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {record.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="2" className="td text-center">No attendance records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ParentAttendance;