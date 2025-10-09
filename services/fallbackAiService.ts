// services/fallbackAiService.ts
import { USER_ROLES } from '../utils/constants';
// FIX: Corrected import name from getFallbackComment to generateFallbackComment.
import { generateFallbackComment, getFallbackLessonPlan } from './fallbackOriginal';

interface Context {
    userRole?: string;
    activeView?: string;
    student?: any;
    scores?: any[];
    subjects?: any[];
    settings?: any;
    [key: string]: any;
}

// --- Intent Definitions ---
const intentRules = [
  { intent: 'greeting', regex: /^(hi|hello|hey|good morning|good day)/i },
  { intent: 'navigate_students', regex: /student list|manage students|see all students|add a new student/i },
  { intent: 'navigate_scores', regex: /enter scores|add results|grade students|input scores/i },
  { intent: 'navigate_reports', regex: /report card|dossier|generate report|print reports/i },
  { intent: 'navigate_settings', regex: /settings|school settings|configure|change grading/i },
  { intent: 'action_add_student', regex: /how do I add a student/i },
  { intent: 'action_print_report', regex: /how do I print a report/i },
  { intent: 'explain_broadsheet', regex: /what is broadsheet|explain broadsheet/i },
  { intent: 'explain_ai_tools', regex: /what can ai do|ai tools|what are the ai features/i },
  { intent: 'parent_performance_summary', regex: /how is my child|tell me about .*'s performance|how is .* doing/i, requiredRole: USER_ROLES.PARENT },
  { intent: 'teacher_analytics_query', regex: /insights|analytics for|how is .* class doing/i, requiredRole: USER_ROLES.TEACHER },
  { intent: 'student_academic_question', regex: /^(what is|what are|explain|tell me about|define)\s(.+)/i, requiredRole: USER_ROLES.STUDENT },
  { intent: 'generate_comment', regex: /generate a comment for/i },
  { intent: 'generate_lesson_plan', regex: /lesson plan|lesson note/i },
];

// --- Response Generation Logic ---
const responses = {
    greeting: {
        default: "Hello! I am Sheety, your offline assistant. I can help you with questions about using the ReportSheet app. What would you like to do?"
    },
    navigate_students: {
        [USER_ROLES.ADMIN]: "You can add, edit, and manage all students from the 'Students' section in the main menu.",
        [USER_ROLES.TEACHER]: "You can view the students assigned to your classes in the 'My Students' section.",
        default: "The 'Students' section is available to administrators to manage all student records."
    },
    navigate_scores: {
        [USER_ROLES.ADMIN]: "You can enter scores for any student by navigating to 'Academics' > 'Enter Scores' from the menu.",
        [USER_ROLES.TEACHER]: "Go to the 'Enter Scores' section from your menu to input results for your assigned classes and subjects.",
        default: "Score entry is typically handled by Teachers and Admins in the 'Enter Scores' section."
    },
    action_add_student: {
        [USER_ROLES.ADMIN]: "To add a student, go to the 'Students' page and click the '+ Add Student' button.",
        default: "Adding students is an administrative task. Please contact your school admin."
    },
    action_print_report: {
        [USER_ROLES.ADMIN]: "Navigate to 'Academics' > 'Dossier', select a class and the students you want, and then use the 'Print' or 'Download' buttons.",
        default: "In the 'Results' or 'Report Card' section of your portal, you should see a 'Print' button to get a copy of the report."
    },
    explain_broadsheet: {
        [USER_ROLES.ADMIN]: "The Broadsheet provides a full, spreadsheet-like view of all scores for every student in a selected class for the current term. You can find it under 'Academics' > 'Broadsheet'.",
        default: "A broadsheet is a summary of all student scores in a class for a term."
    },
    explain_ai_tools: {
        default: "The AI Tools section provides assistants to help with tasks like generating report card comments, creating lesson plans, and getting academic insights. It's most powerful when you are online."
    },
    generate_comment: {
        // FIX: Added explicit types for context and prompt parameters to resolve type inference errors.
        // FIX: Corrected function call from getFallbackComment to generateFallbackComment.
        default: (context: Context, prompt: string) => generateFallbackComment({ studentName: 'the student', performanceSummary: prompt })
    },
    generate_lesson_plan: {
        // FIX: Added explicit types for context and prompt parameters to resolve type inference errors.
        default: (context: Context, prompt: string) => getFallbackLessonPlan(prompt.replace(/lesson plan|lesson note/i, '').trim())
    },
    teacher_analytics_query: {
        default: "While offline, I can't generate detailed analytics. When you're back online, you can visit the 'Analytics' page to see class performance charts, subject-by-subject breakdowns, and identify students who may need extra support. This helps you make data-driven decisions for your class."
    },
    student_academic_question: {
        // FIX: Added explicit types for context and prompt parameters to resolve type inference errors.
        default: (context: Context, prompt: string) => {
            const match = prompt.match(/^(what is|what are|explain|tell me about|define)\s(.+)/i);
            const topic = match ? match[2].replace(/[?.]/g, '') : "that topic";
            return `It looks like you're asking about "${topic}". While offline, I can't give you a full explanation. I can help you find your timetable to see when your next class is, or you can use the AI tools to generate a practice quiz on this topic once you're back online.`;
        }
    },
    parent_performance_summary: {
        default: (context: Context) => {
            const { student, scores, subjects, settings } = context;
            if (!student || !scores || !subjects || !settings) {
                return "I can't access your child's data while you are offline. Please connect to the internet for performance details.";
            }
            const studentScores = scores.filter(s => s.studentId === student.id && s.session === settings.session && s.term === settings.term);
            if (studentScores.length === 0) {
                return `Offline check shows no scores have been recorded for ${student.name} in the current term (${settings.term}). Please check back later.`;
            }

            const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
            let totalSum = 0;
            let highest = { score: -1, subject: '' };
            let lowest = { score: 101, subject: '' };

            studentScores.forEach(s => {
                const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
                totalSum += total;
                const subjectName = subjectMap.get(s.subjectId) || 'a subject';
                if (total > highest.score) highest = { score: total, subject: subjectName };
                if (total < lowest.score) lowest = { score: total, subject: subjectName };
            });

            const avg = (totalSum / studentScores.length).toFixed(1);

            return `Offline analysis for ${student.name} shows an average of ${avg}% this term. Their highest score is in ${highest.subject} (${highest.score}%), and they seem to be finding ${lowest.subject} (${lowest.score}%) more challenging. For a detailed AI-powered breakdown, please connect to the internet.`;
        }
    }
};

// FIX: Added explicit types for function parameters to improve type safety.
const getResponse = (intent: string, prompt: string, context: Context): string => {
    const responseMap = responses[intent];
    if (!responseMap) return "I'm not sure how to help with that while offline.";

    const roleSpecificResponse = responseMap[context.userRole];
    if (typeof roleSpecificResponse === 'function') return roleSpecificResponse(context, prompt);
    if (typeof roleSpecificResponse === 'string') return roleSpecificResponse;
    
    const defaultResponse = responseMap.default;
    if (typeof defaultResponse === 'function') return defaultResponse(context, prompt);
    
    return defaultResponse || "I'm not sure how to help with that while offline.";
};

export const generateFallbackResponse = ({ prompt, context }: { prompt: string; context: Context }): string => {
    const { userRole } = context;
    const lowerPrompt = prompt.toLowerCase().trim();

    for (const rule of intentRules) {
        // Check if role requirement is met
        if (rule.requiredRole && rule.requiredRole !== userRole) {
            continue;
        }
        if (rule.regex.test(lowerPrompt)) {
            return getResponse(rule.intent, prompt, context);
        }
    }

    // Default response if no intent is matched
    return "I have limited functionality while offline. I can only answer basic questions about navigating the app. Please connect to the internet for full assistance.";
};

/**
 * @deprecated This function is part of the old, simpler fallback system.
 */
export const getFallbackChatResponse = (prompt: string): string => {
    return generateFallbackResponse({ prompt, context: {} });
};