import React, { createContext, useContext, ReactNode, PropsWithChildren } from 'react';

// Fix: Provide a default value to the context that matches the shape of the data it will hold.
const PlanFeaturesContext = createContext({
    hasAI: false,
    maxStudents: 0,
});

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