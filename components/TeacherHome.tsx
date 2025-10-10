import React, { useState, useEffect } from 'react';
// types
import { TeacherView, Teacher, Student, Subject, Assignment, AssignmentScore } from '../types';
// services
import { supabase } from '../services/supabaseClient';
import { apiGetTimetableData, apiGetSubjects, apiGetTeachers, apiGetAssignments, apiGetStudents, apiGetAssignmentScores } from '../services/api';
// utils
import { TEACHER_VIEWS } from '../utils/constants';
import { formatDate } from '../utils/dateHelpers';
// icons
import ClipboardListIcon from './icons/ClipboardListIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import UsersIcon from './icons/UsersIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import TrophyIcon from './icons/TrophyIcon';


const TeacherOfTheMonthWidget = ({ teacherName }) => (
    <div className="card bg-gradient-to-br from-yellow-300 to-orange-400 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center space-x-4">
            <TrophyIcon className="w-16 h-16 flex-shrink-0" />
            <div>
                <h3 className="text-2xl font-bold">Data Champion!</h3>
                <p className="font-semibold text-yellow-100">Congratulations, {teacherName}!</p>
                <p className="text-sm text-yellow-200 mt-1">For your outstanding commitment to timely and accurate record-keeping.</p>
            </div>
        </div>
    </div>
);


const TeacherHome = ({ setActiveView }: { setActiveView: (view: TeacherView) => void }) => {
    const [loading, setLoading] = useState(true);
    const [scheduleForToday, setScheduleForToday] = useState([]);
    const [actionItems, setActionItems] = useState([]);
    const [stats, setStats] = useState({ studentCount: 0, classCount: 0 });
    const [teacherName, setTeacherName] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const [
                teachers,
                allStudents,
                allSubjects,
                timetable,
                allAssignments,
                allAssignmentScores,
            ]: [Teacher[], Student[], Subject[], any, Assignment[], AssignmentScore[]] = await Promise.all([
                apiGetTeachers(),
                apiGetStudents(),
                apiGetSubjects(),
                apiGetTimetableData(),
                apiGetAssignments(),
                apiGetAssignmentScores(),
            ]);

            const me = teachers.find(t => t.email.toLowerCase() === user.email.toLowerCase());
            if (!me) {
                setLoading(false);
                return;
            }
            setTeacherName(me.name.split(' ')[0]);

            // --- Process Data ---
            const subjectMap = new Map(allSubjects.map(s => [s.id, s.name]));
            const today = new Date().toLocaleString('en-US', { weekday: 'long' }); // e.g., "Monday"
            
            const myClasses = new Set<string>();
            if (me.classTeacherOf) {
                myClasses.add(me.classTeacherOf);
            }

            // Schedule for today
            const todaySchedule = [];
            Object.keys(timetable).forEach(className => {
                if (timetable[className][today]) {
                    Object.keys(timetable[className][today]).forEach(timeSlot => {
                        const slot = timetable[className][today][timeSlot];
                        if (slot.teacherId === me.id) {
                            todaySchedule.push({
                                time: timeSlot,
                                subject: subjectMap.get(slot.subjectId) || 'Unknown',
                                className: className,
                            });
                            myClasses.add(className);
                        }
                    });
                }
            });
            todaySchedule.sort((a, b) => a.time.localeCompare(b.time));
            setScheduleForToday(todaySchedule);

            const myStudents = allStudents.filter(s => myClasses.has(s.class));
            setStats({ studentCount: myStudents.length, classCount: myClasses.size });

            // Action Items (Assignments to grade)
            const now = new Date();
            const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

            const assignmentsForMyClasses = allAssignments.filter(a => myClasses.has(a.class));
            
            const relevantAssignments = assignmentsForMyClasses.filter(a => {
                const dueDate = new Date(a.dueDate);
                return dueDate < now && dueDate > twoWeeksAgo; // Due in the last 14 days
            });

            const actionItemsData = relevantAssignments.map(assignment => {
                const studentsInClass = allStudents.filter(s => s.class === assignment.class).length;
                const scoresSubmitted = allAssignmentScores.filter(s => s.assignmentId === assignment.id).length;
                return {
                    ...assignment,
                    studentsInClass,
                    scoresSubmitted,
                    subjectName: subjectMap.get(assignment.subjectId) || 'Unknown'
                };
            }).filter(item => item.scoresSubmitted < item.studentsInClass); // Only show if not fully graded
            
            setActionItems(actionItemsData.slice(0, 3)); // Show top 3

            setLoading(false);
        };

        fetchDashboardData();
    }, []);

    const quickLinks = [
        { view: TEACHER_VIEWS.ENTER_SCORES, title: "Enter Scores", icon: <ClipboardListIcon className="w-6 h-6"/> },
        { view: TEACHER_VIEWS.MY_SCHEDULE, title: "Full Schedule", icon: <CalendarDaysIcon className="w-6 h-6"/> },
        { view: TEACHER_VIEWS.MY_STUDENTS, title: "My Students", icon: <UsersIcon className="w-6 h-6"/> },
        { view: TEACHER_VIEWS.AI_TOOLS, title: "AI Tools", icon: <BrainCircuitIcon className="w-6 h-6"/> },
    ];
    
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <SpinnerIcon className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700">Welcome, {teacherName}!</h1>
            <p className="mt-1 text-gray-600">Here's what's happening today.</p>

            <div className="mt-6">
                 <TeacherOfTheMonthWidget teacherName={teacherName} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Main content area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Schedule Widget */}
                    <div className="card">
                        <div className="p-6">
                            <h3 className="font-semibold text-lg">Today's Schedule</h3>
                             {scheduleForToday.length > 0 ? (
                                <ul className="mt-4 space-y-3">
                                    {scheduleForToday.map(item => (
                                        <li key={`${item.time}-${item.className}`} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm font-mono text-indigo-600 w-24 flex-shrink-0">{item.time}</div>
                                            <div>
                                                <p className="font-bold">{item.subject}</p>
                                                <p className="text-sm text-gray-500">{item.className}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-4 text-center text-gray-500 py-4">No classes scheduled for today. Enjoy your day!</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Action Items Widget */}
                     <div className="card">
                        <div className="p-6">
                            <h3 className="font-semibold text-lg">Action Items: Grade Assignments</h3>
                             {actionItems.length > 0 ? (
                                <ul className="mt-4 space-y-3">
                                    {actionItems.map(item => (
                                         <li key={item.id} className="p-3 bg-yellow-50 rounded-lg">
                                            <p className="font-bold text-yellow-800">{item.title}</p>
                                            <p className="text-sm text-yellow-700">{item.subjectName} - {item.className}</p>
                                            <div className="flex justify-between items-center mt-1 text-xs text-yellow-600">
                                                <span>Due: {formatDate(item.dueDate)}</span>
                                                <span>{item.scoresSubmitted}/{item.studentsInClass} Graded</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-4 text-center text-gray-500 py-4">All caught up! No recent assignments need grading.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Side content area */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Stats Widget */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-lg">Your Stats</h3>
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><UsersIcon className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.studentCount}</p>
                                    <p className="text-sm text-gray-500">Total Students</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="bg-green-100 text-green-600 p-2 rounded-full"><AcademicCapIcon className="w-5 h-5"/></div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.classCount}</p>
                                    <p className="text-sm text-gray-500">Classes Taught</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links Widget */}
                    <div className="card p-6">
                        <h3 className="font-semibold text-lg">Quick Links</h3>
                        <div className="mt-4 space-y-2">
                             {quickLinks.map(link => (
                                <button 
                                    key={link.view} 
                                    onClick={() => setActiveView(link.view)}
                                    className="w-full flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="text-gray-500">{link.icon}</div>
                                    <span className="ml-3 font-medium">{link.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherHome;
