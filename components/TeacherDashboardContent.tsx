import React from 'react';
// Fix: Correctly import TeacherView from the central types file.
import { TeacherView } from '../types';
import TeacherHome from './TeacherHome';
import MyStudents from './MyStudents';
import Results from './Results';
import TeacherSchedule from './TeacherSchedule';
import LessonPlanner from './LessonPlanner';
import CommentGenerator from './CommentGenerator';
import { TEACHER_VIEWS } from '../utils/constants';
import LearningPathways from './LearningPathways';
import PracticeQuiz from './PracticeQuiz';
import EarlyIntervention from './EarlyIntervention';
import BroadsheetAnalysis from './BroadsheetAnalysis';
import SubjectRecommender from './SubjectRecommender';
import DirectMessages from './DirectMessages';


interface TeacherDashboardContentProps {
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const AiTools = () => (
    <div className="space-y-8">
        <div>
            <p className="text-gray-600">Use these AI-powered tools to streamline your workflow.</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                <CommentGenerator />
                <LessonPlanner />
                <SubjectRecommender />
                <LearningPathways />
                <PracticeQuiz />
                <EarlyIntervention />
            </div>
        </div>
        <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Class Broadsheet</h2>
            <BroadsheetAnalysis />
        </div>
    </div>
);

const TeacherDashboardContent = ({ activeView, setActiveView }: TeacherDashboardContentProps) => {
    switch(activeView) {
        case TEACHER_VIEWS.DASHBOARD:
            return <TeacherHome setActiveView={setActiveView} />;
        case TEACHER_VIEWS.MY_STUDENTS:
            return <MyStudents />;
        case TEACHER_VIEWS.ENTER_SCORES:
            return <Results />;
        case TEACHER_VIEWS.MY_SCHEDULE:
            return <TeacherSchedule />;
        case TEACHER_VIEWS.AI_TOOLS:
            return <AiTools />;
        case TEACHER_VIEWS.MESSAGES:
            return <DirectMessages />;
        default:
            return <TeacherHome setActiveView={setActiveView} />;
    }
};

export default TeacherDashboardContent;