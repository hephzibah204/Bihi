import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, initSupabase } from '../services/supabaseClient';
import { getSubdomain } from '../utils/subdomain';
import { apiGetTenants, apiGetPlatformSettings, apiGetTeachers, apiGetStudents, apiGetSchoolSettings } from '../services/api';
import { DEMO_TENANT_ID, CORE_DEMO_DATA } from '../utils/demoData';
import { USER_ROLES } from '../utils/constants';
import type { SchoolSettings, Teacher, Student, Parent, UserRole } from '../types';
import { registerFeatureContext } from '../services/aiContextRegistry';

interface AuthContextType {
    user: Teacher | Student | Parent | null;
    role: UserRole | null;
    session: any;
    loading: boolean;
    isValidTenant: boolean;
    subdomain: string | null;
    settings: Partial<SchoolSettings> | null;
    platformSettings: any;
    isSmsConfigured: boolean;
    isPaymentConfigured: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Safely read from localStorage, guarding against cross-origin and SSR issues
function safeLocalStorageGet(key: string): string | null {
    try {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

// FIX: Made children optional to satisfy the compiler for usages where it incorrectly reports it as missing.
export const AuthProvider = ({ children }: { children?: ReactNode }) => {
    const [user, setUser] = useState<Teacher | Student | Parent | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isValidTenant, setIsValidTenant] = useState(true);
    const [subdomain, setSubdomain] = useState<string | null>(null);
    const [settings, setSettings] = useState<Partial<SchoolSettings> | null>(null);
    const [platformSettings, setPlatformSettings] = useState<any>(null);

    useEffect(() => {
        const initializeAuth = async () => {
            setLoading(true);
            await initSupabase();
            const sd = getSubdomain();
            setSubdomain(sd);

            // Skip tenant validation for Super Admin routes
            const isControlHub = typeof window !== 'undefined' && window.location.pathname.startsWith('/controlhub');

            const platform = await apiGetPlatformSettings();
            setPlatformSettings(platform);

            if (sd && sd !== 'admin' && sd !== DEMO_TENANT_ID && !isControlHub) {
                try {
                    const tenants = await apiGetTenants();
                    const isValid = tenants.some(t => {
                        const candidates = [
                            (t as any).id,
                            (t as any).slug,
                            (t as any).subdomain,
                        ]
                        .filter(Boolean)
                        .map(v => String(v).toLowerCase());
                        return candidates.includes(sd.toLowerCase());
                    });

                    if (!isValid) {
                        // Dev convenience: if running on localhost and tenant list is empty/missing,
                        // treat the current subdomain as valid and seed a local dev tenant so flows continue.
                        const isLocalhost =
                            typeof window !== 'undefined' &&
                            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                        if (isLocalhost) {
                            setIsValidTenant(true);
                            try {
                                const existing = localStorage.getItem('dev_tenants');
                                const list = existing ? JSON.parse(existing) : [];
                                const entry = { id: sd, name: sd };
                                if (!Array.isArray(list)) {
                                    localStorage.setItem('dev_tenants', JSON.stringify([entry]));
                                } else if (!list.some((t: any) => t.id === entry.id)) {
                                    localStorage.setItem('dev_tenants', JSON.stringify([...list, entry]));
                                }
                            } catch { /* noop */ }
                        } else {
                            // New: fallback for recently registered portals to avoid "Portal Not Found" immediately after signup.
                            const markerRaw = safeLocalStorageGet('recentlyRegisteredTenant');
                            if (markerRaw) {
                                try {
                                    const marker = JSON.parse(markerRaw);
                                    const tooOld = Date.now() - marker.ts > 15 * 60 * 1000;
                                    if (!tooOld && marker.id === sd) {
                                        console.info('Treating recently registered tenant as temporarily valid', marker.id);
                                        setIsValidTenant(true);
                                        // Continue through; do not return early so subsequent flows proceed
                                    } else {
                                        setIsValidTenant(false);
                                        setLoading(false);
                                        return;
                                    }
                                } catch {
                                    setIsValidTenant(false);
                                    setLoading(false);
                                    return;
                                }
                            } else {
                                setIsValidTenant(false);
                                setLoading(false);
                                return;
                            }
                        }
                    } else {
                        setIsValidTenant(true);
                    }
                } catch (e) {
                    console.error('Failed to load tenants', e);
                    const isLocalhost =
                        typeof window !== 'undefined' &&
                        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
                    // In dev, fail-open; in prod, fail-closed
                    setIsValidTenant(isLocalhost);
                }
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
                setSession(session);
                if (!session) {
                    // Check for student/parent demo session
                    const activeUserSession = sessionStorage.getItem('activeUser');
                    if (activeUserSession) {
                        const parsedUser = JSON.parse(activeUserSession);
                        setUser(parsedUser);
                        setRole(parsedUser.role);
                    } else {
                        setUser(null);
                        setRole(null);
                    }
                } else {
                    try {
                        const teachers = await apiGetTeachers();
                        const currentUser = teachers.find(t => t.email.toLowerCase() === session.user.email.toLowerCase());
                        
                        if (currentUser) {
                            setUser(currentUser);
                            setRole(currentUser.role);
                            console.log('User authenticated successfully:', currentUser.email);
                        } else {
                            // Auth user exists but no teacher profile - this is a data integrity issue
                            console.error('Authentication succeeded but no teacher profile found for:', session.user.email);
                            console.log('Teachers found:', teachers.length);
                            console.log('Session user metadata:', session.user.user_metadata);
                            
                            // Store error for display
                            const errorMessage = 
                                'Your account exists but your profile is incomplete. ' +
                                'Please contact support with this email: ' + session.user.email;
                            sessionStorage.setItem('authProfileError', errorMessage);
                            
                            // Sign out the user to prevent stuck state
                            await supabase.auth.signOut();
                            setUser(null);
                            setRole(null);
                        }
                    } catch (error) {
                        console.error('Error loading teacher profile:', error);
                        // Don't sign out on network errors - allow retry
                    }
                }
            });
            
            // Initial session check
            const { data: { session: initialSession } } = await supabase.auth.getSession();
            setSession(initialSession);
            if (!initialSession) {
                const activeUserSession = sessionStorage.getItem('activeUser');
                if (activeUserSession) {
                    const parsedUser = JSON.parse(activeUserSession);
                    setUser(parsedUser);
                    setRole(parsedUser.role);
                }
            } else {
                try {
                    const teachers = await apiGetTeachers();
                    const currentUser = teachers.find(t => t.email.toLowerCase() === initialSession.user.email.toLowerCase());
                    
                    if (currentUser) {
                        setUser(currentUser);
                        setRole(currentUser.role);
                        console.log('Initial session: User authenticated successfully:', currentUser.email);
                    } else {
                        // Auth user exists but no teacher profile
                        console.error('Initial session: No teacher profile found for:', initialSession.user.email);
                        console.log('Teachers found:', teachers.length);
                        
                        const errorMessage = 
                            'Your account exists but your profile is incomplete. ' +
                            'Please contact support with this email: ' + initialSession.user.email;
                        sessionStorage.setItem('authProfileError', errorMessage);
                        
                        await supabase.auth.signOut();
                        setUser(null);
                        setRole(null);
                    }
                } catch (error) {
                    console.error('Error loading teacher profile during initial session:', error);
                }
            }

            return () => {
                subscription.unsubscribe();
            };
        };
        initializeAuth();
    }, []);

    useEffect(() => {
        // Persist identity details for AI context scoping and register a "user" feature context
        try {
            if (role) {
                // Registry uses demoUserRole to resolve scope; set for all roles
                localStorage.setItem('demoUserRole', String(role));
            }
            if (subdomain) {
                localStorage.setItem('tenantId', String(subdomain));
            }
            if (user && (user as any).id) {
                const uid = String((user as any).id);
                localStorage.setItem('currentUserId', uid);
                const minimal = {
                    userId: uid,
                    role: role,
                    name: (user as any).name || (user as any).fullName || (user as any).firstName || undefined,
                    email: (user as any).email || undefined,
                    class: (user as any).class || undefined
                } as Record<string, unknown>;
                try { sessionStorage.setItem('activeUser', JSON.stringify(minimal)); } catch { /* noop */ }
            }
        } catch { /* noop */ }

        if (user) {
            try {
                registerFeatureContext('user', {
                    id: (user as any).id,
                    role: role || undefined,
                    name: (user as any).name || (user as any).fullName || (user as any).firstName || undefined,
                    email: (user as any).email || undefined,
                    class: (user as any).class || undefined,
                    tenantId: subdomain || undefined
                });
            } catch { /* noop */ }
        }

        const fetchTenantSettings = async () => {
            // Skip tenant settings fetch for Super Admin routes
            const isControlHub = typeof window !== 'undefined' && window.location.pathname.startsWith('/controlhub');
            
            // Check for demo mode - skip tenant settings and mark as loaded immediately
            const isDemoMode = typeof window !== 'undefined' && 
                (sessionStorage.getItem('isDemoMode') === 'true' || 
                 localStorage.getItem('isDemoMode') === 'true');
            
            if (isDemoMode || isControlHub) {
                setLoading(false);
                return;
            }
            
            if (subdomain) {
                const schoolSettings = await apiGetSchoolSettings(subdomain);
                setSettings(schoolSettings);
            }
            // Set loading to false after async operations, regardless of subdomain
            setLoading(false);
        };
        fetchTenantSettings();
    }, [subdomain, user, role]);

    const logout = async () => {
        const sd = getSubdomain();
        const wasDemo = sd === 'demo' 
            || (typeof window !== 'undefined' && (
                sessionStorage.getItem('isDemoMode') === 'true' 
                || localStorage.getItem('isDemoMode') === 'true'
            ));

        // Clear demo/session flags
        try {
            sessionStorage.removeItem('activeUser');
            sessionStorage.removeItem('isDemoMode');
            localStorage.removeItem('isDemoMode');
            localStorage.removeItem('demoUserRole');
            localStorage.removeItem('currentUserId');
            localStorage.removeItem('tenantId');
        } catch { /* noop */ }

        // Sign out real sessions if present
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setSession(null);

        // Redirect: demo -> /demo selector; otherwise -> root
        window.location.href = wasDemo ? '/demo' : '/';
    };

    const isSmsConfigured = !!(settings?.integrations?.sms_api_key && settings?.integrations?.sms_sender_id);
    const isPaymentConfigured = !!(settings?.integrations?.paystack_public_key);

    const value = {
        user, role, session, loading, isValidTenant, subdomain,
        settings, platformSettings, logout, isSmsConfigured, isPaymentConfigured
    };

    // Always render children so routers and loaders inside can react to `loading`.
    // AppRouter already displays a full-page loader when `loading` is true.
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        // In dev/offline or during hot reloads, components may briefly mount
        // before the provider. Return safe defaults to avoid crashing.
        console.error('useAuth called outside of AuthProvider. Returning safe defaults.');
        return {
            user: null,
            role: null,
            session: null,
            loading: true,
            isValidTenant: true,
            subdomain: null,
            settings: null,
            platformSettings: null,
            isSmsConfigured: false,
            isPaymentConfigured: false,
            logout: async () => {}
        } as AuthContextType;
    }
    return context;
};

