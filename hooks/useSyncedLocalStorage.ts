import React from 'react';

/**
 * @deprecated This hook is deprecated and should be removed.
 * It encouraged loading entire datasets into component state, which is not scalable.
 * Components should now use standard React `useState` and `useEffect` hooks
 * to fetch data on-demand from the refactored functions in `services/api.ts`.
 */
function useSyncedLocalStorage<T>(key: string, initialValue: T) {
  React.useEffect(() => {
     console.error(`DEPRECATION: Attempted to use useSyncedLocalStorage for key "${key}". This is no longer supported. Please refactor the component to use on-demand data fetching from services/api.ts.`);
  }, [key]);

  const [value, setValue] = React.useState(initialValue);
  
  return [value, setValue] as const;
}

export default useSyncedLocalStorage;
