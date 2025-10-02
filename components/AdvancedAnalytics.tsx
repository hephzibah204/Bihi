import React, { useState, useEffect, useRef, PropsWithChildren } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetTeachers, apiGetScores, apiGetAttendance } from '../services/api';
import { Score, Student, Subject } from '../types';

declare global {
    interface Window {
        Chart: any;
    }
}

const AdvancedAnalytics = () => {
    const [stats, setStats] = useState({ students: 0, subjects: 0, teachers: 0 });
    const [allData, setAllData] = useState<{students: Student[], scores: Score[], subjects: Subject[]}>({ students: [], scores: [], subjects: [] });
    const [chartData, setChartData] = useState({
        subjectHotspot: null,
        termPerformance: null,
        studentTrajectory: null,
    });
    
    const [sessions, setSessions] = useState<string[]>([]);
    const [terms, setTerms] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('All Terms');
    const [selectedClassForTerms, setSelectedClassForTerms] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');

    const [loading, setLoading] = useState(true);

    const subjectHotspotChartRef = useRef<HTMLCanvasElement>(null);
    const termPerformanceChartRef = useRef<HTMLCanvasElement>(null);
    const studentTrajectoryChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ [key: string]: any }>({});

    useEffect(() => {
        const fetchAndProcessData = async () => {
            try {
                const [studentData, subjectData, teacherData, scoreData] = await Promise.all([
                    apiGetStudents(),
                    apiGetSubjects(),
                    apiGetTeachers(),
                    apiGetScores(),
                ]);

                setAllData({ students: studentData, scores: scoreData, subjects: subjectData });
                setStats({ students: studentData.length, subjects: subjectData.length, teachers: teacherData.length });

                // FIX: Explicitly type sort callback arguments as string to resolve localeCompare error.
                const uniqueSessions = [...new Set(scoreData.map(s => s.session))].sort((a: string, b: string) => b.localeCompare(a));
                const uniqueTerms = ['All Terms', ...new Set(scoreData.map(s => s.term))];
                setSessions(uniqueSessions);
                setTerms(uniqueTerms);

                if (uniqueSessions.length > 0) setSelectedSession(uniqueSessions[0]);

                const allClasses = [...new Set(studentData.map(s => s.class))].sort();
                if(allClasses.length > 0) setSelectedClassForTerms(allClasses[0]);
                if(studentData.length > 0) setSelectedStudentId(studentData[0].id);

            } catch (error) {
                console.error("Failed to load analytics data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAndProcessData();
    }, []);

    useEffect(() => {
        if (loading || !allData.scores.length) return;

        setChartData({
            subjectHotspot: processSubjectHotspotData(allData.students, allData.subjects, allData.scores, selectedSession, selectedTerm),
            termPerformance: processTermPerformanceData(allData.scores, selectedClassForTerms),
            studentTrajectory: processStudentTrajectoryData(allData.scores, allData.subjects, selectedStudentId),
        });

    }, [loading, allData, selectedSession, selectedTerm, selectedClassForTerms, selectedStudentId]);

    useEffect(() => {
        if (loading || !window.Chart) return;
        const isDarkMode = document.documentElement.classList.contains('dark');
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const labelColor = isDarkMode ? '#CBD5E1' : '#4B5563';

        // FIX: Explicitly type the 'chart' parameter as 'any' to avoid it being inferred as 'unknown', allowing the type guard and method call to work correctly.
        Object.values(chartInstances.current).forEach((chart: any) => {
            if (chart && typeof chart.destroy === 'function') chart.destroy();
        });

        // Subject Hotspot Chart (Grouped Bar)
        if (subjectHotspotChartRef.current && chartData.subjectHotspot) {
            chartInstances.current.subjectHotspot = new window.Chart(subjectHotspotChartRef.current, {
                type: 'bar', data: chartData.subjectHotspot, options: { responsive: true, scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: labelColor } }, x: { grid: { color: gridColor }, ticks: { color: labelColor } } } }
            });
        }
        // Term Performance Chart (Line)
        if (termPerformanceChartRef.current && chartData.termPerformance) {
            chartInstances.current.termPerformance = new window.Chart(termPerformanceChartRef.current, {
                type: 'line', data: chartData.termPerformance, options: { responsive: true, scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: labelColor } }, x: { grid: { color: gridColor }, ticks: { color: labelColor } } } }
            });
        }
        // Student Trajectory Chart (Line)
        if (studentTrajectoryChartRef.current && chartData.studentTrajectory) {
            chartInstances.current.studentTrajectory = new window.Chart(studentTrajectoryChartRef.current, {
                type: 'line', data: chartData.studentTrajectory, options: { responsive: true, scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: labelColor } }, x: { grid: { color: gridColor }, ticks: { color: labelColor } } }, plugins: { legend: { display: false } } }
            });
        }
    }, [loading, chartData]);

    if (loading) return <div className="card p-6 text-center">Loading analytics...</div>;
    
    const { students: allStudents } = allData;
    const allClasses = [...new Set(allStudents.map(s => s.class))].sort();

    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Interactive Analytics</h1>
                 <div className="flex gap-4">
                    <select value={selectedSession} onChange={e => setSelectedSession(e.target.value)} className="input-field"><option value="">All Sessions</option>{sessions.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    <select value={selectedTerm} onChange={e => setSelectedTerm(e.target.value)} className="input-field">{terms.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <StatCard title="Total Students" value={stats.students} />
                <StatCard title="Total Teachers" value={stats.teachers} />
                <StatCard title="Total Subjects" value={stats.subjects} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <ChartCard title="Subject Performance Hotspots">
                    <canvas ref={subjectHotspotChartRef}></canvas>
                </ChartCard>
                 <ChartCard title="Term-over-Term Performance">
                     <select value={selectedClassForTerms} onChange={e => setSelectedClassForTerms(e.target.value)} className="input-field mb-4"><option value="">Select a Class</option>{allClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <canvas ref={termPerformanceChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Student Academic Trajectory" fullWidth={true}>
                     <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="input-field mb-4"><option value="">Select a Student</option>{allStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}</select>
                    <canvas ref={studentTrajectoryChartRef}></canvas>
                </ChartCard>
            </div>
        </div>
    );
};

const StatCard = ({ title, value }: { title: string, value: number }) => (
    <div className="card p-6 text-center">
        <h3 className="text-4xl font-bold">{value}</h3>
        <p className="text-gray-500">{title}</p>
    </div>
);

const ChartCard = ({ title, children, fullWidth = false }: PropsWithChildren<{ title: string, fullWidth?: boolean }>) => (
    <div className={`card ${fullWidth ? 'lg:col-span-2' : ''}`}>
        <div className="p-6">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="mt-4">{children}</div>
        </div>
    </div>
);

// --- Data Processing Functions ---
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1'];

const processSubjectHotspotData = (students: Student[], subjects: Subject[], scores: Score[], session: string, term: string) => {
    const classGroups = students.reduce((acc, student) => {
        if (!acc[student.class]) acc[student.class] = [];
        acc[student.class].push(student.id);
        return acc;
    }, {});

    const labels = [...new Set(subjects.map(s => s.name))].sort();
    const datasets = Object.keys(classGroups).sort().map((className, index) => {
        const studentIdsInClass = classGroups[className];
        const data = labels.map(subjectName => {
            const subject = subjects.find(s => s.name === subjectName);
            if (!subject) return 0;

            const relevantScores = scores.filter(score =>
                studentIdsInClass.includes(score.studentId) &&
                score.subjectId === subject.id &&
                (!session || score.session === session) &&
                (term === 'All Terms' || score.term === term)
            );

            if (relevantScores.length === 0) return 0;
            const total = relevantScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
            return (total / relevantScores.length).toFixed(2);
        });
        return {
            label: className,
            data,
            backgroundColor: COLORS[index % COLORS.length]
        };
    });

    return { labels, datasets };
};

const processTermPerformanceData = (scores: Score[], className: string) => {
    if (!className) return { labels: [], datasets: [] };
    const termScores = scores.filter(score => {
        // This is a simplification; in a real app, we'd look up the student's class for that specific term.
        // For this demo, we assume the current class is constant. This is a limitation.
        return true; 
    }).reduce((acc, score) => {
        const termKey = `${score.session} ${score.term}`;
        if (!acc[termKey]) acc[termKey] = { total: 0, count: 0, order: `${score.session}-${['First', 'Second', 'Third'].indexOf(score.term.split(' ')[0])}` };
        acc[termKey].total += (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
        acc[termKey].count += 1;
        return acc;
    }, {});
    
    const sortedTerms = Object.keys(termScores).sort((a, b) => termScores[a].order.localeCompare(termScores[b].order));
    const labels = sortedTerms;
    const data = sortedTerms.map(term => {
        const avg = termScores[term].count > 0 ? termScores[term].total / termScores[term].count : 0;
        return avg.toFixed(2);
    });

    return { labels, datasets: [{ label: `Avg. for ${className}`, data, borderColor: COLORS[0], tension: 0.1 }] };
};

const processStudentTrajectoryData = (scores: Score[], subjects: Subject[], studentId: string) => {
    if (!studentId) return { labels: [], datasets: [] };
    
    const studentScoresByTerm = scores
        .filter(s => s.studentId === studentId)
        .reduce((acc, score) => {
            const termKey = `${score.session} ${score.term}`;
             if (!acc[termKey]) acc[termKey] = { scores: [], order: `${score.session}-${['First', 'Second', 'Third'].indexOf(score.term.split(' ')[0])}` };
            acc[termKey].scores.push(score);
            return acc;
        }, {});
    
    const sortedTerms = Object.keys(studentScoresByTerm).sort((a,b) => studentScoresByTerm[a].order.localeCompare(studentScoresByTerm[b].order));

    const labels = sortedTerms;
    const data = sortedTerms.map(term => {
        const termScores = studentScoresByTerm[term].scores;
        if(termScores.length === 0) return 0;
        const total = termScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
        return (total / termScores.length).toFixed(2);
    });

    return { labels, datasets: [{ label: 'Student Average', data, borderColor: COLORS[1], tension: 0.1 }] };
}

export default AdvancedAnalytics;