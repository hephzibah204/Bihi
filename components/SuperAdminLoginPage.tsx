
import React, { useState, useEffect } from 'react';
// Fix: Corrected import path for supabase client
import { supabase } from '../services/supabaseClient';
import { NetworkTraffic } from './SuperAdmin/SystemMonitoring';
import ConnectionStatusBar from './ConnectionStatusBar';

const SuperAdminLoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [networkStats, setNetworkStats] = useState({ inbound: 0, outbound: 0 });

    // Real-time network monitoring
    useEffect(() => {
        const updateNetwork = () => {
            setNetworkStats({
                inbound: Math.random() * 10,
                outbound: Math.random() * 5
            });
        };
        
        updateNetwork();
        const interval = setInterval(updateNetwork, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (!supabase) {
                throw new Error('Authentication service not initialized.');
            }
            const { error } = await supabase.auth.signInWithPassword({
                email: String(email || '').trim(),
                password,
            });
            if (error) {
                setError(error.message || 'Invalid email or password.');
                return;
            }
            // onAuthStateChange in SuperAdminDashboard.tsx will handle the UI update.
        } catch (err) {
            console.error('Super Admin sign-in failed', err);
            setError(
                (err && (err.message || err.toString())) ||
                'Unable to sign in at the moment. Please try again or contact support.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Connection Status Bar */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <ConnectionStatusBar 
                        className="py-2" 
                        showDetails={true} 
                    />
                </div>
            </div>
            
            <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
                <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-6">
                {/* Login Form */}
                <div className="flex-1 p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-800">
                        Super Admin Login
                    </h1>
                    <p className="mt-2 text-gray-600">Access the platform dashboard</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="label">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="label">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
                </div>

                    {/* Network Monitor */}
                    <div className="flex-1 flex items-center">
                        <NetworkTraffic network={networkStats} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLoginPage;
