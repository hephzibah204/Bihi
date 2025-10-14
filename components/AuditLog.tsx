import React, { useState, useEffect } from 'react';
import { apiGetActivityLog } from '../services/api';
import { formatDate } from '../utils/dateHelpers';
import SpinnerIcon from './icons/SpinnerIcon';

const AuditLog = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLog = async () => {
            setLoading(true);
            const data = await apiGetActivityLog();
            setActivities(data);
            setLoading(false);
        };
        fetchLog();
    }, []);

    if (loading) {
        return <div className="p-6 text-center"><SpinnerIcon className="w-6 h-6 animate-spin mx-auto"/></div>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Activity Audit Log</h2>
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Date & Time</th>
                            <th className="th">User</th>
                            <th className="th">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map(activity => (
                            <tr key={activity.id}>
                                <td className="td text-sm">{new Date(activity.timestamp).toLocaleString()}</td>
                                <td className="td">{activity.user}</td>
                                <td className="td">{activity.description}</td>
                            </tr>
                        ))}
                         {activities.length === 0 && (
                            <tr><td colSpan={3} className="td text-center text-gray-500">No recent activity recorded.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLog;
