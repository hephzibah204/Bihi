import React, { useState, useEffect, useMemo } from 'react';
import { apiGetTeachers, apiGetStudents, apiGetSubjects, apiGetScores, apiGetTimetableData, apiGetSchoolSettings } from '../services/api';
import { Teacher, Student, Subject, Score, SchoolSettings } from '../types';
import TrophyIcon from './icons/TrophyIcon';
import SkeletonLoader from './SkeletonLoader';

interface RankedTeacher {
    teacher: Teacher;
    score: number;
}

// FIX: Added TimetableSlot interface to correctly type timetable data and resolve property access errors on 'unknown' type.
interface TimetableSlot {
    teacherId: string;
    subjectId: string;
}

const DataChampionsWidget = () => {
    const [rankedTeachers, setRankedTeachers] = useState<RankedTeacher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateScores = async () => {
            setLoading(true);
            try {
                const [teachers, students, subjects, scores, timetable, settings] = await Promise.all([
                    apiGetTeachers(),
                    apiGetStudents(),
                    apiGetSubjects(),
                    apiGetScores(),
                    apiGetTimetableData(),
                    apiGetSchoolSettings()
                ]);

                if (!teachers.length || !students.length || !Object.keys(timetable).length) {
                    setLoading(false);
                    return;
                }

                const teacherScores = teachers.map(teacher => {
                    let totalPossibleEntries = 0;
                    let actualEntries = 0;

                    // Find all unique class/subject pairs for this teacher from the timetable
                    const taughtSubjects = new Map<string, Set<string>>(); // Map<class, Set<subjectId>>
                    Object.entries(timetable).forEach(([className, classSchedule]) => {
                        Object.values(classSchedule as any).forEach((daySchedule: any) => {
                            Object.values(daySchedule).forEach((slot: TimetableSlot) => {
                                if (slot && slot.teacherId === teacher.id) {
                                    if (!taughtSubjects.has(className)) {
                                        taughtSubjects.set(className, new Set());
                                    }
                                    taughtSubjects.get(className)?.add(slot.subjectId);
                                }
                            });
                        });
                    });

                    taughtSubjects.forEach((subjectIds, className) => {
                        const studentsInClass = students.filter(s => s.class === className);
                        if (studentsInClass.length === 0) return;

                        subjectIds.forEach(subjectId => {
                            totalPossibleEntries += studentsInClass.length * 3; // CA1, CA2, Exam

                            studentsInClass.forEach(student => {
                                const scoreRecord = scores.find(s =>
                                    s.studentId === student.id &&
                                    s.subjectId === subjectId &&
                                    s.session === settings.session &&
                                    s.term === settings.term
                                );
                                if (scoreRecord) {
                                    if (typeof scoreRecord.ca1 === 'number') actualEntries++;
                                    if (typeof scoreRecord.ca2 === 'number') actualEntries++;
                                    if (typeof scoreRecord.exam === 'number') actualEntries++;
                                }
                            });
                        });
                    });

                    const scorePercentage = totalPossibleEntries > 0 ? (actualEntries / totalPossibleEntries) * 100 : 0;
                    return { teacher, score: scorePercentage };
                });

                teacherScores.sort((a, b) => b.score - a.score);
                setRankedTeachers(teacherScores);

            } catch (error) {
                console.error("Failed to calculate data champion scores:", error);
            } finally {
                setLoading(false);
            }
        };

        calculateScores();
    }, []);

    const rankColors = {
        1: 'text-yellow-400',
        2: 'text-gray-400',
        3: 'text-yellow-600'
    };

    if (loading) {
        return (
            <div className="card mt-6">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800">Data Champions</h3>
                     <div className="mt-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                                <SkeletonLoader className="w-10 h-10 rounded-full" />
                                <div className="flex-1">
                                    <SkeletonLoader className="h-4 w-3/4 mb-1" />
                                    <SkeletonLoader className="h-3 w-1/2" />
                                </div>
                                <SkeletonLoader className="h-6 w-12" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    
    if(rankedTeachers.length === 0) {
        return null; // Don't show the widget if there's no data to rank
    }

    return (
        <div className="card mt-6">
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800">Data Champions</h3>
                <p className="text-sm text-gray-500">Top teachers by data entry completeness this term.</p>
                <ul className="mt-4 space-y-4">
                    {rankedTeachers.slice(0, 3).map((item, index) => (
                        <li key={item.teacher.id} className="flex items-center space-x-4">
                            <TrophyIcon className={`w-8 h-8 flex-shrink-0 ${rankColors[index + 1]}`} />
                            <img
                                src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(item.teacher.name)}`}
                                alt={item.teacher.name}
                                className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                                <p className="font-semibold">{item.teacher.name}</p>
                                <p className="text-xs text-gray-500">{item.teacher.role}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-indigo-600">{item.score.toFixed(1)}%</p>
                                <p className="text-xs text-gray-500">Complete</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DataChampionsWidget;
