import React from 'react';
import CloudCheckIcon from './icons/CloudCheckIcon';
import CloudArrowUpIcon from './icons/CloudArrowUpIcon';
import CloudSlashIcon from './icons/CloudSlashIcon';
import { useSync } from '../hooks/useSync';

const SyncStatusIndicator = () => {
    const { syncStatus } = useSync();

    const statusInfo = {
        synced: {
            icon: <CloudCheckIcon className="w-5 h-5 text-green-500" />,
            text: 'Synced',
            color: 'text-green-500'
        },
        syncing: {
            icon: <CloudArrowUpIcon className="w-5 h-5 text-blue-500 animate-pulse" />,
            text: 'Syncing...',
            color: 'text-blue-500'
        },
        unsynced: {
            icon: <CloudArrowUpIcon className="w-5 h-5 text-yellow-500" />,
            text: 'Unsynced',
            color: 'text-yellow-500'
        },
        offline: {
            icon: <CloudSlashIcon className="w-5 h-5 text-red-500" />,
            text: 'Offline',
            color: 'text-red-500'
        }
    };

    const currentStatus = statusInfo[syncStatus];
    if (!currentStatus) return null;

    const tooltipText = {
        synced: "All changes are saved to the cloud.",
        syncing: "Saving your changes to the cloud...",
        unsynced: "You have unsaved changes. They will sync automatically.",
        offline: "You are offline. Changes are saved locally and will sync when you reconnect."
    }[syncStatus];

    return (
        <div title={tooltipText} className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 flex items-center space-x-2 text-sm z-50">
            {currentStatus.icon}
            <span className={`font-medium ${currentStatus.color}`}>{currentStatus.text}</span>
        </div>
    );
};

export default SyncStatusIndicator;
