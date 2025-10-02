import React, { useState, useEffect } from 'react';
import { apiGetScores, apiGetSubjects, apiGetStudents, apiGetSchoolSettings } from '../services/api';
import { calculateGrade } from '../utils/reportCardHelper';

const StudentResults = ({ demoUserId }) => {
    const [results, setResults] = useState([]);
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            setError("Student profile not selected.");
            return;
        }
        
        const fetchResults = async () => {
            setLoading(true);
            setError('');
            try {
                const [allScores, allSubjects, allStudents, settings] = await Promise.all([
                    apiGetScores(),
                    apiGetSubjects(),
                    apiGetStudents(),
                    apiGetSchoolSettings()
                ]);

                const currentStudent = allStudents.find(s => s.id === demoUserId);
                if (!currentStudent) {
                    throw new Error("Student profile not found.");
                }
                setStudent(currentStudent);

                const studentScores = allScores.filter(score => score.studentId === demoUserId);
                
                const formattedResults = studentScores.map(score => {
                    const subject = allSubjects.find(sub => sub.id === score.subjectId);
                    const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
                    const gradeInfo = calculateGrade(total, settings.gradingSystem || []);
                    return {
                        subjectName: subject ? subject.name : 'Unknown Subject',
                        ca1: score.ca1 || 0,
                        ca2: score.ca2 || 0,
                        exam: score.exam || 0,
                        total,
                        grade: gradeInfo.grade,
                        remark: gradeInfo.remark,
                    };
                });
                
                setResults(formattedResults);

            } catch (err) {
                console.error("Failed to fetch results:", err);
                setError("Could not load your results. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [demoUserId]);
    
    if (loading) {
        return <div className="card p-6 text-center">Loading your results...</div>;
    }

    if (error) {
        return <div className="card p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">My Results</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
                Displaying results for {student?.name} in class {student?.class}.
            </p>

            <div className="table-container mt-6">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="th">Subject</th>
                            <th className="th text-center">CA 1</th>
                            <th className="th text-center">CA 2</th>
                            <th className="th text-center">Exam</th>
                            <th className="th text-center">Total</th>
                            <th className="th text-center">Grade</th>
                            <th className="th">Remark</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {results.length > 0 ? results.map((res, index) => (
                            <tr key={index}>
                                <td className="td font-medium text-gray-900 dark:text-white">{res.subjectName}</td>
                                <td className="td text-center">{res.ca1}</td>
                                <td className="td text-center">{res.ca2}</td>
                                <td className="td text-center">{res.exam}</td>
                                <td className="td text-center font-bold">{res.total}</td>
                                <td className="td text-center font-semibold">{res.grade}</td>
                                <td className="td">{res.remark}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" className="td text-center">No results have been uploaded for you yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentResults;