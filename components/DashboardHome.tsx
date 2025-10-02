import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetTeachers } from '../services/api';
import UsersIcon from './icons/UsersIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import RecentActivityWidget from './RecentActivityWidget';
import DashboardInsights from './DashboardInsights';

function StatCard({ icon, title, value }: { icon: React.ReactNode, title: string, value: any }) {
    return (
        <div className="card p-6 flex items-center space-x-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                {icon}
            </div>
            <div>
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                 <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value}</p>
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
            <p className="text-gray-600 dark:text-gray-400 mb-6">Welcome back! Here's a summary of your school.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    <p>Loading stats...</p>
                ) : (
                    <>
                        <StatCard icon={<UsersIcon className="w-8 h-8"/>} title="Total Students" value={stats.students} />
                        <StatCard icon={<BriefcaseIcon className="w-8 h-8"/>} title="Total Teachers" value={stats.teachers} />
                        <StatCard icon={<BookOpenIcon className="w-8 h-8"/>} title="Total Subjects" value={stats.subjects} />
                    </>
                )}
            </div>
            
            <DashboardInsights />
            
            <RecentActivityWidget />
        </div>
    );
}