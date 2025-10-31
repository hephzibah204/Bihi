import React, { useState, useEffect } from 'react';
import { apiGetAttendance, apiGetStudents } from '../services/api';
import { formatDate } from '../utils/dateHelpers';

const ParentAttendance = ({ demoUserId }) => {
    const [attendanceLog, setAttendanceLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true);
            setError('');
            try {
                const students = await apiGetStudents();
                // Resolve effective student id
                let effectiveId = demoUserId || null;
                if (!effectiveId && typeof window !== 'undefined') {
                    try {
                        const raw = sessionStorage.getItem('activeUser');
                        const active = raw ? JSON.parse(raw) : null;
                        if (active?.userId) effectiveId = active.userId;
                    } catch {}
                }
                if (!effectiveId && students.length > 0) {
                    effectiveId = students[0].id;
                }

                if (!effectiveId) {
                    setError('Child profile not selected.');
                    setAttendanceLog([]);
                    return;
                }

                const allAttendance = await apiGetAttendance();
                const log = allAttendance
                    .map(record => ({
                        date: record.date,
                        status: record.statuses?.[effectiveId]
                    }))
                    .filter(item => item.status)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setAttendanceLog(log);
            } catch (err) {
                setError('Could not load attendance data.');
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [demoUserId]);

    if (loading) return <div className="card p-6 text-center">Loading attendance...</div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;

    const getStatusChip = (status) => {
        switch (status) {
            case 'present': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Present</span>;
            case 'late': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Late</span>;
            case 'absent': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Absent</span>;
            default: return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">N/A</span>;
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Attendance Log</h2>
                {attendanceLog.length > 0 ? (
                    <ul className="divide-y mt-4">
                        {attendanceLog.map(item => (
                            <li key={item.date} className="py-3 flex justify-between items-center">
                                <span>{formatDate(item.date)}</span>
                                {getStatusChip(item.status)}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-4 text-center text-gray-500">No attendance records found.</p>
                )}
            </div>
        </div>
    );
};

export default ParentAttendance;
