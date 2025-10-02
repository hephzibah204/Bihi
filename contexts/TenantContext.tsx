import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { apiGetSchoolSettings } from '../services/api';

const TenantContext = createContext(null);

export const useTenant = () => useContext(TenantContext);

// Fix: Defined a props interface for TenantProvider to ensure children are correctly typed.
interface TenantProviderProps {
}

export const TenantProvider = ({ children }: PropsWithChildren<TenantProviderProps>) => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const tenantSettings = await apiGetSchoolSettings();
                setSettings(tenantSettings);
            } catch (error) {
                console.error("Failed to load tenant settings:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const value = {
        settings,
        loading,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};