import React, { useState, useEffect } from 'react';
import { apiGetTimetableData, apiGetSubjects, apiGetTeachers } from '../services/api';
import { supabase } from '../services/supabaseClient';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '1:00 - 2:00'];

const TeacherSchedule = () => {
    const [schedule, setSchedule] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            setLoading(true);

            if (!supabase) {
                setLoading(false);
                return;
            }
            
            // FIX: Defensively destructure user data to prevent crash if 'data' is null.
            const { data, error } = await supabase.auth.getUser();
            if (error || !data?.user) {
                console.error("Could not get user for teacher schedule:", error);
                setLoading(false);
                return;
            }
            const { user } = data;


            const [timetableData, subjectData, teacherData] = await Promise.all([
                apiGetTimetableData(),
                apiGetSubjects(),
                apiGetTeachers()
            ]);
            setSubjects(subjectData);

            const me = teacherData.find(t => t.email.toLowerCase() === user.email.toLowerCase());
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

    if (loading) return <div className="card p-6 text-center">Loading your schedule...</div>;

    return (
        <div>
            <h1 className="text-2xl font-semibold">My Weekly Schedule</h1>
            <div className="table-container mt-6">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th w-1/6">Time</th>
                            {DAYS.map(day => <th key={day} className="th text-center">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                        {TIME_SLOTS.map(time => (
                            <tr key={time} className="divide-x divide-gray-200 dark:divide-gray-700">
                                <td className="td font-semibold">{time}</td>
                                {DAYS.map(day => {
                                    const slot = schedule[day]?.[time];
                                    return (
                                        <td key={day} className="td text-center p-2">
                                            {slot ? (
                                                <div>
                                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{getSubjectName(slot.subjectId)}</p>
                                                    <p className="text-sm text-gray-500">{slot.className}</p>
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
        </div>
    );
};

export default TeacherSchedule;