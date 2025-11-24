// services/fallbackAiService.ts
import { 
    generateFallbackComment, 
    getFallbackLessonPlan, 
    getFallbackTutorResponse, 
    getFallbackParentChatResponse
} from './fallbackOriginal';
import { generateEnhancedFallbackResponse } from './enhancedFallbackAI';
import { HybridSearchEngine, getSemanticSearchEngine, type SemanticMatch } from './semanticSearch';
import { getHuggingFaceClient } from './huggingFaceAPI';
import { getAIResponseCache } from './aiResponseCache';
import { logger } from '../utils/logger';

// Enhanced fallback AI service with improved training data and context awareness
// Now uses the new enhanced AI system with 500+ templates and Nigerian curriculum support
// Plus semantic search for finding cached responses
// Plus optional Hugging Face API for dynamic content generation
// Hybrid search engine instance (wraps semantic singleton)
const hybridSearch = new HybridSearchEngine();

const polishResponse = (text: string): string => {
    try {
        let out = (text || '').trim();
        if (out.length < 200) {
            out += '\n\n**Next Steps:**\n- Clarify objectives and constraints\n- List key concepts and required outcomes\n- Draft a short plan with tasks and checks';
        }
        return out;
    } catch { return text; }
};

export const generateFallbackResponse = (prompt: unknown, context?: Record<string, unknown>, type?: string): string => {
    try {
        const p = typeof prompt === 'string' ? prompt : ((prompt as any)?.prompt ?? (prompt as any)?.text ?? String(prompt ?? ''));
        // Step 1: Try semantic search for cached responses
        const semanticMatches = searchSemanticCache(p, context);
        if (semanticMatches.length > 0) {
            const best = semanticMatches[0];
            if (best.similarity >= 0.6 && (best.confidence ?? 0.5) >= 0.6) {
                return polishResponse(best.response);
            }
        }
        
        // Step 2: Use the enhanced fallback AI system with 500+ templates (sync)
        const enhancedResponse = generateEnhancedFallbackResponse(p, context);
        
        // Step 3: Cache this response for future semantic search
        cacheResponse(p, enhancedResponse, context);
        
        return polishResponse(enhancedResponse);
        
    } catch (_error) {
        // Emergency fallback to old system if enhanced system fails
        return generateLegacyFallbackResponse(prompt as string, context);
    }
};

/**
 * Async fallback that may attempt Hugging Face before templates when online
 */
export const generateFallbackResponseAsync = async (
    prompt: unknown,
    context?: Record<string, unknown>,
    type?: string
): Promise<string> => {
    try {
        const p = typeof prompt === 'string' ? prompt : ((prompt as any)?.prompt ?? (prompt as any)?.text ?? String(prompt ?? ''));
        // Step 1: Semantic cache
        const semanticMatches = searchSemanticCache(p, context);
        if (semanticMatches.length > 0) {
            const best = semanticMatches[0];
            if (best.similarity >= 0.6 && (best.confidence ?? 0.5) >= 0.6) {
                return polishResponse(best.response);
            }
        }
        // Step 2: Try Hugging Face when network is online
        if (typeof navigator === 'undefined' || navigator.onLine) {
            const hf = await tryHuggingFaceGeneration(p, context);
            if (hf && hf.trim() && hf.trim().length > 180 && !/offline mode|limited capabilities/i.test(hf)) {
                cacheResponse(p, hf, context);
                return polishResponse(hf);
            }
        }
        // Step 3: Enhanced templates (sync)
        const enhanced = generateEnhancedFallbackResponse(p, context);
        cacheResponse(p, enhanced, context);
        return polishResponse(enhanced);
    } catch {
        return generateLegacyFallbackResponse(prompt as string, context);
    }
};

/**
 * Try to generate response using Hugging Face API (async)
 * Returns null if generation fails or is inappropriate
 */
const tryHuggingFaceGeneration = async (prompt: string, context?: Record<string, unknown>): Promise<string | null> => {
    try {
        const hfClient = getHuggingFaceClient();
        
        // Build educational prompt with Nigerian context
        let educationalPrompt = prompt;
        
        if (context?.userRole) {
            educationalPrompt = `Context: Nigerian educational system, user role: ${context.userRole}\n\n${prompt}`;
        }
        
        // Select appropriate model based on task
        const model = selectHuggingFaceModel(prompt, context);
        
        // Generate with timeout
        const response = await Promise.race([
            hfClient.generateEducationalContent(educationalPrompt, undefined, model),
            new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('HuggingFace timeout')), 10000)
            )
        ]);
        
        return response;
        
    } catch (_error) {
        return null;
    }
};

/**
 * Select appropriate HuggingFace model based on task
 */
const selectHuggingFaceModel = (prompt: string, context?: any): string => {
    const promptLower = prompt.toLowerCase();
    
    // Use different models for different tasks
    if (promptLower.includes('quiz') || promptLower.includes('question')) {
        return 'google/flan-t5-large'; // Better for Q&A
    }
    
    if (promptLower.includes('translate') || promptLower.includes('summarize')) {
        return 'facebook/bart-large-cnn'; // Better for summarization
    }
    
    // Default educational model
    return 'google/flan-t5-base';
};

/**
 * Search semantic cache for similar prompts
 */
const searchSemanticCache = (prompt: string, _context?: Record<string, unknown>): SemanticMatch[] => {
    try {
        // Use hybrid engine (semantic + keyword boost) with a lower minimum to widen recall
        const results = hybridSearch.search(prompt, 5);
        // Fallback to pure semantic if hybrid returns nothing
        if (!results.length) {
            const searchEngine = getSemanticSearchEngine();
            return searchEngine.search(prompt, 5, 0.4);
        }
        return results;
    } catch (_error) {
        return [];
    }
};

/**
 * Cache a response for future semantic retrieval
 */
const cacheResponse = (prompt: string, response: string, context?: Record<string, unknown>): void => {
    const cacheId = `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let confidence = 0.5;
    try {
        const searchEngine = getSemanticSearchEngine();
        confidence = calculateResponseConfidence(response, context);
        searchEngine.indexDocument(cacheId, prompt, response, {
            confidence,
            timestamp: Date.now(),
            context: (context as any)?.userRole || 'general',
            cached: true
        });
    } catch (searchError: any) {
        logger.warn('Failed to index document in semantic search', { error: searchError?.message, prompt: prompt.substring(0, 50), cacheId });
        try {
            const rc = getAIResponseCache();
            rc.cacheResponse(prompt, response, 'fallback', context, { confidence });
        } catch (cacheError: any) {
            logger.warn('Failed to cache response', { error: cacheError?.message, prompt: prompt.substring(0, 50) });
        }
        try {
            const tenantId = typeof window !== 'undefined' ? (localStorage.getItem('tenant_id') || 'demo') : 'demo';
            import('../lib/ai/rag/embedder')
              .then(m => m.upsertEmbedding(tenantId, cacheId, response))
              .catch((embedError: any) => {
                logger.warn('Failed to upsert embedding', { error: embedError?.message, tenantId, cacheId });
              });
        } catch (embedImportError: any) {
            logger.warn('Failed to import embedder module', { error: embedImportError?.message });
        }
    }
};

/**
 * Calculate confidence score for a response
 */
const calculateResponseConfidence = (response: string, context?: Record<string, unknown>): number => {
    let confidence = 0.5; // Base confidence
    
    // Longer, detailed responses have higher confidence
    if (response.length > 500) confidence += 0.15;
    else if (response.length > 300) confidence += 0.1;
    else if (response.length < 100) confidence -= 0.1;
    
    // Structured responses (with bullet points, sections) have higher confidence
    const hasStructure = response.includes('**') || response.includes('•') || response.includes('###');
    if (hasStructure) confidence += 0.1;
    
    // Responses with specific context have higher confidence
    if (context?.userRole) confidence += 0.05;
    
    // Avoid offline/fallback disclaimers
    if (response.toLowerCase().includes('offline mode')) confidence -= 0.2;
    if (response.toLowerCase().includes('basic template')) confidence -= 0.15;
    
    // Cap confidence between 0 and 1
    return Math.max(0, Math.min(1, confidence));
};

// Legacy fallback system (kept as emergency backup)
const generateLegacyFallbackResponse = (prompt: string, context?: Record<string, unknown>): string => {
    const promptLower = prompt.toLowerCase();
    
    try {
        // Enhanced lesson planning with subject-specific templates
        if (promptLower.includes('lesson plan')) {
            const topicMatch = prompt.match(/topic: "([^"]+)"/i) || prompt.match(/for (.+?)(?:\n|$)/i);
            const subjectMatch = prompt.match(/subject: "([^"]+)"/i) || prompt.match(/\b(mathematics|english|science|physics|chemistry|biology|history|geography|economics|literature|computer science|art|music|physical education)\b/i);
            
            const topic = topicMatch ? topicMatch[1] : 'the selected topic';
            const subject = subjectMatch ? subjectMatch[1] : null;
            
            return getEnhancedLessonPlan(topic, subject);
        }
        
        // Enhanced report card comments with performance analysis
        if (promptLower.includes('report card comment') || promptLower.includes('student comment')) {
            const studentNameMatch = prompt.match(/name: ([^\n]+)/i) || prompt.match(/student: ([^\n]+)/i);
            const performanceMatch = prompt.match(/academic performance this term:\s*([\s\S]+?)\s*(behavioral notes:|your task:)/i);
            const subjectMatch = prompt.match(/subject: ([^\n]+)/i);
            const gradeMatch = prompt.match(/grade: ([^\n]+)/i) || prompt.match(/score: ([^\n]+)/i);
            
            const commentContext = {
                studentName: studentNameMatch ? studentNameMatch[1].trim() : 'The student',
                performanceSummary: performanceMatch ? performanceMatch[1].trim() : 'Average performance',
                subject: subjectMatch ? subjectMatch[1].trim() : null,
                grade: gradeMatch ? gradeMatch[1].trim() : null
            };
            return getEnhancedComment(commentContext);
        }
        
        // Enhanced announcement generation
        if (promptLower.includes('announcement') || promptLower.includes('message for parents')) {
            const topicMatch = prompt.match(/topic.*?["']([^"']+)["']/i) || prompt.match(/about (.+?)(?:\n|$)/i);
            const toneMatch = prompt.match(/tone.*?["']([^"']+)["']/i);
            
            const topic = topicMatch ? topicMatch[1] : 'school update';
            const tone = toneMatch ? toneMatch[1] : 'formal';
            
            return getEnhancedAnnouncement(topic, tone);
        }
        
        // Enhanced debt reminder generation
        if (promptLower.includes('debt reminder') || promptLower.includes('payment reminder')) {
            const studentMatch = prompt.match(/student name: ([^\n]+)/i);
            const amountMatch = prompt.match(/amount due: [₦$]?([0-9,]+)/i);
            const dueDateMatch = prompt.match(/due date: ([^\n]+)/i);
            const toneMatch = prompt.match(/tone: ([^\n]+)/i);
            
            return getEnhancedDebtReminder({
                studentName: studentMatch ? studentMatch[1] : 'Student',
                amount: amountMatch ? amountMatch[1] : 'outstanding amount',
                dueDate: dueDateMatch ? dueDateMatch[1] : 'the due date',
                tone: toneMatch ? toneMatch[1] : 'formal'
            });
        }
        
        // Enhanced financial analysis
        if (promptLower.includes('financial') || promptLower.includes('revenue') || promptLower.includes('expense') || promptLower.includes('budget')) {
            return getEnhancedFinancialAnalysis(prompt, context);
        }
        
        // Enhanced academic analysis
        if (promptLower.includes('performance') || promptLower.includes('grades') || promptLower.includes('scores') || promptLower.includes('academic')) {
            return getEnhancedAcademicAnalysis(prompt, context);
        }
        
        // Enhanced tutoring responses
        if (context?.userRole === 'Student' || context?.userRole === 'Parent' || promptLower.includes('explain') || promptLower.includes('help me understand')) {
            return getEnhancedTutorResponse(prompt, context);
        }
        
        // Enhanced parent chat responses
        if (context?.userRole === 'Parent' || promptLower.includes('my child') || promptLower.includes('parent')) {
            return getEnhancedParentChatResponse(prompt, context);
        }
        
        // Enhanced general responses with context awareness
        return getEnhancedGeneralResponse(prompt, context);
        
    } catch (_error) {
        return "I'm currently running in offline mode with limited capabilities. Please connect to the internet for full AI functionality.";
    }
};

// Enhanced lesson plan generator with subject-specific content
const getEnhancedLessonPlan = (topic: string, subject?: string): string => {
    const subjectSpecific = getSubjectSpecificContent(subject);
    
    return `**Lesson Plan: ${topic}**
${subject ? `**Subject:** ${subject}` : ''}

*Note: This is a basic template generated in offline mode. For detailed, curriculum-aligned lesson plans, please connect to the internet.*

**Learning Objectives:**
• Students will understand the key concepts of ${topic}
• Students will be able to apply knowledge through practical exercises
${subjectSpecific.objectives}

**Materials Needed:**
• Whiteboard/Blackboard
• Textbooks and reference materials
${subjectSpecific.materials}

**Lesson Structure (45 minutes):**

**1. Introduction (10 minutes)**
• Warm-up activity related to ${topic}
• Review previous lesson connections
• Introduce today's learning objectives

**2. Main Content (25 minutes)**
• Explain core concepts of ${topic}
• Use examples and demonstrations
${subjectSpecific.activities}

**3. Practice & Assessment (8 minutes)**
• Quick comprehension check
• Student questions and clarification
${subjectSpecific.assessment}

**4. Conclusion (2 minutes)**
• Summarize key points
• Preview next lesson

**Homework Assignment:**
${subjectSpecific.homework}

**Note:** This offline template provides basic structure. For personalized, standards-aligned content with interactive activities, please use the online AI assistant.`;
};

// Enhanced comment generator with more nuanced analysis
const getEnhancedComment = (context: any): string => {
    const { studentName, performanceSummary, subject, grade } = context;
    const performanceLower = performanceSummary.toLowerCase();
    
    let opening = '';
    let detail = '';
    let recommendation = '';
    let subjectSpecific = '';
    
    // Performance analysis
    if (performanceLower.includes('excellent') || performanceLower.includes('outstanding') || grade?.includes('A')) {
        opening = `${studentName} has demonstrated exceptional performance this term.`;
        detail = 'Shows excellent understanding of concepts and consistently produces high-quality work.';
        recommendation = 'Continue this excellent trajectory and consider taking on additional challenges.';
    } else if (performanceLower.includes('very good') || performanceLower.includes('strong') || grade?.includes('B')) {
        opening = `${studentName} has shown very good progress this term.`;
        detail = 'Demonstrates solid understanding and good application of learned concepts.';
        recommendation = 'With continued effort, has the potential to achieve even higher standards.';
    } else if (performanceLower.includes('good') || performanceLower.includes('satisfactory') || grade?.includes('C')) {
        opening = `${studentName} is making steady progress.`;
        detail = 'Shows adequate understanding of most concepts with room for improvement.';
        recommendation = 'Focus on consistent practice and seeking help when needed will lead to better results.';
    } else if (performanceLower.includes('below average') || performanceLower.includes('struggling') || grade?.includes('D')) {
        opening = `${studentName} is working hard but facing some challenges.`;
        detail = 'Shows effort but needs additional support to fully grasp key concepts.';
        recommendation = 'Regular practice, extra tutoring, and consistent study habits will help improve performance.';
    } else {
        opening = `${studentName} has shown a positive attitude towards learning.`;
        detail = 'Demonstrates engagement in class activities and willingness to participate.';
        recommendation = 'Continued effort and focus will lead to improved academic outcomes.';
    }
    
    // Subject-specific insights
    if (subject) {
        subjectSpecific = getSubjectSpecificComment(subject, performanceLower);
    }
    
    const comment = [opening, detail, subjectSpecific, recommendation].filter(Boolean).join(' ');
    
    return `${comment}\n\n*Note: This comment was generated in offline mode. For more detailed, personalized feedback, please use the online AI assistant.*`;
};

// Enhanced announcement generator
const getEnhancedAnnouncement = (topic: string, tone: string): string => {
    const toneStyle = getToneStyle(tone);
    
    return `${toneStyle.greeting}

We would like to inform you about ${topic}.

${getAnnouncementContent(topic)}

${toneStyle.closing}

Best regards,
School Administration

*Note: This announcement was generated in offline mode. For more personalized and detailed announcements, please connect to the internet.*`;
};

// Enhanced debt reminder generator
const getEnhancedDebtReminder = (context: any): string => {
    const { studentName, amount, dueDate, tone } = context;
    const toneStyle = getToneStyle(tone);
    
    return `${toneStyle.greeting}

This is a ${tone} reminder regarding the outstanding school fees for ${studentName}.

**Outstanding Amount:** ₦${amount}
**Due Date:** ${dueDate}

We kindly request that you settle this amount at your earliest convenience to avoid any disruption to your child's education.

Payment can be made through:
• Bank transfer
• Online payment portal
• Cash payment at the school office

If you have any questions or need to discuss a payment plan, please contact the school office.

${toneStyle.closing}

School Accounts Department

*Note: This reminder was generated in offline mode. For personalized payment plans and detailed account information, please use the online system.*`;
};

// Enhanced financial analysis
const getEnhancedFinancialAnalysis = (prompt: string, context: any): string => {
    return `**Financial Analysis (Offline Mode)**

I can provide basic financial insights in offline mode, but my analysis capabilities are limited without real-time data access.

**What I can help with offline:**
• Basic financial terminology explanations
• General budgeting principles
• Standard financial ratios interpretation
• Common financial planning strategies

**For comprehensive analysis, I need:**
• Current financial data
• Real-time calculations
• Trend analysis
• Comparative reports

**Recommendation:** Please connect to the internet for detailed financial analysis with your actual school data, including revenue trends, expense breakdowns, and predictive insights.

*This is a basic response generated in offline mode. Full financial analysis requires internet connectivity.*`;
};

// Enhanced academic analysis
const getEnhancedAcademicAnalysis = (prompt: string, context: any): string => {
    return `**Academic Analysis (Offline Mode)**

I can provide general academic insights in offline mode, but detailed analysis requires access to current student data.

**Basic Academic Insights Available Offline:**
• General performance interpretation guidelines
• Standard grading scale explanations
• Common academic improvement strategies
• Basic statistical concepts

**For detailed analysis, I need access to:**
• Current student scores and grades
• Historical performance data
• Subject-wise breakdowns
• Comparative class statistics

**Recommendation:** Connect to the internet for comprehensive academic analysis including performance trends, subject comparisons, and personalized improvement recommendations.

*This is a basic response generated in offline mode. Detailed academic analysis requires internet connectivity.*`;
};

// Enhanced tutor response
const getEnhancedTutorResponse = (prompt: string, context: any): string => {
    const subjectKeywords = ['math', 'science', 'english', 'history', 'geography', 'physics', 'chemistry', 'biology'];
    const detectedSubject = subjectKeywords.find(subject => prompt.toLowerCase().includes(subject));
    
    return `**Academic Help (Offline Mode)**

I'd love to help you understand this topic better! However, I'm currently in offline mode with limited capabilities.

${detectedSubject ? `**Subject:** ${detectedSubject.charAt(0).toUpperCase() + detectedSubject.slice(1)}` : ''}

**What I can provide offline:**
• Basic concept explanations
• General study tips
• Simple problem-solving approaches
• Study strategies and techniques

**For comprehensive help, I need internet access to:**
• Provide detailed explanations with examples
• Create practice problems
• Offer step-by-step solutions
• Access current curriculum content

**Study Tip:** Try breaking down complex topics into smaller parts and practice regularly.

**Recommendation:** Connect to the internet for detailed tutoring with interactive examples, practice exercises, and personalized learning paths.

*This is a basic response generated in offline mode. Full tutoring capabilities require internet connectivity.*`;
};

// Enhanced parent chat response
const getEnhancedParentChatResponse = (prompt: string, context: any): string => {
    return `**Parent Support (Offline Mode)**

Thank you for reaching out! I'm here to help, but I'm currently in offline mode with limited access to your child's specific information.

**What I can help with offline:**
• General parenting and education advice
• Basic academic guidance
• Study tips and strategies
• General school policy information

**For detailed support, I need internet access to:**
• Review your child's current performance
• Analyze specific academic trends
• Provide personalized recommendations
• Access real-time school updates

**General Advice:** Stay engaged with your child's education through regular communication with teachers and consistent homework support.

**Recommendation:** Please connect to the internet for personalized insights about your child's progress, detailed performance analysis, and specific improvement strategies.

*This is a basic response generated in offline mode. Personalized parent support requires internet connectivity.*`;
};

// Enhanced general response
const getEnhancedGeneralResponse = (prompt: string, context: any): string => {
    return `**AI Assistant (Offline Mode)**

I'm currently running in offline mode, which means I have limited capabilities compared to my full online functionality.

**Current Capabilities (Offline):**
• Basic template generation
• General educational guidance
• Simple text formatting
• Standard response patterns

**Full Capabilities (Online):**
• Personalized content generation
• Real-time data analysis
• Advanced problem solving
• Context-aware responses
• Interactive learning experiences

**Why am I offline?**
• No internet connection detected
• Server connectivity issues
• API service temporarily unavailable

**Recommendation:** Please check your internet connection and try again for the full AI experience with personalized, intelligent responses.

*This response was generated using offline fallback capabilities. For the best experience, please ensure you have a stable internet connection.*`;
};

// Helper functions for enhanced responses
const getSubjectSpecificContent = (subject?: string) => {
    const subjects = {
        mathematics: {
            objectives: '• Students will solve mathematical problems step-by-step',
            materials: '• Calculator, graph paper, geometric tools',
            activities: '• Work through example problems\n• Practice calculations together',
            assessment: '• Quick problem-solving exercise',
            homework: 'Complete practice problems from textbook pages [specify pages]'
        },
        science: {
            objectives: '• Students will observe and analyze scientific phenomena',
            materials: '• Lab equipment, safety goggles, worksheets',
            activities: '• Conduct simple demonstration\n• Observe and record results',
            assessment: '• Lab observation quiz',
            homework: 'Read chapter [X] and answer review questions'
        },
        english: {
            objectives: '• Students will improve reading comprehension and writing skills',
            materials: '• Reading materials, writing supplies',
            activities: '• Read passage together\n• Discuss themes and vocabulary',
            assessment: '• Comprehension questions',
            homework: 'Write a short paragraph about today\'s topic'
        }
    };
    
    return subjects[subject?.toLowerCase()] || {
        objectives: '• Students will engage with the subject matter effectively',
        materials: '• Standard classroom materials',
        activities: '• Interactive discussion and practice',
        assessment: '• Quick understanding check',
        homework: 'Review today\'s lesson and prepare for next class'
    };
};

const getSubjectSpecificComment = (subject: string, performance: string): string => {
    const subjectComments = {
        mathematics: performance.includes('excellent') ? 
            'Shows strong analytical thinking and problem-solving skills in mathematics.' :
            'Would benefit from additional practice with mathematical concepts and problem-solving techniques.',
        science: performance.includes('excellent') ?
            'Demonstrates excellent scientific inquiry skills and understanding of scientific principles.' :
            'Encouraged to engage more with hands-on experiments and scientific observations.',
        english: performance.includes('excellent') ?
            'Shows excellent reading comprehension and written communication skills.' :
            'Would benefit from additional reading practice and vocabulary development.'
    };
    
    return subjectComments[subject?.toLowerCase()] || '';
};

const getToneStyle = (tone: string) => {
    const styles = {
        formal: {
            greeting: 'Dear Parent/Guardian,',
            closing: 'Thank you for your attention to this matter.'
        },
        friendly: {
            greeting: 'Hello!',
            closing: 'Thank you for your cooperation!'
        },
        urgent: {
            greeting: 'URGENT NOTICE:',
            closing: 'Immediate attention to this matter is appreciated.'
        }
    };
    
    return styles[tone?.toLowerCase()] || styles.formal;
};

const getAnnouncementContent = (topic: string): string => {
    const topicContent = {
        'school closure': 'The school will be closed on [date] due to [reason]. Classes will resume on [date].',
        'parent meeting': 'We invite all parents to attend an important meeting on [date] at [time] in [location].',
        'exam schedule': 'The examination timetable has been finalized. Please check the school notice board for details.',
        'fee payment': 'School fees for the current term are now due. Please ensure payment is made by [date].',
        'sports day': 'Our annual sports day will be held on [date]. All students are expected to participate.'
    };
    
    return topicContent[topic.toLowerCase()] || `Please find important information regarding ${topic}. Details will be communicated through the appropriate channels.`;
};
