import React, { useState, useEffect } from 'react';
import { apiGetTimetableData, apiGetStudents, apiGetSubjects } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { computeTimetablePlan } from '../utils/timetable';

const StudentTimetable = ({ demoUserId }) => {
    const { settings } = useAuth();
    const plan = computeTimetablePlan(settings || undefined);
    const DAYS_LOCAL = plan.days;
    const TIME_SLOTS_LOCAL = plan.timeSlots;
    const SLOT_META = (plan as any).slotMeta;
    const [timetable, setTimetable] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [studentClass, setStudentClass] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [ttData, studentData, subjectData] = await Promise.all([
                    apiGetTimetableData(),
                    apiGetStudents(),
                    apiGetSubjects()
                ]);

                const currentStudent = demoUserId ? studentData.find(s => s.id === demoUserId) : null;
                if (currentStudent) {
                    setStudentClass(currentStudent.class);
                    setTimetable(ttData[currentStudent.class]);
                } else {
                    // Fallback: pick the first available class in timetable
                    const classNames = Object.keys(ttData || {});
                    if (classNames.length > 0) {
                        setStudentClass(classNames[0]);
                        setTimetable(ttData[classNames[0]]);
                    }
                }
                setSubjects(subjectData);
            } catch (error) {
                console.error("Failed to load timetable", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [demoUserId]);
    
    const getSubjectName = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject?.name || 'N/A';
    };

    if (loading) return <div className="card p-6 text-center">Loading Timetable...</div>;
    if (!timetable) return <div className="card p-6 text-center">No timetable has been set for your class ({studentClass}).</div>;

    return (
        <div>
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
                                {DAYS_LOCAL.map(day => (
                                    <td key={day} className="td text-center p-2">
                                        {SLOT_META?.[time]?.type === 'break' ? (
                                            <div className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded p-2">Break</div>
                                        ) : timetable[day]?.[time] ? (
                                            <div className="bg-indigo-50 border border-indigo-200 rounded p-2">
                                                <p className="font-semibold text-indigo-700">{getSubjectName(timetable[day][time].subjectId)}</p>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">-</span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentTimetable;