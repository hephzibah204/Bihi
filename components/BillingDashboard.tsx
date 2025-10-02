import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiGetSchoolSettings, updateSchoolSettings } from '../services/api';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import { supabase } from '../services/supabaseClient';
import CheckIcon from './icons/CheckIcon';
import { Plan } from '../types';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const BillingDashboard = () => {
    const { isSubscribed, planName, isLoading } = usePlanFeatures();
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [billingCycle, setBillingCycle] = useState('termly');
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [schoolSettings, setSchoolSettings] = useState(null);
    const [userEmail, setUserEmail] = useState('');

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [platform, school] = await Promise.all([
                    apiGetPlatformSettings(),
                    apiGetSchoolSettings()
                ]);
                setAllPlans(platform.plans || []);
                setSchoolSettings(school);
                
                if (supabase) {
                    const { data } = await supabase.auth.getUser();
                    if (data?.user) setUserEmail(data.user.email);
                }
            } catch (error) {
                console.error("Failed to load billing data:", error);
            } finally {
                setLoadingPlans(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleSubscribe = (plan: Plan) => {
        const paystackKey = schoolSettings?.paystackPublicKey;
        if (!window.PaystackPop || !paystackKey || !userEmail) {
            alert("Payment service is not configured. Please contact support.");
            return;
        }
        
        const price = plan[`price_${billingCycle}`] * 100; // Price in kobo

        const handler = window.PaystackPop.setup({
            key: paystackKey,
            email: userEmail,
            amount: price,
            ref: `sub_${plan.id}_${Date.now()}`,
            onClose: () => {},
            callback: async (response) => {
                if (response.status === 'success') {
                    // Payment successful, update the user's plan
                    await updateSchoolSettings(currentSettings => ({
                        ...currentSettings,
                        planId: plan.id,
                    }));
                    // Reload the page to reflect the new subscription status
                    window.location.reload();
                } else {
                    alert('Payment failed. Please try again.');
                }
            }
        });
        handler.openIframe();
    };


    const renderCurrentPlan = () => (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Subscription Overview</h2>
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <p><strong>Current Plan:</strong> {planName}</p>
                    <p><strong>Status:</strong> {isSubscribed ? 'Active' : 'Not Subscribed'}</p>
                    {isSubscribed && <p><strong>Next Billing Date:</strong> September 1, 2024</p>}
                </div>
            </div>
        </div>
    );
    
    const renderPlans = () => {
         if (loadingPlans) return <div className="text-center p-8">Loading plans...</div>;
        
        return (
            <div className="card mt-8">
                <div className="p-6">
                    <h2 className="text-xl font-semibold">Available Plans</h2>
                    <p className="text-sm text-gray-500">Choose a plan to unlock features and supercharge your school.</p>
                    
                    <div className="flex justify-center my-6">
                        <div className="pricing-toggle">
                            <button onClick={() => setBillingCycle('monthly')} className={billingCycle === 'monthly' ? 'active' : ''}>Monthly</button>
                            <button onClick={() => setBillingCycle('termly')} className={billingCycle === 'termly' ? 'active' : ''}>Termly</button>
                            <button onClick={() => setBillingCycle('yearly')} className={billingCycle === 'yearly' ? 'active' : ''}>Yearly <span className="ml-2 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">Save 20%</span></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {allPlans.map(plan => (
                            <div key={plan.id} className="p-6 border dark:border-gray-700 rounded-lg flex flex-col">
                                <h3 className="text-lg font-bold">{plan.name}</h3>
                                <p className="mt-4 text-3xl font-bold">₦{plan[`price_${billingCycle}`].toLocaleString()}</p>
                                <ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    <li className="flex items-center"><CheckIcon className="w-4 h-4 mr-2 text-green-500"/> Up to {plan.features.maxStudents} students</li>
                                    <li className={`flex items-center ${plan.features.hasAI ? '' : 'text-gray-400 line-through'}`}><CheckIcon className="w-4 h-4 mr-2 text-green-500"/> AI Assistant Tools</li>
                                    <li className={`flex items-center ${plan.features.hasAnalytics ? '' : 'text-gray-400 line-through'}`}><CheckIcon className="w-4 h-4 mr-2 text-green-500"/> Advanced Analytics</li>
                                </ul>
                                <button onClick={() => handleSubscribe(plan)} className="btn btn-primary mt-auto">
                                    {isSubscribed ? 'Switch Plan' : 'Subscribe'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div>
            {isLoading ? <div>Loading...</div> : renderCurrentPlan()}
            {renderPlans()}
        </div>
    );
};

export default BillingDashboard;