import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { apiGetSchoolSettings } from '../services/api';
import { UserRole } from '../types';

interface TenantContextType {
    settings: any;
    loading: boolean;
    hasFeature: (role: UserRole, featureKey: string) => boolean;
}

const TenantContext = createContext<TenantContextType>({
    settings: null,
    loading: true,
    hasFeature: () => true, // Default to true to avoid breaking UI before settings load
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider = ({ children }: PropsWithChildren<{}>) => {
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

    const hasFeature = (role: UserRole, featureKey: string): boolean => {
        if (!settings || !settings.featureControls) {
            return true; // Default to enabled if settings aren't loaded or configured
        }
        const roleKey = role.toLowerCase();
        const controls = settings.featureControls[roleKey];
        if (controls && typeof controls[featureKey] === 'boolean') {
            return controls[featureKey];
        }
        return true; // Default to enabled if specific feature isn't configured
    };

    const value = {
        settings,
        loading,
        hasFeature,
    };

    return (
        <TenantContext.Provider value={value}>
            {children}
        </TenantContext.Provider>
    );
};
