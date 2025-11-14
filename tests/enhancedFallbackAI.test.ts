// tests/enhancedFallbackAI.test.ts
// Test suite for the enhanced fallback AI system

import { generateEnhancedFallbackResponse } from '../services/enhancedFallbackAI';
import { generateFallbackResponse } from '../services/fallbackAiService';

describe('Enhanced Fallback AI System', () => {
    describe('Lesson Plan Generation', () => {
        test('should generate algebra lesson plan with WAEC alignment', () => {
            const prompt = 'Create a lesson plan for algebra on quadratic equations for SS2 class';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('LESSON PLAN');
            expect(response).toContain('WAEC/NECO');
            expect(response.toLowerCase()).toContain('quadratic equations');
            expect(response).toContain('SS2');
            expect(response).toContain('LEARNING OBJECTIVES');
        });

        test('should generate geometry lesson plan with Nigerian context', () => {
            const prompt = 'lesson plan on geometry: circles for class SS1';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('Geometry');
            expect(response.toLowerCase()).toContain('circles');
            expect(response).toContain('Nigerian');
            expect(response).toContain('WAEC');
        });

        test('should generate English comprehension lesson plan', () => {
            const prompt = 'Create lesson plan for English comprehension reading for JSS3';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('Reading Comprehension');
            expect(response).toContain('WAEC/NECO');
            expect(response).toContain('OBJECTIVES');
        });
    });

    describe('Report Card Comments', () => {
        test('should generate excellent performance comment', () => {
            const prompt = 'Generate report card comment for student: Name: Ada Obi, Subject: Mathematics, Score: 85';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('Ada Obi');
            expect(response).toMatch(/exceptional|outstanding|excellent/i);
            expect(response).toContain('85');
            expect(response).not.toContain('struggling');
        });

        test('should generate needs improvement comment', () => {
            const prompt = 'report card comment for Name: Chidi Eze, Subject: English, Score: 42';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('Chidi Eze');
            expect(response).toMatch(/challenges|support|improv/i);
            expect(response).toContain('42');
        });

        test('should recognize grade format (A1, B2, etc.)', () => {
            const prompt = 'comment for student: Amina Yusuf, subject: Chemistry, grade: A1';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('Amina Yusuf');
            expect(response).toMatch(/A1|excellent|exceptional/);
        });
    });

    describe('Tutoring Responses', () => {
        test('should provide algebra tutoring help', () => {
            const prompt = 'Help me understand algebra: how do I solve equations?';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('algebra');
            expect(response).toContain('step');
            expect(response).toContain('WAEC');
            expect(response.toLowerCase()).toMatch(/equation|solve/);
        });

        test('should provide essay writing guidance', () => {
            const prompt = 'How can I write a better essay for WAEC English exam?';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('essay');
            expect(response).toContain('WAEC');
            expect(response).toMatch(/structure|paragraph|introduction/);
        });

        test('should include Nigerian context in examples', () => {
            const prompt = 'explain how to solve math word problems';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toMatch(/₦|naira|nigerian/i);
        });
    });

    describe('Parent Chat Responses', () => {
        test('should address academic concerns', () => {
            const prompt = 'My child is struggling with grades in mathematics. What should I do?';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toMatch(/academic|performance/i);
            expect(response).toMatch(/support|help/i);
            expect(response).toMatch(/teacher|study/i);
        });

        test('should provide WAEC/NECO exam preparation advice', () => {
            const prompt = 'How can I help my child prepare for WAEC exams?';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('WAEC');
            expect(response).toMatch(/past questions|preparation/i);
            expect(response).toContain('study');
        });

        test('should handle behavior concerns', () => {
            const prompt = 'My child has behavior issues at school. Need advice.';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toMatch(/behavior|discipline/i);
            expect(response).toContain('teacher' || 'school');
        });
    });

    describe('Financial Analysis', () => {
        test('should provide revenue analysis framework', () => {
            const prompt = 'Analyze school revenue and income collection';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toMatch(/revenue/i);
            expect(response).toMatch(/tuition|fees/i);
            expect(response).toContain('Nigerian' || '₦');
        });

        test('should provide expense management guidance', () => {
            const prompt = 'How can we manage school expenses better?';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('expense' || 'Expense');
            expect(response).toContain('budget' || 'cost');
        });
    });

    describe('Subject Detection', () => {
        test('should detect mathematics keywords', () => {
            const prompt = 'Help with solving algebraic equations';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response.toLowerCase()).toMatch(/math|algebra/);
        });

        test('should detect English keywords', () => {
            const prompt = 'Need help with essay writing and grammar';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response.toLowerCase()).toMatch(/english|essay|writing/);
        });

        test('should detect science keywords', () => {
            const prompt = 'Explain biology concepts about photosynthesis';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response.toLowerCase()).toMatch(/biology|science/);
        });
    });

    describe('Context Extraction', () => {
        test('should extract student name from prompt', () => {
            const prompt = 'Generate comment for Name: Blessing Nwosu, score: 75';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('Blessing Nwosu');
        });

        test('should extract class level', () => {
            const prompt = 'Create lesson plan for Class: SS3, topic: trigonometry';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('SS3');
        });

        test('should extract scores and grades', () => {
            const prompt = 'comment for student with score: 68 in Physics';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('68');
        });
    });

    describe('Fallback Integration', () => {
        test('should work through main fallback service', () => {
            const prompt = 'Create a lesson plan for mathematics';
            const response = generateFallbackResponse({ prompt });
            
            expect(response).toBeTruthy();
            expect(response.length).toBeGreaterThan(100);
        });

        test('should handle errors gracefully', () => {
            const prompt = '';
            const response = generateFallbackResponse({ prompt });
            
            expect(response).toBeTruthy();
            expect(response).toContain('offline' || 'Offline');
        });
    });

    describe('Nigerian Education Context', () => {
        test('should include WAEC references', () => {
            const prompt = 'How to prepare for final exams';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('WAEC' || 'NECO' || 'JAMB');
        });

        test('should use Naira (₦) currency', () => {
            const prompt = 'financial analysis for school budget';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response).toContain('₦');
        });

        test('should reference Nigerian grading system', () => {
            const prompt = 'explain grading system';
            const response = generateEnhancedFallbackResponse(prompt);
            
            // Should mention A1-F9 or similar Nigerian grading
            expect(response).toMatch(/A1|B2|C4|D7|F9|grading/);
        });
    });

    describe('Response Quality', () => {
        test('should provide comprehensive responses', () => {
            const prompt = 'Create detailed lesson plan for algebra';
            const response = generateEnhancedFallbackResponse(prompt);
            
            // Should be substantial
            expect(response.length).toBeGreaterThan(500);
            expect(response).toMatch(/LEARNING OBJECTIVES|Objectives/);
            expect(response).toContain('MATERIALS' || 'Materials');
        });

        test('should include offline mode disclaimer', () => {
            const prompt = 'Generate content';
            const response = generateEnhancedFallbackResponse(prompt);
            
            expect(response.toLowerCase()).toMatch(/offline|internet/);
        });

        test('should provide helpful suggestions', () => {
            const prompt = 'Need help with teaching';
            const response = generateEnhancedFallbackResponse(prompt);
            
            // Should have educational guidance
            expect(response.length).toBeGreaterThan(200);
        });
    });

    describe('Performance', () => {
        test('should respond quickly (under 100ms)', () => {
            const start = Date.now();
            const prompt = 'Create lesson plan';
            generateEnhancedFallbackResponse(prompt);
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(100);
        });

        test('should handle multiple requests efficiently', () => {
            const prompts = [
                'lesson plan for math',
                'report comment for student',
                'help with algebra',
                'parent advice needed',
                'financial analysis'
            ];
            
            const start = Date.now();
            prompts.forEach(prompt => generateEnhancedFallbackResponse(prompt));
            const duration = Date.now() - start;
            
            // All 5 requests should complete quickly
            expect(duration).toBeLessThan(500);
        });
    });
});

// Integration tests with real use cases
describe('Real-World Use Cases', () => {
    test('Teacher creates algebra lesson plan for SS2', () => {
        const prompt = `Create a lesson plan for teaching quadratic equations to SS2 students.
        Topic: Solving quadratic equations using factorization
        Duration: 45 minutes`;
        
        const response = generateFallbackResponse({ prompt });
        
        expect(response).toContain('quadratic equations');
        expect(response).toContain('SS2');
        expect(response).toContain('factorization');
        expect(response).toContain('WAEC');
    });

    test('Teacher writes report card comment', () => {
        const prompt = `Generate a report card comment for:
        Name: Chioma Nnamdi
        Subject: Chemistry
        Score: 78
        Performance: Very good understanding, active participation`;
        
        const response = generateFallbackResponse({ prompt });
        
        expect(response).toContain('Chioma Nnamdi');
        expect(response).toContain('Chemistry');
        expect(response).toContain('78');
        expect(response).toMatch(/good|excellent/i);
    });

    test('Student asks for math help', () => {
        const prompt = 'I don\'t understand how to solve simultaneous equations in algebra. Can you help?';
        const context = { userRole: 'Student' };
        
        const response = generateFallbackResponse({ prompt, context });
        
        expect(response).toMatch(/algebra|equation/i);
        expect(response).toMatch(/step|solve/i);
        expect(response).toMatch(/WAEC|exam/i);
    });

    test('Parent seeks advice on child performance', () => {
        const prompt = 'My child scored 45 in Mathematics this term. How can I help improve their performance?';
        const context = { userRole: 'Parent' };
        
        const response = generateFallbackResponse({ prompt, context });
        
        expect(response).toMatch(/support|help|improve/i);
        expect(response).toMatch(/study|practice/i);
        expect(response).toMatch(/teacher|tutor/i);
    });

    test('Bursar analyzes school finances', () => {
        const prompt = 'Provide analysis of school revenue collection and expense management for this term';
        
        const response = generateFallbackResponse({ prompt });
        
        expect(response).toMatch(/revenue|expense/i);
        expect(response).toMatch(/₦|Nigerian/);
        expect(response).toMatch(/school|tuition/i);
    });
});

console.log('✅ Enhanced Fallback AI Test Suite Complete');
