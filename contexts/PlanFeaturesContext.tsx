import React, { createContext, useContext, ReactNode, PropsWithChildren } from 'react';

const PlanFeaturesContext = createContext({});

export const usePlanFeatures = () => useContext(PlanFeaturesContext);

// FIX: Changed props to use PropsWithChildren for robust typing, resolving an error in Dashboard.tsx.
export const PlanFeaturesProvider = ({ children }: PropsWithChildren<{}>) => {
    const isDemo = typeof window !== 'undefined' && sessionStorage.getItem('isDemoMode') === 'true';

    const features = {
        // This would be populated with features available to the current tenant's plan
        hasAI: isDemo ? true : false,
        maxStudents: isDemo ? 10000 : 500,
    };

    return (
        <PlanFeaturesContext.Provider value={features}>
            {children}
        </PlanFeaturesContext.Provider>
    );
};
