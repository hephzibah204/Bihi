import React from 'react';
import { usePlanFeatures } from '../contexts/PlanFeaturesContext';
import UpgradePrompt from './UpgradePrompt';
import { ADMIN_VIEWS, TEACHER_VIEWS, STUDENT_VIEWS, PARENT_VIEWS, USER_ROLES } from '../utils/constants';
import { DashboardView, TeacherView, StudentView, ParentView } from '../types';
import { useAuth } from '../contexts/AuthContext';
import SparklesIcon from './icons/SparklesIcon';
import { BeakerIcon, DocumentTextIcon, AcademicCapIcon, ChatBubbleLeftRightIcon, 
         LightBulbIcon, ChartBarIcon, BookOpenIcon, PencilSquareIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import HeadsetIcon from './icons/HeadsetIcon';

interface AIToolsNavigationProps {
    setActiveView: (view: DashboardView | TeacherView | StudentView | ParentView) => void;
}

interface AITool {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    view: string;
    roles: string[];
}

const aiTools: AITool[] = [
    {
        id: 'ai-coach',
        title: 'AI Coach & Training',
        description: 'Micro-courses, recommendations, and badges to strengthen pedagogy.',
        icon: <DocumentTextIcon className="h-8 w-8" />,
        view: 'AI_COACH',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER]
    },
    {
        id: 'ai-coach-progress',
        title: 'AI Coach Progress',
        description: 'View teachers’ course completions and quiz performance.',
        icon: <ChartBarIcon className="h-8 w-8" />,
        view: 'AI_COACH_PROGRESS',
        roles: [USER_ROLES.ADMIN]
    },
    {
        id: 'ai-chat',
        title: 'AI Assistant',
        description: 'Chat with your role-tailored AI assistant for personalized help and guidance.',
        icon: <ChatBubbleLeftRightIcon className="h-8 w-8" />,
        view: 'AI_CHAT',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.PARENT]
    },
    {
        id: 'ai-elaboratory',
        title: 'E-Laboratory',
        description: 'Interactive simulations and virtual experiments for hands-on learning.',
        icon: <BeakerIcon className="h-8 w-8" />,
        view: 'AI_ELABORATORY',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.PARENT]
    },
    {
        id: 'ai-lesson-planner',
        title: 'Lesson Planner',
        description: 'AI-powered lesson planning with curriculum alignment and resource suggestions.',
        icon: <DocumentTextIcon className="h-8 w-8" />,
        view: 'AI_LESSON_PLANNER',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER]
    },
    {
        id: 'ai-practice-quiz',
        title: 'Practice Quiz',
        description: 'Generate customized quizzes and self-practice tests quickly.',
        icon: <AcademicCapIcon className="h-8 w-8" />,
        view: 'AI_PRACTICE_QUIZ',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT]
    },
    {
        id: 'ai-comment-generator',
        title: 'Comment Generator',
        description: 'Generate personalized comments and feedback for student reports.',
        icon: <PencilSquareIcon className="h-8 w-8" />,
        view: 'AI_COMMENT_GENERATOR',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER]
    },
    {
        id: 'ai-early-intervention',
        title: 'Early Intervention',
        description: 'Identify students who may need additional support and intervention.',
        icon: <LightBulbIcon className="h-8 w-8" />,
        view: 'AI_EARLY_INTERVENTION',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER]
    },
    {
        id: 'ai-learning-pathways',
        title: 'Learning Pathways',
        description: 'Personalized step-by-step plans to master any topic.',
        icon: <ChartBarIcon className="h-8 w-8" />,
        view: 'AI_LEARNING_PATHWAYS',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT]
    },
    {
        id: 'ai-subject-recommender',
        title: 'Subject Recommender',
        description: 'Get AI-powered subject suggestions tailored to performance and interests.',
        icon: <BookOpenIcon className="h-8 w-8" />,
        view: 'AI_SUBJECT_RECOMMENDER',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT, USER_ROLES.PARENT]
    },
    {
        id: 'ai-tutor',
        title: 'Live Tutor',
        description: 'Have a real-time voice conversation about any topic.',
        icon: <HeadsetIcon className="h-8 w-8" />,
        view: 'AI_TUTOR',
        roles: [USER_ROLES.STUDENT, USER_ROLES.PARENT]
    },
    {
        id: 'ai-rubric-generator',
        title: 'Rubric Generator',
        description: 'Generate assessment rubrics aligned with learning objectives.',
        icon: <DocumentTextIcon className="h-8 w-8" />,
        view: 'AI_RUBRIC_GENERATOR',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER]
    },
    {
        id: 'ai-parent-message-composer',
        title: 'Parent Message Composer',
        description: 'Compose professional messages to parents about student progress.',
        icon: <EnvelopeIcon className="h-8 w-8" />,
        view: 'AI_PARENT_MESSAGE_COMPOSER',
        roles: [USER_ROLES.ADMIN, USER_ROLES.TEACHER]
    }
];

const AIToolsNavigation: React.FC<AIToolsNavigationProps> = ({ setActiveView }) => {
    const { hasFeature, isLoading } = usePlanFeatures();
    const { user, role } = useAuth();
    
    // Resolve current role, considering demo mode fallback
    const currentRole = role || (typeof window !== 'undefined' ? (localStorage.getItem('demoUserRole') as string | null) : null);
    
    if (isLoading) {
        return <div className="card p-6 text-center">Loading AI features...</div>;
    }

    if (!hasFeature('ai-tools')) {
        return <UpgradePrompt featureName="AI Tools" onUpgradeClick={() => setActiveView(ADMIN_VIEWS.BILLING as DashboardView)} />;
    }

    // Filter tools based on current user role
    const availableTools = aiTools.filter(tool => 
        tool.roles.includes(currentRole || USER_ROLES.ADMIN)
    );

    const handleToolClick = (tool: AITool) => {
        switch (currentRole) {
            case USER_ROLES.TEACHER:
                setActiveView((TEACHER_VIEWS as any)[tool.view] as TeacherView);
                return;
            case USER_ROLES.STUDENT:
                setActiveView((STUDENT_VIEWS as any)[tool.view] as StudentView);
                return;
            case USER_ROLES.PARENT:
                setActiveView((PARENT_VIEWS as any)[tool.view] as ParentView);
                return;
            default:
                setActiveView((ADMIN_VIEWS as any)[tool.view] as DashboardView);
                return;
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                    <SparklesIcon className="h-8 w-8 text-indigo-600 mr-2" />
                    <h1 className="text-3xl font-bold text-gray-900">AI Tools</h1>
                </div>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Enhance your {currentRole?.toLowerCase() || 'admin'} experience with our powerful AI-driven tools designed to streamline your workflow and improve outcomes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTools.map((tool) => (
                    <div
                        key={tool.id}
                        className="card p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                        onClick={() => handleToolClick(tool)}
                    >
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0 p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                                <div className="text-indigo-600">
                                    {tool.icon}
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                    {tool.title}
                                </h3>
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {tool.description}
                        </p>
                        <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium group-hover:text-indigo-700">
                            <span>Open Tool</span>
                            <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                ))}
            </div>

            {availableTools.length === 0 && (
                <div className="text-center py-12">
                    <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Tools Available</h3>
                    <p className="text-gray-600">No AI tools are available for your current role.</p>
                </div>
            )}
        </div>
    );
};

export default AIToolsNavigation;
