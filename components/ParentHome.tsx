import React, { useState, useEffect } from 'react';
import { apiGetAttendance, apiGetBehavioralRecords, apiGetStudents } from '../services/api';

const ParentHome = ({ demoUserId }) => {
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ attendance: null, behavior: null });

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            return;
        }
        const fetchSummary = async () => {
            try {
                const [allStudents, allAttendance, allBehavioral] = await Promise.all([
                    apiGetStudents(),
                    apiGetAttendance(),
                    apiGetBehavioralRecords()
                ]);

                const currentChild = allStudents.find(s => s.id === demoUserId);
                setChild(currentChild);

                // Get latest attendance
                const today = new Date().toISOString().split('T')[0];
                const latestAttendanceRecord = allAttendance
                    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .find(rec => rec.date <= today);
                const latestStatus = latestAttendanceRecord?.statuses[demoUserId] || 'N/A';

                // Get latest behavioral record
                const childBehavior = allBehavioral
                    .filter(rec => rec.studentId === demoUserId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const latestBehavior = childBehavior.length > 0 ? childBehavior[0] : null;

                setSummary({ attendance: latestStatus, behavior: latestBehavior });
            } catch (error) {
                console.error("Failed to load parent dashboard summary", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [demoUserId]);

    if (loading) {
        return <div className="card p-6 text-center">Loading dashboard...</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Parent Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome! Here's a summary for {child?.name}.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="card p-6">
                    <h3 className="font-semibold">Latest Attendance Record</h3>
                    <p className={`mt-2 text-3xl font-bold capitalize ${
                        summary.attendance === 'present' ? 'text-green-500' :
                        summary.attendance === 'late' ? 'text-yellow-500' :
                        summary.attendance === 'absent' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                        {summary.attendance}
                    </p>
                </div>
                <div className="card p-6">
                    <h3 className="font-semibold">Latest Behavioral Note</h3>
                    {summary.behavior ? (
                         <div>
                             <p className={`mt-2 font-bold capitalize ${summary.behavior.type === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                                {summary.behavior.type}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{summary.behavior.remark}</p>
                         </div>
                    ) : (
                        <p className="mt-2 text-gray-500">No behavioral records found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ParentHome;