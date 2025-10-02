import React, { useState } from 'react';
import { apiAddTenant, apiSaveTeachers, apiGetTenants, apiSaveSchoolSettings } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { demoSchoolSettings } from '../utils/demoData';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

const SubscriptionPage = () => {
    const [schoolName, setSchoolName] = useState('');
    const [subdomain, setSubdomain] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Using a test public key for demonstration
    const PAYSTACK_PUBLIC_KEY = "pk_test_a62243685a10497577e5c54c34a873130d71a9b5";
    const PLAN_AMOUNT = 675000; // ₦6,750 in kobo for the Termly Pro plan

    const handleSubdomainChange = (e) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setSubdomain(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!schoolName || !subdomain || !adminName || !adminEmail || !password) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }

        try {
            // Check if tenant exists first
            const tenants = await apiGetTenants();
            if (tenants.some(tenant => tenant.id === subdomain)) {
                throw new Error('This portal address is already taken. Please choose another.');
            }
            
            // If all checks pass, initiate payment
            initiatePayment();

        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
            setLoading(false);
        }
    };
    
    const initiatePayment = () => {
        if (!window.PaystackPop) {
            setError("Payment service is unavailable. Please refresh and try again.");
            setLoading(false);
            return;
        }

        const handler = window.PaystackPop.setup({
            key: PAYSTACK_PUBLIC_KEY,
            email: adminEmail,
            amount: PLAN_AMOUNT,
            ref: '' + Math.floor((Math.random() * 1000000000) + 1), // Unique ref
            onClose: function(){
                setError('Payment window closed. Your school has not been created.');
                setLoading(false);
            },
            callback: async function(response){
                if (response.status === 'success') {
                    // Payment is successful, now create the school and user
                    await createSchoolAndUser();
                } else {
                    setError('Payment failed. Please try again.');
                    setLoading(false);
                }
            }
        });
        handler.openIframe();
    }
    
    const createSchoolAndUser = async () => {
        try {
            // Create the Supabase auth user
            const { data: { user }, error: signUpError } = await supabase.auth.signUp({
                email: adminEmail,
                password: password,
            });

            if (signUpError) throw signUpError;
            if (!user) throw new Error("Authentication failed after payment.");

            // Create new tenant
            // FIX: Removed `createdAt` property to match the expected type for `apiAddTenant`.
            await apiAddTenant({ id: subdomain, name: schoolName });
            
            // Save default settings for the new tenant, including the public key
            await apiSaveSchoolSettings({ ...demoSchoolSettings, schoolName, paystackPublicKey: PAYSTACK_PUBLIC_KEY }, subdomain);

            // Create first admin user
            const newAdmin = {
                id: `teacher_${Date.now()}`,
                name: adminName,
                email: adminEmail,
                role: 'Admin',
                auth_id: user.id,
            };
            await apiSaveTeachers([newAdmin], subdomain);
            
            setSuccess(true);

        } catch (err) {
             setError(`CRITICAL ERROR: Payment was successful but account setup failed. Please contact support with your email ${adminEmail}. Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    const getPortalUrl = () => {
        const { protocol, hostname, port } = window.location;
        const portString = port ? `:${port}` : '';

        if (hostname.includes('localhost')) {
            return `${protocol}//${subdomain}.localhost${portString}`;
        }
        const rootDomain = 'reportsheet.com.ng';
        return `${protocol}//${subdomain}.${rootDomain}${portString}`;
    };

    if (success) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-full max-w-lg p-8 space-y-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
                     <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">
                        School Created Successfully!
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Your school portal for <strong>{schoolName}</strong> is ready.
                    </p>
                    <a 
                        href={getPortalUrl()}
                        className="w-full btn btn-primary"
                    >
                       Go to Your New Portal
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        Create Your School Portal
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">Join ReportSheet and transform your school's management.</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800" role="alert">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="schoolName" className="label">School Name</label>
                        <input id="schoolName" type="text" required className="input-field" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="e.g., Brightstar Academy" />
                    </div>
                    
                    <div>
                        <label htmlFor="subdomain" className="label">Portal Address</label>
                        <div className="flex items-center">
                            <input id="subdomain" type="text" required className="input-field rounded-r-none" value={subdomain} onChange={handleSubdomainChange} placeholder="e.g., brightstar" />
                            <span className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md">.reportsheet.com.ng</span>
                        </div>
                         <p className="text-xs text-gray-500 mt-1">This will be your unique web address. Use only letters, numbers, and hyphens.</p>
                    </div>

                    <hr className="dark:border-gray-600" />
                    
                    <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Your Administrator Account</h2>

                     <div>
                        <label htmlFor="adminName" className="label">Your Full Name</label>
                        <input id="adminName" type="text" required className="input-field" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="e.g., Jane Doe" />
                    </div>

                    <div>
                        <label htmlFor="adminEmail" className="label">Email Address</label>
                        <input id="adminEmail" type="email" required className="input-field" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="you@example.com" />
                    </div>
                    
                    <div>
                        <label htmlFor="password" className="label">Password</label>
                        <input id="password" type="password" required className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    
                    <div>
                        <button type="submit" disabled={loading} className="w-full btn btn-primary">
                            {loading ? 'Initializing...' : 'Proceed to Payment (₦6,750)'}
                        </button>
                    </div>
                </form>
                 <p className="text-center text-sm text-gray-500">
                    Already have an account?{' '}
                    <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Go back to Sign In
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SubscriptionPage;
