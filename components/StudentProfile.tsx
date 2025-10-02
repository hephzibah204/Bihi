import React, { useState, useEffect } from 'react';
import { apiGetStudents } from '../services/api';

const StudentProfile = ({ demoUserId }) => {
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!demoUserId) {
            setLoading(false);
            return;
        }
        const fetchProfile = async () => {
            const allStudents = await apiGetStudents();
            const profile = allStudents.find(s => s.id === demoUserId);
            setStudent(profile);
            setLoading(false);
        };
        fetchProfile();
    }, [demoUserId]);

    if (loading) return <div className="card p-6 text-center">Loading profile...</div>;
    if (!student) return <div className="card p-6 text-center">Could not find student profile.</div>;

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">My Profile</h1>
            <div className="card mt-6">
                <div className="p-6 flex flex-col md:flex-row items-center gap-6">
                    <img 
                        src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} 
                        alt={student.name} 
                        className="h-32 w-32 rounded-full object-cover ring-4 ring-indigo-300" 
                    />
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold">{student.name}</h2>
                        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-gray-600 dark:text-gray-300">
                            <strong>Class:</strong><span>{student.class}</span>
                            <strong>Admission No:</strong><span>{student.admissionNo}</span>
                            <strong>Gender:</strong><span>{student.gender}</span>
                            <strong>Date of Birth:</strong><span>{student.dob}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;