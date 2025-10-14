import React, { useState, useEffect } from 'react';
import { apiGetStudents, apiGetScores, apiGetSchoolSettings, apiGetAttendance } from '../services/api';
import StatCard from './StatCard';
import UsersIcon from './icons/UsersIcon';
import StatCardSkeleton from './skeletons/StatCardSkeleton';
import BookOpenIcon from './icons/BookOpenIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';

const DashboardInsights = () => {
    const [stats, setStats] = useState({ studentCount: 0, newStudents: 0, averagePerformance: 0, attendancePercentage: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const [students, scores, settings, attendance] = await Promise.all([
                    apiGetStudents(),
                    apiGetScores(),
                    apiGetSchoolSettings(),
                    apiGetAttendance()
                ]);

                // Student stats
                const studentCount = students.length;
                const newStudents = students.filter(s => s.created_at && new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
                
                // Performance stats
                const currentTermScores = scores.filter(s => s.session === settings.session && s.term === settings.term);
                const totalScore = currentTermScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
                const averagePerformance = currentTermScores.length > 0 ? totalScore / currentTermScores.length : 0;

                // Attendance stats
                let totalPresentOrLate = 0;
                let totalRecords = 0;
                attendance.forEach(record => {
                    const statuses = Object.values(record.statuses);
                    totalRecords += statuses.length;
                    statuses.forEach(status => {
                        if (status === 'present' || status === 'late') {
                            totalPresentOrLate++;
                        }
                    });
                });
                const attendancePercentage = totalRecords > 0 ? (totalPresentOrLate / totalRecords) * 100 : 100;

                setStats({
                    studentCount,
                    newStudents,
                    averagePerformance,
                    attendancePercentage,
                });
            } catch (error) {
                console.error("Failed to load dashboard insights:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInsights();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <StatCard
                title="Total Students"
                value={stats.studentCount}
                icon={<UsersIcon className="w-6 h-6" />}
                trend={stats.newStudents > 0 ? { value: `${stats.newStudents} new this month`, direction: 'up' } : null}
            />
             <StatCard
                title="Class Average (Current Term)"
                value={`${stats.averagePerformance.toFixed(1)}%`}
                icon={<BookOpenIcon className="w-6 h-6" />}
                trend={null}
            />
            <StatCard
                title="Overall Attendance"
                value={`${stats.attendancePercentage.toFixed(1)}%`}
                icon={<CheckBadgeIcon className="w-6 h-6" />}
                trend={null}
            />
        </div>
    );
};

export default DashboardInsights;