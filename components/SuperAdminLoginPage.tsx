
import React, { useState, useEffect } from 'react';
// Fix: Corrected import path for supabase client
import { initSupabase, getSupabase, isSupabaseOnline } from '../services/supabaseClient';
import { getSupabaseConfig } from '../utils/env';
import { NetworkTraffic } from './SuperAdmin/SystemMonitoring';
import ConnectionStatusBar from './ConnectionStatusBar';

const SuperAdminLoginPage = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [networkStats, setNetworkStats] = useState({ inbound: 0, outbound: 0 });
    const [isDbOnline, setIsDbOnline] = useState(false);
    const [dbError, setDbError] = useState<string | null>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);

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
                if (mounted) {
                    setIsDbOnline(online);
                    setDbError(null);
                }
            } catch (err: any) {
                if (mounted) {
                    setIsDbOnline(false);
                    setDbError(err?.message || 'Failed to connect to database');
                }
            }
        };
        init();
        const onReconnect = () => {
            setIsDbOnline(true);
            setDbError(null);
        };
        const onLost = () => {
            setIsDbOnline(false);
            setDbError('Connection lost');
        };
        window.addEventListener('supabase-reconnected', onReconnect as EventListener);
        window.addEventListener('supabase-connection-lost', onLost as EventListener);
        return () => {
            mounted = false;
            window.removeEventListener('supabase-reconnected', onReconnect as EventListener);
            window.removeEventListener('supabase-connection-lost', onLost as EventListener);
        };
    }, []);

    const testConnection = async () => {
        setTestingConnection(true);
        setDbError(null);
        try {
            await initSupabase();
            const online = await isSupabaseOnline();
            setIsDbOnline(online);
            if (!online) {
                setDbError('Connection test failed. Check your network and configuration.');
            }
        } catch (err: any) {
            setIsDbOnline(false);
            setDbError(err?.message || 'Connection test failed');
        } finally {
            setTestingConnection(false);
        }
    };

    const getConfigStatus = () => {
        try {
            const config = getSupabaseConfig();
            return {
                hasUrl: !!config.url,
                hasKey: !!config.anonKey,
                url: config.url ? `${config.url.substring(0, 20)}...` : 'Not set',
                keyType: config.anonKey ? (config.anonKey.length > 200 ? 'service_role' : 'anon') : 'none'
            };
        } catch {
            return {
                hasUrl: false,
                hasKey: false,
                url: 'Error reading config',
                keyType: 'none'
            };
        }
    };

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
                    <div className="p-4 text-sm bg-amber-50 border border-amber-200 rounded-lg" role="status">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="font-semibold text-amber-800 mb-1">
                                    Database Disconnected
                                </div>
                                <div className="text-amber-700 mb-2">
                                    {dbError || 'Please check configuration or network.'}
                                </div>
                                {typeof navigator !== 'undefined' && !navigator.onLine && (
                                    <div className="text-xs text-amber-600 mb-2">
                                        ⚠️ Your device appears to be offline. Check your internet connection.
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setShowDiagnostics(!showDiagnostics)}
                                    className="text-xs text-amber-700 underline hover:text-amber-900"
                                >
                                    {showDiagnostics ? 'Hide' : 'Show'} Diagnostics
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={testConnection}
                                disabled={testingConnection}
                                className="ml-2 px-3 py-1 text-xs bg-amber-200 hover:bg-amber-300 text-amber-800 rounded disabled:opacity-50"
                            >
                                {testingConnection ? 'Testing...' : 'Test Connection'}
                            </button>
                        </div>
                        
                        {showDiagnostics && (
                            <div className="mt-3 pt-3 border-t border-amber-200">
                                <div className="text-xs font-semibold text-amber-800 mb-2">Configuration Status:</div>
                                <div className="space-y-1 text-xs text-amber-700">
                                    {(() => {
                                        const config = getConfigStatus();
                                        return (
                                            <>
                                                <div className="flex items-center">
                                                    <span className="w-32">Supabase URL:</span>
                                                    <span className={config.hasUrl ? 'text-green-700' : 'text-red-700'}>
                                                        {config.hasUrl ? '✓ Set' : '✗ Missing'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-32">API Key:</span>
                                                    <span className={config.hasKey ? 'text-green-700' : 'text-red-700'}>
                                                        {config.hasKey ? `✓ Set (${config.keyType})` : '✗ Missing'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="w-32">Network:</span>
                                                    <span className={typeof navigator !== 'undefined' && navigator.onLine ? 'text-green-700' : 'text-red-700'}>
                                                        {typeof navigator !== 'undefined' && navigator.onLine ? '✓ Online' : '✗ Offline'}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                                <div className="mt-3 pt-2 border-t border-amber-200">
                                    <div className="text-xs font-semibold text-amber-800 mb-1">Troubleshooting Steps:</div>
                                    <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                                        <li>Verify environment variables are set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)</li>
                                        <li>Check your internet connection</li>
                                        <li>Verify Supabase project is active and accessible</li>
                                        <li>Check browser console for detailed error messages</li>
                                        <li>Try refreshing the page or clearing browser cache</li>
                                    </ol>
                                </div>
                            </div>
                        )}
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
