import React, { useState, useEffect } from 'react';
import { apiGetTenants, apiGetPlatformSettings } from '../services/api';
import { getSubdomain } from '../utils/subdomain';
import PaymentSettings from './PaymentSettings';

const BillingDashboard = () => {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBillingInfo = async () => {
            try {
                const tenantId = getSubdomain(window.location.hostname);
                if (!tenantId) throw new Error("Could not identify school portal.");

                const [tenants, settings] = await Promise.all([
                    apiGetTenants(),
                    apiGetPlatformSettings()
                ]);

                const myTenant = tenants.find(t => t.id === tenantId);
                if (myTenant && myTenant.planId) {
                    const myPlan = (settings.plans || []).find(p => p.id === myTenant.planId);
                    setPlan(myPlan);
                }
            } catch (error) {
                console.error("Failed to load billing info:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBillingInfo();
    }, []);

    const handleUpgrade = () => {
        // In a real application, this would open a modal with plan options
        // and initiate a payment flow with Paystack.
        alert("Upgrade functionality is a placeholder. This would trigger a payment flow to change your plan.");
    };

    if (loading) return <div className="card p-6 text-center">Loading billing information...</div>;

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Billing & Subscription</h1>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <div className="card">
                        <div className="p-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">My Plan</h2>
                                <button onClick={handleUpgrade} className="btn btn-secondary">Upgrade Plan</button>
                            </div>
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {plan ? (
                                    <>
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <h3 className="font-semibold">Current Plan</h3>
                                            <p className="text-2xl font-bold mt-2">{plan.name}</p>
                                            <p className="text-sm text-gray-500">Billed Termly</p>
                                        </div>
                                        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                            <h3 className="font-semibold">Next Invoice</h3>
                                            <p className="text-2xl font-bold mt-2">{plan.price}</p>
                                            <p className="text-sm text-gray-500">Due on: 1st Sep, 2024</p>
                                        </div>
                                    </>
                                ) : (
                                     <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg col-span-2 text-center">
                                        <p>You are not subscribed to any plan.</p>
                                        <button onClick={handleUpgrade} className="mt-2 text-sm text-indigo-600">Choose a Plan</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                     <PaymentSettings />
                </div>
            </div>
        </div>
    );
};

export default BillingDashboard;