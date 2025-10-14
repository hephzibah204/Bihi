import React, { useState, useEffect } from 'react';
import XIcon from './icons/XIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

const GlobalSuccessNotification = () => {
    const [notification, setNotification] = useState<{ message: string } | null>(null);

    useEffect(() => {
        const handleShowSuccess = (e: Event) => {
            const customEvent = e as CustomEvent;
            setNotification({ message: customEvent.detail.message });
            const timer = setTimeout(() => setNotification(null), 4000); // Auto-dismiss after 4 seconds
            return () => clearTimeout(timer);
        };
        
        window.addEventListener('show-global-success', handleShowSuccess);
        
        return () => {
            window.removeEventListener('show-global-success', handleShowSuccess);
        };
    }, []);

    if (!notification) return null;

    return (
        <div className={`fixed top-20 right-4 md:top-4 z-[100] p-4 rounded-lg shadow-lg bg-green-500 text-white max-w-sm flex items-start`}>
            <CheckCircleIcon className="w-6 h-6 mr-3 flex-shrink-0" />
            <p className="flex-1">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-4 -mr-2 -mt-2 p-2">
                <XIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// Simple CheckCircleIcon for the success toast
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);


export default GlobalSuccessNotification;