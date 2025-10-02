import React from 'react';
// Fix: Correctly import TeacherView from the central types file.
import { TeacherView } from '../types';
import TeacherHome from './TeacherHome';
import MyStudents from './MyStudents';
import Results from './Results';
import TeacherSchedule from './TeacherSchedule';
import LessonPlanner from './LessonPlanner';
import CommentGenerator from './CommentGenerator';


interface TeacherDashboardContentProps {
    activeView: TeacherView;
    setActiveView: (view: TeacherView) => void;
}

const AiTools = () => (
     <div>
        <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">AI Teacher Assistant</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <CommentGenerator />
            <LessonPlanner />
        </div>
    </div>
)

const TeacherDashboardContent = ({ activeView, setActiveView }: TeacherDashboardContentProps) => {
    switch(activeView) {
        case 'dashboard':
            return <TeacherHome setActiveView={setActiveView} />;
        case 'my-students':
            return <MyStudents />;
        case 'enter-scores':
            return <Results />;
        case 'my-schedule':
            return <TeacherSchedule />;
        case 'ai-tools':
            return <AiTools />;
        default:
            return <TeacherHome setActiveView={setActiveView} />;
    }
};

export default TeacherDashboardContent;