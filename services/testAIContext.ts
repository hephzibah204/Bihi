// Test file for AI Context System
import { buildQuestionFocusContext, analyzeQuestionIntent } from './aiQuestionContext';
import type { UserRole } from '../types';

// Test data
const mockDashboardContext = JSON.stringify({
  academics: { termAveragePct: 78.5 },
  attendance: { todayAttendancePct: 92.3 },
  finance: { outstandingFees: 450000 },
  totals: { totalStudents: 1250, studentsDelta: 15 }
});

const mockPerformanceContext = JSON.stringify({
  teachingSubjects: ['Mathematics', 'Physics'],
  classPerformance: { '9A': { average: 82, studentCount: 35 }, '10B': { average: 76, studentCount: 32 } },
  recentScores: [{ subject: 'Math', score: 85 }, { subject: 'English', score: 78 }]
});

// Test cases for different user roles and question types
const testCases = [
  {
    role: 'Admin' as UserRole,
    question: 'What is the overall academic performance this term?',
    expectedCategories: ['academic']
  },
  {
    role: 'Teacher' as UserRole,
    question: 'How are my students performing in mathematics?',
    expectedCategories: ['academic', 'teaching']
  },
  {
    role: 'Parent' as UserRole,
    question: 'How is my child doing in school?',
    expectedCategories: ['child', 'academic']
  },
  {
    role: 'Bursar' as UserRole,
    question: 'What are the outstanding fees this month?',
    expectedCategories: ['financial']
  },
  {
    role: 'Admin' as UserRole,
    question: 'Show me attendance trends and student behavior patterns',
    expectedCategories: ['attendance', 'behavior', 'students']
  },
  {
    role: 'Teacher' as UserRole,
    question: 'What assignments do I need to grade?',
    expectedCategories: ['teaching', 'academic']
  }
];

// Function to run tests
export function runAIContextTests(): void {
  console.log('🧪 Running AI Context System Tests...\n');

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.role} - "${testCase.question}"`);
    
    // Test intent analysis
    const intent = analyzeQuestionIntent(testCase.question);
    console.log(`  Intent Categories: ${intent.categories.join(', ')}`);
    console.log(`  Confidence: ${intent.confidence.toFixed(2)}`);
    console.log(`  Keywords: ${intent.keywords.join(', ')}`);
    
    // Test context building
    const context = buildQuestionFocusContext(
      testCase.question,
      testCase.role,
      mockDashboardContext,
      mockPerformanceContext
    );
    
    try {
      const parsedContext = JSON.parse(context);
      console.log(`  Context Keys: ${Object.keys(parsedContext).join(', ')}`);
      console.log(`  Role-specific data: ${parsedContext.userRole}`);
    } catch (e) {
      console.log(`  Context (string): ${context.substring(0, 100)}...`);
    }
    
    // Check if expected categories are detected
    const hasExpectedCategories = testCase.expectedCategories.every(cat => 
      intent.categories.includes(cat)
    );
    console.log(`  ✅ Expected categories detected: ${hasExpectedCategories}`);
    console.log('');
  });

  console.log('🎉 AI Context System Tests Completed!');
}

// Export for potential use in development
if (typeof window !== 'undefined') {
  (window as any).runAIContextTests = runAIContextTests;
}