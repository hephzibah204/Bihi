import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { getSubdomain } from '../utils/subdomain';
import { apiGetTenants, apiGetPlatformSettings, apiGetTeachers, apiGetStudents, apiGetSchoolSettings } from '../services/api';
import { DEMO_TENANT_ID, CORE_DEMO_DATA } from '../utils/demoData';
import { USER_ROLES } from '../utils/constants';
import type { SchoolSettings, Teacher, Student, Parent, UserRole } from '../types';

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
            const sd = getSubdomain();
            setSubdomain(sd);

            const platform = await apiGetPlatformSettings();
            setPlatformSettings(platform);

            if (sd && sd !== 'admin' && sd !== DEMO_TENANT_ID) {
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
                    setIsValidTenant(isValid);
                    if (!isValid) {
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    // Assume valid in local/offline to avoid blocking development
                    setIsValidTenant(true);
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
                    const teachers = await apiGetTeachers();
                    const currentUser = teachers.find(t => t.email.toLowerCase() === session.user.email.toLowerCase());
                    if (currentUser) {
                        setUser(currentUser);
                        setRole(currentUser.role);
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
                const teachers = await apiGetTeachers();
                const currentUser = teachers.find(t => t.email.toLowerCase() === initialSession.user.email.toLowerCase());
                if (currentUser) {
                    setUser(currentUser);
                    setRole(currentUser.role);
                }
            }

            return () => {
                subscription.unsubscribe();
            };
        };
        initializeAuth();
    }, []);

    useEffect(() => {
        const fetchTenantSettings = async () => {
            if (subdomain) {
                const schoolSettings = await apiGetSchoolSettings(subdomain);
                setSettings(schoolSettings);
            }
            // Set loading to false after async operations, regardless of subdomain
            setLoading(false);
        };
        fetchTenantSettings();
    }, [subdomain]);

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
        } catch {}

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

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

