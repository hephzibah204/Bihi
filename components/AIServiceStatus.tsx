// components/AIServiceStatus.tsx
// UI component for displaying AI service status and handling notifications

import React, { useState, useEffect } from 'react';
import { getAIService, type AIServiceStatus } from '../services/aiService';
import { logger } from '../utils/logger';

interface AIServiceStatusProps {
  showDetails?: boolean;
  className?: string;
  onStatusChange?: (status: AIServiceStatus) => void;
}

export const AIServiceStatusComponent: React.FC<AIServiceStatusProps> = ({
  showDetails = false,
  className = '',
  onStatusChange
}) => {
  const [status, setStatus] = useState<AIServiceStatus | null>(null);
  const [notification, setNotification] = useState<{
    type: 'restored' | 'down' | null;
    message: string;
    timestamp: Date;
  } | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const aiService = getAIService();
    
    // Get initial status
    const initialStatus = aiService.getStatus();
    setStatus(initialStatus);
    onStatusChange?.(initialStatus);

    // Listen for service events
    const handleServiceRestored = (event: CustomEvent) => {
      const { service, status: newStatus } = event.detail;
      setStatus(newStatus);
      setNotification({
        type: 'restored',
        message: `${service.toUpperCase()} AI service restored`,
        timestamp: new Date()
      });
      onStatusChange?.(newStatus);
      
      // Auto-hide notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    };

    const handleServiceDown = (event: CustomEvent) => {
      const { service, status: newStatus } = event.detail;
      setStatus(newStatus);
      setNotification({
        type: 'down',
        message: `${service.toUpperCase()} AI service unavailable${newStatus.service === 'fallback' ? ' - Using offline mode' : ''}`,
        timestamp: new Date()
      });
      onStatusChange?.(newStatus);
      
      logger.warn('AI service notification displayed');
    };

    window.addEventListener('ai-service-restored', handleServiceRestored as EventListener);
    window.addEventListener('ai-service-down', handleServiceDown as EventListener);

    return () => {
      window.removeEventListener('ai-service-restored', handleServiceRestored as EventListener);
      window.removeEventListener('ai-service-down', handleServiceDown as EventListener);
    };
  }, [onStatusChange]);

  const handleRetryConnection = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      const aiService = getAIService();
      const restored = await aiService.testAndRestore();
      
      if (restored) {
        setNotification({
          type: 'restored',
          message: 'Connection restored successfully',
          timestamp: new Date()
        });
        setTimeout(() => setNotification(null), 3000);
      } else {
        setNotification({
          type: 'down',
          message: 'Connection test failed - still offline',
          timestamp: new Date()
        });
      }
    } catch (error: any) {
      logger.error('Manual connection retry failed');
      setNotification({
        type: 'down',
        message: 'Retry failed - please check your connection',
        timestamp: new Date()
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getStatusColor = () => {
    if (!status) return 'bg-gray-500';
    
    switch (status.service) {
      case 'gemini':
        return status.online ? 'bg-green-500' : 'bg-red-500';
      case 'fallback':
        return 'bg-yellow-500';
      case 'offline':
      default:
        return 'bg-red-500';
    }
  };

  const getStatusText = () => {
    if (!status) return 'Unknown';
    
    switch (status.service) {
      case 'gemini':
        return status.online ? 'AI Online' : 'AI Offline';
      case 'fallback':
        return 'Offline Mode';
      case 'offline':
      default:
        return 'Unavailable';
    }
  };

  const getStatusIcon = () => {
    if (!status) return '❓';
    
    switch (status.service) {
      case 'gemini':
        return status.online ? '🤖' : '❌';
      case 'fallback':
        return '📱';
      case 'offline':
      default:
        return '🔌';
    }
  };

  if (!status) return null;

  return (
    <div className={`ai-service-status ${className}`}>
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <span className="text-sm font-medium">
          {getStatusIcon()} {getStatusText()}
        </span>
        
        {/* Retry Button */}
        {!status.online && (
          <button
            onClick={handleRetryConnection}
            disabled={isRetrying}
            className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isRetrying ? '⏳' : '🔄'} {isRetrying ? 'Testing...' : 'Retry'}
          </button>
        )}
      </div>

      {/* Detailed Status */}
      {showDetails && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <div>Service: {status.service}</div>
          <div>Last Check: {status.lastCheck.toLocaleTimeString()}</div>
          {status.responseTime && (
            <div>Response Time: {status.responseTime}ms</div>
          )}
          {status.error && (
            <div className="text-red-600">Error: {status.error}</div>
          )}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'restored' 
            ? 'bg-green-100 border-green-500 text-green-800' 
            : 'bg-yellow-100 border-yellow-500 text-yellow-800'
        } border-l-4`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'restored' ? '✅' : '⚠️'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
              <p className="text-xs mt-1 opacity-75">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto flex-shrink-0 text-lg leading-none hover:opacity-75"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for using AI service status in components
export const useAIServiceStatus = () => {
  const [status, setStatus] = useState<AIServiceStatus | null>(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const aiService = getAIService();
    const initialStatus = aiService.getStatus();
    setStatus(initialStatus);
    setIsOnline(initialStatus.online);

    const handleStatusChange = (event: CustomEvent) => {
      const newStatus = event.detail.status;
      setStatus(newStatus);
      setIsOnline(newStatus.online);
    };

    window.addEventListener('ai-service-restored', handleStatusChange as EventListener);
    window.addEventListener('ai-service-down', handleStatusChange as EventListener);

    return () => {
      window.removeEventListener('ai-service-restored', handleStatusChange as EventListener);
      window.removeEventListener('ai-service-down', handleStatusChange as EventListener);
    };
  }, []);

  const retryConnection = async () => {
    const aiService = getAIService();
    return await aiService.testAndRestore();
  };

  const forceHealthCheck = async () => {
    const aiService = getAIService();
    return await aiService.forceHealthCheck();
  };

  return {
    status,
    isOnline,
    retryConnection,
    forceHealthCheck
  };
};

export default AIServiceStatusComponent;