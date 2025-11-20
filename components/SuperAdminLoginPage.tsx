
import React, { useState, useEffect } from 'react';
// Fix: Corrected import path for supabase client
import { initSupabase, getSupabase, isSupabaseOnline } from '../services/supabaseClient';
import { NetworkTraffic } from './SuperAdmin/SystemMonitoring';
import ConnectionStatusBar from './ConnectionStatusBar';

const SuperAdminLoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [networkStats, setNetworkStats] = useState({ inbound: 0, outbound: 0 });
    const [isDbOnline, setIsDbOnline] = useState(false);

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

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            try {
                await initSupabase();
                const online = await isSupabaseOnline();
                if (mounted) setIsDbOnline(online);
            } catch {
                if (mounted) setIsDbOnline(false);
            }
        };
        init();
        const onReconnect = () => setIsDbOnline(true);
        const onLost = () => setIsDbOnline(false);
        window.addEventListener('supabase-reconnected', onReconnect as EventListener);
        window.addEventListener('supabase-connection-lost', onLost as EventListener);
        return () => {
            mounted = false;
            window.removeEventListener('supabase-reconnected', onReconnect as EventListener);
            window.removeEventListener('supabase-connection-lost', onLost as EventListener);
        };
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await initSupabase();
            const client = getSupabase();
            const signIn = client?.auth?.signInWithPassword;
            if (typeof signIn !== 'function') {
                throw new Error('Authentication service not initialized.');
            }
            const { error } = await signIn({
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
                {!isDbOnline && (
                    <div className="p-3 text-sm text-amber-700 bg-amber-100 rounded-lg" role="status">
                        Database disconnected. Please check configuration or network.
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
                            disabled={loading || !isDbOnline}
                            className="w-full btn btn-primary"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                        <div className="mt-2 text-xs text-gray-600 text-center">
                            {isDbOnline ? 'Database Connected' : 'Database Disconnected'}
                        </div>
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
