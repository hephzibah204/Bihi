import React from 'react';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import PlanSelector from './PlanSelector';

const BillingDashboard = () => {
    const { isSubscribed, planName, isLoading } = usePlanFeatures();

    const renderCurrentPlan = () => (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Subscription Overview</h2>
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p><strong>Current Plan:</strong> {planName}</p>
                    <p><strong>Status:</strong> {isSubscribed ? 'Active' : 'Not Subscribed'}</p>
                </div>
            </div>
        </div>
    );
    
    return (
        <div>
            {isLoading ? <div className="card p-6">Loading subscription details...</div> : renderCurrentPlan()}
            <PlanSelector isSubscribed={isSubscribed} planName={planName} />
        </div>
    );
};

export default BillingDashboard;
