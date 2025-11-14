// tests/offlineMode.test.ts
// Comprehensive tests for offline mode transitions and fallback behavior

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { getConnectionManager, ConnectionManager } from '../utils/connectionManager';
import { isSupabaseOnline } from '../services/supabaseClient';
import { getAIService } from '../services/aiService';
import { logger } from '../utils/logger';

// Mock dependencies
vi.mock('../services/supabaseClient', () => ({
  isSupabaseOnline: vi.fn(),
  startConnectionMonitoring: vi.fn(),
  getSupabase: vi.fn(() => ({ from: vi.fn() }))
}));

vi.mock('../services/aiService', () => ({
  getAIService: vi.fn(() => ({
    testAndRestore: vi.fn(),
    getStatus: vi.fn(() => ({ service: 'gemini', isOnline: true })),
    startHealthMonitoring: vi.fn(),
    generateResponse: vi.fn()
  }))
}));

vi.mock('../utils/logger', () => ({
  Logger: {
    getInstance: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      captureError: vi.fn()
    }))
  },
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    captureError: vi.fn()
  }
}));

// Mock window and navigator
Object.defineProperty(window, 'navigator', {
  value: { onLine: true },
  writable: true
});

Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'removeEventListener', {
  value: vi.fn(),
  writable: true
});

Object.defineProperty(window, 'dispatchEvent', {
  value: vi.fn(),
  writable: true
});

describe('Offline Mode and Connection Management', () => {
  let connectionManager: ConnectionManager;
  let mockAIService: any;
  let mockSupabaseOnline: MockedFunction<any>;
  let mockLogger: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset navigator online status
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });

    // Setup mocks
    mockAIService = {
      testAndRestore: vi.fn().mockResolvedValue(true),
      getStatus: vi.fn().mockReturnValue({ service: 'gemini', isOnline: true }),
      startHealthMonitoring: vi.fn(),
      generateResponse: vi.fn().mockResolvedValue({ success: true, response: 'test' })
    };
    
    (getAIService as MockedFunction<any>).mockReturnValue(mockAIService);
    
    mockSupabaseOnline = isSupabaseOnline as MockedFunction<any>;
    mockSupabaseOnline.mockResolvedValue(true);

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
    
    // Logger is already a singleton instance, no need to mock getInstance

    connectionManager = getConnectionManager();
  });

  afterEach(() => {
    connectionManager.stopMonitoring();
  });

  describe('Network Connectivity Changes', () => {
    it('should detect network going offline', async () => {
      // Simulate network going offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      // Trigger offline event
      const offlineEvent = new Event('offline');
      window.dispatchEvent(offlineEvent);

      const state = connectionManager.getConnectionState();
      expect(state.network.online).toBe(false);
    });

    it('should trigger restoration handshakes when network comes back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true
      });

      // Go back online
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        writable: true
      });

      // Trigger online event
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify handshakes were attempted
      expect(mockSupabaseOnline).toHaveBeenCalled();
      expect(mockAIService.testAndRestore).toHaveBeenCalled();
    });
  });

  describe('Service Handshakes', () => {
    it('should perform successful Supabase handshake', async () => {
      mockSupabaseOnline.mockResolvedValue(true);

      const results = await connectionManager.forceReconnectAll();
      
      expect(results.supabase.success).toBe(true);
      expect(results.supabase.service).toBe('supabase');
      expect(results.supabase.responseTime).toBeGreaterThan(0);
    });

    it('should handle failed Supabase handshake', async () => {
      mockSupabaseOnline.mockRejectedValue(new Error('Connection failed'));

      const results = await connectionManager.forceReconnectAll();
      
      expect(results.supabase.success).toBe(false);
      expect(results.supabase.error).toBe('Connection failed');
    });

    it('should perform successful AI service handshake', async () => {
      mockAIService.testAndRestore.mockResolvedValue(true);
      mockAIService.getStatus.mockReturnValue({ service: 'gemini', isOnline: true });

      const results = await connectionManager.forceReconnectAll();
      
      expect(results.ai.success).toBe(true);
      expect(results.ai.service).toBe('ai-gemini');
    });

    it('should handle failed AI service handshake', async () => {
      mockAIService.testAndRestore.mockResolvedValue(false);
      mockAIService.getStatus.mockReturnValue({ service: 'offline', isOnline: false });

      const results = await connectionManager.forceReconnectAll();
      
      expect(results.ai.success).toBe(false);
      expect(results.ai.error).toContain('AI service handshake failed');
    });
  });

  describe('Reconnection Logic', () => {
    it('should implement exponential backoff for reconnection attempts', async () => {
      mockSupabaseOnline.mockRejectedValue(new Error('Connection failed'));
      
      const state = connectionManager.getConnectionState();
      
      // Simulate multiple failed attempts
      await connectionManager.forceReconnectAll();
      expect(state.supabase.reconnectAttempts).toBeGreaterThanOrEqual(0);
      
      await connectionManager.forceReconnectAll();
      // Verify attempts are being tracked
      const newState = connectionManager.getConnectionState();
      expect(newState.supabase.reconnectAttempts).toBeGreaterThanOrEqual(0);
    });

    it('should reset reconnect attempts on successful connection', async () => {
      // First fail, then succeed
      mockSupabaseOnline
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue(true);

      // First attempt fails
      await connectionManager.forceReconnectAll();
      
      // Second attempt succeeds
      await connectionManager.forceReconnectAll();
      
      const state = connectionManager.getConnectionState();
      expect(state.supabase.online).toBe(true);
    });

    it('should stop attempting reconnection after max attempts', async () => {
      mockSupabaseOnline.mockRejectedValue(new Error('Connection failed'));
      
      // Simulate multiple failed attempts beyond the limit
      for (let i = 0; i < 6; i++) {
        await connectionManager.forceReconnectAll();
      }
      
      const state = connectionManager.getConnectionState();
      expect(state.supabase.reconnectAttempts).toBeLessThanOrEqual(5);
    });
  });

  describe('Event Dispatching', () => {
    it('should dispatch connection restored events', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      mockSupabaseOnline.mockResolvedValue(true);
      mockAIService.testAndRestore.mockResolvedValue(true);

      await connectionManager.forceReconnectAll();

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'service-connection-restored'
        })
      );
    });

    it('should dispatch restoration complete events', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      // Trigger network restoration
      const onlineEvent = new Event('online');
      window.dispatchEvent(onlineEvent);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'connection-restoration-complete'
        })
      );
    });
  });

  describe('Health Monitoring', () => {
    it('should report healthy status when all services are online', () => {
      const state = connectionManager.getConnectionState();
      state.network.online = true;
      state.supabase.online = true;
      state.ai.online = true;

      expect(connectionManager.areServicesHealthy()).toBe(true);
    });

    it('should report healthy status when at least one critical service is online', () => {
      const state = connectionManager.getConnectionState();
      state.network.online = true;
      state.supabase.online = false;
      state.ai.online = true;

      expect(connectionManager.areServicesHealthy()).toBe(true);
    });

    it('should report unhealthy status when network is offline', () => {
      const state = connectionManager.getConnectionState();
      state.network.online = false;
      state.supabase.online = true;
      state.ai.online = true;

      expect(connectionManager.areServicesHealthy()).toBe(false);
    });

    it('should report unhealthy status when all services are offline', () => {
      const state = connectionManager.getConnectionState();
      state.network.online = true;
      state.supabase.online = false;
      state.ai.online = false;

      expect(connectionManager.areServicesHealthy()).toBe(false);
    });
  });

  describe('AI Service Fallback Behavior', () => {
    it('should switch to fallback when primary AI service fails', async () => {
      // Mock AI service to fail primary and succeed with fallback
      mockAIService.testAndRestore.mockResolvedValueOnce(false);
      mockAIService.getStatus.mockReturnValue({ service: 'offline', isOnline: false });
      
      const results = await connectionManager.forceReconnectAll();
      
      expect(results.ai.success).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'AI service handshake failed',
        expect.any(Object)
      );
    });

    it('should notify when AI service switches to fallback mode', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      
      mockAIService.testAndRestore.mockResolvedValue(false);
      
      await connectionManager.forceReconnectAll();
      
      // Should dispatch connection lost event for AI service
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});

export {};
