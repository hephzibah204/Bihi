import React from 'react';
import StudentHome from './StudentHome';
import StudentResults from './StudentResults';
import StudentProfile from './StudentProfile';
import StudentTimetable from './StudentTimetable';
// Fix: Import StudentView from the central types file to break a circular dependency.
import { StudentView } from '../types';
import AIAcademicTutor from './AIAcademicTutor';
import NotificationViewer from './NotificationViewer';

interface StudentDashboardContentProps {
    activeView: StudentView;
    setActiveView: (view: StudentView) => void;
    demoUserId?: string | null;
}

const StudentDashboardContent = ({ activeView, setActiveView, demoUserId }: StudentDashboardContentProps) => {
    switch(activeView) {
        case 'dashboard':
            return <StudentHome setActiveView={setActiveView} />;
        case 'results':
            return <StudentResults demoUserId={demoUserId} />;
        case 'timetable':
            return <StudentTimetable demoUserId={demoUserId} />;
        case 'ai-tutor':
            return <AIAcademicTutor />;
        case 'profile':
            return <StudentProfile demoUserId={demoUserId} />;
        case 'notifications':
            return <NotificationViewer demoUserId={demoUserId} />;
        default:
            return <StudentHome setActiveView={setActiveView} />;
    }
};

export default StudentDashboardContent;