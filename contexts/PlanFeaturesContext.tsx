import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { useTenant } from './TenantContext';
import { apiGetPlatformSettings } from '../services/api';
import { Plan } from '../types';

interface PlanFeaturesContextType {
    isSubscribed: boolean;
    hasFeature: (featureKey: string) => boolean;
    isLoading: boolean;
    planName: string | null;
}

const PlanFeaturesContext = createContext<PlanFeaturesContextType>({
    isSubscribed: false,
    hasFeature: () => false,
    isLoading: true,
    planName: null,
});

export const usePlanFeatures = () => useContext(PlanFeaturesContext);

export const PlanFeaturesProvider = ({ children }: PropsWithChildren<{}>) => {
    const { settings: tenantSettings, loading: tenantLoading } = useTenant() as any;
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [activePlan, setActivePlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            const platformSettings = await apiGetPlatformSettings();
            setAllPlans(platformSettings.plans || []);
        };
        fetchPlans();
    }, []);

    useEffect(() => {
        if (tenantLoading || allPlans.length === 0) return;

        const tenantPlanId = tenantSettings?.planId;
        if (tenantPlanId) {
            const plan = allPlans.find(p => p.id === tenantPlanId);
            setActivePlan(plan || null);
        } else {
            setActivePlan(null);
        }
        setIsLoading(false);

    }, [tenantSettings, tenantLoading, allPlans]);

    const isSubscribed = !!activePlan;

    const hasFeature = (featureKey: string): boolean => {
        if (!isSubscribed || !activePlan) return false;
        // Correctly handle boolean or number feature flags
        const featureValue = activePlan.features?.[featureKey];
        if (typeof featureValue === 'boolean') {
            return featureValue;
        }
        if (typeof featureValue === 'number') {
            return featureValue > 0;
        }
        return false;
    };

    const value: PlanFeaturesContextType = {
        isSubscribed,
        hasFeature,
        isLoading,
        planName: activePlan?.name || 'Free Plan',
    };

    return (
        <PlanFeaturesContext.Provider value={value}>
            {children}
        </PlanFeaturesContext.Provider>
    );
};
