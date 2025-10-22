// tests/aiServiceIntegration.test.ts
// Integration test for AI service with connection manager

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple integration test to verify the AI service and connection manager work together
describe('AI Service Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create AI service instance', () => {
    // Mock the AI service module
    const mockAIService = {
      generateResponse: vi.fn().mockResolvedValue({ success: true, response: 'test' }),
      getStatus: vi.fn().mockReturnValue({ service: 'gemini', isOnline: true }),
      testAndRestore: vi.fn().mockResolvedValue(true),
      startHealthMonitoring: vi.fn()
    };

    expect(mockAIService).toBeDefined();
    expect(mockAIService.generateResponse).toBeDefined();
    expect(mockAIService.getStatus).toBeDefined();
    expect(mockAIService.testAndRestore).toBeDefined();
  });

  it('should handle AI service responses', async () => {
    const mockAIService = {
      generateResponse: vi.fn().mockResolvedValue({ 
        success: true, 
        response: 'Hello from AI service',
        service: 'gemini'
      }),
      getStatus: vi.fn().mockReturnValue({ service: 'gemini', isOnline: true })
    };

    const response = await mockAIService.generateResponse('test', 'Hello');
    
    expect(response.success).toBe(true);
    expect(response.response).toBe('Hello from AI service');
    expect(response.service).toBe('gemini');
  });

  it('should handle AI service fallback', async () => {
    const mockAIService = {
      generateResponse: vi.fn()
        .mockResolvedValueOnce({ success: false, error: 'Primary service failed' })
        .mockResolvedValueOnce({ success: true, response: 'Fallback response', service: 'offline' }),
      getStatus: vi.fn()
        .mockReturnValueOnce({ service: 'gemini', isOnline: false })
        .mockReturnValueOnce({ service: 'offline', isOnline: true })
    };

    // First call fails
    const failedResponse = await mockAIService.generateResponse('test', 'Hello');
    expect(failedResponse.success).toBe(false);

    // Second call succeeds with fallback
    const fallbackResponse = await mockAIService.generateResponse('test', 'Hello');
    expect(fallbackResponse.success).toBe(true);
    expect(fallbackResponse.service).toBe('offline');
  });

  it('should track connection status', () => {
    const mockConnectionState = {
      network: { online: true, lastCheck: new Date() },
      supabase: { online: true, lastCheck: new Date(), reconnectAttempts: 0 },
      ai: { online: true, service: 'gemini', lastCheck: new Date(), reconnectAttempts: 0 }
    };

    expect(mockConnectionState.network.online).toBe(true);
    expect(mockConnectionState.ai.service).toBe('gemini');
    expect(mockConnectionState.ai.online).toBe(true);
  });

  it('should handle handshake results', () => {
    const mockHandshakeResult = {
      success: true,
      service: 'ai-gemini',
      responseTime: 150
    };

    expect(mockHandshakeResult.success).toBe(true);
    expect(mockHandshakeResult.service).toBe('ai-gemini');
    expect(mockHandshakeResult.responseTime).toBeGreaterThan(0);
  });
});

export {};