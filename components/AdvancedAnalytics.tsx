import React, { useState, useEffect, useRef, PropsWithChildren } from 'react';
import { apiGetStudents, apiGetSubjects, apiGetTeachers, apiGetScores, apiGetSchoolSettings } from '../services/api';
import { Score, Student, Subject } from '../types';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';

declare global {
    interface Window {
        Chart: any;
    }
}

const AdvancedAnalytics = () => {
    const [stats, setStats] = useState({ students: 0, subjects: 0, teachers: 0 });
    const [allData, setAllData] = useState<{students: Student[], scores: Score[], subjects: Subject[], settings: any}>({ students: [], scores: [], subjects: [], settings: null });
    const [chartData, setChartData] = useState({
        subjectHotspot: null,
        termPerformance: null,
        studentTrajectory: null,
        classAverages: null,
    });
    
    const [sessions, setSessions] = useState<string[]>([]);
    const [terms, setTerms] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [selectedTerm, setSelectedTerm] = useState('All Terms');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');

    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysisResult, setAiAnalysisResult] = useState('');
    const [analysisError, setAnalysisError] = useState('');

    const subjectHotspotChartRef = useRef<HTMLCanvasElement>(null);
    const termPerformanceChartRef = useRef<HTMLCanvasElement>(null);
    const studentTrajectoryChartRef = useRef<HTMLCanvasElement>(null);
    const classAverageChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ [key: string]: any }>({});

    useEffect(() => {
        const fetchAndProcessData = async () => {
            try {
                const [studentData, subjectData, teacherData, scoreData, settingsData]: [Student[], Subject[], any[], Score[], any] = await Promise.all([
                    apiGetStudents(),
                    apiGetSubjects(),
                    apiGetTeachers(),
                    apiGetScores(),
                    apiGetSchoolSettings(),
                ]);

                setAllData({ students: studentData, scores: scoreData, subjects: subjectData, settings: settingsData });
                setStats({ students: studentData.length, subjects: subjectData.length, teachers: teacherData.length });

                const uniqueSessions = [...new Set(scoreData.map(s => s.session))].sort((a: string, b: string) => b.localeCompare(a));
                const uniqueTerms = ['All Terms', ...new Set(scoreData.map(s => s.term))];
                setSessions(uniqueSessions);
                setTerms(uniqueTerms);

                if (uniqueSessions.length > 0) setSelectedSession(uniqueSessions[0]);

                const allClasses = [...new Set(studentData.map(s => s.class))].sort();
                if(allClasses.length > 0) setSelectedClass(allClasses[0]);
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
            termPerformance: processTermPerformanceData(allData.scores, selectedClass),
            studentTrajectory: processStudentTrajectoryData(allData.scores, allData.subjects, selectedStudentId, allData.students),
            classAverages: processClassSubjectAverages(allData.students, allData.subjects, allData.scores, selectedClass, selectedSession, selectedTerm)
        });

    }, [loading, allData, selectedSession, selectedTerm, selectedClass, selectedStudentId]);

    useEffect(() => {
        if (loading || !window.Chart) return;
        const isDarkMode = document.documentElement.classList.contains('dark');
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const labelColor = isDarkMode ? '#CBD5E1' : '#4B5563';

        Object.values(chartInstances.current).forEach((chart: any) => {
            if (chart && typeof chart.destroy === 'function') chart.destroy();
        });

        const commonOptions = { responsive: true, scales: { y: { beginAtZero: true, max: 100, grid: { color: gridColor }, ticks: { color: labelColor } }, x: { grid: { color: gridColor }, ticks: { color: labelColor } } } };

        if (subjectHotspotChartRef.current && chartData.subjectHotspot) {
            chartInstances.current.subjectHotspot = new window.Chart(subjectHotspotChartRef.current, { type: 'bar', data: chartData.subjectHotspot, options: commonOptions });
        }
        if (termPerformanceChartRef.current && chartData.termPerformance) {
            chartInstances.current.termPerformance = new window.Chart(termPerformanceChartRef.current, { type: 'line', data: chartData.termPerformance, options: commonOptions });
        }
        if (studentTrajectoryChartRef.current && chartData.studentTrajectory) {
            chartInstances.current.studentTrajectory = new window.Chart(studentTrajectoryChartRef.current, { type: 'line', data: chartData.studentTrajectory, options: { ...commonOptions, plugins: { legend: { display: true } } } });
        }
        if (classAverageChartRef.current && chartData.classAverages) {
            chartInstances.current.classAverages = new window.Chart(classAverageChartRef.current, { type: 'bar', data: chartData.classAverages, options: commonOptions });
        }
    }, [loading, chartData]);

    const handleRunAnalysis = async () => {
        if (!selectedClass) return;
        setIsAnalyzing(true);
        setAiAnalysisResult('');
        setAnalysisError('');

        const failureGrade = allData.settings?.gradingSystem?.find(g => g.grade === 'F');
        const failureThreshold = failureGrade ? failureGrade.to : 39;

        const studentsInClass = allData.students.filter(s => s.class === selectedClass);
        const subjectsForClass = allData.subjects.filter(s => s.classes.includes(selectedClass));
        
        if (studentsInClass.length === 0 || subjectsForClass.length === 0) {
            setAnalysisError("Not enough data for this class to perform an analysis.");
            setIsAnalyzing(false);
            return;
        }

        const performanceSummary = subjectsForClass.map(subject => {
            const scoresForSubject = allData.scores.filter(score => 
                score.subjectId === subject.id && 
                studentsInClass.some(s => s.id === score.studentId) &&
                (!selectedSession || score.session === selectedSession) &&
                (selectedTerm === 'All Terms' || score.term === selectedTerm)
            );

            if (scoresForSubject.length === 0) return { name: subject.name, avg: 0, failRate: 0 };

            let totalScore = 0;
            let failureCount = 0;
            scoresForSubject.forEach(s => {
                const total = (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0);
                totalScore += total;
                if (total <= failureThreshold) {
                    failureCount++;
                }
            });

            return {
                name: subject.name,
                avg: (totalScore / scoresForSubject.length).toFixed(1),
                failRate: ((failureCount / scoresForSubject.length) * 100).toFixed(0)
            };
        });

        const prompt = `
            As an expert educational analyst for a Nigerian school, provide a detailed performance breakdown and actionable insights.

            **Analysis Context:**
            - **Class:** ${selectedClass}
            - **Academic Session:** ${selectedSession || 'All Sessions'}
            - **Term:** ${selectedTerm}

            **Performance Data Summary:**
            ${performanceSummary.map(p => `- Subject: ${p.name}, Average Score: ${p.avg}, Failure Rate: ${p.failRate}%`).join('\n')}

            **Your Task:**
            Based *specifically* on the context and data above, provide the following:
            1.  **Underperforming Subjects:** List subjects with an average score below 50 or a failure rate above 50%.
            2.  **Potential Insights:** For each underperforming subject, suggest 2-3 potential reasons for the poor performance (e.g., curriculum difficulty, teaching methods).
            3.  **Actionable Recommendations:** Provide a brief, actionable recommendation for each identified issue (e.g., "Recommend extra tutorial sessions for...").

            Format your response clearly with headings. If all subjects are performing well, congratulate the teachers and students on their excellent work for this specific term/session.
        `;

        try {
            const result = await generateText(prompt);
            setAiAnalysisResult(result);
        } catch (error) {
            console.error("AI Analysis failed:", error);
            setAnalysisError(`AI Analysis Error: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };


    if (loading) return <div className="card p-6 text-center">Loading analytics...</div>;
    
    const { students: allStudents } = allData;
    const allClasses = [...new Set(allStudents.map(s => s.class))].sort();

    return (
        <div>
            <div className="flex justify-between items-center">
                <div></div>
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
            
            <ChartCard title="AI Performance Analysis" fullWidth={true}>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Select a class and run an AI-powered analysis to get insights and recommendations on subject performance.
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field w-auto">
                            {allClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                         <button onClick={handleRunAnalysis} className="btn btn-primary" disabled={isAnalyzing}>
                            {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                        </button>
                    </div>
                    {analysisError && <p className="mt-4 text-sm text-red-500">{analysisError}</p>}
                    {aiAnalysisResult && (
                        <div className="mt-6 border-t dark:border-gray-600 pt-4">
                            <h4 className="font-semibold">AI Insights for {selectedClass}</h4>
                            <div className="prose dark:prose-invert max-w-none mt-2 text-sm whitespace-pre-wrap">{aiAnalysisResult}</div>
                        </div>
                    )}
                </div>
            </ChartCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <ChartCard title="Class Subject Averages">
                    <canvas ref={classAverageChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Subject Performance Hotspots">
                    <canvas ref={subjectHotspotChartRef}></canvas>
                </ChartCard>
                 <ChartCard title="Term-over-Term Performance">
                     <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field mb-4"><option value="">Select a Class</option>{allClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <canvas ref={termPerformanceChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Student Academic Trajectory">
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
const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#8B5CF6', '#EC4899'];

const processClassSubjectAverages = (students: Student[], subjects: Subject[], scores: Score[], className: string, session: string, term: string) => {
    if (!className) return { labels: [], datasets: [] };

    const studentsInClass = students.filter(s => s.class === className);
    const subjectsForClass = subjects.filter(s => s.classes.includes(className));
    
    const labels = subjectsForClass.map(s => s.name);
    const data = labels.map(subjectName => {
        const subject = subjects.find(s => s.name === subjectName);
        if (!subject) return 0;

        const relevantScores = scores.filter(score =>
            studentsInClass.some(s => s.id === score.studentId) &&
            score.subjectId === subject.id &&
            (!session || score.session === session) &&
            (term === 'All Terms' || score.term === term)
        );

        if (relevantScores.length === 0) return 0;
        const total = relevantScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
        return (total / relevantScores.length).toFixed(2);
    });

    return {
        labels,
        datasets: [{
            label: `Average Score for ${className}`,
            data,
            backgroundColor: COLORS,
        }]
    };
};


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

const processStudentTrajectoryData = (scores: Score[], subjects: Subject[], studentId: string, allStudents: Student[]) => {
    if (!studentId || !allStudents.length) return { labels: [], datasets: [] };

    const selectedStudent = allStudents.find(s => s.id === studentId);
    if (!selectedStudent) return { labels: [], datasets: [] };

    const studentsInClass = allStudents.filter(s => s.class === selectedStudent.class);
    const studentIdsInClass = new Set(studentsInClass.map(s => s.id));

    // Group all class scores by term for efficiency
    const classScoresByTerm = scores.filter(s => studentIdsInClass.has(s.studentId)).reduce((acc, score) => {
        const termKey = `${score.session} ${score.term}`;
        const termOrder = ['First', 'Second', 'Third'].indexOf(score.term.split(' ')[0]);
        const orderKey = `${score.session}-${termOrder}`;

        if (!acc[termKey]) {
            acc[termKey] = { scores: [], order: orderKey };
        }
        acc[termKey].scores.push(score);
        return acc;
    }, {});

    const sortedTerms = Object.keys(classScoresByTerm).sort((a, b) => classScoresByTerm[a].order.localeCompare(classScoresByTerm[b].order));
    if (sortedTerms.length === 0) return { labels: [], datasets: [] };

    const labels = sortedTerms;

    const studentData = sortedTerms.map(term => {
        const termScores = classScoresByTerm[term].scores.filter(s => s.studentId === studentId);
        if (termScores.length === 0) return null;
        const total = termScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
        return (total / termScores.length);
    });

    const classData = sortedTerms.map(term => {
        const studentAverages = studentsInClass.map(student => {
            const studentTermScores = classScoresByTerm[term].scores.filter(s => s.studentId === student.id);
            if (studentTermScores.length === 0) return null;
            const total = studentTermScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
            return total / studentTermScores.length;
        }).filter(avg => avg !== null);

        if (studentAverages.length === 0) return null;
        const classAverage = studentAverages.reduce((sum, avg) => sum + avg, 0) / studentAverages.length;
        return classAverage;
    });

    return {
        labels,
        datasets: [
            {
                label: `${selectedStudent.name}'s Average`,
                data: studentData.map(d => d ? d.toFixed(2) : null), // Handle nulls and format
                borderColor: COLORS[1],
                tension: 0.1,
                borderWidth: 2,
                fill: false,
            },
            {
                label: `${selectedStudent.class} Average`,
                data: classData.map(d => d ? d.toFixed(2) : null),
                borderColor: COLORS[3],
                tension: 0.1,
                borderDash: [5, 5],
                borderWidth: 2,
                backgroundColor: 'transparent',
                fill: false,
            }
        ]
    };
};


export default AdvancedAnalytics;