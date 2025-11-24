import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequest as itemsHandler } from '../functions/api/cbt/items.js';
import { onRequest as examsHandler } from '../functions/api/cbt/exams.js';
import { onRequest as startSessionHandler } from '../functions/api/cbt/sessions/start.js';
import { onRequest as submitSessionHandler } from '../functions/api/cbt/sessions/submit.js';
import { onRequest as markSessionHandler } from '../functions/api/cbt/mark-session.js';
import { onRequest as recordScoresHandler } from '../functions/api/cbt/record-scores.js';
import { onRequest as analyticsHandler } from '../functions/api/cbt/analytics/index.js';

// Mock environment variables
const mockEnv = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  GOOGLE_API_KEY: 'test-google-key',
  HUGGINGFACE_API_KEY: 'test-hf-key'
};

// Mock auth user
const mockAuthUser = {
  id: 'test-user-id',
  user_metadata: {
    tenant_id: 'test-tenant-id',
    role: 'Teacher'
  }
};

// Mock fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CBT API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Items API', () => {
    it('should handle GET requests with filters', async () => {
      const mockItems = [
        { id: '1', type: 'mcq', stem: 'Test question', difficulty: 5 },
        { id: '2', type: 'essay', stem: 'Test essay', difficulty: 8 }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockItems
      });

      const request = new Request('http://localhost/api/cbt/items?type=mcq&difficultyMin=3', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const context = { request, env: mockEnv };
      const response = await itemsHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockItems);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('type=eq.mcq'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should handle POST requests to create items', async () => {
      const newItem = {
        type: 'mcq',
        stem: 'New question',
        options: ['A', 'B', 'C', 'D'],
        answer_key: { correct: 'A' },
        difficulty: 6
      };

      const createdItem = { ...newItem, id: '3', tenant_id: 'test-tenant-id' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => createdItem
      });

      const request = new Request('http://localhost/api/cbt/items', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
      });

      const context = { request, env: mockEnv };
      const response = await itemsHandler(context);
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toEqual(createdItem);
    });

    it('should reject unauthorized requests', async () => {
      const request = new Request('http://localhost/api/cbt/items', {
        method: 'GET'
      });

      const context = { request, env: mockEnv };
      const response = await itemsHandler(context);
      
      expect(response.status).toBe(403);
    });
  });

  describe('Exams API', () => {
    it('should handle GET requests with security restrictions', async () => {
      const mockExams = [
        { id: '1', title: 'Math Exam', status: 'ready' },
        { id: '2', title: 'Science Exam', status: 'draft' }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockExams
      });

      const request = new Request('http://localhost/api/cbt/exams?select=id,title,status', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const context = { request, env: mockEnv };
      const response = await examsHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockExams);
    });

    it('should reject broad SELECT * queries', async () => {
      const request = new Request('http://localhost/api/cbt/exams?select=*', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const context = { request, env: mockEnv };
      const response = await examsHandler(context);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Broad SELECT * queries are not allowed');
    });
  });

  describe('Session Management', () => {
    it('should create new exam session', async () => {
      const mockExam = { id: 'exam-1', status: 'ready' };
      const newSession = { id: 'session-1', exam_id: 'exam-1', user_id: 'test-user-id', status: 'not_started' };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [mockExam] })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })
        .mockResolvedValueOnce({ ok: true, json: async () => newSession });

      const request = new Request('http://localhost/api/cbt/sessions/start', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exam_id: 'exam-1' })
      });

      const context = { request, env: mockEnv };
      const response = await startSessionHandler(context);
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.session_id).toBe('session-1');
    });

    it('should handle existing active session', async () => {
      const mockExam = { id: 'exam-1', status: 'ready' };
      const existingSession = { id: 'session-1', status: 'in_progress' };

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [mockExam] })
        .mockResolvedValueOnce({ ok: true, json: async () => [existingSession] });

      const request = new Request('http://localhost/api/cbt/sessions/start', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ exam_id: 'exam-1' })
      });

      const context = { request, env: mockEnv };
      const response = await startSessionHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.session_id).toBe('session-1');
      expect(data.message).toBe('Existing session found');
    });

    it('should submit exam session', async () => {
      const mockSession = { id: 'session-1', status: 'in_progress', user_id: 'test-user-id' };
      const responses = [
        { item_id: 'item-1', answer: 'A', time_on_item_seconds: 120 }
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [mockSession] })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const request = new Request('http://localhost/api/cbt/sessions/submit', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: 'session-1', responses })
      });

      const context = { request, env: mockEnv };
      const response = await submitSessionHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('submitted');
    });
  });

  describe('Marking and Grading', () => {
    it('should mark objective questions correctly', async () => {
      const mockResponses = [
        { id: 'resp-1', item_id: 'item-1', answer: 'A' },
        { id: 'resp-2', item_id: 'item-2', answer: ['A', 'B'] }
      ];
      
      const mockItems = [
        { id: 'item-1', type: 'mcq', answer_key: { correct: 'A' }, rubric: { maxPoints: 2 } },
        { id: 'item-2', type: 'multiple_answer', answer_key: { correct: ['A', 'B'] }, rubric: { maxPoints: 3 } }
      ];

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponses })
        .mockResolvedValueOnce({ ok: true, json: async () => mockItems })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const request = new Request('http://localhost/api/cbt/mark-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: 'session-1' })
      });

      const context = { request, env: mockEnv };
      const response = await markSessionHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total_score).toBe(5); // 2 + 3 points
    });

    it('should handle AI grading for theory questions', async () => {
      const mockResponses = [
        { id: 'resp-1', item_id: 'item-1', answer: 'Sample essay answer' }
      ];
      
      const mockItems = [
        { id: 'item-1', type: 'essay', stem: 'Explain photosynthesis', rubric: { maxPoints: 10 } }
      ];

      // Mock successful Gemini API response
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponses })
        .mockResolvedValueOnce({ ok: true, json: async () => mockItems })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: '{"score": 7, "rationale": "Good explanation with minor gaps", "confidence": 0.8}'
                }]
              }
            }]
          })
        })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const request = new Request('http://localhost/api/cbt/mark-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: 'session-1' })
      });

      const context = { request, env: mockEnv };
      const response = await markSessionHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total_score).toBe(7);
    });

    it('should fallback to local scorer when AI fails', async () => {
      const mockResponses = [
        { id: 'resp-1', item_id: 'item-1', answer: 'Sample answer' }
      ];
      
      const mockItems = [
        { id: 'item-1', type: 'essay', stem: 'Explain concept', rubric: { maxPoints: 10 } }
      ];

      // Mock failed AI responses, then success for local scorer
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponses })
        .mockResolvedValueOnce({ ok: true, json: async () => mockItems })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      const request = new Request('http://localhost/api/cbt/mark-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: 'session-1' })
      });

      const context = { request, env: mockEnv };
      const response = await markSessionHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.total_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Analytics API', () => {
    it('should provide overview analytics', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ length: 50 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ length: 10 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ length: 200 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ length: 150 }) })
        .mockResolvedValueOnce({ ok: true, json: async () => [{ status: 'submitted' }] })
        .mockResolvedValueOnce({ ok: true, json: async () => [{ status: 'submitted' }] });

      const request = new Request('http://localhost/api/cbt/analytics?type=overview', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const context = { request, env: mockEnv };
      const response = await analyticsHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.overview).toBeDefined();
      expect(data.overview.total_items).toBe(50);
      expect(data.overview.total_exams).toBe(10);
    });

    it('should provide item statistics', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => [
          { type: 'mcq', difficulty: 5 },
          { type: 'essay', difficulty: 8 },
          { type: 'mcq', difficulty: 3 }
        ] })
        .mockResolvedValueOnce({ ok: true, json: async () => [
          { item_id: 'item-1', auto_score: 2 },
          { item_id: 'item-1', auto_score: 0 },
          { item_id: 'item-2', ai_score: 7 }
        ] });

      const request = new Request('http://localhost/api/cbt/analytics?type=item-stats', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const context = { request, env: mockEnv };
      const response = await analyticsHandler(context);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.type_distribution).toBeDefined();
      expect(data.type_distribution.mcq).toBe(2);
      expect(data.type_distribution.essay).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Database connection failed'));

      const request = new Request('http://localhost/api/cbt/items', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      const context = { request, env: mockEnv };
      const response = await itemsHandler(context);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Query failed');
    });

    it('should validate required parameters', async () => {
      const request = new Request('http://localhost/api/cbt/sessions/start', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Missing exam_id
      });

      const context = { request, env: mockEnv };
      const response = await startSessionHandler(context);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('exam_id is required');
    });

    it('should handle malformed JSON', async () => {
      const request = new Request('http://localhost/api/cbt/sessions/start', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: 'invalid json'
      });

      const context = { request, env: mockEnv };
      const response = await startSessionHandler(context);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid JSON');
    });
  });

  describe('Performance and Load', () => {
    it('should handle large response batches efficiently', async () => {
      const largeResponses = Array.from({ length: 100 }, (_, i) => ({
        id: `resp-${i}`,
        item_id: `item-${i % 10}`,
        answer: `Answer ${i}`
      }));

      const mockItems = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        type: 'mcq',
        answer_key: { correct: 'A' },
        rubric: { maxPoints: 2 }
      }));

      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => largeResponses })
        .mockResolvedValueOnce({ ok: true, json: async () => mockItems });

      // Mock multiple batch updates
      for (let i = 0; i < 100; i++) {
        mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
      }

      const request = new Request('http://localhost/api/cbt/mark-session', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: 'session-1' })
      });

      const context = { request, env: mockEnv };
      const startTime = Date.now();
      const response = await markSessionHandler(context);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});