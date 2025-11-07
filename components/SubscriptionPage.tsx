import React, { useState } from 'react';
import SpinnerIcon from './icons/SpinnerIcon';
import Logo from './icons/Logo';
import { getPortalUrl, isProductionDomain, getDomainConfiguration, normalizeSubdomain } from '../utils/subdomain';
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
            processedValue = normalizeSubdomain(value);
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
            // Detect Supabase Functions (new domain or legacy /functions/v1 path)
            const maybeSupabase = /https?:\/\/[^/]*functions\.supabase\.co\//i.test(registerEndpoint)
                || /https?:\/\/[^/]*supabase\.co\/functions\/v1\//i.test(registerEndpoint);
            const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (maybeSupabase && publishableKey) {
                // Supabase Functions commonly expect Authorization with anon key; apikey is also accepted
                headers['apikey'] = publishableKey as string;
                if (!headers['Authorization']) {
                    headers['Authorization'] = `Bearer ${publishableKey}`;
                }
            }

            // If the user already has a session, prefer JWT over anon key for Authorization
            if (maybeSupabase && supabase?.auth) {
                try {
                    const { data } = await supabase.auth.getSession();
                    const token = data?.session?.access_token;
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                } catch { /* ignore */ }
            }

            // If calling a Supabase function without a session, attempt to sign up to obtain a JWT
            if (maybeSupabase && supabase?.auth && !headers['Authorization']) {
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email: formData.adminEmail,
                        password: formData.adminPassword,
                        options: { emailRedirectTo: portalUrl }
                    });
                    if (error && error?.message?.toLowerCase().includes('already')) {
                        // User exists; try sign in to get a session
                        const { data: signInData } = await supabase.auth.signInWithPassword({
                            email: formData.adminEmail,
                            password: formData.adminPassword,
                        });
                        const token = signInData?.session?.access_token;
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                    } else {
                        const token = data?.session?.access_token;
                        if (token) headers['Authorization'] = `Bearer ${token}`;
                        // If email confirmation is required, session may be null; proceed unauthenticated with owner_email
                    }
                } catch { /* ignore and proceed */ }
            }

            const payload = {
                ...formData,
                // Align with Supabase function expected field
                name: formData.schoolName,
                // Ensure both slug and subdomain are provided for schema-aware backends
                slug: formData.subdomain,
                subdomain: formData.subdomain,
                // Provide owner_email for functions that support unauthenticated registration paths
                owner_email: formData.adminEmail,
                emailRedirectTo: portalUrl,
            };

            const tryRequest = async (url: string) => {
                // Clone headers per attempt to avoid cross-contamination
                const h: Record<string, string> = { ...headers };
                const isSupa = /https?:\/\/[^/]*functions\.supabase\.co\//i.test(url)
                    || /https?:\/\/[^/]*supabase\.co\/functions\/v1\//i.test(url);
                // For Supabase functions, ensure apikey/Authorization are present
                if (isSupa) {
                    const pub = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;
                    if (pub) {
                        h['apikey'] = pub as string;
                        if (!h['Authorization']) h['Authorization'] = `Bearer ${pub}`;
                    }
                } else {
                    // Do not send Supabase-specific headers to non-Supabase endpoints
                    delete h['apikey'];
                }
                const res = await fetch(url, {
                    method: 'POST',
                    headers: h,
                    body: JSON.stringify(payload)
                });
                return res;
            };

            // Endpoint selection: strict in production, multi-fallbacks only in development
            const isDev = window.location.hostname === 'localhost';
            let candidates: string[] = [];
            if (import.meta.env.VITE_SUPABASE_FUNCTION_REGISTER_URL) {
                candidates.push(import.meta.env.VITE_SUPABASE_FUNCTION_REGISTER_URL);
            } else {
                // Use the canonical production handler if functions URL isn’t set
                candidates.push('/api/register');
            }

            // In development, optionally add local API fallback
            if (isDev && import.meta.env.VITE_LOCAL_API_URL) {
                const localUrl = `${import.meta.env.VITE_LOCAL_API_URL.replace(/\/$/, '')}/api/register`;
                candidates.push(localUrl);
            }

            if (!candidates.length) {
                throw new Error('No registration endpoint configured.');
            }

            let response: Response | null = null;
            let lastError: string | null = null;
            for (const url of candidates) {
                try {
                    const res = await tryRequest(url);
                    if (res.ok) { response = res; break; }
                    // Collect detailed error for diagnostics
                    let details = `HTTP ${res.status}: ${res.statusText}`;
                    try {
                        const j = await res.json();
                        details = j?.details || j?.error || details;
                    } catch {
                        try { details = (await res.text()) || details; } catch {}
                    }
                    lastError = `${url} -> ${details}`;
                } catch (e: any) {
                    lastError = `${url} -> ${e?.message || 'Network error'}`;
                }
            }

            if (!response) {
                throw new Error(lastError || 'Registration failed');
            }

            const data: any = await response.json();

            // Validate response before showing success
            if (!data || data.error) {
                throw new Error(data?.error || 'Registration failed on server.');
            }
            const okFlags = [
                data.success,
                data.tenantCreated,
                data.tenantId,
                data.teacherProfileCreated,
                data.userCreated,
            ].filter(Boolean);
            if (okFlags.length === 0) {
                throw new Error('Registration endpoint did not confirm portal creation.');
            }

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

            // Dev/local: seed the admin teacher profile so login can proceed without a backend
            try {
                const raw = localStorage.getItem('dev_teachers');
                const teachers = raw ? JSON.parse(raw) : [];
                const adminTeacher = {
                    id: `teacher_${formData.subdomain}_admin`,
                    name: formData.adminName || formData.adminEmail,
                    email: formData.adminEmail,
                    role: 'Administrator',
                    tenant_id: formData.subdomain
                };
                let next = Array.isArray(teachers) ? teachers : [];
                const exists = next.some((t: any) => String(t.email).toLowerCase() === String(adminTeacher.email).toLowerCase());
                if (!exists) {
                    next = [...next, adminTeacher];
                    localStorage.setItem('dev_teachers', JSON.stringify(next));
                }
            } catch { /* noop */ }

            // Record recent registration marker for tenant validation fallback (expires after 15 minutes)
            try {
                const marker = { id: formData.subdomain, ts: Date.now() };
                localStorage.setItem('recentlyRegisteredTenant', JSON.stringify(marker));
            } catch {}

            setStep(3); // Show "Success" only now
        } catch (err: any) {
            let errorMessage = String(err?.message || 'Registration failed');
            if (String(err?.message || '').toLowerCase().includes('failed to fetch')) {
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