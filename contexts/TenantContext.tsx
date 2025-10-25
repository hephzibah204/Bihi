
import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
// FIX: Corrected import path for api services.
import { apiGetSchoolSettings } from '../services/api';
// FIX: Corrected import path for types.
import { SchoolSettings } from '../types';

interface TenantContextType {
    settings: SchoolSettings | null;
    loading: boolean;
}

const TenantContext = createContext<TenantContextType>({
    settings: null,
    loading: true,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const schoolSettings = await apiGetSchoolSettings();
                setSettings(schoolSettings);
            } catch (error) {
                console.error("Failed to load tenant settings:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchSettings();

        // Listen for updates from other tabs/components
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.key === 'settings') {
                fetchSettings();
            }
        };
        window.addEventListener('storage-update', handleStorageUpdate);
        return () => window.removeEventListener('storage-update', handleStorageUpdate);

    }, []);

    const value = { settings, loading };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};
