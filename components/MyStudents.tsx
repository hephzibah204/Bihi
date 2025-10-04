import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetTeachers, apiGetTimetableData } from '../services/api';
import { supabase } from '../functions/supabaseClient';
import { Student, Teacher } from '../types';

const MyStudents = () => {
    const [myStudents, setMyStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyStudents = async () => {
            setLoading(true);
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

            const [allStudents, allTeachers, timetableData]: [Student[], Teacher[], any] = await Promise.all([
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

            const studentsToShow: Student[] = [];
            const studentIdSet = new Set<string>();

            // 1. Primary source: Class Teacher role
            if (me.classTeacherOf) {
                const classStudents = allStudents.filter(s => s.class === me.classTeacherOf);
                classStudents.forEach(student => {
                    if (!studentIdSet.has(student.id)) {
                        studentsToShow.push(student);
                        studentIdSet.add(student.id);
                    }
                });
            }

            // 2. Secondary source: Subject teacher from timetable
            const teacherClassesFromTimetable = new Set<string>();
            Object.keys(timetableData).forEach(className => {
                const classTimetable = timetableData[className];
                Object.keys(classTimetable).forEach(day => {
                    const daySlots = classTimetable[day];
                    Object.keys(daySlots).forEach(time => {
                        const slot = daySlots[time];
                        if (slot.teacherId === me.id) {
                            teacherClassesFromTimetable.add(className);
                        }
                    });
                });
            });

            const myTimetableClasses = Array.from(teacherClassesFromTimetable);
            const studentsInMySubjectClasses = allStudents.filter(s => myTimetableClasses.includes(s.class));
            
            studentsInMySubjectClasses.forEach(student => {
                if (!studentIdSet.has(student.id)) {
                    studentsToShow.push(student);
                    studentIdSet.add(student.id);
                }
            });

            setMyStudents(studentsToShow);
            setLoading(false);
        };
        fetchMyStudents();
    }, []);


    if (loading) return <p>Loading students...</p>;

    return (
        <div>
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
                                <td className="td"><div className="truncate max-w-sm" title={student.name}>{student.name}</div></td>
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