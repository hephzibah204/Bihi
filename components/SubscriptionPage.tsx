import React, { useState } from 'react';
import { apiAddTenant, apiSaveSchoolSettings, apiSaveSubjects, apiSaveTeachers } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { demoSchoolSettings, demoSubjects, demoTeachers } from '../utils/demoData';
import SpinnerIcon from './icons/SpinnerIcon';
import Logo from './icons/Logo';

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

    const getRootDomain = () => {
        let host = window.location.host;
        // Strip 'www.' if it exists, as it's not part of the root for subdomain creation
        if (host.startsWith('www.')) {
            return host.substring(4);
        }
        return host;
    };

    const domain = getRootDomain();
    const portalUrl = `${window.location.protocol}//${formData.subdomain}.${domain}`;

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

        if (!supabase) {
            setError("Authentication service is not available. Cannot create account.");
            setLoading(false);
            return;
        }

        try {
            await apiAddTenant({ id: formData.subdomain, name: formData.schoolName });

            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.adminEmail,
                password: formData.adminPassword,
                options: { emailRedirectTo: portalUrl }
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("User creation failed.");

            const newAdmin = { ...demoTeachers.find(t=>t.role === 'Admin'),
                id: `teacher_${Date.now()}`,
                name: formData.adminName,
                email: formData.adminEmail,
                auth_id: authData.user.id,
            };

            const defaultSettings = {
                ...demoSchoolSettings,
                schoolName: formData.schoolName,
                schoolType: formData.schoolType as 'nursery_primary' | 'secondary' | 'all',
            };

            await Promise.all([
                apiSaveSchoolSettings(defaultSettings, formData.subdomain),
                apiSaveSubjects(demoSubjects, formData.subdomain),
                apiSaveTeachers([newAdmin], formData.subdomain),
            ]);

            setStep(3);
        } catch (err) {
            let errorMessage = err.message;
            if (err.message.toLowerCase().includes('failed to fetch')) {
                errorMessage = "A network error occurred. Please check your connection and try again.";
            } else if (err.status === 429) {
                errorMessage = "Too many requests. Please wait a moment.";
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
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
                                <div><label className="label">Portal Address</label><div className="flex items-center"><input type="text" name="subdomain" value={formData.subdomain} onChange={handleChange} className="input-field rounded-r-none" placeholder="brightstar" required /><span className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border border-l-0 dark:border-gray-600 rounded-r-md">.{domain}</span></div></div>
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
                            <h2 className="text-2xl font-semibold text-indigo-600">Almost there!</h2>
                            <p className="mt-4">We've sent a verification link to <strong>{formData.adminEmail}</strong>.</p>
                            <p className="mt-2">Please click the link in the email to activate your account. Once verified, you can log in at:</p>
                            <a href={portalUrl} className="my-4 block font-mono text-lg text-indigo-600 underline" target="_blank" rel="noopener noreferrer">{portalUrl}</a>
                            <p className="text-sm text-gray-500">Didn't receive an email? Check your spam folder.</p>
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