import React from 'react';
import CloudCheckIcon from './icons/CloudCheckIcon';
import CloudSlashIcon from './icons/CloudSlashIcon';
import { useSync } from '../hooks/useSync';

const SyncStatusIndicator = () => {
    const { syncStatus } = useSync();

    const statusInfo = {
        synced: {
            icon: <CloudCheckIcon className="w-5 h-5 text-green-500" />,
            text: 'Online',
            color: 'text-green-500',
            tooltip: "You are online. All changes are saved instantly."
        },
        offline: {
            icon: <CloudSlashIcon className="w-5 h-5 text-red-500" />,
            text: 'Offline',
            color: 'text-red-500',
            tooltip: "You are offline. The app has limited functionality."
        }
    };

    const currentStatus = statusInfo[syncStatus];
    if (!currentStatus) return null;

    return (
        <div title={currentStatus.tooltip} className="fixed top-20 right-4 bg-white shadow-lg rounded-full p-2 flex items-center space-x-2 text-sm z-50">
            {currentStatus.icon}
            <span className={`font-medium ${currentStatus.color}`}>{currentStatus.text}</span>
        </div>
    );
};

export default SyncStatusIndicator;
