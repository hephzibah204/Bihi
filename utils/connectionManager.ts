// utils/connectionManager.ts
// Centralized connection management with handshake protocols for service restoration

import { logger } from './logger';
import { getAIService } from '../services/aiService';
import { getSupabase, isSupabaseOnline, startConnectionMonitoring as startSupabaseMonitoring } from '../services/supabaseClient';

interface ConnectionState {
  supabase: {
    online: boolean;
    lastCheck: Date;
    reconnectAttempts: number;
  };
  ai: {
    online: boolean;
    service: string;
    lastCheck: Date;
    reconnectAttempts: number;
  };
  network: {
    online: boolean;
    lastCheck: Date;
  };
}

interface HandshakeResult {
  success: boolean;
  service: string;
  responseTime: number;
  error?: string;
}

class ConnectionManager {
  private state: ConnectionState;
  private logger = logger;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Start with 2 seconds

  constructor() {
        this.state = {
      supabase: {
        online: false,
        lastCheck: new Date(),
        reconnectAttempts: 0
      },
      ai: {
        online: false,
        service: 'offline',
        lastCheck: new Date(),
        reconnectAttempts: 0
      },
      network: {
        online: navigator.onLine,
        lastCheck: new Date()
      }
    };

    this.setupNetworkListeners();
    this.startMonitoring();
  }

  /**
   * Setup network connectivity listeners
   */
  private setupNetworkListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.state.network.online = true;
      this.state.network.lastCheck = new Date();
      this.logger.info('Network connection restored');
      this.handleNetworkRestore();
    });

    window.addEventListener('offline', () => {
      this.state.network.online = false;
      this.state.network.lastCheck = new Date();
      this.logger.warn('Network connection lost');
      this.notifyConnectionLost('network');
    });
  }

  /**
   * Handle network restoration with service handshakes
   */
  private async handleNetworkRestore() {
    this.logger.info('Starting service restoration handshakes');
    
    // Reset reconnect attempts when network is restored
    this.state.supabase.reconnectAttempts = 0;
    this.state.ai.reconnectAttempts = 0;

    // Perform handshakes in parallel
    const handshakes = await Promise.allSettled([
      this.performSupabaseHandshake(),
      this.performAIHandshake()
    ]);

    const results = handshakes.map((result, index) => ({
      service: index === 0 ? 'supabase' : 'ai',
      success: result.status === 'fulfilled' && result.value.success,
      result: result.status === 'fulfilled' ? result.value : { success: false, error: 'Promise rejected' }
    }));

    this.logger.info('Service restoration handshakes completed', { results });

    // Notify UI of restoration results
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('connection-restoration-complete', {
        detail: { results, timestamp: new Date() }
      }));
    }
  }

  /**
   * Perform Supabase connection handshake
   */
  private async performSupabaseHandshake(): Promise<HandshakeResult> {
    const startTime = Date.now();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        service: 'supabase',
        responseTime: Date.now() - startTime,
        error: 'Network offline'
      };
    }
    
    try {
      this.logger.info('Performing Supabase handshake');
      
      // Test basic connectivity
      const isOnline = await isSupabaseOnline();
      const responseTime = Date.now() - startTime;
      
      if (isOnline) {
        this.state.supabase.online = true;
        this.state.supabase.lastCheck = new Date();
        this.state.supabase.reconnectAttempts = 0;
        
        this.logger.info('Supabase handshake successful', { responseTime });
        this.notifyConnectionRestored('supabase');
        
        return {
          success: true,
          service: 'supabase',
          responseTime
        };
      } else {
        throw new Error('Supabase connectivity test failed');
      }
    } catch (error: any) {
      this.state.supabase.online = false;
      this.state.supabase.reconnectAttempts = Math.min(this.state.supabase.reconnectAttempts + 1, this.maxReconnectAttempts);
      
      this.logger.error('Supabase handshake failed', { 
        error: error.message, 
        attempts: this.state.supabase.reconnectAttempts 
      });
      
      return {
        success: false,
        service: 'supabase',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Perform AI service connection handshake
   */
  private async performAIHandshake(): Promise<HandshakeResult> {
    const startTime = Date.now();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        success: false,
        service: 'ai',
        responseTime: Date.now() - startTime,
        error: 'Network offline'
      };
    }
    
    try {
      this.logger.info('Performing AI service handshake');
      
      const aiService = getAIService();
      const restored = await aiService.testAndRestore();
      const status = aiService.getStatus();
      const responseTime = Date.now() - startTime;
      
      this.state.ai.online = restored;
      this.state.ai.service = status.service;
      this.state.ai.lastCheck = new Date();
      
      if (restored) {
        this.state.ai.reconnectAttempts = 0;
        this.logger.info('AI service handshake successful', { 
          service: status.service, 
          responseTime 
        });
        this.notifyConnectionRestored('ai');
        
        return {
          success: true,
          service: `ai-${status.service}`,
          responseTime
        };
      } else {
        this.state.ai.reconnectAttempts++;
        throw new Error(`AI service handshake failed - service: ${status.service}`);
      }
    } catch (error: any) {
      this.state.ai.reconnectAttempts = Math.min(this.state.ai.reconnectAttempts + 1, this.maxReconnectAttempts);
      
      this.logger.error('AI service handshake failed', { 
        error: error.message, 
        attempts: this.state.ai.reconnectAttempts 
      });
      
      return {
        success: false,
        service: 'ai',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Start comprehensive connection monitoring
   */
  public startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.logger.info('Connection manager monitoring started');
    
    // Start individual service monitoring
    startSupabaseMonitoring();
    getAIService().startHealthMonitoring();
    
    // Overall connection health check every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);
  }

  /**
   * Stop connection monitoring
   */
  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      this.logger.info('Connection manager monitoring stopped');
    }
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck() {
    if (!this.state.network.online) {
      return; // Skip if network is offline
    }

    // Check services that should be online but might have failed
    const checks = [];
    
    if (!this.state.supabase.online && this.state.supabase.reconnectAttempts < this.maxReconnectAttempts) {
      checks.push(this.attemptSupabaseReconnect());
    }
    
    if (!this.state.ai.online && this.state.ai.reconnectAttempts < this.maxReconnectAttempts) {
      checks.push(this.attemptAIReconnect());
    }
    
    if (checks.length > 0) {
      await Promise.allSettled(checks);
    }
  }

  /**
   * Attempt Supabase reconnection with exponential backoff
   */
  private async attemptSupabaseReconnect() {
    const delay = this.reconnectDelay * Math.pow(2, this.state.supabase.reconnectAttempts);
    
    this.logger.info('Attempting Supabase reconnection', { 
      attempt: this.state.supabase.reconnectAttempts + 1,
      delay 
    });
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await this.performSupabaseHandshake();
  }

  /**
   * Attempt AI service reconnection with exponential backoff
   */
  private async attemptAIReconnect() {
    const delay = this.reconnectDelay * Math.pow(2, this.state.ai.reconnectAttempts);
    
    this.logger.info('Attempting AI service reconnection', { 
      attempt: this.state.ai.reconnectAttempts + 1,
      delay 
    });
    
    await new Promise(resolve => setTimeout(resolve, delay));
    await this.performAIHandshake();
  }

  /**
   * Notify connection restored
   */
  private notifyConnectionRestored(service: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('service-connection-restored', {
        detail: { 
          service, 
          timestamp: new Date(),
          state: this.getConnectionState()
        }
      }));
    }
  }

  /**
   * Notify connection lost
   */
  private notifyConnectionLost(service: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('service-connection-lost', {
        detail: { 
          service, 
          timestamp: new Date(),
          state: this.getConnectionState()
        }
      }));
    }
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): ConnectionState {
    try {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : this.state.network.online;
      this.state.network.online = online;
      this.state.network.lastCheck = new Date();
    } catch {}
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Force reconnection of all services
   */
  public async forceReconnectAll(): Promise<{ supabase: HandshakeResult; ai: HandshakeResult }> {
    this.logger.info('Forcing reconnection of all services');
    
    const [supabaseResult, aiResult] = await Promise.allSettled([
      this.performSupabaseHandshake(),
      this.performAIHandshake()
    ]);
    
    return {
      supabase: supabaseResult.status === 'fulfilled' ? supabaseResult.value : {
        success: false,
        service: 'supabase',
        responseTime: 0,
        error: 'Handshake promise rejected'
      },
      ai: aiResult.status === 'fulfilled' ? aiResult.value : {
        success: false,
        service: 'ai',
        responseTime: 0,
        error: 'Handshake promise rejected'
      }
    };
  }

  /**
   * Check if all critical services are online
   */
  public areServicesHealthy(): boolean {
    return this.state.network.online && 
           (this.state.supabase.online || this.state.ai.online);
  }
}

// Singleton instance
let connectionManagerInstance: ConnectionManager | null = null;

export function getConnectionManager(): ConnectionManager {
  if (!connectionManagerInstance) {
    connectionManagerInstance = new ConnectionManager();
  }
  return connectionManagerInstance;
}

export { ConnectionManager, type ConnectionState, type HandshakeResult };
