import React, { useState, useEffect } from 'react';
import ClipboardListIcon from './icons/ClipboardListIcon';
import ClockIcon from './icons/ClockIcon';
// Fix: Correct import path
import { StudentView } from '../types';
import BrainCircuitIcon from './icons/BrainCircuitIcon';
import { STUDENT_VIEWS } from '../utils/constants';
// Fix: Correct import path
import { apiGetStudents, apiGetScores, apiGetAttendance, apiGetSchoolSettings, apiGetSubjects } from '../services/api';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import TrophyIcon from './icons/TrophyIcon';
import ArrowTrendingUpIcon from './icons/ArrowTrendingUpIcon';

// Fix: Added a props interface and typed the Badge component as a React.FC. This resolves a TypeScript error when using the component in a .map() loop, as React.FC correctly handles the special 'key' prop.
interface BadgeProps {
    icon: React.ReactNode;
    title: string;
    text: string;
}

const Badge: React.FC<BadgeProps> = ({ icon, title, text }) => (
    <div title={title} className="flex flex-col items-center text-center p-2">
        <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded-full">
            {icon}
        </div>
        <p className="mt-2 text-xs font-semibold text-gray-700">{text}</p>
    </div>
);

const AchievementsWidget = ({ studentId }) => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) {
            setLoading(false);
            return;
        }

        const calculateBadges = async () => {
            try {
                const [allStudents, allScores, allAttendance, settings, allSubjects] = await Promise.all([
                    apiGetStudents(),
                    apiGetScores(),
                    apiGetAttendance(),
                    apiGetSchoolSettings(),
                    apiGetSubjects()
                ]);

                const student = allStudents.find(s => s.id === studentId);
                if (!student) return;

                const earnedBadges = [];
                const subjectMap = new Map(allSubjects.map(s => [s.id, s.name]));

                // Perfect Attendance for the current term
                const currentTermAttendance = allAttendance.filter(a => {
                    // A simple heuristic for "current term" could be records from the last 90 days
                    return new Date(a.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                });

                const hasAbsence = currentTermAttendance.some(record => {
                    const status = record.statuses?.[student.id];
                    return status === 'absent' || status === 'late';
                });

                if (!hasAbsence && currentTermAttendance.length > 0) {
                    earnedBadges.push({
                        id: 'perfect-attendance',
                        icon: <CheckBadgeIcon className="w-8 h-8 text-green-500" />,
                        title: 'Perfect Attendance for the term!',
                        text: 'Perfect Attendance'
                    });
                }

                // Top Performer for the current term
                const studentsInClass = allStudents.filter(s => s.class === student.class);
                const studentIdsInClass = studentsInClass.map(s => s.id);
                const scoresInClassForTerm = allScores.filter(s => studentIdsInClass.includes(s.studentId) && s.session === settings.session && s.term === settings.term);
                
                const scoresBySubject = scoresInClassForTerm.reduce((acc, score) => {
                    if (!acc[score.subjectId]) acc[score.subjectId] = [];
                    acc[score.subjectId].push({ studentId: score.studentId, total: (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0) });
                    return acc;
                }, {});

                for (const subjectId in scoresBySubject) {
                    const subjectScores = scoresBySubject[subjectId];
                    if (subjectScores.length < 2) continue; // Only award for competitive subjects
                    
                    const maxScore = Math.max(...subjectScores.map(s => s.total));
                    const topPerformers = subjectScores.filter(s => s.total === maxScore);
                    
                    if (topPerformers.some(p => p.studentId === student.id)) {
                         const subjectName = subjectMap.get(subjectId);
                         if (subjectName) {
                            earnedBadges.push({
                                id: `top-performer-${subjectId}`,
                                icon: <TrophyIcon className="w-8 h-8 text-yellow-500" />,
                                title: `Top Performer in ${subjectName}`,
                                text: `Top in ${subjectName}`
                            });
                         }
                    }
                }
                
                // Most Improved
                const { session, term } = settings;
                let prevSession, prevTerm;
                const sessionYears = session.split('/').map(Number);

                if (term === 'First Term') {
                    prevTerm = 'Third Term';
                    prevSession = `${sessionYears[0] - 1}/${sessionYears[1] - 1}`;
                } else if (term === 'Second Term') {
                    prevTerm = 'First Term';
                    prevSession = session;
                } else { // Third Term
                    prevTerm = 'Second Term';
                    prevSession = session;
                }

                const currentTermScores = allScores.filter(s => s.studentId === student.id && s.session === session && s.term === term);
                const prevTermScores = allScores.filter(s => s.studentId === student.id && s.session === prevSession && s.term === prevTerm);

                if (currentTermScores.length > 0 && prevTermScores.length > 0) {
                    const currentTotal = currentTermScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
                    const currentAvg = currentTotal / currentTermScores.length;

                    const prevTotal = prevTermScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
                    const prevAvg = prevTotal / prevTermScores.length;

                    if (currentAvg > prevAvg * 1.15) { // 15% improvement threshold
                        earnedBadges.push({
                            id: 'most-improved',
                            icon: <ArrowTrendingUpIcon className="w-8 h-8 text-blue-500" />,
                            title: `Huge improvement from last term!`,
                            text: 'Most Improved'
                        });
                    }
                }

                setBadges(earnedBadges);

            } catch (e) {
                console.error("Failed to calculate badges", e);
            } finally {
                setLoading(false);
            }
        };

        calculateBadges();

    }, [studentId]);

    if (loading) {
        return <div className="card mt-6 p-6"><h3 className="text-lg font-semibold">Achievements</h3><p className="mt-2 text-gray-500">Calculating badges...</p></div>;
    }

    if (badges.length === 0) {
        return null;
    }

    return (
        <div className="card mt-6">
            <div className="p-6">
                <h3 className="text-lg font-semibold">Your Achievements</h3>
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {badges.map(badge => (
                        <Badge key={badge.id} icon={badge.icon} title={badge.title} text={badge.text} />
                    ))}
                </div>
            </div>
        </div>
    );
};


const StudentHome = ({ setActiveView, demoUserId }: { setActiveView: (view: StudentView) => void, demoUserId: string }) => {
    const quickLinks = [
        { view: STUDENT_VIEWS.RESULTS, title: "View My Results", icon: <ClipboardListIcon className="w-8 h-8"/>, description: "Check your latest scores and grades." },
        { view: STUDENT_VIEWS.AI_TOOLS, title: "AI Learning Tools", icon: <BrainCircuitIcon className="w-8 h-8"/>, description: "Use AI to generate quizzes, study plans, and more." },
        { view: STUDENT_VIEWS.TIMETABLE, title: "Check Timetable", icon: <ClockIcon className="w-8 h-8"/>, description: "See your class schedule for the week." },
    ];

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700">Welcome, Student!</h1>
            <p className="mt-2 text-gray-600">Here's a quick overview of your portal.</p>
            <AchievementsWidget studentId={demoUserId} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {quickLinks.map(link => (
                    <button 
                        key={link.view} 
                        onClick={() => setActiveView(link.view as StudentView)}
                        className="card p-6 text-center hover:shadow-lg hover:scale-105 transition-transform duration-200"
                    >
                        <div className="text-indigo-500 mx-auto w-16 h-16 flex items-center justify-center bg-indigo-100 rounded-full">
                            {link.icon}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">{link.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{link.description}</p>
                    </button>
                ))}
            </div>
             <div className="card mt-6">
                <div className="p-6">
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <p className="mt-2 text-gray-500">No new notifications.</p>
                </div>
            </div>
        </div>
    );
};

export default StudentHome;