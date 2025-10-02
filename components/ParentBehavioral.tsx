import React, { useState, useEffect } from 'react';
import { apiGetBehavioralRecords, apiGetStudents } from '../services/api';

const ParentBehavioral = ({ demoUserId }) => {
    const [records, setRecords] = useState([]);
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            setError("Child profile not selected.");
            return;
        }
        const fetchRecords = async () => {
            setLoading(true);
            setError('');
            try {
                const [allRecords, allStudents] = await Promise.all([
                    apiGetBehavioralRecords(),
                    apiGetStudents()
                ]);

                const currentChild = allStudents.find(s => s.id === demoUserId);
                if (!currentChild) throw new Error("Child's profile not found.");
                setChild(currentChild);
                
                const childRecords = allRecords.filter(rec => rec.studentId === demoUserId);
                setRecords(childRecords);

            } catch (err) {
                setError("Could not load behavioral records.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRecords();
    }, [demoUserId]);

    if (loading) return <div className="card p-6 text-center">Loading records...</div>;
    if (error) return <div className="card p-6 text-center text-red-500">{error}</div>;

    return (
        <div>
            <div className="space-y-4 mt-6">
                {records.length > 0 ? records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                    <div key={record.id} className="card p-4">
                        <div className="flex justify-between items-start">
                            <p className="font-semibold capitalize text-lg">{record.type} Remark</p>
                            <p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p>
                        </div>
                        <p className="mt-2">{record.remark}</p>
                    </div>
                )) : (
                    <div className="card p-6 text-center">
                        No behavioral records found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParentBehavioral;