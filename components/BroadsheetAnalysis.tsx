import React, { useState, useEffect } from 'react';
import { apiGetStudentsForClasses, apiGetScores, apiGetSubjects } from '../services/api';
import { Subject } from '../types';

const BroadsheetAnalysis = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [scoresMap, setScoresMap] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            const allSubjects: Subject[] = await apiGetSubjects();
            setSubjects(allSubjects);
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
            const [classStudents, allScores] = await Promise.all([
                apiGetStudentsForClasses([selectedClass]),
                apiGetScores()
            ]);
            setStudents(classStudents);
            
            // Create a score lookup map for performance
            const map = allScores.reduce((acc, score) => {
                if (!acc[score.studentId]) acc[score.studentId] = {};
                acc[score.studentId][score.subjectId] = score;
                return acc;
            }, {});
            setScoresMap(map);

            setLoading(false);
        };
        fetchDataForClass();
    }, [selectedClass]);

    const getStudentScore = (studentId, subjectId) => {
        const score = scoresMap[studentId]?.[subjectId];
        if (!score) return { total: 0 };
        const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
        return { ...score, total };
    };
    
    const classSubjects = subjects.filter(s => s.classes.includes(selectedClass));

    const studentTotals = students.map(student => {
        const totalScore = classSubjects.reduce((acc, subject) => {
            const score = getStudentScore(student.id, subject.id);
            return acc + score.total;
        }, 0);
        return { studentId: student.id, total: totalScore };
    });

    return (
        <div>
            <h1 className="text-2xl font-semibold">Broadsheet Analysis</h1>
            <div className="my-4">
                <label className="label">Select Class</label>
                <select className="input-field max-w-xs" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {loading ? <p>Loading data...</p> : (
            <div className="table-container overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr className="divide-x divide-gray-200 dark:divide-gray-700">
                            <th className="th sticky left-0 bg-gray-50 dark:bg-gray-800">Student Name</th>
                            {classSubjects.map(sub => <th key={sub.id} className="th text-center">{sub.name}</th>)}
                            <th className="th text-center">Total</th>
                            <th className="th text-center">Average</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {students.map(student => {
                            const studentTotal = studentTotals.find(st => st.studentId === student.id)?.total || 0;
                            const average = classSubjects.length > 0 ? (studentTotal / classSubjects.length).toFixed(1) : 0;
                            return (
                                <tr key={student.id} className="divide-x divide-gray-200 dark:divide-gray-700">
                                    <td className="td font-medium sticky left-0 bg-white dark:bg-gray-800">{student.name}</td>
                                    {classSubjects.map(sub => {
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