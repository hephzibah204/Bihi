import React from 'react';
import StudentHome from './StudentHome';
import StudentResults from './StudentResults';
import StudentProfile from './StudentProfile';
import StudentTimetable from './StudentTimetable';
// Fix: Import StudentView from the central types file to break a circular dependency.
import { StudentView } from '../types';
import NotificationViewer from './NotificationViewer';
import StudentAssignments from './StudentAssignments';
import AIAcademicTutor from './AIAcademicTutor';
import { STUDENT_VIEWS } from '../utils/constants';

interface StudentDashboardContentProps {
    activeView: StudentView;
    setActiveView: (view: StudentView) => void;
    demoUserId?: string | null;
}

const StudentDashboardContent = ({ activeView, setActiveView, demoUserId }: StudentDashboardContentProps) => {
    switch(activeView) {
        case STUDENT_VIEWS.DASHBOARD:
            return <StudentHome setActiveView={setActiveView} />;
        case STUDENT_VIEWS.RESULTS:
            return <StudentResults demoUserId={demoUserId} />;
        case STUDENT_VIEWS.ASSIGNMENTS:
            return <StudentAssignments demoUserId={demoUserId} />;
        case STUDENT_VIEWS.TIMETABLE:
            return <StudentTimetable demoUserId={demoUserId} />;
        case STUDENT_VIEWS.PROFILE:
            return <StudentProfile demoUserId={demoUserId} />;
        case STUDENT_VIEWS.NOTIFICATIONS:
            return <NotificationViewer demoUserId={demoUserId} />;
        case STUDENT_VIEWS.AI_TUTOR:
            return <AIAcademicTutor />;
        default:
            return <StudentHome setActiveView={setActiveView} />;
    }
};

export default StudentDashboardContent;
