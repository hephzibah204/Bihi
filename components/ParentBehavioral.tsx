import React, { useState, useEffect } from 'react';
import { apiGetBehavioralRecords } from '../services/api';
import { formatDate } from '../utils/dateHelpers';

const ParentBehavioral = ({ demoUserId }) => {
    const [remarks, setRemarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            setError("Child profile not selected.");
            return;
        }

        const fetchRemarks = async () => {
            try {
                const allRemarks = await apiGetBehavioralRecords();
                const studentRemarks = allRemarks
                    .filter(r => r.studentId === demoUserId)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRemarks(studentRemarks);
            } catch (err) {
                setError("Could not load behavioral data.");
            } finally {
                setLoading(false);
            }
        };

        fetchRemarks();
    }, [demoUserId]);

    if (loading) return <div className="card p-6 text-center">Loading remarks...</div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;
    
    const getTypeChip = (type) => {
        switch (type) {
            case 'positive': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Positive</span>;
            case 'negative': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Negative</span>;
            default: return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Neutral</span>;
        }
    };


    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Behavioral Remarks</h2>
                {remarks.length > 0 ? (
                    <div className="space-y-4 mt-4">
                        {remarks.map(remark => (
                            <div key={remark.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start">
                                    {getTypeChip(remark.type)}
                                    <span className="text-sm text-gray-500">{formatDate(remark.date)}</span>
                                </div>
                                <p className="mt-2 text-gray-700">{remark.remark}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="mt-4 text-center text-gray-500">No behavioral remarks have been recorded.</p>
                )}
            </div>
        </div>
    );
};

export default ParentBehavioral;
