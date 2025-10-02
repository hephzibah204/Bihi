import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetTeachers, apiGetTimetableData } from '../services/api';
import { supabase } from '../services/supabaseClient';

const MyStudents = () => {
    const [myStudents, setMyStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyStudents = async () => {
            if (!supabase) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase.auth.getUser();
            if (error || !data?.user) {
                console.error("Could not get user for 'My Students':", error);
                setLoading(false);
                return;
            }
            const { user } = data;

            const [allStudents, allTeachers, timetableData] = await Promise.all([
                apiGetStudents(),
                apiGetTeachers(),
                apiGetTimetableData()
            ]);

            const me = allTeachers.find(t => t.email.toLowerCase() === user.email.toLowerCase());
            if (!me) {
                setMyStudents([]);
                setLoading(false);
                return;
            }

            // Find classes from timetable
            const teacherClasses = new Set<string>();
            Object.keys(timetableData).forEach(className => {
                const classTimetable = timetableData[className];
                Object.keys(classTimetable).forEach(day => {
                    const daySlots = classTimetable[day];
                    Object.keys(daySlots).forEach(time => {
                        const slot = daySlots[time];
                        if (slot.teacherId === me.id) {
                            teacherClasses.add(className);
                        }
                    });
                });
            });

            const myClassesArray = Array.from(teacherClasses);
            
            const studentsInMyClasses = allStudents.filter(s => myClassesArray.includes(s.class));
            setMyStudents(studentsInMyClasses);
            setLoading(false);
        };
        fetchMyStudents();
    }, []);

    if (loading) return <p>Loading students...</p>;

    return (
        <div>
            <h1 className="text-2xl font-semibold">My Students</h1>
            <div className="table-container mt-6">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Name</th>
                            <th className="th">Class</th>
                            <th className="th">Admission No.</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                        {myStudents.map(student => (
                            <tr key={student.id}>
                                <td className="td">{student.name}</td>
                                <td className="td">{student.class}</td>
                                <td className="td">{student.admissionNo}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyStudents;