import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetScores, apiGetSubjects } from '../services/api';
import { Student, Score, Subject } from '../types';
import { exportToCSV } from '../utils/csvExporter';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';

const BroadsheetAnalysis = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            const allSubjects: Subject[] = await apiGetSubjects();
            const allClasses = [...new Set(allSubjects.flatMap(s => s.classes))].sort();
            setClasses(allClasses);
            if (allClasses.length > 0) {
                setSelectedClass(allClasses[0]);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedClass) return;
        const fetchDataForClass = async () => {
            setLoading(true);
            const [classStudents, allSubjects] = await Promise.all([
                apiGetStudents({ classFilter: selectedClass }),
                apiGetSubjects()
            ]);
            
            const subjectsForClass = allSubjects.filter(s => s.classes.includes(selectedClass));
            setSubjects(subjectsForClass);
            setStudents(classStudents);
            
            if (classStudents.length > 0) {
                const studentIds = classStudents.map(s => s.id);
                const classScores = await apiGetScores({ studentIds });
                setScores(classScores);
            } else {
                setScores([]);
            }

            setLoading(false);
        };
        fetchDataForClass();
    }, [selectedClass]);

    const scoresMap = React.useMemo(() => {
        return scores.reduce((acc, score) => {
            if (!acc[score.studentId]) acc[score.studentId] = {};
            acc[score.studentId][score.subjectId] = score;
            return acc;
        }, {});
    }, [scores]);

    const getStudentScore = (studentId, subjectId) => {
        const score = scoresMap[studentId]?.[subjectId];
        if (!score) return { total: 0 };
        const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
        return { ...score, total };
    };

    const studentTotals = students.map(student => {
        const totalScore = subjects.reduce((acc, subject) => {
            return acc + getStudentScore(student.id, subject.id).total;
        }, 0);
        return { studentId: student.id, total: totalScore };
    });

    const handleExport = () => {
        const dataToExport = students.map(student => {
            const row: { [key: string]: any } = {
                'Student Name': student.name,
                'Admission No': student.admissionNo,
            };
            
            let totalScore = 0;
            subjects.forEach(subject => {
                const score = getStudentScore(student.id, subject.id).total;
                row[subject.name] = score;
                totalScore += score;
            });

            row['Total'] = totalScore;
            row['Average'] = subjects.length > 0 ? (totalScore / subjects.length).toFixed(1) : 0;
            
            return row;
        });

        exportToCSV(dataToExport, `broadsheet_${selectedClass}.csv`);
    };

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold">Broadsheet Analysis</h1>
                <div className="flex items-center gap-4">
                    <select className="input-field max-w-xs" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button onClick={handleExport} className="btn btn-primary" disabled={students.length === 0}>
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        Export Broadsheet
                    </button>
                </div>
            </div>

            {loading ? <p className="mt-4">Loading data...</p> : (
            <div className="table-container overflow-x-auto mt-6">
                <table className="table">
                    <thead>
                        <tr className="divide-x divide-gray-200 dark:divide-gray-700">
                            <th className="th sticky left-0 bg-gray-50 dark:bg-gray-800">Student Name</th>
                            {subjects.map(sub => <th key={sub.id} className="th text-center"><div className="truncate max-w-[100px] mx-auto" title={sub.name}>{sub.name}</div></th>)}
                            <th className="th text-center">Total</th>
                            <th className="th text-center">Average</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {students.map(student => {
                            const studentTotal = studentTotals.find(st => st.studentId === student.id)?.total || 0;
                            const average = subjects.length > 0 ? (studentTotal / subjects.length).toFixed(1) : 0;
                            return (
                                <tr key={student.id} className="divide-x divide-gray-200 dark:divide-gray-700">
                                    <td className="td font-medium sticky left-0 bg-white dark:bg-gray-800"><div className="truncate max-w-xs" title={student.name}>{student.name}</div></td>
                                    {subjects.map(sub => {
                                        const score = getStudentScore(student.id, sub.id);
                                        return <td key={sub.id} className="td text-center">{score.total}</td>
                                    })}
                                    <td className="td text-center font-bold">{studentTotal}</td>
                                    <td className="td text-center font-semibold">{average}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    );
};

export default BroadsheetAnalysis;
