import React, { useState, useEffect, useMemo } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetScores, apiGetSchoolSettings } from '../services/api';
import { Student, Subject, Score, SchoolSettings } from '../types';
import { calculateGrade } from '../utils/reportCardHelper';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';

const BroadsheetAnalysis = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('');
    const { settings: tenantSettings } = useTenant();
    const classNames = useMemo(() => generateClassNames(tenantSettings), [tenantSettings]);

    useEffect(() => {
        if (classNames.length > 0 && !selectedClass) {
            setSelectedClass(classNames[0]);
        }
    }, [classNames, selectedClass]);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [studentsData, subjectsData, scoresData, settingsData] = await Promise.all([
                    apiGetStudents(),
                    apiGetSubjects(),
                    apiGetScores(),
                    apiGetSchoolSettings()
                ]);
                setStudents(studentsData);
                setSubjects(subjectsData);
                setScores(scoresData);
                setSettings(settingsData);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const broadsheetData = useMemo(() => {
        if (!selectedClass || !settings) return { students: [], subjects: [] };
        
        const studentsInClass = students.filter(s => s.class === selectedClass);
        const subjectsForClass = subjects.filter(s => s.classes.includes(selectedClass));
        
        const studentResults = studentsInClass.map(student => {
            let totalScore = 0;
            const scoresBySubject = subjectsForClass.reduce((acc, subject) => {
                const score = scores.find(s => 
                    s.studentId === student.id && 
                    s.subjectId === subject.id &&
                    s.session === settings.session &&
                    s.term === settings.term
                );
                const total = (score?.ca1 || 0) + (score?.ca2 || 0) + (score?.exam || 0);
                totalScore += total;
                acc[subject.id] = total;
                return acc;
            }, {});
            
            return {
                ...student,
                scoresBySubject,
                total: totalScore,
                average: subjectsForClass.length > 0 ? totalScore / subjectsForClass.length : 0
            };
        });

        studentResults.sort((a, b) => b.average - a.average);

        return { students: studentResults, subjects: subjectsForClass };
    }, [selectedClass, students, subjects, scores, settings]);

    if (loading) return <div>Loading broadsheet...</div>;

    const { students: results, subjects: classSubjects } = broadsheetData;

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-semibold">Broadsheet Analysis</h2>
                     <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field w-auto">
                        {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th className="th sticky left-0 bg-gray-50 z-10">Student Name</th>
                                {classSubjects.map(sub => <th key={sub.id} className="th text-center">{sub.name}</th>)}
                                <th className="th text-center">Total</th>
                                <th className="th text-center">Average</th>
                                <th className="th text-center">Position</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((student, index) => (
                                <tr key={student.id}>
                                    <td className="td sticky left-0 bg-white font-medium z-10">{student.name}</td>
                                    {classSubjects.map(sub => <td key={sub.id} className="td text-center">{student.scoresBySubject[sub.id]}</td>)}
                                    <td className="td text-center font-bold">{student.total}</td>
                                    <td className="td text-center font-bold">{student.average.toFixed(2)}</td>
                                    <td className="td text-center font-bold">{index + 1}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BroadsheetAnalysis;