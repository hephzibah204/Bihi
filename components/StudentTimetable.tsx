import React, { useState, useEffect } from 'react';
import { apiGetTimetableData, apiGetStudents, apiGetSubjects } from '../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['8:00 - 9:00', '9:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '1:00 - 2:00'];

const StudentTimetable = ({ demoUserId }) => {
    const [timetable, setTimetable] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [studentClass, setStudentClass] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            setLoading(true);
            try {
                const [ttData, studentData, subjectData] = await Promise.all([
                    apiGetTimetableData(),
                    apiGetStudents(),
                    apiGetSubjects()
                ]);

                const currentStudent = studentData.find(s => s.id === demoUserId);
                if (currentStudent) {
                    setStudentClass(currentStudent.class);
                    setTimetable(ttData[currentStudent.class]);
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
                            {DAYS.map(day => <th key={day} className="th text-center">{day}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                        {TIME_SLOTS.map(time => (
                            <tr key={time} className="divide-x divide-gray-200 dark:divide-gray-700">
                                <td className="td font-semibold">{time}</td>
                                {DAYS.map(day => (
                                    <td key={day} className="td text-center p-2">
                                        {timetable[day]?.[time] ? (
                                            <p className="font-bold text-indigo-600 dark:text-indigo-400">
                                                {getSubjectName(timetable[day][time].subjectId)}
                                            </p>
                                        ) : (
                                            <span className="text-gray-400">-</span>
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