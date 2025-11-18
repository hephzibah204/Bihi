

import React, { useState, useEffect, useRef, PropsWithChildren } from 'react';
// Fix: Add missing imports
import { apiGetStudents, apiGetScores, apiGetAttendance, apiGetSchoolSettings, apiGetSubjects, apiGetTeachers, apiGetTimetableData, apiGetPayments, apiGetInvoices, apiSendMessage } from '../services/api';
import { useAI } from '../hooks/useAI';
import { generateResponse as aiGenerateResponse } from '../services/geminiAIService';
import { Score, Student, Subject } from '../types';
import { downloadElementAsPdf, sanitizeFilename } from '../utils/pdfUtils';
import { exportToCSV } from '../utils/csvExporter';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { USER_ROLES } from '../utils/constants';
import UsersIcon from './icons/UsersIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import BookOpenIcon from './icons/BookOpenIcon';

declare global {
    interface Window {
        Chart: any;
    }
}

const AdminAnalyticsDashboard = () => {
    // State for visual dashboards
    const [stats, setStats] = useState({ students: 0, subjects: 0, teachers: 0 });
    const [allData, setAllData] = useState<{students: Student[], scores: Score[], subjects: Subject[], settings: any, teachers: any[]}>({ students: [], scores: [], subjects: [], settings: null, teachers: [] });
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
    const [selectedClassForCharts, setSelectedClassForCharts] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [loading, setLoading] = useState(true);
    const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'termly' | 'yearly'>('termly');
    const [reportDate, setReportDate] = useState<string>('');
    const [weekStartDate, setWeekStartDate] = useState<string>('');
    const [reportSummary, setReportSummary] = useState<{ period: string; session: string; term: string; studentCount: number; averageScore: number; attendanceRate: number; totalCollected: number; outstanding: number; topClasses: { className: string; average: number }[] } | null>(null);

    // State for new School-Wide AI Analyst
    const { generateResponse, status } = useAI();
    const [aiQuery, setAiQuery] = useState('');
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
                // Fix: Add apiGetTeachers to Promise.all
                const [studentData, subjectData, teacherData, scoreData, settingsData]: [Student[], Subject[], any[], Score[], any] = await Promise.all([
                    apiGetStudents(),
                    apiGetSubjects(),
                    apiGetTeachers(),
                    apiGetScores(),
                    apiGetSchoolSettings(),
                ]);

                setAllData({ students: studentData, scores: scoreData, subjects: subjectData, settings: settingsData, teachers: teacherData });
                setStats({ students: studentData.length, subjects: subjectData.length, teachers: teacherData.length });

                const uniqueSessions = [...new Set(scoreData.map(s => s.session))].sort((a: string, b: string) => b.localeCompare(a));
                const uniqueTerms = ['All Terms', ...new Set(scoreData.map(s => s.term))];
                setSessions(uniqueSessions);
                setTerms(uniqueTerms);

                if (uniqueSessions.length > 0) setSelectedSession(uniqueSessions[0]);

                const allClasses = [...new Set(studentData.map(s => s.class))].sort();
                if(allClasses.length > 0) setSelectedClassForCharts(allClasses[0]);
                // FIX: Corrected typo from setSelectedStudent to setSelectedStudentId.
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
            termPerformance: processTermPerformanceData(allData.scores, selectedClassForCharts),
            studentTrajectory: processStudentTrajectoryData(allData.scores, allData.subjects, selectedStudentId, allData.students),
            classAverages: processClassSubjectAverages(allData.students, allData.subjects, allData.scores, selectedClassForCharts, selectedSession, selectedTerm)
        });

    }, [loading, allData, selectedSession, selectedTerm, selectedClassForCharts, selectedStudentId]);

    useEffect(() => {
        if (loading || !window.Chart) return;
        const gridColor = 'rgba(0, 0, 0, 0.1)';
        const labelColor = '#4B5563';

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

    const computeDateRange = () => {
        const now = new Date();
        if (reportPeriod === 'daily') {
            const d = reportDate ? new Date(reportDate) : now;
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
            return { start, end };
        }
        if (reportPeriod === 'weekly') {
            const d = weekStartDate ? new Date(weekStartDate) : now;
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            end.setHours(23, 59, 59, 999);
            return { start, end };
        }
        if (reportPeriod === 'termly') {
            return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59) };
        }
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31, 23, 59, 59) };
    };

    const filterByDate = (iso?: string, range?: { start: Date; end: Date }) => {
        if (!iso) return false;
        const d = new Date(iso);
        return d >= (range?.start || new Date(0)) && d <= (range?.end || new Date(8640000000000000));
    };

    const summarizePerformance = async () => {
        const range = computeDateRange();
        const [payments, invoices] = await Promise.all([apiGetPayments(), apiGetInvoices()]);
        const attendance = await apiGetAttendance();
        const students = allData.students;
        const scores = allData.scores;
        const settings = allData.settings;

        const relevantAttendance = attendance.filter(a => filterByDate(a.date, range));
        let present = 0, totalMarked = 0;
        relevantAttendance.forEach(rec => {
            Object.values(rec.statuses || {}).forEach(s => {
                totalMarked += 1;
                if (String(s).toLowerCase() === 'present') present += 1;
            });
        });
        const attendanceRate = totalMarked > 0 ? ((present / totalMarked) * 100) : 0;

        const currentSessionSel = selectedSession || settings?.session || '';
        const selectedTermEffective = selectedTerm === 'All Terms' ? '' : (selectedTerm || settings?.term || '');
        const sessionScores = scores.filter(s => (!currentSessionSel || s.session === currentSessionSel) && (!selectedTermEffective || s.term === selectedTermEffective));
        const overallAvg = sessionScores.length > 0 ? (
            sessionScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0) / sessionScores.length
        ) : 0;

        const classList = [...new Set(students.map(s => s.class))];
        const classAverages = classList.map(cls => {
            const ids = new Set(students.filter(s => s.class === cls).map(s => s.id));
            const clsScores = sessionScores.filter(s => ids.has(s.studentId));
            const avg = clsScores.length > 0 ? (
                clsScores.reduce((sum, sc) => sum + (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0), 0) / clsScores.length
            ) : 0;
            return { className: cls, average: Number(avg.toFixed(2)) };
        }).sort((a, b) => b.average - a.average);

        const topClasses = classAverages.slice(0, 3);

        const relevantPayments = payments.filter(p => filterByDate(p.paymentDate, range));
        const totalCollected = relevantPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const outstanding = invoices.reduce((sum, inv) => sum + Math.max((inv.totalAmount || 0) - (inv.amountPaid || 0), 0), 0);

        return {
            period: reportPeriod,
            session: currentSessionSel,
            term: selectedTermEffective || 'All Terms',
            studentCount: students.length,
            averageScore: Number(overallAvg.toFixed(2)),
            attendanceRate: Number(attendanceRate.toFixed(2)),
            totalCollected,
            outstanding,
            topClasses
        };
    };

    const downloadReportPdf = async () => {
        await downloadElementAsPdf('#school-performance-report', sanitizeFilename(`School_Performance_${reportPeriod}`));
    };

    const downloadReportCsv = async () => {
        const summary = await summarizePerformance();
        const rows: any[] = [
            { Metric: 'Period', Value: summary.period },
            { Metric: 'Session', Value: summary.session },
            { Metric: 'Term', Value: summary.term },
            { Metric: 'Students', Value: summary.studentCount },
            { Metric: 'Average Score', Value: summary.averageScore },
            { Metric: 'Attendance Rate (%)', Value: summary.attendanceRate },
            { Metric: 'Total Collected', Value: summary.totalCollected },
            { Metric: 'Outstanding Fees', Value: summary.outstanding },
        ];
        summary.topClasses.forEach((c, idx) => rows.push({ Metric: `Top Class ${idx + 1}`, Value: `${c.className} (${c.average})` }));
        exportToCSV(rows, `School_Performance_${reportPeriod}.csv`);
    };

    const sendReportEmail = async () => {
        const summary = await summarizePerformance();
        const recipients: string[] = [];
        const adminEmails = (allData.teachers || []).filter(t => String(t.role) === 'Admin').map(t => t.email).filter(Boolean);
        recipients.push(...adminEmails);
        const schoolEmail = allData.settings?.email ? [allData.settings.email] : [];
        recipients.push(...schoolEmail);
        const content = [
            `Subject: School Performance (${summary.period})`,
            `Session: ${summary.session} | Term: ${summary.term}`,
            `Students: ${summary.studentCount}`,
            `Average Score: ${summary.averageScore.toFixed(2)}`,
            `Attendance Rate: ${summary.attendanceRate.toFixed(2)}%`,
            `Total Collected: ₦${summary.totalCollected.toLocaleString()}`,
            `Outstanding Fees: ₦${summary.outstanding.toLocaleString()}`,
            `Top Classes: ${summary.topClasses.map(c => `${c.className} (${c.average})`).join(', ')}`
        ].join('\n');
        await apiSendMessage({ channel: 'email', content, recipients: recipients.length ? recipients : ['all'], type: 'announcement' });
    };

    useEffect(() => {
        const init = async () => {
            const s = await summarizePerformance();
            setReportSummary(s);
        };
        if (!loading) init();
    }, [loading, reportPeriod, reportDate, weekStartDate, selectedSession, selectedTerm]);

    const handleSchoolWideAnalysis = async () => {
        if (!aiQuery.trim()) return;
        setIsAnalyzing(true);
        setAiAnalysisResult('');
        setAnalysisError('');
    
        try {
            // Step 1: Fetch all necessary data in parallel
            // Fix: add apiGetTeachers and apiGetTimetableData
            const [
                allStudents,
                allScores,
                allSubjects,
                allTeachers,
                timetable,
                settings
            ] = await Promise.all([
                apiGetStudents(),
                apiGetScores(), // Fetches all scores
                apiGetSubjects(),
                apiGetTeachers(),
                apiGetTimetableData(),
                apiGetSchoolSettings()
            ]);
    
            // Step 2: Create a summarized context for the prompt
            const studentSummary = allStudents.map(s => ({ id: s.id, name: s.name, class: s.class }));
            const scoreSummary = allScores.map(s => ({
                studentId: s.studentId,
                subjectId: s.subjectId,
                session: s.session,
                term: s.term,
                total: (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0)
            }));
            const subjectSummary = allSubjects.map(s => ({ id: s.id, name: s.name }));
            const teacherSummary = allTeachers.map(t => ({ id: t.id, name: t.name }));
    
            const contextForAI = {
                gradingSystem: settings.gradingSystem,
                teachers: teacherSummary,
                subjects: subjectSummary,
                students: studentSummary,
                scores: scoreSummary,
                timetable: timetable,
            };
    
            const prompt = `
                You are a highly advanced data analyst for a Nigerian secondary school. Your task is to provide deep insights based on the user's question by analyzing the provided school data.

                **INSTRUCTIONS:**
                1.  Analyze the JSON data below to answer the user's question.
                2.  Provide a concise, clear summary as your primary answer.
                3.  If the query asks for a list, comparison, or trend, YOU MUST format the detailed data in a MARKDOWN TABLE.
                4.  Be aware of different academic sessions and terms to analyze trends correctly.
                5.  Use the timetable data to link teachers to subjects and classes for performance analysis.

                **AVAILABLE DATA (JSON):**
                ${JSON.stringify(contextForAI)}

                ---

                **USER'S QUESTION:**
                "${aiQuery}"

                ---

                **YOUR ANALYSIS:**
            `;
            
            const result = await aiGenerateResponse(prompt);
            setAiAnalysisResult(String(result));
    
        } catch (error) {
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
            <div className="card mb-6">
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-semibold">School Performance Report</h2>
                            <p className="text-gray-500 mt-1">Download or send daily, weekly, termly and yearly summaries.</p>
                        </div>
                        <div className="flex gap-2">
                            <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value as any)} className="input-field">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="termly">Termly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                            {reportPeriod === 'daily' && (
                                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="input-field" />
                            )}
                            {reportPeriod === 'weekly' && (
                                <input type="date" value={weekStartDate} onChange={e => setWeekStartDate(e.target.value)} className="input-field" />
                            )}
                        </div>
                    </div>
                    <div id="school-performance-report" className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="Students" value={stats.students} />
                        <StatCard title="Average Score (session/term)" value={(() => {
                            const s = selectedSession || allData.settings?.session || '';
                            const t = selectedTerm === 'All Terms' ? '' : (selectedTerm || allData.settings?.term || '');
                            const sc = allData.scores.filter(v => (!s || v.session === s) && (!t || v.term === t));
                            if (!sc.length) return '0';
                            const avg = sc.reduce((sum, v) => sum + (v.ca1 || 0) + (v.ca2 || 0) + (v.exam || 0), 0) / sc.length;
                            return Number(avg.toFixed(2));
                        })()} />
                        <StatCard title="Attendance Rate" value={reportSummary ? `${reportSummary.attendanceRate.toFixed(2)}%` : '...'} />
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <button className="btn-outline" onClick={downloadReportCsv}>Export CSV</button>
                        <button className="btn-outline" onClick={downloadReportPdf}>Download PDF</button>
                        <button className="btn" onClick={sendReportEmail}>Send Email</button>
                    </div>
                </div>
            </div>
            <div className="card mb-6">
                <div className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-semibold">School-Wide AI Analyst</h2>
                            <p className="text-gray-500 mt-1">Ask complex questions about performance across classes, sessions, and teachers.</p>
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                            <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            {status === 'gemini' ? 'Online' : 'Offline'}
                        </div>
                    </div>
                    
                    <div className="mt-4">
                        <textarea 
                            className="input-field w-full"
                            rows={3}
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            placeholder="e.g., Who are the top 3 teachers in JSS classes based on student average scores this session?"
                        />
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                        <strong>Examples:</strong> "Compare JSS 1 and JSS 2 performance in Mathematics this term." or "Show the performance trend for SSS 1 English over the last 2 sessions."
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button onClick={handleSchoolWideAnalysis} className="btn btn-primary" disabled={isAnalyzing}>
                            {isAnalyzing ? <SpinnerIcon className="w-5 h-5 animate-spin mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                        </button>
                    </div>

                    {(aiAnalysisResult || analysisError) && (
                        <div className="mt-6 border-t pt-4">
                            <h4 className="font-semibold">AI Analysis Result</h4>
                            {analysisError && <p className="mt-2 text-sm text-red-500">{analysisError}</p>}
                            {aiAnalysisResult && <pre className="mt-2 text-sm whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-md">{aiAnalysisResult}</pre>}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Visual Dashboards</h2>
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
                <ChartCard title="Class Subject Averages">
                     <select value={selectedClassForCharts} onChange={e => setSelectedClassForCharts(e.target.value)} className="input-field mb-4"><option value="">Select a Class</option>{allClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <canvas ref={classAverageChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Subject Performance Hotspots">
                    <canvas ref={subjectHotspotChartRef}></canvas>
                </ChartCard>
                 <ChartCard title="Term-over-Term Performance">
                     <select value={selectedClassForCharts} onChange={e => setSelectedClassForCharts(e.target.value)} className="input-field mb-4"><option value="">Select a Class</option>{allClasses.map(c => <option key={c} value={c}>{c}</option>)}</select>
                    <canvas ref={termPerformanceChartRef}></canvas>
                </ChartCard>
                <ChartCard title="Student Academic Trajectory">
                     <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="input-field mb-4"><option value="">Select a Student</option>{allData.students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}</select>
                    <canvas ref={studentTrajectoryChartRef}></canvas>
                </ChartCard>
            </div>
        </div>
    );
};

const StatCard = ({ title, value }: { title: string, value: number | string }) => (
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
    const classStudentIds = new Set(studentsInClass.map(s => s.id));
    const subjectsForClass = subjects.filter(s => s.classes.includes(className));
    const labels = subjectsForClass.map(s => s.name);
    const data = labels.map(subjectName => {
        const subject = subjects.find(s => s.name === subjectName); if (!subject) return 0;
        const relevantScores = scores.filter(score => classStudentIds.has(score.studentId) && score.subjectId === subject.id && (!session || score.session === session) && (term === 'All Terms' || score.term === term));
        if (relevantScores.length === 0) return 0;
        const total = relevantScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
        return (total / relevantScores.length).toFixed(2);
    });
    return { labels, datasets: [{ label: `Avg Score for ${className}`, data, backgroundColor: COLORS }] };
};

const processSubjectHotspotData = (students: Student[], subjects: Subject[], scores: Score[], session: string, term: string) => {
    const classGroups = students.reduce((acc, student) => { if (!acc[student.class]) acc[student.class] = []; acc[student.class].push(student.id); return acc; }, {});
    const labels = [...new Set(subjects.map(s => s.name))].sort();
    const datasets = Object.keys(classGroups).sort().map((className, index) => {
        const studentIdsInClass = classGroups[className];
        const idSet = new Set(studentIdsInClass);
        const data = labels.map(subjectName => {
            const subject = subjects.find(s => s.name === subjectName); if (!subject) return 0;
            const relevantScores = scores.filter(score => idSet.has(score.studentId) && score.subjectId === subject.id && (!session || score.session === session) && (term === 'All Terms' || score.term === term));
            if (relevantScores.length === 0) return 0;
            const total = relevantScores.reduce((sum, s) => sum + (s.ca1 || 0) + (s.ca2 || 0) + (s.exam || 0), 0);
            return (total / relevantScores.length).toFixed(2);
        });
        return { label: className, data, backgroundColor: COLORS[index % COLORS.length] };
    });
    return { labels, datasets };
};

const processTermPerformanceData = (scores: Score[], className: string) => {
    if (!className) return { labels: [], datasets: [] };
    const termScores = scores.reduce((acc, score) => {
        const termKey = `${score.session} ${score.term}`;
        if (!acc[termKey]) acc[termKey] = { total: 0, count: 0, order: `${score.session}-${['First', 'Second', 'Third'].indexOf(score.term.split(' ')[0])}` };
        acc[termKey].total += (score.ca1 || 0) + (score.ca2 || 0) + (score.exam || 0);
        acc[termKey].count += 1;
        return acc;
    }, {});
    const sortedTerms = Object.keys(termScores).sort((a, b) => termScores[a].order.localeCompare(termScores[b].order));
    const labels = sortedTerms;
    const data = sortedTerms.map(term => (termScores[term].count > 0 ? termScores[term].total / termScores[term].count : 0).toFixed(2));
    return { labels, datasets: [{ label: `Avg. for ${className}`, data, borderColor: COLORS[0], tension: 0.1 }] };
};

const processStudentTrajectoryData = (scores: Score[], subjects: Subject[], studentId: string, allStudents: Student[]) => {
    if (!studentId || !allStudents.length) return { labels: [], datasets: [] };
    const selectedStudent = allStudents.find(s => s.id === studentId);
    if (!selectedStudent) return { labels: [], datasets: [] };
    const studentsInClass = allStudents.filter(s => s.class === selectedStudent.class);
    const studentIdsInClass = new Set(studentsInClass.map(s => s.id));
    const classScoresByTerm = scores.filter(s => studentIdsInClass.has(s.studentId)).reduce((acc, score) => {
        const termKey = `${score.session} ${score.term}`;
        const orderKey = `${score.session}-${['First', 'Second', 'Third'].indexOf(score.term.split(' ')[0])}`;
        if (!acc[termKey]) acc[termKey] = { scores: [], order: orderKey };
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
        return studentAverages.reduce((sum, avg) => sum + avg, 0) / studentAverages.length;
    });
    return { labels, datasets: [ { label: `${selectedStudent.name}'s Average`, data: studentData.map(d => d ? d.toFixed(2) : null), borderColor: COLORS[1], tension: 0.1, borderWidth: 2, fill: false }, { label: `${selectedStudent.class} Average`, data: classData.map(d => d ? d.toFixed(2) : null), borderColor: COLORS[3], tension: 0.1, borderDash: [5, 5], borderWidth: 2, backgroundColor: 'transparent', fill: false } ] };
};

export default AdminAnalyticsDashboard;
