import React, { useState, useEffect } from 'react';
import { apiGetTimetableData, apiGetSubjects, apiGetTeachers } from '../services/api';
// Fix: Corrected import path for supabase client
import { supabase } from '../services/supabaseClient';
import { getSubdomain } from '../utils/subdomain';
import { useAuth } from '../contexts/AuthContext';
import { computeTimetablePlan } from '../utils/timetable';

const TeacherSchedule = () => {
    const { settings } = useAuth();
    const plan = computeTimetablePlan(settings || undefined);
    const DAYS_LOCAL = plan.days;
    const TIME_SLOTS_LOCAL = plan.timeSlots;
    const SLOT_META = (plan as any).slotMeta;
    const [schedule, setSchedule] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);

            const demo = (typeof window !== 'undefined') && (
                sessionStorage.getItem('isDemoMode') === 'true' ||
                localStorage.getItem('isDemoMode') === 'true' ||
                getSubdomain() === 'demo'
            );

            let userEmail: string | null = null;
            if (!demo) {
                if (!supabase) {
                    setLoading(false);
                    return;
                }
                // FIX: Defensively destructure user data to prevent crash if 'data' is null.
                const { data: userData, error } = await supabase.auth.getUser();
                if (error || !userData?.user) {
                    console.error("Could not get user for teacher schedule:", error);
                    setLoading(false);
                    return;
                }
                userEmail = userData.user.email || null;
            } else {
                // Demo mode: use demo teacher email
                userEmail = 'teacher@demo.com';
            }

            const [timetableData, subjectData, teacherData] = await Promise.all([
                apiGetTimetableData(),
                apiGetSubjects(),
                apiGetTeachers()
            ]);
            setSubjects(subjectData);

            const me = teacherData.find(t => t.email && t.email.toLowerCase() === (userEmail || '').toLowerCase());
            if (!me) {
                setLoading(false);
                return;
            }
            const loggedInTeacherId = me.id;

            // Filter the timetable for the current teacher
            const teacherSchedule = {};
            Object.keys(timetableData).forEach(className => {
                Object.keys(timetableData[className]).forEach(day => {
                    Object.keys(timetableData[className][day]).forEach(time => {
                        const slot = timetableData[className][day][time];
                        if (slot.teacherId === loggedInTeacherId) {
                            if (!teacherSchedule[day]) teacherSchedule[day] = {};
                            teacherSchedule[day][time] = { ...slot, className };
                        }
                    });
                });
            });
            setSchedule(teacherSchedule);
            setLoading(false);
        };
        fetchSchedule();
    }, []);

    const getSubjectName = (subjectId) => subjects.find(s => s.id === subjectId)?.name || 'N/A';
    
    const isScheduleEmpty = Object.keys(schedule).length === 0;

    if (loading) return <div className="card p-6 text-center">Loading your schedule...</div>;

    return (
        <div>
            {isScheduleEmpty ? (
                <div className="card p-8 text-center">
                    <p className="text-gray-500">Your schedule is empty. Please contact your school administrator to be assigned to classes.</p>
                </div>
            ) : (
                <div className="table-container mt-6">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th w-1/6">Time</th>
                                {DAYS_LOCAL.map(day => <th key={day} className="th text-center">{day}</th>)}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {TIME_SLOTS_LOCAL.map(time => (
                                <tr key={time} className="divide-x divide-gray-200">
                                    <td className="td font-semibold">{time}</td>
                                    {DAYS_LOCAL.map(day => {
                                        const slot = schedule[day]?.[time];
                                        return (
                                            <td key={day} className="td text-center p-2">
                                                {SLOT_META?.[time]?.type === 'break' ? (
                                                    <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded p-2">Break</div>
                                                ) : slot ? (
                                                    <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                                                        <p className="font-semibold text-indigo-700">{getSubjectName(slot.subjectId)}</p>
                                                        <p className="text-sm text-gray-600">{slot.className}</p>
                                                    </div>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TeacherSchedule;
