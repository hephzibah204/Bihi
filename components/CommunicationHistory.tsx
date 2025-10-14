import React, { useState, useEffect } from 'react';
import { apiGetCommunicationLogs } from '../services/api';
import { CommunicationLog } from '../types';
import { formatDate } from '../utils/dateHelpers';
import SpinnerIcon from './icons/SpinnerIcon';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';

const CommunicationHistory = () => {
    const [logs, setLogs] = useState<CommunicationLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await apiGetCommunicationLogs();
                setLogs(data.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()));
            } catch (error) {
                // error handled silently
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) {
        return <div className="card p-6"><TableSkeleton cols={4} /></div>;
    }

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Communication History</h2>
                <p className="text-sm text-gray-500 mt-1">A log of all bulk announcements and reminders sent from the platform.</p>
                {logs.length === 0 ? (
                    <div className="mt-4">
                        <EmptyState message="No communications have been sent yet." />
                    </div>
                ) : (
                    <div className="table-container mt-4">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="th">Date Sent</th>
                                    <th className="th">Type</th>
                                    <th className="th">Channel</th>
                                    <th className="th">Content</th>
                                    <th className="th">Recipients</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="td whitespace-nowrap">{new Date(log.sentAt).toLocaleString()}</td>
                                        <td className="td capitalize">{log.type}</td>
                                        <td className="td capitalize">{log.channel}</td>
                                        <td className="td"><p className="truncate max-w-sm">{log.content}</p></td>
                                        <td className="td">{Array.isArray(log.recipients) ? log.recipients.length : 'N/A'}</td>
                                    </tr>
                                ))
                                }
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunicationHistory;