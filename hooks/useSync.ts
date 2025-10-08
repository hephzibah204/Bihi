import { useOnlineStatus } from './useOnlineStatus';

export type SyncStatus = 'synced' | 'offline';

/**
 * @deprecated This hook is deprecated. The application now saves data instantly.
 * This hook is maintained for backward compatibility and now only reflects online/offline status.
 * Please use `useOnlineStatus` for new components.
 */
export const useSync = () => {
    const isOnline = useOnlineStatus();
    const syncStatus: SyncStatus = isOnline ? 'synced' : 'offline';

    return { syncStatus };
};
