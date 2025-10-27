import React, { useState, useEffect } from 'react';
import XIcon from './icons/XIcon';

const GlobalNotification = () => {
    const [notification, setNotification] = useState<{ title?: string, message: string, type: 'error' | 'success', actionText?: string, actionUrl?: string } | null>(null);

    useEffect(() => {
        const handleShowError = (e: Event) => {
            const customEvent = e as CustomEvent;
            setNotification({ title: customEvent.detail.title, message: customEvent.detail.message, type: 'error', actionText: customEvent.detail.actionText, actionUrl: customEvent.detail.actionUrl });
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
            <div className="flex-1">
              {notification.title && (<div className="font-semibold">{notification.title}</div>)}
              <p>{notification.message}</p>
              {notification.actionUrl && (
                <a href={notification.actionUrl} className="underline mt-2 inline-block" onClick={() => setNotification(null)}>{notification.actionText || 'Open'}</a>
              )}
            </div>
            <button onClick={() => setNotification(null)} className="ml-4 -mr-2 -mt-2 p-2">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};
export default GlobalNotification;