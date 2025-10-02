import { useState, useEffect, useCallback } from 'react';
import { getTenantData, updateTenantData } from '../services/api';

// This hook manages a piece of state that is synced with localStorage and a remote server.
function useSyncedLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    // We read directly from the tenant-aware API function
    const item = getTenantData(key);
    return item ?? initialValue;
  });

  // The setter function that components will use.
  // It uses the atomic updateTenantData function from the API service.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (value instanceof Function) {
        updateTenantData(key, (currentData) => {
            const newValue = value(currentData ?? initialValue);
            // Also update our own state immediately for UI responsiveness
            setStoredValue(newValue);
            return newValue;
        });
    } else {
        updateTenantData(key, () => {
            // Also update our own state immediately for UI responsiveness
            setStoredValue(value);
            return value;
        });
    }
  }, [key, initialValue]);


  // Effect to listen for remote changes.
  useEffect(() => {
    const handleStorageUpdate = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.key === key) {
            // Data for our key has been updated remotely, so we re-read from localStorage
            const newItem = getTenantData(key);
            setStoredValue(newItem ?? initialValue);
        }
    };

    // Also listen for the initial data pull which might happen after component mount
    const item = getTenantData(key);
    if(item !== null) {
      setStoredValue(item);
    }

    window.addEventListener('storage-update', handleStorageUpdate);

    return () => {
        window.removeEventListener('storage-update', handleStorageUpdate);
    };
  }, [key, initialValue]);


  return [storedValue, setValue] as const;
}

export default useSyncedLocalStorage;
