
import React, { useState, useEffect } from 'react';
import { apiGetTenants } from '../services/api';

const PlatformAnalytics = () => {
    const [totalSchools, setTotalSchools] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const tenants = await apiGetTenants();
            setTotalSchools(tenants.length);
            setLoading(false);
        };
        fetchAnalytics();
    }, []);

    if (loading) return <p>Loading analytics...</p>;

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Platform Analytics</h2>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
                        <p className="text-3xl font-bold">{totalSchools}</p>
                        <p className="text-gray-500">Total Schools</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformAnalytics;
