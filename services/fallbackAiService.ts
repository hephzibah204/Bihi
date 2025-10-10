// services/fallbackAiService.ts
import { 
    generateFallbackComment, 
    getFallbackLessonPlan, 
    getFallbackTutorResponse, 
    getFallbackParentChatResponse
} from './fallbackOriginal';

// This is the new, more sophisticated fallback router.
export const generateFallbackResponse = ({ prompt, context }: { prompt: string; context?: any }): string => {
    const promptLower = prompt.toLowerCase();
    
    // Determine the type of request based on keywords in the prompt.
    if (promptLower.includes('lesson plan')) {
        const topicMatch = prompt.match(/topic: "([^"]+)"/i);
        const topic = topicMatch ? topicMatch[1] : 'the selected topic';
        return getFallbackLessonPlan(topic);
    }
    
    if (promptLower.includes('report card comment')) {
        // Attempt to parse context for more specific fallback comment
        const studentNameMatch = prompt.match(/name: ([^\n]+)/i);
        const performanceMatch = prompt.match(/academic performance this term:\s*([\s\S]+?)\s*(behavioral notes:|your task:)/i);
        
        const commentContext = {
            studentName: studentNameMatch ? studentNameMatch[1].trim() : 'The student',
            performanceSummary: performanceMatch ? performanceMatch[1].trim() : 'Average performance'
        };
        return generateFallbackComment(commentContext);
    }

    if (context?.userRole === 'Student' || context?.userRole === 'Parent') {
        return getFallbackTutorResponse(prompt);
    }
    
    // Generic fallback
    return "The AI assistant is currently offline. Please check your internet connection and try again. Basic functionality is limited.";
};
