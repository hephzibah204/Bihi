import React, { useState } from 'react';
import SpinnerIcon from './icons/SpinnerIcon';
import Logo from './icons/Logo';
import { getPortalUrl, isProductionDomain, getDomainConfiguration } from '../utils/subdomain';
import { supabase } from '../services/supabaseClient';

const SubscriptionPage = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        schoolName: '',
        schoolType: 'secondary',
        subdomain: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const portalUrl = getPortalUrl(formData.subdomain);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === 'subdomain') {
            processedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const registerEndpoint = import.meta.env.VITE_SUPABASE_FUNCTION_REGISTER_URL || '/api/register';
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const maybeSupabase = registerEndpoint.includes('.supabase.co/functions/v1');
            const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (maybeSupabase && publishableKey) {
                headers['apikey'] = publishableKey as string;
            }

            // If the user already has a session, include JWT for protected functions
            if (maybeSupabase && supabase?.auth) {
                try {
                    const { data } = await supabase.auth.getSession();
                    const token = data?.session?.access_token;
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                } catch { /* ignore */ }
            }

            const response = await fetch(registerEndpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...formData,
                    // Align with Supabase function expected field
                    name: formData.schoolName,
                    // Ensure both slug and subdomain are provided for schema-aware backends
                    slug: formData.subdomain,
                    subdomain: formData.subdomain,
                    emailRedirectTo: portalUrl,
                })
            });

            // Check if response is OK before trying to parse JSON
            if (!response.ok) {
                // Try to get error details from response, but handle empty responses gracefully
                let errorDetails = 'Registration failed';
                try {
                    const errorData = await response.json();
                    errorDetails = errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
                } catch (jsonError) {
                    // If JSON parsing fails, use status text
                    errorDetails = `HTTP ${response.status}: ${response.statusText || 'No response body'}`;
                }
                throw new Error(errorDetails);
            }

            // Only parse JSON if response is successful
            const data = await response.json();
            
            // Clear any lingering demo session data to ensure the new portal is clean.
            sessionStorage.removeItem('isDemoMode');
            sessionStorage.removeItem('activeUser');

            // Dev/local: persist the new tenant so validation passes without a backend
            try {
                const existing = localStorage.getItem('dev_tenants');
                const list = existing ? JSON.parse(existing) : [];
                const entry = { id: formData.subdomain, name: formData.schoolName };
                if (!Array.isArray(list)) {
                    localStorage.setItem('dev_tenants', JSON.stringify([entry]));
                } else if (!list.some((t: any) => t.id === entry.id)) {
                    localStorage.setItem('dev_tenants', JSON.stringify([...list, entry]));
                }
            } catch {}

            // Record recent registration marker for tenant validation fallback (expires after 15 minutes)
            try {
                const marker = { id: formData.subdomain, ts: Date.now() };
                localStorage.setItem('recentlyRegisteredTenant', JSON.stringify(marker));
            } catch {}

            setStep(3);
        } catch (err) {
            let errorMessage = err.message;
            if (err.message.toLowerCase().includes('failed to fetch')) {
                errorMessage = "A network error occurred. Please check your connection and try again.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const { protocol, hostname, port } = window.location;
    const isProdDomain = isProductionDomain();
    const domainConfig = getDomainConfiguration();
    const displayPort = port ? `:${port}` : '';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                 <div className="text-center mb-8">
                    <Logo className="w-12 h-12 mx-auto" />
                    <h1 className="text-3xl font-bold mt-2">Create your ReportSheet Account</h1>
                </div>

                <div className="card p-8">
                     {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Step 1: School Details</h2>
                            <div className="space-y-4">
                                <div><label className="label">School Name</label><input type="text" name="schoolName" value={formData.schoolName} onChange={handleChange} className="input-field" placeholder="Brightstar Academy" required /></div>
                                <div><label className="label">School Level</label><select name="schoolType" value={formData.schoolType} onChange={handleChange} className="input-field"><option value="nursery_primary">Nursery & Primary</option><option value="secondary">Secondary</option><option value="all">All Levels</option></select></div>
                                <div>
                                    <label className="label">Portal Address</label>
                                    <div className="flex items-center">
                                        {isProdDomain && domainConfig.useSubdomains ? (
                                            <>
                                                <span className="px-3 py-2.5 bg-gray-100 border border-r-0 rounded-l-md text-sm text-gray-500">{`${protocol}//`}</span>
                                                <input type="text" name="subdomain" value={formData.subdomain} onChange={handleChange} className="input-field rounded-none" placeholder="brightstar" required />
                                                <span className="px-3 py-2.5 bg-gray-100 border border-l-0 rounded-r-md text-sm text-gray-500">{`.${domainConfig.rootDomains.find(d => hostname === d || hostname === `www.${d}`) || domainConfig.rootDomains[0]}${displayPort}`}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="px-3 py-2.5 bg-gray-100 border border-r-0 rounded-l-md text-sm text-gray-500">{`${protocol}//${hostname}${displayPort}/?tenant=`}</span>
                                                <input type="text" name="subdomain" value={formData.subdomain} onChange={handleChange} className="input-field rounded-l-none" placeholder="brightstar" required />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right mt-6"><button onClick={handleNext} disabled={!formData.schoolName || !formData.subdomain} className="btn btn-primary">Next</button></div>
                        </div>
                    )}
                    {step === 2 && (
                         <form onSubmit={handleSubmit}>
                            <h2 className="text-xl font-semibold mb-4">Step 2: Admin Account</h2>
                            <div className="space-y-4">
                                <div><label className="label">Your Full Name</label><input type="text" name="adminName" value={formData.adminName} onChange={handleChange} className="input-field" placeholder="Funke Akindele" required /></div>
                                <div><label className="label">Your Email</label><input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} className="input-field" placeholder="you@example.com" required /></div>
                                <div><label className="label">Password</label><input type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} className="input-field" placeholder="••••••••" required minLength={6} /></div>
                            </div>
                            <div className="flex justify-between items-center mt-6">
                                <button type="button" onClick={handleBack} className="btn btn-secondary">Back</button>
                                <button type="submit" className="btn btn-primary" disabled={loading || !formData.adminName || !formData.adminEmail || !formData.adminPassword}>
                                    {loading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : "Create Account"}
                                </button>
                            </div>
                        </form>
                    )}
                     {step === 3 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-indigo-600">Success! Your Portal is Ready!</h2>
                            <p className="mt-4">You can now sign in to your new school portal at:</p>
                            <a href={portalUrl} className="my-4 block font-mono text-lg text-indigo-600 underline break-all" target="_blank" rel="noopener noreferrer">{portalUrl}</a>
                            <p className="text-sm text-gray-500">Your account has been created with the credentials you provided.</p>
                             <div className="mt-6">
                                <a href={portalUrl} className="btn btn-primary">Go to My Portal</a>
                            </div>
                        </div>
                    )}
                </div>
                 <p className="text-center text-sm text-gray-500 mt-6">
                    <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Back to Home
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SubscriptionPage;