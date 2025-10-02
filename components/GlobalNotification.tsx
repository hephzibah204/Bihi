import React, { useState, useEffect } from 'react';
import XIcon from './icons/XIcon';

const GlobalNotification = () => {
    const [notification, setNotification] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

    useEffect(() => {
        const handleShowError = (e: Event) => {
            const customEvent = e as CustomEvent;
            setNotification({ message: customEvent.detail.message, type: 'error' });
            const timer = setTimeout(() => setNotification(null), 6000);
            return () => clearTimeout(timer);
        };
        window.addEventListener('show-global-error', handleShowError);
        return () => window.removeEventListener('show-global-error', handleShowError);
    }, []);

    if (!notification) return null;

    const colors = notification.type === 'error'
        ? 'bg-red-500 text-white'
        : 'bg-green-500 text-white';

    return (
        <div className={`fixed top-20 right-4 md:top-4 z-[100] p-4 rounded-lg shadow-lg ${colors} max-w-sm flex items-start`}>
            <p className="flex-1">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-4 -mr-2 -mt-2 p-2">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};
export default GlobalNotification;