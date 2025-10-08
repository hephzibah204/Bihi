import React, { useState } from 'react';
import { apiFindTenantByEmail } from '../services/api';
import Logo from './icons/Logo';
import SpinnerIcon from './icons/SpinnerIcon';

const CentralLoginPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const tenantId = await apiFindTenantByEmail(email);
            if (tenantId) {
                // Redirect to the correct tenant portal
                window.location.href = `/?tenant=${tenantId}`;
            } else {
                setError('No account found with that email address. Please check the email or sign up for a new school.');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Logo className="w-12 h-12 mx-auto" />
                    <h1 className="text-3xl font-bold mt-2">Sign in to your portal</h1>
                </div>

                <div className="card p-8">
                    {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="label">Work Email Address</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="you@yourschool.com"
                                required
                            />
                        </div>
                        <div>
                            <button type="submit" className="w-full btn btn-primary" disabled={loading}>
                                {loading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Find My Portal'}
                            </button>
                        </div>
                    </form>

                     <p className="text-center text-sm text-gray-500 mt-6">
                        Forgot your portal address? Just enter your email above and we'll find it for you.
                    </p>
                </div>
                 <p className="text-center text-sm text-gray-500 mt-6">
                    <a href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
                        &larr; Back to Home
                    </a>
                </p>
            </div>
        </div>
    );
};

export default CentralLoginPage;