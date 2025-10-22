// hooks/useConnectionManager.ts
// React hook for managing connection state and restoration

import { useState, useEffect, useCallback } from 'react';
import { getConnectionManager, type ConnectionState, type HandshakeResult } from '../utils/connectionManager';
import { Logger } from '../utils/logger';

interface UseConnectionManagerReturn {
  connectionState: ConnectionState | null;
  isRestoring: boolean;
  lastRestoration: {
    results?: Array<{
      service: string;
      success: boolean;
      result: HandshakeResult;
    }>;
    timestamp?: Date;
  } | null;
  forceReconnect: () => Promise<void>;
  areServicesHealthy: boolean;
}

export function useConnectionManager(): UseConnectionManagerReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastRestoration, setLastRestoration] = useState<UseConnectionManagerReturn['lastRestoration']>(null);
  const logger = Logger.getInstance();

  // Initialize connection manager and get initial state
  useEffect(() => {
    const connectionManager = getConnectionManager();
    setConnectionState(connectionManager.getConnectionState());
  }, []);

  // Listen for connection events
  useEffect(() => {
    const handleConnectionRestored = (event: CustomEvent) => {
      logger.info('Connection restored hook event', event.detail);
      const connectionManager = getConnectionManager();
      setConnectionState(connectionManager.getConnectionState());
    };

    const handleConnectionLost = (event: CustomEvent) => {
      logger.warn('Connection lost hook event', event.detail);
      const connectionManager = getConnectionManager();
      setConnectionState(connectionManager.getConnectionState());
    };

    const handleRestorationComplete = (event: CustomEvent) => {
      logger.info('Restoration complete hook event', event.detail);
      setIsRestoring(false);
      setLastRestoration({
        results: event.detail.results,
        timestamp: event.detail.timestamp
      });
      
      const connectionManager = getConnectionManager();
      setConnectionState(connectionManager.getConnectionState());
    };

    const handleNetworkOnline = () => {
      setIsRestoring(true);
    };

    // Add event listeners
    window.addEventListener('service-connection-restored', handleConnectionRestored as EventListener);
    window.addEventListener('service-connection-lost', handleConnectionLost as EventListener);
    window.addEventListener('connection-restoration-complete', handleRestorationComplete as EventListener);
    window.addEventListener('online', handleNetworkOnline);

    // Cleanup
    return () => {
      window.removeEventListener('service-connection-restored', handleConnectionRestored as EventListener);
      window.removeEventListener('service-connection-lost', handleConnectionLost as EventListener);
      window.removeEventListener('connection-restoration-complete', handleRestorationComplete as EventListener);
      window.removeEventListener('online', handleNetworkOnline);
    };
  }, [logger]);

  // Force reconnection function
  const forceReconnect = useCallback(async () => {
    setIsRestoring(true);
    
    try {
      const connectionManager = getConnectionManager();
      const results = await connectionManager.forceReconnectAll();
      
      logger.info('Force reconnect completed via hook', results);
      
      setLastRestoration({
        results: [
          { service: 'supabase', success: results.supabase.success, result: results.supabase },
          { service: 'ai', success: results.ai.success, result: results.ai }
        ],
        timestamp: new Date()
      });
      
      setConnectionState(connectionManager.getConnectionState());
    } catch (error) {
      logger.error('Force reconnect failed via hook', error);
    } finally {
      setIsRestoring(false);
    }
  }, [logger]);

  // Calculate if services are healthy
  const areServicesHealthy = connectionState ? 
    getConnectionManager().areServicesHealthy() : false;

  return {
    connectionState,
    isRestoring,
    lastRestoration,
    forceReconnect,
    areServicesHealthy
  };
}

export default useConnectionManager;