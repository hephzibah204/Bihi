import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetScores, apiGetSubjects } from '../services/api';
import { Student, Score, Subject } from '../types';
import { ADMIN_VIEWS } from '../utils/constants';

const StudentProfilePage = ({ studentId, setActiveView }) => {
    const [student, setStudent] = useState<Student | null>(null);
    const [scores, setScores] = useState<Score[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studentId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [allStudents, allScores, allSubjects] = await Promise.all([
                    apiGetStudents(),
                    apiGetScores({ studentIds: [studentId] }),
                    apiGetSubjects()
                ]);

                setStudent(allStudents.find(s => s.id === studentId) || null);
                setScores(allScores);
                setSubjects(allSubjects);
            } catch (error) {
                console.error("Failed to load student profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [studentId]);

    if (loading) return <div className="card p-6 text-center">Loading profile...</div>;
    if (!student) return <div className="card p-6 text-center">Student not found. <button onClick={() => setActiveView(ADMIN_VIEWS.STUDENTS)} className="text-indigo-600">Go back</button></div>;
    
    // Simple logic to show recent scores
    const recentScores = scores.slice(0, 5).map(score => {
        const subject = subjects.find(s => s.id === score.subjectId);
        const total = (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
        return { subjectName: subject?.name || 'Unknown', total };
    });

    return (
        <div>
             <button onClick={() => setActiveView(ADMIN_VIEWS.STUDENTS)} className="btn btn-secondary mb-4">&larr; Back to Students</button>
             <div className="card">
                <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <img src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} alt={student.name} className="h-32 w-32 rounded-full object-cover" />
                    <div>
                        <h2 className="text-3xl font-bold">{student.name}</h2>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-gray-600">
                            <span><strong>Class:</strong> {student.class}</span>
                            <span><strong>Admission No:</strong> {student.admissionNo}</span>
                             <span><strong>Gender:</strong> {student.gender}</span>
                            <span><strong>DOB:</strong> {student.dob}</span>
                        </div>
                    </div>
                </div>
            </div>
             <div className="card mt-6">
                <div className="p-6">
                    <h3 className="text-xl font-semibold">Recent Performance</h3>
                     {recentScores.length > 0 ? (
                        <ul className="mt-4 divide-y">
                            {recentScores.map((s, i) => <li key={i} className="py-2 flex justify-between"><span>{s.subjectName}</span><span className="font-bold">{s.total}%</span></li>)}
                        </ul>
                    ) : <p className="mt-4 text-gray-500">No scores recorded yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default StudentProfilePage;
