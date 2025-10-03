// This hook has been deprecated and its functionality removed.
// It encouraged loading entire datasets into component state, which is not scalable.
// Components should now use standard React `useState` and `useEffect` hooks
// to fetch data on-demand from the refactored functions in `services/api.ts`.
// Fix: Import React to resolve 'React is not defined' error.
import React from 'react';

function useSyncedLocalStorage<T>(key: string, initialValue: T) {
  console.warn(`useSyncedLocalStorage is deprecated and should be removed. Key: ${key}`);
  
  const [value, setValue] = React.useState(initialValue);
  
  React.useEffect(() => {
     console.error("Attempted to use deprecated useSyncedLocalStorage. Please refactor the component to use on-demand data fetching from services/api.ts.");
  }, []);

  return [value, setValue] as const;
}

export default useSyncedLocalStorage;