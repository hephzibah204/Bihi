
import React, { useState, useEffect } from 'react';
import { apiGetTenants, apiGetPlatformSettings } from '../services/api';

const AdminBillingPage = () => {
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [tenantData, settingsData] = await Promise.all([
                    apiGetTenants(),
                    apiGetPlatformSettings()
                ]);
                setTenants(tenantData);
                setPlans(settingsData.plans || []);
            } catch (error) {
                console.error("Failed to load billing data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getPlanName = (planId) => {
        const plan = plans.find(p => p.id === planId);
        return plan ? plan.name : 'No Plan';
    };
    
    if (loading) return <div className="card p-6 text-center">Loading tenant billing information...</div>

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Tenant Billing Management</h2>
                <div className="table-container mt-4">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th">School</th>
                                <th className="th">Plan</th>
                                <th className="th">Status</th>
                                <th className="th">Next Billing Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y dark:divide-gray-700">
                            {tenants.map(tenant => (
                                <tr key={tenant.id}>
                                    <td className="td font-medium">{tenant.name}</td>
                                    <td className="td">{getPlanName(tenant.planId)}</td>
                                    <td className="td">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Active
                                        </span>
                                    </td>
                                    <td className="td">1st Sep, 2024</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminBillingPage;
