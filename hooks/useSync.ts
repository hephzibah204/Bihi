import { useState, useEffect } from 'react';
import { syncEventBus, isSyncNeeded, processSyncQueue } from '../services/api';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'unsynced';

export const useSync = () => {
    const getInitialStatus = (): SyncStatus => {
        if (!navigator.onLine) return 'offline';
        return isSyncNeeded() ? 'unsynced' : 'synced';
    };
    
    const [syncStatus, setSyncStatus] = useState<SyncStatus>(getInitialStatus());

    useEffect(() => {
        const handleStatusChange = (event: Event) => {
            // Type guard to ensure event is CustomEvent
            if (event instanceof CustomEvent) {
                setSyncStatus(event.detail);
            }
        };
        syncEventBus.addEventListener('syncStatusChange', handleStatusChange);

        const handleOnline = () => {
            setSyncStatus(isSyncNeeded() ? 'unsynced' : 'synced');
            // Trigger an immediate sync attempt when connection is restored
            processSyncQueue();
        };
        const handleOffline = () => setSyncStatus('offline');
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            syncEventBus.removeEventListener('syncStatusChange', handleStatusChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { syncStatus };
};