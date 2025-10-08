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
import { STUDENT_VIEWS, USER_ROLES } from '../utils/constants';
import PracticeQuiz from './PracticeQuiz';
import LearningPathways from './LearningPathways';
import SubjectRecommender from './SubjectRecommender';
import HeadsetIcon from './icons/HeadsetIcon';
import StudentReportCardViewer from './StudentReportCardViewer';


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
            return <StudentReportCardViewer demoUserId={demoUserId} />;
        case STUDENT_VIEWS.TRANSCRIPT:
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
        case STUDENT_VIEWS.AI_TOOLS:
            return (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-2xl font-semibold">AI Tools</h2>
                        <p className="mt-1 text-gray-600">Your personal AI-powered learning assistants.</p>
                    </div>
                    {/* Link to the live tutor */}
                    <div className="card p-6 flex flex-col md:flex-row items-center justify-between hover:shadow-lg transition-shadow gap-4">
                        <div className="flex items-center gap-4">
                            <div className="text-indigo-500 flex-shrink-0 w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-full">
                                <HeadsetIcon className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Live AI Tutor</h3>
                                <p className="text-gray-500 mt-1">Have a real-time voice conversation about any topic.</p>
                            </div>
                        </div>
                        <button onClick={() => setActiveView(STUDENT_VIEWS.AI_TUTOR)} className="btn btn-primary w-full md:w-auto">
                           Start Session
                        </button>
                    </div>

                    <PracticeQuiz userRole={USER_ROLES.STUDENT} studentId={demoUserId} />
                    <LearningPathways userRole={USER_ROLES.STUDENT} studentId={demoUserId} />
                    <SubjectRecommender userRole={USER_ROLES.STUDENT} studentId={demoUserId} />
                </div>
            );
        default:
            return <StudentHome setActiveView={setActiveView} />;
    }
};

export default StudentDashboardContent;