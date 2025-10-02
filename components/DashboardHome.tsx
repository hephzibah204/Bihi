import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetTeachers } from '../services/api';
import UsersIcon from './icons/UsersIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import RecentActivityWidget from './RecentActivityWidget';

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: any }) {
    return (
        <div className="card flex items-center p-6">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 mr-4">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-semibold text-gray-800 dark:text-white">{value}</p>
            </div>
        </div>
    );
}

export default function DashboardHome() {
    const [stats, setStats] = useState({ students: 0, subjects: 0, teachers: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [studentData, subjectData, teacherData] = await Promise.all([
                    apiGetStudents(),
                    apiGetSubjects(),
                    apiGetTeachers()
                ]);
                setStats({
                    students: studentData.length,
                    subjects: subjectData.length,
                    teachers: teacherData.length,
                });
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome back! Here's a summary of your school.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {loading ? (
                    <p>Loading stats...</p>
                ) : (
                    <>
                        <StatCard icon={<UsersIcon className="w-6 h-6"/>} title="Total Students" value={stats.students} />
                        <StatCard icon={<BriefcaseIcon className="w-6 h-6"/>} title="Total Teachers" value={stats.teachers} />
                        <StatCard icon={<BookOpenIcon className="w-6 h-6"/>} title="Total Subjects" value={stats.subjects} />
                    </>
                )}
            </div>
            
            <RecentActivityWidget />
        </div>
    );
}
