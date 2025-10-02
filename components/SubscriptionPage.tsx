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
            // 1. Create the tenant record first
            await apiAddTenant({ id: formData.subdomain, name: formData.schoolName });

            // 2. Create the Supabase user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.adminEmail,
                password: formData.adminPassword,
            });
            if (authError) throw authError;
            if (!authData.user) throw new Error("User creation failed.");

            // 3. Populate the new tenant with default data
            const newAdmin = {
                id: `teacher_${Date.now()}`,
                name: formData.adminName,
                email: formData.adminEmail,
                role: 'Admin',
                auth_id: authData.user.id,
            };
            const defaultSettings = {
                ...demoSchoolSettings,
                schoolName: formData.schoolName,
                schoolType: formData.schoolType,
            };

            await Promise.all([
                apiSaveSchoolSettings(defaultSettings, formData.subdomain),
                apiSaveSubjects(demoSubjects, formData.subdomain),
                apiSaveTeachers([newAdmin], formData.subdomain),
            ]);

            // 4. Redirect to the new portal
            setStep(3);
        } catch (err) {
            setError(err.message);
            // TODO: Add rollback logic if tenant creation succeeds but user creation fails
        } finally {
            setLoading(false);
        }
    };

    const portalUrl = `http://${formData.subdomain}.localhost:5173`; // Adjust for production

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
                                <div><label className="label">Portal Address</label><div className="flex items-center"><input type="text" name="subdomain" value={formData.subdomain} onChange={handleChange} className="input-field rounded-r-none" placeholder="brightstar" required /><span className="px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border border-l-0 dark:border-gray-600 rounded-r-md">.reportsheet.com</span></div></div>
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
                            <h2 className="text-2xl font-semibold text-green-600">Account Created!</h2>
                            <p className="mt-4">Your school portal is ready. You can now log in at your new address:</p>
                            <a href={portalUrl} className="my-4 block font-mono text-lg text-indigo-600 underline">{portalUrl}</a>
                            <a href={portalUrl} className="btn btn-primary">Go to My Portal</a>
                        </div>
                    )}
                </div>
                 <p className="text-center text-sm text-gray-500 mt-6">
                    Already have an account?{' '}
                    <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Go to your portal
                    </a>
                </p>
            </div>
        </div>
    );
};

export default SubscriptionPage;