// components/ConnectionStatusBar.tsx
// Status bar component showing connection health and restoration progress

import React, { useState, useEffect } from 'react';
import { getConnectionManager, type ConnectionState, type HandshakeResult } from '../utils/connectionManager';
import { logger } from '../utils/logger';

interface ConnectionStatusBarProps {
  className?: string;
  showDetails?: boolean;
}

interface RestorationProgress {
  inProgress: boolean;
  results?: Array<{
    service: string;
    success: boolean;
    result: HandshakeResult;
  }>;
  timestamp?: Date;
}

export const ConnectionStatusBar: React.FC<ConnectionStatusBarProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [restorationProgress, setRestorationProgress] = useState<RestorationProgress>({ inProgress: false });
  const [isExpanded, setIsExpanded] = useState(false);
  // removed: const logger = Logger.getInstance();

  useEffect(() => {
    const connectionManager = getConnectionManager();
    
    // Initial state
    setConnectionState(connectionManager.getConnectionState());

    // Listen for connection events
    const handleConnectionRestored = (event: CustomEvent) => {
      logger.info('Connection restored event received', event.detail);
      setConnectionState(connectionManager.getConnectionState());
    };

    const handleConnectionLost = (event: CustomEvent) => {
      logger.warn('Connection lost event received', event.detail);
      setConnectionState(connectionManager.getConnectionState());
    };

    const handleRestorationComplete = (event: CustomEvent) => {
      logger.info('Restoration complete event received', event.detail);
      setRestorationProgress({
        inProgress: false,
        results: event.detail.results,
        timestamp: event.detail.timestamp
      });
      setConnectionState(connectionManager.getConnectionState());
    };

    const handleRestorationStart = () => {
      setRestorationProgress({ inProgress: true });
    };

    // Add event listeners
    window.addEventListener('service-connection-restored', handleConnectionRestored as EventListener);
    window.addEventListener('service-connection-lost', handleConnectionLost as EventListener);
    window.addEventListener('connection-restoration-complete', handleRestorationComplete as EventListener);
    window.addEventListener('online', handleRestorationStart);

    // Cleanup
    return () => {
      window.removeEventListener('service-connection-restored', handleConnectionRestored as EventListener);
      window.removeEventListener('service-connection-lost', handleConnectionLost as EventListener);
      window.removeEventListener('connection-restoration-complete', handleRestorationComplete as EventListener);
      window.removeEventListener('online', handleRestorationStart);
    };
  }, [logger]);

  const getOverallStatus = (): 'online' | 'partial' | 'offline' | 'restoring' => {
    if (restorationProgress.inProgress) return 'restoring';
    if (!connectionState) return 'offline';
    
    const { network, supabase, ai } = connectionState;
    
    if (!network.online) return 'offline';
    if (supabase.online && ai.online) return 'online';
    if (supabase.online || ai.online) return 'partial';
    return 'offline';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'partial': return 'text-yellow-600 bg-yellow-100';
      case 'restoring': return 'text-blue-600 bg-blue-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'online': return '🟢';
      case 'partial': return '🟡';
      case 'restoring': return '🔄';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  const handleForceReconnect = async () => {
    const connectionManager = getConnectionManager();
    setRestorationProgress({ inProgress: true });
    
    try {
      const results = await connectionManager.forceReconnectAll();
      logger.info('Force reconnect completed', results);
      
      setRestorationProgress({
        inProgress: false,
        results: [
          { service: 'supabase', success: results.supabase.success, result: results.supabase },
          { service: 'ai', success: results.ai.success, result: results.ai }
        ],
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Force reconnect failed', error);
      setRestorationProgress({ inProgress: false });
    }
  };

  if (!connectionState) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1 rounded-md bg-gray-100 ${className}`}>
        <span className="text-sm text-gray-600">⚪ Initializing...</span>
      </div>
    );
  }

  const overallStatus = getOverallStatus();
  const statusColor = getStatusColor(overallStatus);
  const statusIcon = getStatusIcon(overallStatus);

  return (
    <div className={`${className}`}>
      {/* Main status bar */}
      <div 
        className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all ${statusColor}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            {statusIcon} {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
          </span>
          {restorationProgress.inProgress && (
            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
          )}
        </div>
        
        {showDetails && (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleForceReconnect();
              }}
              disabled={restorationProgress.inProgress}
              className="text-xs px-2 py-1 rounded bg-white bg-opacity-50 hover:bg-opacity-75 transition-colors disabled:opacity-50"
            >
              {restorationProgress.inProgress ? 'Reconnecting...' : 'Reconnect'}
            </button>
            <span className="text-xs">
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && showDetails && (
        <div className="mt-2 p-3 bg-white rounded-md border shadow-sm">
          <div className="space-y-2">
            {/* Network Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network</span>
              <span className={`text-xs px-2 py-1 rounded ${connectionState.network.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {connectionState.network.online ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Supabase Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Database</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${connectionState.supabase.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {connectionState.supabase.online ? 'Connected' : 'Disconnected'}
                </span>
                {connectionState.supabase.reconnectAttempts > 0 && (
                  <span className="text-xs text-gray-500">
                    ({connectionState.supabase.reconnectAttempts} attempts)
                  </span>
                )}
              </div>
            </div>

            {/* AI Service Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI Service</span>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${connectionState.ai.online ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {connectionState.ai.online ? connectionState.ai.service : 'Offline'}
                </span>
                {connectionState.ai.reconnectAttempts > 0 && (
                  <span className="text-xs text-gray-500">
                    ({connectionState.ai.reconnectAttempts} attempts)
                  </span>
                )}
              </div>
            </div>

            {/* Last restoration results */}
            {restorationProgress.results && (
              <div className="mt-3 pt-2 border-t">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  Last Restoration ({restorationProgress.timestamp?.toLocaleTimeString()})
                </div>
                {restorationProgress.results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="capitalize">{result.service}</span>
                    <div className="flex items-center space-x-1">
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.success ? '✓' : '✗'}
                      </span>
                      {result.result.responseTime && (
                        <span className="text-gray-500">
                          {result.result.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatusBar;