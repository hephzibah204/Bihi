import React, { useState, useEffect } from 'react';
import { apiGetPlatformSettings, apiGetSchoolSettings, apiUpdateTenantSubscription } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { Plan } from '../types';
import CheckIcon from './icons/CheckIcon';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PlanSelectorProps {
    isSubscribed: boolean;
    planName: string | null;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ isSubscribed, planName }) => {
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'termly' | 'yearly'>('termly');
    const [loading, setLoading] = useState(true);
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
                console.error("Failed to load plans data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const ensurePaystackScript = async () => {
        if (typeof window !== 'undefined' && window.PaystackPop) return;
        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Paystack script'));
            document.head.appendChild(script);
        });
    };

    const handleSubscribe = async (plan: Plan) => {
        const paystackKey = schoolSettings?.paystackPublicKey;
        try {
            await ensurePaystackScript();
        } catch (e: any) {
            alert(`Unable to initialize payment: ${e.message || 'Unknown error'}`);
            return;
        }

        if (!window.PaystackPop || !paystackKey || !userEmail) {
            alert("Payment service is not configured. Please contact support.");
            return;
        }

        // In non-HTTPS environments (except localhost), the Paystack popup can fail.
        if (window.location.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
            console.warn('Paystack popup may fail over non-HTTPS. Use HTTPS or localhost for testing.');
        }

        let priceValue;
        switch (billingCycle) {
            case 'monthly':
                priceValue = plan.price_monthly;
                break;
            case 'termly':
                priceValue = plan.price_termly;
                break;
            case 'yearly':
                priceValue = plan.price_yearly;
                break;
            default:
                priceValue = plan.price_monthly;
        }
        const price = priceValue * 100; // Price in kobo

        const handler = window.PaystackPop.setup({
            key: paystackKey,
            email: userEmail,
            amount: price,
            ref: `sub_${plan.id}_${Date.now()}`,
            onClose: () => {},
            callback: async (response) => {
                if (response.status === 'success') {
                    try {
                        await apiUpdateTenantSubscription(plan.id, billingCycle);
                        alert('Subscription successful! The page will now reload to apply your new plan.');
                        window.location.reload();
                    } catch (error) {
                        alert(`There was an error updating your subscription: ${error.message}`);
                    }
                } else {
                    alert('Payment failed. Please try again.');
                }
            }
        });
        handler.openIframe();
    };

    if (loading) {
        return <div className="card mt-8 p-6 text-center">Loading plans...</div>;
    }

    return (
        <div className="card mt-8">
            <div className="p-6">
                <h2 className="text-xl font-semibold">Available Plans</h2>
                <p className="text-sm text-gray-500">Choose a plan to unlock features and supercharge your school.</p>
                
                <div className="flex justify-center my-6">
                    <div className="pricing-toggle">
                        <button onClick={() => setBillingCycle('monthly')} aria-pressed={billingCycle === 'monthly'}>Monthly</button>
                        <button onClick={() => setBillingCycle('termly')} aria-pressed={billingCycle === 'termly'}>Termly</button>
                        <button onClick={() => setBillingCycle('yearly')} aria-pressed={billingCycle === 'yearly'}>Yearly <span className="ml-2 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">Save 20%</span></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {allPlans.map(plan => {
                        let priceForDisplay;
                        switch (billingCycle) {
                            case 'monthly': priceForDisplay = plan.price_monthly; break;
                            case 'termly': priceForDisplay = plan.price_termly; break;
                            case 'yearly': priceForDisplay = plan.price_yearly; break;
                            default: priceForDisplay = plan.price_monthly;
                        }

                        const isCurrentPlan = plan.name === planName;

                        return (
                            <div key={plan.id} className={`p-6 border rounded-lg flex flex-col ${isCurrentPlan ? 'border-indigo-500 ring-2 ring-indigo-300' : 'dark:border-gray-700'}`}>
                                <h3 className="text-lg font-bold">{plan.name}</h3>
                                <p className="mt-4 text-3xl font-bold">₦{priceForDisplay.toLocaleString()}</p>
                                <ul className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-300 flex-grow">
                                    <li className="flex items-center"><CheckIcon className="w-4 h-4 mr-2 text-green-500"/> Up to {plan.features.maxStudents} students</li>
                                    <li className={`flex items-center ${plan.features['ai-tools'] ? '' : 'text-gray-400 line-through'}`}><CheckIcon className="w-4 h-4 mr-2 text-green-500"/> AI Assistant Tools</li>
                                    <li className={`flex items-center ${plan.features['analytics'] ? '' : 'text-gray-400 line-through'}`}><CheckIcon className="w-4 h-4 mr-2 text-green-500"/> Advanced Analytics</li>
                                </ul>
                                <button 
                                    onClick={() => handleSubscribe(plan)} 
                                    className={`btn ${isCurrentPlan ? 'btn-secondary' : 'btn-primary'} mt-8`}
                                    disabled={isCurrentPlan}
                                >
                                    {isCurrentPlan ? 'Current Plan' : isSubscribed ? 'Switch Plan' : 'Subscribe'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PlanSelector;