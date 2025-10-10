import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { useTenant } from './TenantContext';
import { apiGetPlatformSettings, getTenantId } from '../services/api';
import { Plan } from '../types';
import { DEMO_TENANT_ID } from '../utils/demoData';
import { CONTROLLABLE_FEATURES } from '../utils/constants';

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
    const isDemo = getTenantId() === DEMO_TENANT_ID;

    useEffect(() => {
        const fetchPlans = async () => {
            if (isDemo) return; // No need to fetch real plans in demo
            const platformSettings = await apiGetPlatformSettings();
            setAllPlans(platformSettings.plans || []);
        };
        fetchPlans();
    }, [isDemo]);

    useEffect(() => {
        if (tenantLoading || (allPlans.length === 0 && !isDemo)) {
             if (isDemo && !tenantLoading) {
                 // Demo mode can proceed without real plans
             } else {
                return;
             }
        }
        
        if (isDemo) {
            // In demo mode, grant access to a mock top-tier plan's features by
            // dynamically enabling all defined controllable features.
            // Fix: The type for allFeatures now explicitly includes the required 'maxStudents' property to match the 'Plan['features']' type, resolving the TypeScript error.
            const allFeatures: { maxStudents: number; [key: string]: boolean | number } = { maxStudents: 9999 };
            CONTROLLABLE_FEATURES.forEach(f => allFeatures[f.key] = true);
            
            // Also enable all sidebar group IDs
            const groupIds = ['academics', 'records', 'management', 'finance', 'tools', 'alumni'];
            groupIds.forEach(id => allFeatures[id] = true);
            
            const demoEnterprisePlan: Plan = {
                id: 'demo-enterprise',
                name: 'Enterprise (Demo)',
                price_monthly: 0,
                price_termly: 0,
                price_yearly: 0,
                features: allFeatures
            };
            setActivePlan(demoEnterprisePlan);
            setIsLoading(false);
            return; // Exit early for demo mode
        }

        const tenantPlanId = tenantSettings?.planId;
        if (tenantPlanId) {
            const plan = allPlans.find(p => p.id === tenantPlanId);
            setActivePlan(plan || null);
        } else {
            setActivePlan(null);
        }
        setIsLoading(false);

    }, [tenantSettings, tenantLoading, allPlans, isDemo]);

    const isSubscribed = isDemo || !!activePlan;

    const hasFeature = (featureKey: string): boolean => {
        if (isDemo) return true; // Grant all features in demo mode
        if (!isSubscribed || !activePlan) return false;
        
        // The feature check is now against the dynamic features object of the plan.
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
        planName: activePlan?.name || (isDemo ? 'Enterprise (Demo)' : 'Unsubscribed'),
    };

    return (
        <PlanFeaturesContext.Provider value={value}>
            {children}
        </PlanFeaturesContext.Provider>
    );
};
