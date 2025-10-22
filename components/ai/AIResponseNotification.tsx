// components/ai/AIResponseNotification.tsx
import React from 'react';
import { FormattedResponse } from '@/services/geminiAIService';

interface AIResponseNotificationProps {
    response: FormattedResponse;
    onClose?: () => void;
}

export const AIResponseNotification: React.FC<AIResponseNotificationProps> = ({ 
    response, 
    onClose 
}) => {
    const { notification } = response;

    if (!notification) return null;

    const typeStyles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800'
    };

    const iconStyles = {
        success: 'text-green-600',
        info: 'text-blue-600',
        warning: 'text-yellow-600',
        error: 'text-red-600'
    };

    return (
        <div className={`border rounded-lg p-4 mb-4 ${typeStyles[notification.type]}`}>
            <div className="flex items-start">
                <div className={`text-xl mr-3 ${iconStyles[notification.type]}`}>
                    {notification.icon}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium whitespace-pre-line">
                        {notification.message}
                    </p>
                    {notification.showFallbackInfo && (
                        <p className="text-xs mt-2 opacity-75">
                            Don't worry - our backup AI system ensures you always get a response!
                        </p>
                    )}
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 ml-2"
                        aria-label="Close notification"
                    >
                        ×
                    </button>
                )}
            </div>
        </div>
    );
};

/**
 * Compact inline version for smaller spaces
 */
export const AIResponseBadge: React.FC<{ response: FormattedResponse }> = ({ response }) => {
    const { notification } = response;

    if (!notification) return null;

    const badgeStyles = {
        success: 'bg-green-100 text-green-800',
        info: 'bg-blue-100 text-blue-800',
        warning: 'bg-yellow-100 text-yellow-800',
        error: 'bg-red-100 text-red-800'
    };

    return (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[notification.type]}`}>
            <span className="mr-1">{notification.icon}</span>
            <span>{notification.message.split('\n')[0]}</span>
        </div>
    );
};