import React, { createContext, useContext, ReactNode, PropsWithChildren } from 'react';

const PlanFeaturesContext = createContext({
    hasAI: false,
    maxStudents: 0,
});

export const usePlanFeatures = () => useContext(PlanFeaturesContext);

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