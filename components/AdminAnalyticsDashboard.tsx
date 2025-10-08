import React, { useState, useEffect, useRef } from 'react';
import { apiGetStudents, apiGetScores, apiGetAttendance, apiGetSchoolSettings, apiGetSubjects } from '../services/api';
import { generateText } from '../services/geminiService';
import UsersIcon from './icons/UsersIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import ShieldExclamationIcon from './icons/ShieldExclamationIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import SparklesIcon from './icons/SparklesIcon';
import StatCard from './StatCard';
import StatCardSkeleton from './skeletons/StatCardSkeleton';

declare global {
    interface Window {
        Chart: any;
    }
}

const AdminAnalyticsDashboard = () => {
    const [stats, setStats] = useState({ passRate: 0, attendanceRate: 0, atRisk: 0 });
    const [allData, setAllData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const attendanceChartRef = useRef(null);
    const passRateChartRef = useRef(null);
    const chartInstances = useRef({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [students, scores, attendance, settings, subjects] = await Promise.all([
                    apiGetStudents(), apiGetScores(), apiGetAttendance(), apiGetSchoolSettings(), apiGetSubjects()
                ]);
                setAllData({ students, scores, attendance, settings, subjects });

                const failureThreshold = settings.gradingSystem.find(g => g.grade === 'F')?.to || 39;
                
                const currentTermScores = scores.filter(s => s.session === settings.session && s.term === settings.term);
                const passCount = currentTermScores.filter(s => ((s.ca1||0)+(s.ca2||0)+(s.exam||0)) > failureThreshold).length;
                const passRate = currentTermScores.length > 0 ? (passCount / currentTermScores.length) * 100 : 0;

                const currentTermAttendance = attendance.filter(a => new Date(a.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // Approx last 3 months
                let totalEntries = 0;
                let presentEntries = 0;
                currentTermAttendance.forEach(record => {
                    Object.values(record.statuses).forEach(status => {
                        totalEntries++;
                        if (status === 'present' || status === 'late') presentEntries++;
                    });
                });
                const attendanceRate = totalEntries > 0 ? (presentEntries / totalEntries) * 100 : 100;

                setStats({ passRate: Math.round(passRate), attendanceRate: Math.round(attendanceRate), atRisk: 0 });

            } catch (error) {
                console.error("Failed to load dashboard analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    useEffect(() => {
        if (loading || !allData || !window.Chart) return;

        Object.values(chartInstances.current).forEach((chart: any) => chart.destroy());

        if (attendanceChartRef.current) {
            const labels = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toLocaleDateString('en-US', { weekday: 'short' });
            }).reverse();

            chartInstances.current.attendance = new window.Chart(attendanceChartRef.current, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Attendance',
                        data: [95, 98, 92, 97, 96, 99, 100], // Dummy data
                        borderColor: '#4f46e5',
                        tension: 0.1
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
        
        if (passRateChartRef.current) {
             const subjectPassRates = allData.subjects.map(subject => {
                const scoresForSubject = allData.scores.filter(s => s.subjectId === subject.id);
                if (scoresForSubject.length === 0) return { name: subject.name, rate: 0 };
                const passes = scoresForSubject.filter(s => ((s.ca1||0)+(s.ca2||0)+(s.exam||0)) > 40).length;
                return { name: subject.name, rate: (passes / scoresForSubject.length) * 100 };
            }).slice(0, 5);

            chartInstances.current.passRate = new window.Chart(passRateChartRef.current, {
                type: 'bar',
                data: {
                    labels: subjectPassRates.map(s => s.name),
                    datasets: [{
                        label: 'Pass Rate (%)',
                        data: subjectPassRates.map(s => s.rate),
                        backgroundColor: '#4f46e5'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
            });
        }
    }, [loading, allData]);

    const handleGenerateHealthReport = async () => {
        setIsAnalyzing(true);
        setAiAnalysis('');
        try {
            const prompt = `
                Analyze the following school data for the current term and provide an "Academic Health Report".
                - Overall Pass Rate: ${stats.passRate}%
                - Overall Attendance Rate: ${stats.attendanceRate}%
                
                Based on these high-level stats, provide:
                1. A brief, overall assessment (1-2 sentences).
                2. Two potential areas of concern if any metric is below 90%.
                3. Two actionable suggestions for improvement.
                
                Format as a concise report.
            `;
            const result = await generateText(prompt);
            setAiAnalysis(result);
        } catch (error) {
            setAiAnalysis(`Error generating report: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        {/* Fix: Added trend={null} to satisfy required prop error. */}
                        <StatCard title="Overall Pass Rate" value={`${stats.passRate}%`} icon={<CheckBadgeIcon className="w-6 h-6"/>} trend={null} />
                        <StatCard title="Attendance Rate" value={`${stats.attendanceRate}%`} icon={<UsersIcon className="w-6 h-6"/>} trend={null} />
                        <StatCard title="At-Risk Students" value={stats.atRisk} icon={<ShieldExclamationIcon className="w-6 h-6"/>} trend={null} />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 card">
                    <div className="p-6">
                        <h3 className="font-semibold">Academic Health Report (AI)</h3>
                        <div className="p-4 mt-2 bg-gray-50 rounded-lg min-h-[200px] flex flex-col justify-center">
                            {isAnalyzing && <div className="text-center"><SpinnerIcon className="w-8 h-8 mx-auto animate-spin text-indigo-500"/><p className="mt-2 text-sm text-gray-500">Analyzing school data...</p></div>}
                            {!isAnalyzing && aiAnalysis && <pre className="text-sm whitespace-pre-wrap font-sans">{aiAnalysis}</pre>}
                            {!isAnalyzing && !aiAnalysis && (
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">Click the button to get AI-powered insights and suggestions for your school.</p>
                                    <button onClick={handleGenerateHealthReport} className="btn btn-primary mt-4">
                                        <SparklesIcon className="w-5 h-5 mr-2" />
                                        Generate Report
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 card">
                    <div className="p-6">
                        <h3 className="font-semibold">Attendance Trend (Last 7 Days)</h3>
                        <div className="h-48 mt-2 relative"><canvas ref={attendanceChartRef}></canvas></div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="p-6">
                    <h3 className="font-semibold">Subject Pass Rates</h3>
                    <div className="h-64 mt-2 relative"><canvas ref={passRateChartRef}></canvas></div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalyticsDashboard;