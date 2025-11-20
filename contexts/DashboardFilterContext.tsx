import React, { createContext, useContext, useMemo, useState } from 'react';

type DashboardFilterState = {
  session: string;
  term: string;
  setSession: (s: string) => void;
  setTerm: (t: string) => void;
};

const DashboardFilterContext = createContext<DashboardFilterState | null>(null);

export const useDashboardFilter = () => {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error('DashboardFilterContext not found');
  return ctx;
};

export const DashboardFilterProvider: React.FC<React.PropsWithChildren<{ initialSession?: string; initialTerm?: string }>> = ({ initialSession = '', initialTerm = '', children }) => {
  const [session, setSession] = useState(initialSession);
  const [term, setTerm] = useState(initialTerm);
  const value = useMemo(() => ({ session, term, setSession, setTerm }), [session, term]);
  return <DashboardFilterContext.Provider value={value}>{children}</DashboardFilterContext.Provider>;
};