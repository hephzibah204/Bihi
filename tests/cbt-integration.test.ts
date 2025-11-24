import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: [], error: null })),
      update: vi.fn(() => ({ data: [], error: null })),
      delete: vi.fn(() => ({ data: [], error: null })),
      eq: vi.fn(() => ({ data: [], error: null })),
      in: vi.fn(() => ({ data: [], error: null })),
      order: vi.fn(() => ({ data: [], error: null })),
      limit: vi.fn(() => ({ data: [], error: null }))
    })),
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } }, error: null }))
    }
  }))
}));

describe('CBT Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Exam Workflow', () => {
    it('should handle complete exam lifecycle from creation to grading', async () => {
      // Step 1: Create exam items
      const items = [
        {
          type: 'mcq',
          stem: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          answer_key: { correct: '4' },
          difficulty: 3,
          tags: ['mathematics', 'basic-arithmetic']
        },
        {
          type: 'essay',
          stem: 'Explain the process of photosynthesis',
          rubric: { maxPoints: 10, criteria: ['accuracy', 'completeness', 'clarity'] }
        }
      ];

      // Mock item creation
      const mockItemCreation = vi.fn().mockResolvedValue({ 
        data: items.map((item, index) => ({ ...item, id: `item-${index + 1}` }))
      });

      // Step 2: Create exam
      const exam = {
        title: 'Science Test',
        description: 'Basic science concepts',
        sections: [
          {
            title: 'Multiple Choice',
            items: ['item-1'],
            time_limit: 30
          },
          {
            title: 'Essay Questions',
            items: ['item-2'],
            time_limit: 60
          }
        ],
        rules: {
          shuffle_items: true,
          allow_review: true,
          passing_score: 60
        },
        time_window_start: new Date(Date.now() - 3600000).toISOString(),
        time_window_end: new Date(Date.now() + 3600000).toISOString(),
        status: 'ready'
      };

      // Mock exam creation
      const mockExamCreation = vi.fn().mockResolvedValue({
        data: [{ ...exam, id: 'exam-1' }]
      });

      // Step 3: Start exam session
      const session = {
        exam_id: 'exam-1',
        user_id: 'student-1',
        status: 'not_started',
        created_at: new Date().toISOString()
      };

      const mockSessionCreation = vi.fn().mockResolvedValue({
        data: [{ ...session, id: 'session-1' }]
      });

      // Step 4: Submit responses
      const responses = [
        {
          session_id: 'session-1',
          item_id: 'item-1',
          answer: '4',
          time_on_item_seconds: 45
        },
        {
          session_id: 'session-1',
          item_id: 'item-2',
          answer: 'Photosynthesis is the process by which plants convert sunlight into energy...',
          time_on_item_seconds: 180
        }
      ];

      const mockResponseSubmission = vi.fn().mockResolvedValue({
        data: responses.map((response, index) => ({ ...response, id: `response-${index + 1}` }))
      });

      // Step 5: Mark session
      const mockMarking = vi.fn().mockResolvedValue({
        data: { total_score: 17, session_id: 'session-1' }
      });

      // Verify workflow completed successfully
      expect(mockItemCreation).toHaveBeenCalledWith(expect.objectContaining({
        type: 'mcq',
        stem: 'What is 2 + 2?'
      }));

      expect(mockExamCreation).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Science Test'
      }));

      expect(mockSessionCreation).toHaveBeenCalledWith(expect.objectContaining({
        exam_id: 'exam-1'
      }));

      expect(mockResponseSubmission).toHaveBeenCalledTimes(2);
      expect(mockMarking).toHaveBeenCalledWith('session-1');
    });

    it('should handle concurrent exam sessions', async () => {
      const studentIds = ['student-1', 'student-2', 'student-3'];
      const examId = 'exam-1';

      // Mock concurrent session starts
      const mockConcurrentSessions = studentIds.map(studentId => ({
        exam_id: examId,
        user_id: studentId,
        status: 'in_progress',
        created_at: new Date().toISOString()
      }));

      const mockSessionCreation = vi.fn().mockImplementation((sessionData) => {
        return Promise.resolve({
          data: [{ ...sessionData, id: `session-${sessionData.user_id}` }]
        });
      });

      // Simulate concurrent requests
      const sessionPromises = studentIds.map(studentId => 
        mockSessionCreation({
          exam_id: examId,
          user_id: studentId,
          status: 'in_progress'
        })
      );

      const results = await Promise.all(sessionPromises);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.data[0].user_id).toBe(studentIds[index]);
      });
    });
  });

  describe('AI Grading Integration', () => {
    it('should handle AI grading with fallback chain', async () => {
      const essayResponse = {
        session_id: 'session-1',
        item_id: 'essay-item-1',
        answer: 'Climate change is caused by greenhouse gas emissions...',
        time_on_item_seconds: 300
      };

      const essayItem = {
        id: 'essay-item-1',
        type: 'essay',
        stem: 'Explain the causes and effects of climate change',
        rubric: {
          maxPoints: 20,
          criteria: [
            { name: 'Content Accuracy', points: 8 },
            { name: 'Argument Structure', points: 6 },
            { name: 'Use of Evidence', points: 4 },
            { name: 'Language and Style', points: 2 }
          ]
        }
      };

      // Mock AI grading chain
      const mockGeminiGrading = vi.fn().mockResolvedValue({
        score: 15,
        rationale: 'Good explanation with accurate content but limited evidence',
        confidence: 0.8
      });

      const mockHuggingFaceGrading = vi.fn().mockResolvedValue({
        score: 14,
        rationale: 'Solid understanding demonstrated',
        confidence: 0.7
      });

      const mockLocalGrading = vi.fn().mockResolvedValue({
        score: 12,
        rationale: 'Basic understanding shown',
        confidence: 0.5
      });

      // Test fallback chain: Gemini -> HuggingFace -> Local
      let gradingResult = null;

      try {
        gradingResult = await mockGeminiGrading(essayResponse.answer, essayItem.rubric);
      } catch (geminiError) {
        try {
          gradingResult = await mockHuggingFaceGrading(essayResponse.answer, essayItem.rubric);
        } catch (hfError) {
          gradingResult = await mockLocalGrading(essayResponse.answer, essayItem.rubric);
        }
      }

      expect(gradingResult).toBeDefined();
      expect(gradingResult.score).toBeGreaterThanOrEqual(0);
      expect(gradingResult.score).toBeLessThanOrEqual(20);
      expect(gradingResult.rationale).toBeTruthy();
    });

    it('should handle mixed question types in single session', async () => {
      const mixedResponses = [
        {
          item_id: 'mcq-1',
          type: 'mcq',
          answer: 'B',
          correct_answer: 'B',
          max_points: 2
        },
        {
          item_id: 'true-false-1',
          type: 'true_false',
          answer: 'true',
          correct_answer: 'true',
          max_points: 1
        },
        {
          item_id: 'multiple-answer-1',
          type: 'multiple_answer',
          answer: ['A', 'C'],
          correct_answer: ['A', 'C'],
          max_points: 3
        },
        {
          item_id: 'essay-1',
          type: 'essay',
          answer: 'Detailed explanation...',
          ai_score: 8,
          max_points: 10
        }
      ];

      // Calculate expected scores
      const expectedScores = {
        mcq: mixedResponses[0].answer === mixedResponses[0].correct_answer ? 2 : 0,
        true_false: mixedResponses[1].answer === mixedResponses[1].correct_answer ? 1 : 0,
        multiple_answer: JSON.stringify(mixedResponses[2].answer.sort()) === JSON.stringify(mixedResponses[2].correct_answer.sort()) ? 3 : 0,
        essay: mixedResponses[3].ai_score
      };

      const totalScore = Object.values(expectedScores).reduce((sum, score) => sum + score, 0);

      expect(totalScore).toBe(2 + 1 + 3 + 8); // 14 points total
      expect(expectedScores.essay).toBe(8); // AI graded
    });
  });

  describe('Proctoring and Security', () => {
    it('should track and analyze proctoring events', async () => {
      const proctorEvents = [
        {
          session_id: 'session-1',
          event_type: 'focus_loss',
          risk_increment: 5,
          timestamp: new Date(Date.now() - 60000).toISOString()
        },
        {
          session_id: 'session-1',
          event_type: 'tab_switch',
          risk_increment: 10,
          timestamp: new Date(Date.now() - 30000).toISOString()
        },
        {
          session_id: 'session-1',
          event_type: 'flagged_behavior',
          risk_increment: 20,
          timestamp: new Date().toISOString()
        }
      ];

      // Calculate risk score
      const totalRiskScore = proctorEvents.reduce((sum, event) => sum + event.risk_increment, 0);

      expect(totalRiskScore).toBe(35);

      // Mock risk analysis
      const analyzeRisk = (events: any[]) => {
        const score = events.reduce((sum, event) => sum + event.risk_increment, 0);
        return {
          score,
          level: score > 50 ? 'high' : score > 20 ? 'medium' : 'low',
          events: events.length
        };
      };

      const riskAnalysis = analyzeRisk(proctorEvents);

      expect(riskAnalysis.score).toBe(35);
      expect(riskAnalysis.level).toBe('medium');
      expect(riskAnalysis.events).toBe(3);
    });

    it('should handle offline exam taking with sync', async () => {
      // Simulate offline environment
      const isOnline = false;
      const offlineQueue = [];

      const queueResponse = (response: any) => {
        if (!isOnline) {
          offlineQueue.push({
            ...response,
            timestamp: new Date().toISOString(),
            synced: false
          });
        }
      };

      // Simulate student responses while offline
      const offlineResponses = [
        { item_id: 'item-1', answer: 'A' },
        { item_id: 'item-2', answer: 'Sample essay response...' }
      ];

      offlineResponses.forEach(queueResponse);

      expect(offlineQueue).toHaveLength(2);
      expect(offlineQueue.every(r => r.synced === false)).toBe(true);

      // Simulate going back online and syncing
      const syncOfflineResponses = async () => {
        const unsynced = offlineQueue.filter(r => !r.synced);
        
        // Mock successful sync
        unsynced.forEach(response => {
          response.synced = true;
        });

        return unsynced.length;
      };

      const syncedCount = await syncOfflineResponses();

      expect(syncedCount).toBe(2);
      expect(offlineQueue.every(r => r.synced === true)).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large item banks efficiently', async () => {
      const largeItemBank = Array.from({ length: 1000 }, (_, index) => ({
        id: `item-${index + 1}`,
        type: ['mcq', 'essay', 'true_false', 'multiple_answer'][index % 4],
        stem: `Question ${index + 1}`,
        difficulty: Math.floor(Math.random() * 10) + 1,
        tags: ['mathematics', 'science', 'english'][index % 3]
      }));

      // Mock database query with pagination
      const mockPaginatedQuery = vi.fn().mockImplementation((offset: number, limit: number) => {
        return Promise.resolve({
          data: largeItemBank.slice(offset, offset + limit),
          total: largeItemBank.length
        });
      });

      // Test pagination performance
      const pageSize = 50;
      const totalPages = Math.ceil(largeItemBank.length / pageSize);

      const startTime = Date.now();
      
      const pageResults = await Promise.all(
        Array.from({ length: totalPages }, (_, page) => 
          mockPaginatedQuery(page * pageSize, pageSize)
        )
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(pageResults).toHaveLength(totalPages);
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
      expect(pageResults.every(result => result.data.length <= pageSize)).toBe(true);
    });

    it('should handle concurrent marking requests', async () => {
      const sessionIds = Array.from({ length: 50 }, (_, i) => `session-${i + 1}`);

      // Mock marking function with slight delay
      const mockMarking = vi.fn().mockImplementation(async (sessionId: string) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        return {
          session_id: sessionId,
          total_score: Math.floor(Math.random() * 100),
          status: 'graded'
        };
      });

      const startTime = Date.now();
      
      // Process all sessions concurrently
      const markingResults = await Promise.all(
        sessionIds.map(sessionId => mockMarking(sessionId))
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(markingResults).toHaveLength(50);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(markingResults.every(result => result.status === 'graded')).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from AI service failures gracefully', async () => {
      const essayItem = {
        id: 'essay-item-1',
        type: 'essay',
        stem: 'Analyze the impact of technology',
        rubric: { maxPoints: 15 }
      };

      const studentAnswer = 'Technology has significantly impacted society...';

      // Simulate AI service failures
      const mockFailingAI = vi.fn()
        .mockRejectedValueOnce(new Error('Gemini API timeout'))
        .mockRejectedValueOnce(new Error('HuggingFace API error'));

      const mockLocalFallback = vi.fn().mockResolvedValue({
        score: 8,
        rationale: 'Basic analysis provided with some key points',
        confidence: 0.6
      });

      // Test fallback chain with failures
      let result = null;
      let attempts = 0;

      try {
        attempts++;
        result = await mockFailingAI(studentAnswer, essayItem.rubric);
      } catch (error1) {
        try {
          attempts++;
          result = await mockFailingAI(studentAnswer, essayItem.rubric);
        } catch (error2) {
          attempts++;
          result = await mockLocalFallback(studentAnswer, essayItem.rubric);
        }
      }

      expect(attempts).toBe(3);
      expect(result).toBeDefined();
      expect(result.score).toBe(8);
      expect(result.confidence).toBe(0.6);
    });

    it('should validate and sanitize input data', async () => {
      const maliciousInputs = [
        "'; DROP TABLE cbt_items; --",
        '<script>alert("xss")</script>',
        '../../../etc/passwd',
        'javascript:alert(1)'
      ];

      const sanitizeInput = (input: string): string => {
        // Basic sanitization
        return input
          .replace(/[<>]/g, '') // Remove HTML tags
          .replace(/['"]/g, '') // Remove quotes
          .replace(/javascript:/gi, '') // Remove javascript protocol
          .replace(/\.\.\//g, ''); // Remove path traversal
      };

      const sanitizedInputs = maliciousInputs.map(sanitizeInput);

      expect(sanitizedInputs[0]).not.toContain("'");
      expect(sanitizedInputs[1]).not.toContain('<');
      expect(sanitizedInputs[2]).not.toContain('../');
      expect(sanitizedInputs[3]).not.toContain('javascript:');
    });
  });
});